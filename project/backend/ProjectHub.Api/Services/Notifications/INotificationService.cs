using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.DTOs.Notifications;

namespace ProjectHub.Api.Services.Notifications;

// Contract defining notification and direct messaging operations
public interface INotificationService
{
    // Retrieves all active notifications for a given user
    Task<IEnumerable<NotificationResponse>> GetMyNotificationsAsync(Guid userId, CancellationToken ct = default);

    // Counts unread notifications for badge rendering
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default);

    // Marks a single notification as read
    Task MarkAsReadAsync(Guid id, Guid userId, CancellationToken ct = default);

    // Marks all notifications of a user as read
    Task MarkAllAsReadAsync(Guid userId, CancellationToken ct = default);

    // Soft-deletes a user notification
    Task DeleteAsync(Guid id, Guid userId, CancellationToken ct = default);

    // Sends a direct message notification to all active administrators
    Task SendToAdminsAsync(Guid senderId, SendUserMessageRequest request, CancellationToken ct = default);

    // Sends an administrator's direct message reply to a specific user
    Task ReplyToUserAsync(Guid adminId, ReplyMessageRequest request, CancellationToken ct = default);

    // Creates, persists, and broadcasts a notification via SignalR to the recipient
    Task<NotificationResponse> CreateNotificationAsync(
        Guid recipientId,
        Guid? senderId,
        NotificationType type,
        string title,
        string message,
        Guid? taskItemId,
        Guid? projectId,
        CancellationToken ct = default);
}
