using ProjectHub.Api.Domain.Entities;

namespace ProjectHub.Api.Infrastructure.Authentication;

public interface IJwtProvider
{
    string Generate(User user);
}
