using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.DTOs.Auth;
using ProjectHub.Api.Infrastructure.Authentication;
using ProjectHub.Tests.Integration.Infrastructure;
using Xunit;

namespace ProjectHub.Tests.Integration.Controllers;

public class AuthControllerIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public AuthControllerIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_WhenValidDataProvided_ShouldReturn201Created()
    {
        // Arrange
        var uniqueEmail = $"newuser_{Guid.NewGuid():N}@example.com";
        var request = new RegisterRequest(uniqueEmail, "StrongPassword123!");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Register_WhenEmailAlreadyExists_ShouldReturn409Conflict()
    {
        // Arrange
        var duplicateEmail = $"duplicate_{Guid.NewGuid():N}@example.com";
        var request = new RegisterRequest(duplicateEmail, "StrongPassword123!");

        var firstResponse = await _client.PostAsJsonAsync("/api/auth/register", request);
        firstResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        // Act
        var secondResponse = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        secondResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Login_WhenCredentialsAreValid_ShouldReturn200OkWithJwtToken()
    {
        // Arrange
        var loginEmail = $"loginuser_{Guid.NewGuid():N}@example.com";
        var password = "ValidPassword123!";
        var passwordHasher = new PasswordHasher();

        await _factory.SeedAsync(async db =>
        {
            db.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                Email = loginEmail,
                PasswordHash = passwordHasher.Hash(password),
                Role = UserRole.User,
                CreatedAt = DateTime.UtcNow
            });
            await Task.CompletedTask;
        });

        var request = new LoginRequest(loginEmail, password);

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(content);
        var token = jsonDoc.RootElement.GetProperty("token").GetString();
        token.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Login_WhenPasswordIsIncorrect_ShouldReturn401Unauthorized()
    {
        // Arrange
        var userEmail = $"user_wrongpw_{Guid.NewGuid():N}@example.com";
        var passwordHasher = new PasswordHasher();

        await _factory.SeedAsync(async db =>
        {
            db.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                Email = userEmail,
                PasswordHash = passwordHasher.Hash("OriginalPassword123!"),
                Role = UserRole.User,
                CreatedAt = DateTime.UtcNow
            });
            await Task.CompletedTask;
        });

        var request = new LoginRequest(userEmail, "WrongPassword999!");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
