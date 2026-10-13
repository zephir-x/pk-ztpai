namespace ProjectHub.Api.Infrastructure.Authentication;

public sealed class PasswordHasher : IPasswordHasher
{
    // Utilizes BCrypt's enhanced entropy algorithm for stronger security
    public string Hash(string password)
    {
        return BCrypt.Net.BCrypt.EnhancedHashPassword(password);
    }

    public bool Verify(string password, string passwordHash)
    {
        return BCrypt.Net.BCrypt.EnhancedVerify(password, passwordHash);
    }
}
