using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.Domain.Exceptions;
using ProjectHub.Api.DTOs.Notifications;
using ProjectHub.Api.Infrastructure.Data;
using ProjectHub.Api.Infrastructure.Localization;
using ProjectHub.Api.Infrastructure.SignalR;

namespace ProjectHub.Api.Services.Notifications;

// Service orchestrating user notifications, persistence, and real-time WebSocket delivery
public class NotificationService : INotificationService
{
    private readonly ProjectHubDbContext _context;
    private readonly IHubContext<KanbanHub> _hubContext;

    public NotificationService(ProjectHubDbContext context, IHubContext<KanbanHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    // Fetches all notifications addressed to the specified user ordered by timestamp descending
    public async Task<IEnumerable<NotificationResponse>> GetMyNotificationsAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context.Notifications
            .AsNoTracking()
            .Include(n => n.Sender)
            .Include(n => n.TaskItem)
            .Where(n => n.RecipientId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationResponse(
                n.Id,
                n.RecipientId,
                n.SenderId,
                n.Sender != null
                    ? (!string.IsNullOrWhiteSpace(n.Sender.FirstName) || !string.IsNullOrWhiteSpace(n.Sender.LastName)
                        ? (n.Sender.FirstName + " " + n.Sender.LastName).Trim()
                        : n.Sender.Email)
                    : null,
                n.Sender != null ? n.Sender.AvatarUrl : null,
                n.Type,
                n.Title,
                n.Message,
                n.TaskItemId,
                n.TaskItem != null ? n.TaskItem.Title : null,
                n.ProjectId,
                n.IsRead,
                n.CreatedAt
            ))
            .ToListAsync(ct);
    }

    // Returns unread notification count for the user
    public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context.Notifications
            .AsNoTracking()
            .Where(n => n.RecipientId == userId && !n.IsRead)
            .CountAsync(ct);
    }

    // Marks an individual notification as read
    public async Task MarkAsReadAsync(Guid id, Guid userId, CancellationToken ct = default)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.RecipientId == userId, ct)
            ?? throw new NotFoundException(LocalizationMessages.NotFound("Notification", id));

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            await _context.SaveChangesAsync(ct);
        }
    }

    // Marks all active unread notifications of the user as read
    public async Task MarkAllAsReadAsync(Guid userId, CancellationToken ct = default)
    {
        var unreadNotifications = await _context.Notifications
            .Where(n => n.RecipientId == userId && !n.IsRead)
            .ToListAsync(ct);

        if (unreadNotifications.Count > 0)
        {
            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
            }
            await _context.SaveChangesAsync(ct);
        }
    }

    // Soft-deletes a notification belonging to the user
    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken ct = default)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.RecipientId == userId, ct)
            ?? throw new NotFoundException(LocalizationMessages.NotFound("Notification", id));

        notification.IsDeleted = true;
        notification.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
    }

    // Delivers a direct message from a user to all system administrators
    public async Task SendToAdminsAsync(Guid senderId, SendUserMessageRequest request, CancellationToken ct = default)
    {
        var admins = await _context.Users
            .AsNoTracking()
            .Where(u => u.Role == UserRole.Admin)
            .ToListAsync(ct);

        foreach (var admin in admins)
        {
            await CreateNotificationAsync(
                admin.Id,
                senderId,
                NotificationType.DirectMessage,
                LocalizationMessages.NotificationDirectFromUserTitle,
                request.Message,
                null,
                null,
                ct);
        }
    }

    // Dispatches an administrative direct message reply to the specified user
    public async Task ReplyToUserAsync(Guid adminId, ReplyMessageRequest request, CancellationToken ct = default)
    {
        var recipient = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.RecipientId, ct)
            ?? throw new NotFoundException(LocalizationMessages.NotFound("User", request.RecipientId));

        await CreateNotificationAsync(
            recipient.Id,
            adminId,
            NotificationType.DirectMessage,
            LocalizationMessages.NotificationDirectFromAdminTitle,
            request.Message,
            null,
            null,
            ct);
    }

    // Persists a new notification record and pushes real-time WebSocket update
    public async Task<NotificationResponse> CreateNotificationAsync(
        Guid recipientId,
        Guid? senderId,
        NotificationType type,
        string title,
        string message,
        Guid? taskItemId,
        Guid? projectId,
        CancellationToken ct = default)
    {
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            RecipientId = recipientId,
            SenderId = senderId,
            Type = type,
            Title = title,
            Message = message,
            TaskItemId = taskItemId,
            ProjectId = projectId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(ct);

        User? sender = null;
        if (senderId.HasValue)
        {
            sender = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == senderId.Value, ct);
        }

        string? taskTitle = null;
        if (taskItemId.HasValue)
        {
            var task = await _context.Tasks
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == taskItemId.Value, ct);
            taskTitle = task?.Title;
        }

        var senderName = sender != null
            ? (!string.IsNullOrWhiteSpace(sender.FirstName) || !string.IsNullOrWhiteSpace(sender.LastName)
                ? $"{sender.FirstName} {sender.LastName}".Trim()
                : sender.Email)
            : null;

        var response = new NotificationResponse(
            notification.Id,
            notification.RecipientId,
            notification.SenderId,
            senderName,
            sender?.AvatarUrl,
            notification.Type,
            notification.Title,
            notification.Message,
            notification.TaskItemId,
            taskTitle,
            notification.ProjectId,
            notification.IsRead,
            notification.CreatedAt
        );

        // Dispatches real-time update to the recipient's personal group
        await _hubContext.Clients.Group("user_" + recipientId)
            .SendAsync("ReceiveNotification", response, ct);

        return response;
    }
}
