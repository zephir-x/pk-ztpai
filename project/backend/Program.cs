using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Dependency Injection Configuration
builder.Services.AddOpenApi();
builder.Services.AddControllers();

// Register DbContext with connection string from appsettings
builder.Services.AddDbContext<ProjectHubDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// HTTP Request Pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapControllers();

app.Run();
