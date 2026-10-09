using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.DTOs.Users;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace ProjectHub.Api.Services.Users;

public interface IUserService
{
    Task<IEnumerable<UserResponse>> GetAllAsync(CancellationToken ct = default);
    Task<UserResponse> CreateAsync(CreateUserRequest request, Guid adminId, UserRole role, CancellationToken ct = default);
    Task UpdateAsync(Guid id, UpdateUserRequest request, Guid adminId, UserRole role, CancellationToken ct = default);
    Task DeleteAsync(Guid id, Guid adminId, UserRole role, CancellationToken ct = default);
}
