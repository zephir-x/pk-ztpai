// Initialize the web application builder with command-line arguments
var builder = WebApplication.CreateBuilder(args);

// Register services in the Dependency Injection container
// Adds services required for generating OpenAPI documentation (e.g., for Swagger/Scalar)
builder.Services.AddOpenApi();

// Adds support for controllers (necessary if the API uses the MVC/Controller pattern)
builder.Services.AddControllers();

// Build the application based on the configured services
var app = builder.Build();

// Configure the HTTP request pipeline (middleware)
// Check if the application is running in the development environment
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Map request routing to the appropriate controllers
app.MapControllers();

// Start the application server and begin listening for HTTP requests
app.Run();
