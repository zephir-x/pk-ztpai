using FluentValidation;
using ProjectHub.Api.Infrastructure.Localization;

namespace ProjectHub.Api.DTOs.Auth;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage(_ => LocalizationMessages.EmailRequired)
            .EmailAddress().WithMessage(_ => LocalizationMessages.ValidEmailRequired);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage(_ => LocalizationMessages.PasswordRequired);
    }
}
