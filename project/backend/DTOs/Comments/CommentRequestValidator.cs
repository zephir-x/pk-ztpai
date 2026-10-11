using FluentValidation;
using ProjectHub.Api.Infrastructure.Localization;

namespace ProjectHub.Api.DTOs.Comments;

public class CreateCommentRequestValidator : AbstractValidator<CreateCommentRequest>
{
    public CreateCommentRequestValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage(_ => LocalizationMessages.CommentContentRequired)
            .MaximumLength(1000).WithMessage(_ => LocalizationMessages.CommentContentMax(1000));

        RuleFor(x => x.TaskItemId)
            .NotEmpty().WithMessage(_ => LocalizationMessages.TaskIdRequired);
    }
}

public class UpdateCommentRequestValidator : AbstractValidator<UpdateCommentRequest>
{
    public UpdateCommentRequestValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage(_ => LocalizationMessages.CommentContentRequired)
            .MaximumLength(1000).WithMessage(_ => LocalizationMessages.CommentContentMax(1000));
    }
}
