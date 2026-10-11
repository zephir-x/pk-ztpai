using FluentValidation;
using ProjectHub.Api.Infrastructure.Localization;

namespace ProjectHub.Api.DTOs.Workspaces;

public class CreateWorkspaceRequestValidator : AbstractValidator<CreateWorkspaceRequest>
{
    public CreateWorkspaceRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(_ => LocalizationMessages.WorkspaceNameRequired)
            .MaximumLength(100).WithMessage(_ => LocalizationMessages.WorkspaceNameMax(100));

        RuleFor(x => x.ThemeColor)
            .IsInEnum().WithMessage(_ => LocalizationMessages.InvalidThemeColor);
    }
}

public class UpdateWorkspaceRequestValidator : AbstractValidator<UpdateWorkspaceRequest>
{
    public UpdateWorkspaceRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(_ => LocalizationMessages.WorkspaceNameRequired)
            .MaximumLength(100).WithMessage(_ => LocalizationMessages.WorkspaceNameMax(100));
    }
}
