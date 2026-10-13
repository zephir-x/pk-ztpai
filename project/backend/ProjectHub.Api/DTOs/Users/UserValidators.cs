using FluentValidation;
using ProjectHub.Api.Infrastructure.Localization;

namespace ProjectHub.Api.DTOs.Users;

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleLevelCascadeMode = CascadeMode.Stop;

        RuleFor(x => x.Email).NotEmpty().WithMessage(_ => LocalizationMessages.EmailRequired)
            .EmailAddress().WithMessage(_ => LocalizationMessages.ValidEmailRequired);
        RuleFor(x => x.Password).NotEmpty().WithMessage(_ => LocalizationMessages.PasswordRequired)
            .MinimumLength(8).WithMessage(_ => LocalizationMessages.PasswordMinLength(8));
        RuleFor(x => x.Role).IsInEnum().WithMessage(_ => LocalizationMessages.InvalidRole);
        RuleFor(x => x.FirstName).MaximumLength(50).WithMessage(_ => LocalizationMessages.FirstNameMax(50));
        RuleFor(x => x.LastName).MaximumLength(50).WithMessage(_ => LocalizationMessages.LastNameMax(50));
    }
}

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleLevelCascadeMode = CascadeMode.Stop;

        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrEmpty(x.Email))
            .WithMessage(_ => LocalizationMessages.ValidEmailRequired);
        RuleFor(x => x.Password).MinimumLength(8).When(x => !string.IsNullOrEmpty(x.Password))
            .WithMessage(_ => LocalizationMessages.PasswordMinLength(8));
        RuleFor(x => x.Role).IsInEnum().WithMessage(_ => LocalizationMessages.InvalidRole);
        RuleFor(x => x.FirstName).MaximumLength(50).WithMessage(_ => LocalizationMessages.FirstNameMax(50));
        RuleFor(x => x.LastName).MaximumLength(50).WithMessage(_ => LocalizationMessages.LastNameMax(50));
    }
}

public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleLevelCascadeMode = CascadeMode.Stop;

        RuleFor(x => x.FirstName).MaximumLength(50).WithMessage(_ => LocalizationMessages.FirstNameMax(50));
        RuleFor(x => x.LastName).MaximumLength(50).WithMessage(_ => LocalizationMessages.LastNameMax(50));
        RuleFor(x => x.AvatarUrl).NotEmpty().MaximumLength(100).WithMessage(_ => LocalizationMessages.AvatarRequired);
        RuleFor(x => x.Language).NotEmpty().Must(l => l == "en" || l == "pl").WithMessage(_ => LocalizationMessages.LanguageInvalid);
        RuleFor(x => x.AccentColor).NotEmpty().Must(c => c == "fiery" || c == "yellow" || c == "red" || c == "purple" || c == "green" || c == "blue")
            .WithMessage(_ => LocalizationMessages.AccentColorInvalid);
        RuleFor(x => x.NewPassword).MinimumLength(8).When(x => !string.IsNullOrEmpty(x.NewPassword))
            .WithMessage(_ => LocalizationMessages.PasswordMinLength(8));
    }
}
