using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.DTOs.Common;
using ProjectHub.Api.DTOs.Tasks;
using ProjectHub.Api.Services.Tasks;

namespace ProjectHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TaskItemsController : ControllerBase
{
    private readonly ITaskItemService _taskItemService;

    public TaskItemsController(ITaskItemService taskItemService)
    {
        _taskItemService = taskItemService;
    }

    
    [HttpGet("my-tasks")]
    public async Task<IActionResult> GetMyTasks(CancellationToken ct)
    {
        var response = await _taskItemService.GetMyTasksAsync(GetUserId(), ct);
        return Ok(response);
    }

    [HttpGet("project/{projectId:guid}")]
    public async Task<IActionResult> GetPagedByProject(Guid projectId, [FromQuery] PagedRequest request, CancellationToken ct)
    {
        var response = await _taskItemService.GetPagedByProjectAsync(projectId, request, GetUserId(), GetUserRole(), ct);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var response = await _taskItemService.GetByIdAsync(id, GetUserId(), GetUserRole(), ct);
        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaskItemRequest request, CancellationToken ct)
    {
        var response = await _taskItemService.CreateAsync(request, GetUserId(), GetUserRole(), ct);
        
        return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTaskItemRequest request, CancellationToken ct)
    {
        await _taskItemService.UpdateAsync(id, request, GetUserId(), GetUserRole(), ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/assignee")]
    public async Task<IActionResult> ChangeAssignee(Guid id, [FromBody] ChangeAssigneeRequest request, CancellationToken ct)
    {
        await _taskItemService.ChangeAssigneeAsync(id, request, GetUserId(), GetUserRole(), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _taskItemService.DeleteAsync(id, GetUserId(), GetUserRole(), ct);
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
