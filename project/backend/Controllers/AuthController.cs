using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.DTOs.Auth;
using ProjectHub.Api.Infrastructure.Authentication;
using ProjectHub.Api.Infrastructure.Data;

namespace ProjectHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ProjectHubDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtProvider _jwtProvider;

    // Injects dependencies for data access and security operations
    public AuthController(
        ProjectHubDbContext context, 
        IPasswordHasher passwordHasher, 
        IJwtProvider jwtProvider)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtProvider = jwtProvider;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // Enforce email uniqueness to prevent duplicate accounts
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            return Conflict(new { message = "User with this email already exists." });
        }

        // Initialize user with a securely hashed password and default authorization role
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return StatusCode(201);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        // Verify credentials against the stored hash securely to mitigate timing attacks
        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        // Issue a stateless JWT containing user identity and role claims
        var token = _jwtProvider.Generate(user);

        return Ok(new { token });
    }
}
