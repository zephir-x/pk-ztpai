using FluentValidation;
using ProjectHub.Api.Infrastructure.Localization;

namespace ProjectHub.Api.DTOs.Tasks;

public class CreateTaskItemRequestValidator : AbstractValidator<CreateTaskItemRequest>
{
    public CreateTaskItemRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage(_ => LocalizationMessages.TaskTitleRequired)
            .MaximumLength(200).WithMessage(_ => LocalizationMessages.TaskTitleMax(200));
            
        RuleFor(x => x.ProjectId)
            .NotEmpty().WithMessage(_ => LocalizationMessages.ProjectIdRequired);
    }
}

public class UpdateTaskItemRequestValidator : AbstractValidator<UpdateTaskItemRequest>
{
    public UpdateTaskItemRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage(_ => LocalizationMessages.TaskTitleRequired)
            .MaximumLength(200).WithMessage(_ => LocalizationMessages.TaskTitleMax(200));
    }
}
