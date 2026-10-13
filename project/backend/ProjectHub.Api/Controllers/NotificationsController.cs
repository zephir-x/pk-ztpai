using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.DTOs.Notifications;
using ProjectHub.Api.Services.Notifications;

namespace ProjectHub.Api.Controllers;

// Handles HTTP endpoints for notifications and direct messaging between users and admins
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly IValidator<SendUserMessageRequest> _sendValidator;
    private readonly IValidator<ReplyMessageRequest> _replyValidator;

    public NotificationsController(
        INotificationService notificationService,
        IValidator<SendUserMessageRequest> sendValidator,
        IValidator<ReplyMessageRequest> replyValidator)
    {
        _notificationService = notificationService;
        _sendValidator = sendValidator;
        _replyValidator = replyValidator;
    }

    // Retrieves all notifications for the authenticated user
    [HttpGet]
    public async Task<IActionResult> GetMyNotifications(CancellationToken ct)
    {
        var response = await _notificationService.GetMyNotificationsAsync(GetUserId(), ct);
        return Ok(response);
    }

    // Retrieves the number of unread notifications for badge counter display
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
    {
        var count = await _notificationService.GetUnreadCountAsync(GetUserId(), ct);
        return Ok(new { count });
    }

    // Marks a specific notification as read
    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        await _notificationService.MarkAsReadAsync(id, GetUserId(), ct);
        return NoContent();
    }

    // Marks all notifications of the authenticated user as read
    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
    {
        await _notificationService.MarkAllAsReadAsync(GetUserId(), ct);
        return NoContent();
    }

    // Soft deletes a specific notification
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _notificationService.DeleteAsync(id, GetUserId(), ct);
        return NoContent();
    }

    // Delivers a user's direct message to system administrators
    [HttpPost("messages/send-to-admin")]
    public async Task<IActionResult> SendToAdmin([FromBody] SendUserMessageRequest request, CancellationToken ct)
    {
        await _sendValidator.ValidateAndThrowAsync(request, cancellationToken: ct);
        await _notificationService.SendToAdminsAsync(GetUserId(), request, ct);
        return Ok(new { success = true });
    }

    // Delivers an administrator's direct message reply to a user
    [HttpPost("messages/reply")]
    public async Task<IActionResult> ReplyToUser([FromBody] ReplyMessageRequest request, CancellationToken ct)
    {
        if (GetUserRole() != UserRole.Admin)
        {
            return Forbid();
        }

        await _replyValidator.ValidateAndThrowAsync(request, cancellationToken: ct);
        await _notificationService.ReplyToUserAsync(GetUserId(), request, ct);
        return Ok(new { success = true });
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
