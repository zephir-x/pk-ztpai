using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ProjectHub.Api.Infrastructure.SignalR;

// Secures the WebSocket connection requiring a valid JWT
[Authorize]
public class KanbanHub : Hub
{
    // Allows the client to subscribe to updates for a specific workspace
    public async Task JoinWorkspaceGroup(Guid workspaceId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, workspaceId.ToString());
    }

    public async Task LeaveWorkspaceGroup(Guid workspaceId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, workspaceId.ToString());
    }
}
