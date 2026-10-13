using System;

namespace ProjectHub.Api.DTOs.Notifications;

public record ReplyMessageRequest(Guid RecipientId, string Message);
