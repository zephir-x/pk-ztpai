using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.DTOs.Common;
using ProjectHub.Api.DTOs.Projects;
using ProjectHub.Api.Services.Projects;

namespace ProjectHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    [HttpGet("workspace/{workspaceId:guid}")]
    public async Task<IActionResult> GetPagedByWorkspace(Guid workspaceId, [FromQuery] PagedRequest request, CancellationToken ct)
    {
        var response = await _projectService.GetPagedByWorkspaceAsync(workspaceId, request, GetUserId(), GetUserRole(), ct);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var response = await _projectService.GetByIdAsync(id, GetUserId(), GetUserRole(), ct);
        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProjectRequest request, CancellationToken ct)
    {
        var response = await _projectService.CreateAsync(request, GetUserId(), GetUserRole(), ct);
        
        return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProjectRequest request, CancellationToken ct)
    {
        await _projectService.UpdateAsync(id, request, GetUserId(), GetUserRole(), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _projectService.DeleteAsync(id, GetUserId(), GetUserRole(), ct);
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
