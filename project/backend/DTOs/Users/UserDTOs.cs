using ProjectHub.Api.Domain.Enums;
using System;

namespace ProjectHub.Api.DTOs.Users;

public record UserResponse(
    Guid Id, 
    string Email, 
    UserRole Role, 
    string FirstName, 
    string LastName, 
    string AvatarUrl, 
    DateTime CreatedAt);

public record UserProfileResponse(
    Guid Id, 
    string Email, 
    UserRole Role, 
    string FirstName, 
    string LastName, 
    string AvatarUrl, 
    string Language, 
    string AccentColor, 
    DateTime CreatedAt);

public record CreateUserRequest(
    string Email, 
    string Password, 
    UserRole Role, 
    string? FirstName = null, 
    string? LastName = null, 
    string? AvatarUrl = null);

public record UpdateUserRequest(
    string Email, 
    string? Password, 
    UserRole Role, 
    string? FirstName = null, 
    string? LastName = null, 
    string? AvatarUrl = null);

public record UpdateProfileRequest(
    string FirstName, 
    string LastName, 
    string AvatarUrl, 
    string Language, 
    string AccentColor, 
    string? CurrentPassword = null, 
    string? NewPassword = null);
