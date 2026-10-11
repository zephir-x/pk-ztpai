using System;
using ProjectHub.Api.Domain.Enums;

namespace ProjectHub.Api.DTOs.Notifications;

public record NotificationResponse(
    Guid Id,
    Guid RecipientId,
    Guid? SenderId,
    string? SenderName,
    string? SenderAvatarUrl,
    NotificationType Type,
    string Title,
    string Message,
    Guid? TaskItemId,
    string? TaskTitle,
    Guid? ProjectId,
    bool IsRead,
    DateTime CreatedAt);
