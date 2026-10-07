using FluentValidation;

namespace ProjectHub.Api.DTOs.Workspaces;

public class CreateWorkspaceRequestValidator : AbstractValidator<CreateWorkspaceRequest>
{
    public CreateWorkspaceRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Workspace name is required.")
            .MaximumLength(100).WithMessage("Workspace name cannot exceed 100 characters.");
    }
}

public class UpdateWorkspaceRequestValidator : AbstractValidator<UpdateWorkspaceRequest>
{
    public UpdateWorkspaceRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Workspace name is required.")
            .MaximumLength(100).WithMessage("Workspace name cannot exceed 100 characters.");
    }
}
