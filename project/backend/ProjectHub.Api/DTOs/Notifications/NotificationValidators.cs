using FluentValidation;
using ProjectHub.Api.Infrastructure.Localization;

namespace ProjectHub.Api.DTOs.Notifications;

// Validates direct message submissions from users to administrators
public class SendUserMessageRequestValidator : AbstractValidator<SendUserMessageRequest>
{
    public SendUserMessageRequestValidator()
    {
        RuleFor(x => x.Message)
            .NotEmpty().WithMessage(LocalizationMessages.MessageRequired)
            .MaximumLength(2000).WithMessage(LocalizationMessages.MessageMax(2000));
    }
}

// Validates administrative replies to users
public class ReplyMessageRequestValidator : AbstractValidator<ReplyMessageRequest>
{
    public ReplyMessageRequestValidator()
    {
        RuleFor(x => x.RecipientId)
            .NotEmpty().WithMessage(LocalizationMessages.RecipientIdRequired);

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage(LocalizationMessages.MessageRequired)
            .MaximumLength(2000).WithMessage(LocalizationMessages.MessageMax(2000));
    }
}
