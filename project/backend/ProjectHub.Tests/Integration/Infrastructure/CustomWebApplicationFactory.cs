using System.Globalization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Infrastructure.Authentication;
using ProjectHub.Api.Infrastructure.Data;

namespace ProjectHub.Tests.Integration.Infrastructure;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = "IntegrationTestDb_" + Guid.NewGuid();

    static CustomWebApplicationFactory()
    {
        CultureInfo.DefaultThreadCurrentCulture = CultureInfo.GetCultureInfo("en");
        CultureInfo.DefaultThreadCurrentUICulture = CultureInfo.GetCultureInfo("en");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtOptions:Issuer"] = "ProjectHubApi",
                ["JwtOptions:Audience"] = "ProjectHubClients",
                ["JwtOptions:SecretKey"] = "DevelopmentSecretKeyThatIsLongEnoughToProvide256BitEncryption123!"
            });
        });

        builder.ConfigureServices(services =>
        {
            services.AddDbContext<ProjectHubDbContext>(options =>
            {
                options.UseInMemoryDatabase(_dbName);
            });
        });
    }

    public string GenerateJwtToken(User user)
    {
        using var scope = Services.CreateScope();
        var jwtProvider = scope.ServiceProvider.GetRequiredService<IJwtProvider>();
        return jwtProvider.Generate(user);
    }

    public async Task SeedAsync(Func<ProjectHubDbContext, Task> seedAction)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ProjectHubDbContext>();
        await seedAction(db);
        await db.SaveChangesAsync();
    }
}
