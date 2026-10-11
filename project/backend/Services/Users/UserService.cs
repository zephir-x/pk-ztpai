using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.Domain.Exceptions;
using ProjectHub.Api.DTOs.Users;
using ProjectHub.Api.Infrastructure.Authentication;
using ProjectHub.Api.Infrastructure.Data;
using ProjectHub.Api.Infrastructure.Localization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ProjectHub.Api.Services.Users;

public class UserService : IUserService
{
    private readonly ProjectHubDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public UserService(ProjectHubDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    // Retrieves all active users ordered by role (Administrators first) and creation timestamp
    public async Task<IEnumerable<UserResponse>> GetAllAsync(CancellationToken ct = default)
    {
        return await _context.Users
            .AsNoTracking()
            .OrderBy(u => u.Role == UserRole.Admin ? 0 : 1)
            .ThenBy(u => u.CreatedAt)
            .Select(u => new UserResponse(u.Id, u.Email, u.Role, u.FirstName, u.LastName, u.AvatarUrl, u.CreatedAt))
            .ToListAsync(ct);
    }

    // Retrieves the current authenticated user's profile and preferences
    public async Task<UserProfileResponse> GetProfileAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException(LocalizationMessages.NotFound("User", userId));

        return new UserProfileResponse(
            user.Id,
            user.Email,
            user.Role,
            user.FirstName,
            user.LastName,
            user.AvatarUrl,
            user.Language,
            user.AccentColor,
            user.CreatedAt);
    }

    // Updates personal details, theme preferences, and credentials for the current user
    public async Task<UserProfileResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException(LocalizationMessages.NotFound("User", userId));

        // Handle password change request when new password is submitted
        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            if (string.IsNullOrWhiteSpace(request.CurrentPassword) || !_passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
            {
                throw new ConflictException(LocalizationMessages.CurrentPasswordIncorrect);
            }

            user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        }

        user.FirstName = request.FirstName?.Trim() ?? string.Empty;
        user.LastName = request.LastName?.Trim() ?? string.Empty;
        user.AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? "anonymous" : request.AvatarUrl;
        user.Language = request.Language;
        user.AccentColor = request.AccentColor;

        await _context.SaveChangesAsync(ct);

        return new UserProfileResponse(
            user.Id,
            user.Email,
            user.Role,
            user.FirstName,
            user.LastName,
            user.AvatarUrl,
            user.Language,
            user.AccentColor,
            user.CreatedAt);
    }

    // Creates a new system user with securely hashed credentials
    public async Task<UserResponse> CreateAsync(CreateUserRequest request, Guid adminId, UserRole role, CancellationToken ct = default)
    {
        ValidateAdminAccess(role);

        // Enforce email uniqueness at the database level to prevent login conflicts
        if (await _context.Users.AnyAsync(u => u.Email == request.Email, ct))
        {
            throw new ConflictException(LocalizationMessages.UserAlreadyExists);
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = request.Role,
            FirstName = request.FirstName?.Trim() ?? string.Empty,
            LastName = request.LastName?.Trim() ?? string.Empty,
            AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? "anonymous" : request.AvatarUrl,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(ct);

        return new UserResponse(user.Id, user.Email, user.Role, user.FirstName, user.LastName, user.AvatarUrl, user.CreatedAt);
    }

    // Updates user details and resets password if requested by the administrator (email remains immutable)
    public async Task UpdateAsync(Guid id, UpdateUserRequest request, Guid adminId, UserRole role, CancellationToken ct = default)
    {
        ValidateAdminAccess(role);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id, ct) 
            ?? throw new NotFoundException(LocalizationMessages.NotFound("User", id));

        user.Role = request.Role;

        if (request.FirstName != null) user.FirstName = request.FirstName.Trim();
        if (request.LastName != null) user.LastName = request.LastName.Trim();
        if (!string.IsNullOrWhiteSpace(request.AvatarUrl)) user.AvatarUrl = request.AvatarUrl;

        // Apply new hashed password only if explicitly provided in the request
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = _passwordHasher.Hash(request.Password);
        }

        await _context.SaveChangesAsync(ct);
    }

    // Flags the user as deleted using the internal soft-delete mechanism
    public async Task DeleteAsync(Guid id, Guid adminId, UserRole role, CancellationToken ct = default)
    {
        ValidateAdminAccess(role);

        // Prevent self-deletion to guarantee at least one active administrator remains
        if (id == adminId)
        {
            throw new ConflictException(LocalizationMessages.CannotDeleteOwnAccount);
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id, ct) 
            ?? throw new NotFoundException(LocalizationMessages.NotFound("User", id));

        _context.Users.Remove(user);
        await _context.SaveChangesAsync(ct);
    }

    // Verifies that the initiating caller holds administrative privileges
    private static void ValidateAdminAccess(UserRole role)
    {
        if (role != UserRole.Admin)
        {
            throw new ForbiddenException(LocalizationMessages.AdminOnlyOperation);
        }
    }
}
