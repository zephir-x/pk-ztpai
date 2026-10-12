using MediatR;

namespace ProjectHub.Api.Infrastructure.Events;

public interface IEventDispatcher
{
    ValueTask DispatchAsync(INotification domainEvent, CancellationToken ct = default);
}
