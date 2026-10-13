using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.DTOs.Comments;
using ProjectHub.Api.DTOs.Common;
using ProjectHub.Api.Services.Comments;

namespace ProjectHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    [HttpGet("task/{taskId:guid}")]
    public async Task<IActionResult> GetPagedByTask(Guid taskId, [FromQuery] PagedRequest request, CancellationToken ct)
    {
        var response = await _commentService.GetPagedByTaskAsync(taskId, request, GetUserId(), GetUserRole(), ct);
        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCommentRequest request, CancellationToken ct)
    {
        var response = await _commentService.CreateAsync(request, GetUserId(), GetUserRole(), ct);
        return StatusCode(201, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCommentRequest request, CancellationToken ct)
    {
        await _commentService.UpdateAsync(id, request, GetUserId(), GetUserRole(), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _commentService.DeleteAsync(id, GetUserId(), GetUserRole(), ct);
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
