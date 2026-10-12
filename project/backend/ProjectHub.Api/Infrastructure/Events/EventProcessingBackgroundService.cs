using MediatR;

namespace ProjectHub.Api.Infrastructure.Events;

public class EventProcessingBackgroundService : BackgroundService
{
    private readonly EventDispatcher _eventDispatcher;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<EventProcessingBackgroundService> _logger;

    public EventProcessingBackgroundService(
        EventDispatcher eventDispatcher, 
        IServiceProvider serviceProvider, 
        ILogger<EventProcessingBackgroundService> logger)
    {
        _eventDispatcher = eventDispatcher;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Event Processing Background Service is starting.");

        // Asynchronously consumes events from the channel as they arrive
        await foreach (var domainEvent in _eventDispatcher.ReadAllAsync(stoppingToken))
        {
            try
            {
                // MediatR requires a scope to resolve scoped handlers inside a singleton BackgroundService
                using var scope = _serviceProvider.CreateScope();
                var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

                await mediator.Publish(domainEvent, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing event {EventName}", domainEvent.GetType().Name);
            }
        }
    }
}
