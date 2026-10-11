using FluentValidation;
using ProjectHub.Api.Infrastructure.Localization;

namespace ProjectHub.Api.DTOs.Auth;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleLevelCascadeMode = CascadeMode.Stop;

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage(_ => LocalizationMessages.EmailRequired)
            .EmailAddress().WithMessage(_ => LocalizationMessages.ValidEmailRequired);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage(_ => LocalizationMessages.PasswordRequired)
            .MinimumLength(8).WithMessage(_ => LocalizationMessages.PasswordMinLength(8))
            .Matches("[A-Z]").WithMessage(_ => LocalizationMessages.PasswordRequiresUpper)
            .Matches("[a-z]").WithMessage(_ => LocalizationMessages.PasswordRequiresLower)
            .Matches("[0-9]").WithMessage(_ => LocalizationMessages.PasswordRequiresDigit);
    }
}
