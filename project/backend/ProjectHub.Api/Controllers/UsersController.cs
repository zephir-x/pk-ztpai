using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.DTOs.Users;
using ProjectHub.Api.Services.Users;
using System;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;

namespace ProjectHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IValidator<CreateUserRequest> _createValidator;
    private readonly IValidator<UpdateUserRequest> _updateValidator;
    private readonly IValidator<UpdateProfileRequest> _profileValidator;

    public UsersController(
        IUserService userService, 
        IValidator<CreateUserRequest> createValidator,
        IValidator<UpdateUserRequest> updateValidator,
        IValidator<UpdateProfileRequest> profileValidator)
    {
        _userService = userService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _profileValidator = profileValidator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var response = await _userService.GetAllAsync(ct);
        return Ok(response);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var response = await _userService.GetProfileAsync(GetUserId(), ct);
        return Ok(response);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken ct)
    {
        await _profileValidator.ValidateAndThrowAsync(request, cancellationToken: ct);
        var response = await _userService.UpdateProfileAsync(GetUserId(), request, ct);
        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request, CancellationToken ct)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken: ct);
        var response = await _userService.CreateAsync(request, GetUserId(), GetUserRole(), ct);
        return StatusCode(201, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken: ct);
        await _userService.UpdateAsync(id, request, GetUserId(), GetUserRole(), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _userService.DeleteAsync(id, GetUserId(), GetUserRole(), ct);
        return NoContent();
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }

    private UserRole GetUserRole()
    {
        var roleClaim = User.FindFirstValue(ClaimTypes.Role);
        return Enum.TryParse<UserRole>(roleClaim, out var role) ? role : UserRole.User;
    }
}
