using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.Domain.Exceptions;
using ProjectHub.Api.DTOs.Users;
using ProjectHub.Api.Infrastructure.Authentication;
using ProjectHub.Api.Infrastructure.Data;
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

    // Retrieves all active users ordered by creation date
    public async Task<IEnumerable<UserResponse>> GetAllAsync(CancellationToken ct = default)
    {
        return await _context.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserResponse(u.Id, u.Email, u.Role, u.CreatedAt))
            .ToListAsync(ct);
    }

    // Creates a new system user with securely hashed credentials
    public async Task<UserResponse> CreateAsync(CreateUserRequest request, Guid adminId, UserRole role, CancellationToken ct = default)
    {
        ValidateAdminAccess(role);

        // Enforce email uniqueness at the database level to prevent login conflicts
        if (await _context.Users.AnyAsync(u => u.Email == request.Email, ct))
        {
            throw new ConflictException("User with this email already exists.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = request.Role,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(ct);

        return new UserResponse(user.Id, user.Email, user.Role, user.CreatedAt);
    }

    // Updates user details and resets password if requested by the administrator
    public async Task UpdateAsync(Guid id, UpdateUserRequest request, Guid adminId, UserRole role, CancellationToken ct = default)
    {
        ValidateAdminAccess(role);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id, ct) 
            ?? throw new NotFoundException($"User with ID {id} was not found.");

        // Verify that the new email does not collide with an existing account
        if (user.Email != request.Email && await _context.Users.AnyAsync(u => u.Email == request.Email, ct))
        {
            throw new ConflictException("User with this email already exists.");
        }

        user.Email = request.Email;
        user.Role = request.Role;

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
            throw new ConflictException("You cannot delete your own admin account.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id, ct) 
            ?? throw new NotFoundException($"User with ID {id} was not found.");

        _context.Users.Remove(user);
        
        // EF Core interceptor intercepts the Remove call and applies IsDeleted = true
        await _context.SaveChangesAsync(ct);
    }

    // Confirms that the caller has administrative privileges
    private static void ValidateAdminAccess(UserRole role)
    {
        if (role != UserRole.Admin)
        {
            throw new ForbiddenException("Only administrators can manage users.");
        }
    }
}
