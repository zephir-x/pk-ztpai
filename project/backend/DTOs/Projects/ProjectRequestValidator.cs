using FluentValidation;
using ProjectHub.Api.Infrastructure.Localization;

namespace ProjectHub.Api.DTOs.Projects;

public class CreateProjectRequestValidator : AbstractValidator<CreateProjectRequest>
{
    public CreateProjectRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(_ => LocalizationMessages.ProjectNameRequired)
            .MaximumLength(100).WithMessage(_ => LocalizationMessages.ProjectNameMax(100));

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage(_ => LocalizationMessages.DescriptionMax(500));

        RuleFor(x => x.ThemeColor)
            .IsInEnum().WithMessage(_ => LocalizationMessages.InvalidThemeColor);

        RuleFor(x => x.WorkspaceId)
            .NotEmpty().WithMessage(_ => LocalizationMessages.WorkspaceIdRequired);
    }
}

public class UpdateProjectRequestValidator : AbstractValidator<UpdateProjectRequest>
{
    public UpdateProjectRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(_ => LocalizationMessages.ProjectNameRequired)
            .MaximumLength(100).WithMessage(_ => LocalizationMessages.ProjectNameMax(100));

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage(_ => LocalizationMessages.DescriptionMax(500));

        RuleFor(x => x.ThemeColor)
            .IsInEnum().WithMessage(_ => LocalizationMessages.InvalidThemeColor);
    }
}
