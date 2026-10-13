using System.Globalization;
using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Infrastructure.Data;

namespace ProjectHub.Tests.Infrastructure;

public static class TestDbContextFactory
{
    static TestDbContextFactory()
    {
        CultureInfo.DefaultThreadCurrentCulture = CultureInfo.GetCultureInfo("en");
        CultureInfo.DefaultThreadCurrentUICulture = CultureInfo.GetCultureInfo("en");
    }

    public static ProjectHubDbContext Create(string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<ProjectHubDbContext>()
            .UseInMemoryDatabase(databaseName: dbName ?? Guid.NewGuid().ToString())
            .Options;

        var context = new ProjectHubDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}
