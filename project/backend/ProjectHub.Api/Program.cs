using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using ProjectHub.Api.Infrastructure.Data;
using ProjectHub.Api.Infrastructure.Authentication;
using ProjectHub.Api.Infrastructure.Middleware;
using ProjectHub.Api.Infrastructure.SignalR;
using ProjectHub.Api.Infrastructure.Events;
using ProjectHub.Api.Services.Workspaces;
using ProjectHub.Api.Services.Users;
using ProjectHub.Api.Services.Projects;
using ProjectHub.Api.Services.Tasks;
using ProjectHub.Api.Services.Comments;
using ProjectHub.Api.Services.Notifications;
using ProjectHub.Api.Services.StressTest;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using FluentValidation;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// === Dependency Injection & Base Services ===
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// === CORS Policy Configuration ===
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendOrigin", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// === Swagger / OpenAPI Configuration ===
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your valid JWT token in the text input below."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// === Database Configuration ===
if (!builder.Environment.IsEnvironment("Testing"))
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (string.IsNullOrWhiteSpace(connectionString) && !builder.Environment.IsDevelopment())
    {
        throw new InvalidOperationException("ConnectionStrings:DefaultConnection is missing. In production, provide the database connection string via environment variables.");
    }

    builder.Services.AddDbContext<ProjectHubDbContext>(options =>
        options.UseNpgsql(connectionString));
}

// === Infrastructure & Application Services ===
var jwtSection = builder.Configuration.GetSection(JwtOptions.SectionName);
var jwtConfig = jwtSection.Get<JwtOptions>();
if (!builder.Environment.IsEnvironment("Testing"))
{
    if (jwtConfig == null || string.IsNullOrWhiteSpace(jwtConfig.SecretKey))
    {
        throw new InvalidOperationException("JWT SecretKey is missing. Configure JwtOptions:SecretKey in environment configuration.");
    }
}

builder.Services.Configure<JwtOptions>(jwtSection);
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<IJwtProvider, JwtProvider>();
builder.Services.AddScoped<IWorkspaceService, WorkspaceService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<ITaskItemService, TaskItemService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IStressTestService, StressTestService>();

// === Async Mechanism (MediatR & Event Channel) ===
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<Program>());
builder.Services.AddSingleton<EventDispatcher>();
builder.Services.AddSingleton<IEventDispatcher>(sp => sp.GetRequiredService<EventDispatcher>());
builder.Services.AddHostedService<EventProcessingBackgroundService>();

// === Authentication & Authorization ===
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // SignalR requires extracting the JWT token from the query string instead of the HTTP header during the initial WebSocket handshake negotiation
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/kanbanHub"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOptions>>((options, jwtAccessor) =>
    {
        var jwt = jwtAccessor.Value;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SecretKey))
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// === Application Initialization & Seeding ===
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var dbContext = services.GetRequiredService<ProjectHubDbContext>();
        
        if (dbContext.Database.IsRelational())
        {
            await dbContext.Database.MigrateAsync();
            await DatabaseSeeder.SeedAsync(dbContext);
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during database migration or seeding.");
    }
}

// === HTTP Request Pipeline ===
var supportedCultures = new[] { "en", "pl" };
var localizationOptions = new RequestLocalizationOptions()
    .SetDefaultCulture("en")
    .AddSupportedCultures(supportedCultures)
    .AddSupportedUICultures(supportedCultures);

app.UseRequestLocalization(localizationOptions);
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("FrontendOrigin");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<KanbanHub>("/kanbanHub");

app.Run();

public partial class Program { }
