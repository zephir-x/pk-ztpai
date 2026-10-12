using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectHub.Api.Services.StressTest;

namespace ProjectHub.Api.Controllers;

[ApiController]
[Route("api/admin/stress-test")]
[Authorize(Roles = "Admin")]
public class StressTestController : ControllerBase
{
    private readonly IStressTestService _stressTestService;

    public StressTestController(IStressTestService stressTestService)
    {
        _stressTestService = stressTestService;
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus(CancellationToken ct)
    {
        var response = await _stressTestService.GetStatusAsync(ct);
        return Ok(response);
    }

    [HttpPost("seed")]
    public async Task<IActionResult> Seed(CancellationToken ct)
    {
        var adminId = GetUserId();
        var response = await _stressTestService.SeedAsync(adminId, ct);
        return Ok(response);
    }

    [HttpPost("cleanup")]
    public async Task<IActionResult> Cleanup(CancellationToken ct)
    {
        var response = await _stressTestService.CleanupAsync(ct);
        return Ok(response);
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirst("sub")?.Value 
               ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
               ?? User.FindFirst("id")?.Value;
        return Guid.TryParse(sub, out var userId) ? userId : Guid.Empty;
    }
}
