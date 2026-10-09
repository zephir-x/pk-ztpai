using FluentValidation;

namespace ProjectHub.Api.DTOs.Users;

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("A valid email is required.");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).WithMessage("Password must be at least 8 characters long.");
        RuleFor(x => x.Role).IsInEnum().WithMessage("Invalid role specified.");
    }
}

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("A valid email is required.");
        RuleFor(x => x.Password).MinimumLength(8).When(x => !string.IsNullOrEmpty(x.Password)).WithMessage("Password must be at least 8 characters long if provided.");
        RuleFor(x => x.Role).IsInEnum().WithMessage("Invalid role specified.");
    }
}
