using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.DTOs.Common;

namespace ProjectHub.Api.Infrastructure.Extensions;

public static class QueryableExtensions
{
    // Applies pagination to any IQueryable source and executes the database query securely
    public static async Task<PagedResponse<T>> ToPagedResponseAsync<T>(
        this IQueryable<T> source, 
        int pageNumber, 
        int pageSize, 
        CancellationToken cancellationToken = default)
    {
        var count = await source.CountAsync(cancellationToken);
        
        var items = await source
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResponse<T>
        {
            Items = items,
            TotalCount = count,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }
}
