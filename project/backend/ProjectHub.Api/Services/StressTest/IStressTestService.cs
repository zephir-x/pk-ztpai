using System;
using System.Threading;
using System.Threading.Tasks;
using ProjectHub.Api.DTOs.StressTest;

namespace ProjectHub.Api.Services.StressTest;

public interface IStressTestService
{
    Task<StressTestStatusDto> GetStatusAsync(CancellationToken ct = default);
    Task<StressTestResultDto> SeedAsync(Guid currentAdminId, CancellationToken ct = default);
    Task<StressTestResultDto> CleanupAsync(CancellationToken ct = default);
}
