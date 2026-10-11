using System;
using System.Globalization;

namespace ProjectHub.Api.Infrastructure.Localization;

// Centralized localization provider for backend exception messages and validation rules
public static class LocalizationMessages
{
    private static bool IsPolish => CultureInfo.CurrentUICulture.TwoLetterISOLanguageName.Equals("pl", StringComparison.OrdinalIgnoreCase);

    // Validation messages
    public static string EmailRequired => IsPolish ? "Adres email jest wymagany." : "Email is required.";
    public static string ValidEmailRequired => IsPolish ? "Wymagany jest poprawny format adresu email." : "A valid email format is required.";
    public static string PasswordRequired => IsPolish ? "Hasło jest wymagane." : "Password is required.";
    public static string PasswordMinLength(int len = 8) => IsPolish ? $"Hasło musi mieć co najmniej {len} znaków." : $"Password must be at least {len} characters long.";
    public static string PasswordRequiresUpper => IsPolish ? "Hasło musi zawierać co najmniej jedną wielką literę." : "Password must contain at least one uppercase letter.";
    public static string PasswordRequiresLower => IsPolish ? "Hasło musi zawierać co najmniej jedną małą literę." : "Password must contain at least one lowercase letter.";
    public static string PasswordRequiresDigit => IsPolish ? "Hasło musi zawierać co najmniej jedną cyfrę." : "Password must contain at least one number.";
    public static string InvalidRole => IsPolish ? "Określono nieprawidłową rolę użytkownika." : "Invalid role specified.";
    public static string FirstNameMax(int max = 50) => IsPolish ? $"Imię nie może przekraczać {max} znaków." : $"First name cannot exceed {max} characters.";
    public static string LastNameMax(int max = 50) => IsPolish ? $"Nazwisko nie może przekraczać {max} znaków." : $"Last name cannot exceed {max} characters.";
    public static string AvatarRequired => IsPolish ? "Identyfikator awatara jest wymagany." : "Avatar identifier is required.";
    public static string LanguageInvalid => IsPolish ? "Język musi być 'en' lub 'pl'." : "Language must be 'en' or 'pl'.";
    public static string AccentColorInvalid => IsPolish ? "Kolor akcentu musi być jednym z: fiery, yellow, red, purple, green, blue." : "Accent color must be one of: fiery, yellow, red, purple, green, blue.";
    public static string WorkspaceNameRequired => IsPolish ? "Nazwa obszaru roboczego jest wymagana." : "Workspace name is required.";
    public static string WorkspaceNameMax(int max = 100) => IsPolish ? $"Nazwa obszaru roboczego nie może przekraczać {max} znaków." : $"Workspace name cannot exceed {max} characters.";
    public static string InvalidThemeColor => IsPolish ? "Nieprawidłowy kolor motywu." : "Invalid ThemeColor.";
    public static string ProjectNameRequired => IsPolish ? "Nazwa projektu jest wymagana." : "Project name is required.";
    public static string ProjectNameMax(int max = 100) => IsPolish ? $"Nazwa projektu nie może przekraczać {max} znaków." : $"Project name cannot exceed {max} characters.";
    public static string DescriptionMax(int max = 500) => IsPolish ? $"Opis nie może przekraczać {max} znaków." : $"Description cannot exceed {max} characters.";
    public static string WorkspaceIdRequired => IsPolish ? "Identyfikator obszaru roboczego jest wymagany." : "Workspace ID is required.";
    public static string TaskTitleRequired => IsPolish ? "Tytuł zadania jest wymagany." : "Task title is required.";
    public static string TaskTitleMax(int max = 200) => IsPolish ? $"Tytuł zadania nie może przekraczać {max} znaków." : $"Task title cannot exceed {max} characters.";
    public static string ProjectIdRequired => IsPolish ? "Identyfikator projektu jest wymagany." : "Project ID is required.";
    public static string CommentContentRequired => IsPolish ? "Treść komentarza jest wymagana." : "Comment content is required.";
    public static string CommentContentMax(int max = 1000) => IsPolish ? $"Treść komentarza nie może przekraczać {max} znaków." : $"Comment cannot exceed {max} characters.";
    public static string TaskIdRequired => IsPolish ? "Identyfikator zadania jest wymagany." : "Task ID is required.";

    // Service & Auth messages
    public static string UserAlreadyExists => IsPolish ? "Użytkownik o podanym adresie email już istnieje." : "User with this email already exists.";
    public static string InvalidCredentials => IsPolish ? "Nieprawidłowy adres email lub hasło." : "Invalid email or password.";
    public static string CurrentPasswordIncorrect => IsPolish ? "Aktualne hasło jest nieprawidłowe lub nie zostało podane." : "Current password is missing or incorrect.";
    public static string CannotDeleteOwnAccount => IsPolish ? "Nie możesz usunąć własnego konta użytkownika." : "You cannot delete your own user account.";
    public static string AdminOnlyOperation => IsPolish ? "Tylko administrator może wykonać tę operację." : "Only administrators can perform this operation.";
    public static string TaskDoneRequiresAssignee => IsPolish ? "Zadanie nie może zostać oznaczone jako 'Zrobione' bez przypisanej osoby." : "A task cannot be marked as 'Done' if it does not have an active assignee attached.";
    public static string TaskDoneCreateRequiresAssignee => IsPolish ? "Zadanie nie może zostać utworzone ze statusem 'Zrobione' bez przypisanej osoby." : "A task cannot be created with 'Done' status if it does not have an assignee.";
    public static string TaskAssignAdminOnly => IsPolish ? "Tylko użytkownicy z uprawnieniami administratora mogą przypisywać zadania." : "Only users with ADMIN privileges can assign tasks to a user.";
    public static string CommentAuthorOrAdminOnly => IsPolish ? "Tylko autor lub administrator może zmodyfikować ten komentarz." : "Only the author or an administrator can modify this comment.";
    public static string NoWorkspacePermission => IsPolish ? "Nie masz uprawnień do zarządzania tym obszarem roboczym." : "You do not have permission to access or modify this workspace.";
    public static string NoProjectPermission => IsPolish ? "Nie masz uprawnień dostępu do projektów w tym obszarze roboczym." : "You do not have permission to access projects in this workspace.";
    public static string NoTaskPermission => IsPolish ? "Nie masz uprawnień dostępu do zadań w tym projekcie." : "You do not have permission to access tasks in this project.";
    public static string CannotDeleteProjectCriticalTasks => IsPolish ? "Nie można usunąć projektu zawierającego nierozwiązane zadania krytyczne." : "Cannot delete a project that contains unresolved critical tasks.";

    public static string NotFound(string entity, Guid id) => IsPolish
        ? $"{entity} o identyfikatorze {id} nie został(a) odnaleziony(a)."
        : $"{entity} with ID {id} was not found.";
}
