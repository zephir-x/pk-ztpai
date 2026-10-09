using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Infrastructure.Data;

namespace ProjectHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly ProjectHubDbContext _context;

    public UsersController(ProjectHubDbContext context)
    {
        _context = context;
    }

    // Returns the list of registered users for assignment and admin overview
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _context.Users
            .AsNoTracking()
            .Select(u => new 
            {
                u.Id,
                u.Email,
                Role = u.Role.ToString()
            })
            .ToListAsync();

        return Ok(users);
    }
}
