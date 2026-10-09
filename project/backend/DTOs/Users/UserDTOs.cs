using ProjectHub.Api.Domain.Enums;

namespace ProjectHub.Api.DTOs.Users;

public record UserResponse(Guid Id, string Email, UserRole Role, DateTime CreatedAt);
public record CreateUserRequest(string Email, string Password, UserRole Role);
public record UpdateUserRequest(string Email, string? Password, UserRole Role);
