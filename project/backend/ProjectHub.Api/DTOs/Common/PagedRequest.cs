namespace ProjectHub.Api.DTOs.Common;

public class PagedRequest
{
    // Default pagination values
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    
    // Optional search term for filtering data
    public string? SearchTerm { get; init; }
    
    // Optional sorting parameters
    public string? SortColumn { get; init; }
    public string? SortOrder { get; init; } = "asc";
}
