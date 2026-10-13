using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.Domain.Exceptions;
using ProjectHub.Api.DTOs.Users;
using ProjectHub.Api.Infrastructure.Authentication;
using ProjectHub.Api.Infrastructure.Data;
using ProjectHub.Api.Services.Users;
using ProjectHub.Tests.Infrastructure;
using Xunit;

namespace ProjectHub.Tests.Unit.Users;

public class UserService_BusinessRulesTests
{
    private readonly ProjectHubDbContext _context;
    private readonly Mock<IPasswordHasher> _mockPasswordHasher;
    private readonly UserService _service;

    public UserService_BusinessRulesTests()
    {
        _context = TestDbContextFactory.Create();
        _mockPasswordHasher = new Mock<IPasswordHasher>();
        _mockPasswordHasher.Setup(h => h.Hash(It.IsAny<string>())).Returns("mocked_hashed_password");
        _mockPasswordHasher.Setup(h => h.Verify(It.IsAny<string>(), It.IsAny<string>()))
            .Returns<string, string>((pwd, hash) => pwd == "CorrectPassword123!");

        _service = new UserService(_context, _mockPasswordHasher.Object);
    }

    [Fact]
    public async Task DeleteAsync_WhenAdminTriesToDeleteOwnAccount_ShouldThrowConflictException()
    {
        // Arrange (Rule 5: Admin cannot delete their own account)
        var adminId = Guid.NewGuid();
        var adminUser = new User
        {
            Id = adminId,
            Email = "admin@example.com",
            PasswordHash = "hash",
            Role = UserRole.Admin
        };

        _context.Users.Add(adminUser);
        await _context.SaveChangesAsync();

        // Act
        var act = async () => await _service.DeleteAsync(adminId, adminId, UserRole.Admin);

        // Assert
        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task DeleteAsync_WhenRegularUserCallsDelete_ShouldThrowForbiddenException()
    {
        // Arrange (Access control: User deletion requires Admin role)
        var regularUserId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();

        // Act
        var act = async () => await _service.DeleteAsync(targetUserId, regularUserId, UserRole.User);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task DeleteAsync_WhenAdminDeletesAnotherUser_ShouldSoftDeleteUser()
    {
        // Arrange (Soft-delete verification: user record soft-deleted and filtered out by query filters)
        var adminId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        var targetUser = new User
        {
            Id = targetUserId,
            Email = "target@example.com",
            PasswordHash = "hash",
            Role = UserRole.User
        };

        _context.Users.Add(targetUser);
        await _context.SaveChangesAsync();

        // Act
        await _service.DeleteAsync(targetUserId, adminId, UserRole.Admin);

        // Assert
        var activeUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == targetUserId);
        activeUser.Should().BeNull(); // filtered by !IsDeleted

        var softDeleted = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == targetUserId);
        softDeleted.Should().NotBeNull();
        softDeleted!.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task CreateAsync_WhenEmailAlreadyExists_ShouldThrowConflictException()
    {
        // Arrange (Email uniqueness validation)
        var adminId = Guid.NewGuid();
        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "existing@example.com",
            PasswordHash = "hash",
            Role = UserRole.User
        };

        _context.Users.Add(existingUser);
        await _context.SaveChangesAsync();

        var request = new CreateUserRequest("existing@example.com", "Password123!", UserRole.User, "Name", "Surname", null);

        // Act
        var act = async () => await _service.CreateAsync(request, adminId, UserRole.Admin);

        // Assert
        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task UpdateProfileAsync_WhenChangingPasswordWithIncorrectCurrentPassword_ShouldThrowConflictException()
    {
        // Arrange (Security credential verification)
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "profile@example.com",
            PasswordHash = "CorrectPassword123!",
            Role = UserRole.User
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new UpdateProfileRequest("First", "Last", "avatar.png", "en", "#4f46e5", "WrongCurrentPassword", "NewPassword123!");

        // Act
        var act = async () => await _service.UpdateProfileAsync(userId, request);

        // Assert
        await act.Should().ThrowAsync<ConflictException>();
    }
}
