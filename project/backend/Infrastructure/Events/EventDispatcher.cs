using System.Threading.Channels;
using MediatR;

namespace ProjectHub.Api.Infrastructure.Events;

public class EventDispatcher : IEventDispatcher
{
    private readonly Channel<INotification> _channel;

    public EventDispatcher()
    {
        // Unbounded channel allows producers to publish immediately without waiting
        _channel = Channel.CreateUnbounded<INotification>();
    }

    public async ValueTask DispatchAsync(INotification domainEvent, CancellationToken ct = default)
    {
        await _channel.Writer.WriteAsync(domainEvent, ct);
    }

    public IAsyncEnumerable<INotification> ReadAllAsync(CancellationToken ct = default)
    {
        return _channel.Reader.ReadAllAsync(ct);
    }
}
