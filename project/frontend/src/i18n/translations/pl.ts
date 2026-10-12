import type { Translations } from '../types';

export const pl: Translations = {
    common: {
        save: 'Zapisz zmiany',
        saving: 'Zapisywanie...',
        cancel: 'Anuluj',
        delete: 'Usuń',
        edit: 'Edytuj',
        create: 'Utwórz',
        loading: 'Ładowanie...',
        actions: 'Akcje',
        close: 'Zamknij',
        confirm: 'Potwierdź',
        admin: 'Administrator',
        user: 'Użytkownik',
        unassigned: 'Nieprzypisany'
    },
    navigation: {
        dashboard: 'Pulpit',
        myTasks: 'Moje zadania',
        notifications: 'Powiadomienia',
        adminPanel: 'Panel administratora',
        settings: 'Ustawienia',
        logout: 'Wyloguj się'
    },
    notificationsView: {
        pageTitle: 'Powiadomienia',
        title: 'Powiadomienia i wiadomości',
        subtitle: 'Bądź na bieżąco ze wzmiankami, przypisaniami do zadań oraz bezpośrednią komunikacją.',
        markAllAsRead: 'Oznacz wszystkie jako przeczytane',
        noNotifications: 'Brak powiadomień',
        noNotificationsDesc: 'Nie masz jeszcze żadnych powiadomień. Wszystko jest aktualne!',
        loading: 'Ładowanie powiadomień...',
        fetchError: 'Nie udało się pobrać powiadomień.',
        types: {
            mention: 'Wzmianka',
            taskAssigned: 'Przypisanie do zadania',
            directMessage: 'Wiadomość bezpośrednia'
        },
        templates: {
            mentionTitle: 'Oznaczenie w komentarzu',
            mentionDesc: (taskTitle: string) => `Zostałeś oznaczony w zadaniu: ${taskTitle}`,
            assignedTitle: 'Przypisanie do zadania',
            assignedDesc: (taskTitle: string) => `Zostałeś przypisany do zadania: ${taskTitle}`,
            fromUserTitle: (senderName: string) => `Wiadomość od ${senderName}`,
            fromAdminTitle: (senderName: string) => `Odpowiedź administratora od ${senderName}`
        },
        directMessageCard: {
            userTitle: 'Skontaktuj się z administratorem',
            userSubtitle: 'Masz pytanie lub problem? Wyślij bezpośrednią wiadomość do administratorów systemu.',
            placeholder: 'Napisz swoją wiadomość do administratorów tutaj...',
            sendButton: 'Wyślij wiadomość',
            sending: 'Wysyłanie...',
            sendSuccess: 'Twoja wiadomość została dostarczona do administratorów.',
            replyTitle: 'Odpowiedz użytkownikowi',
            replyPlaceholder: 'Napisz odpowiedź do użytkownika...',
            replyButton: 'Wyślij odpowiedź',
            replying: 'Wysyłanie...',
            replySuccess: 'Twoja odpowiedź została dostarczona do użytkownika.'
        },
        actions: {
            openTask: 'Zobacz zadanie',
            reply: 'Odpowiedz',
            delete: 'Usuń',
            markAsRead: 'Oznacz jako przeczytane'
        }
    },
    auth: {
        signIn: 'Logowanie',
        signUp: 'Rejestracja',
        welcomeBack: 'Witaj ponownie',
        welcomeBackSubtitle: 'Zaloguj się, aby uzyskać dostęp do swoich obszarów roboczych',
        createAccount: 'Utwórz konto',
        createAccountSubtitle: 'Skonfiguruj swój profil w kilka sekund',
        email: 'Adres email',
        emailPlaceholder: 'nazwa@firma.pl',
        password: 'Hasło',
        passwordPlaceholder: '••••••••',
        confirmPassword: 'Potwierdź hasło',
        confirmPasswordPlaceholder: '••••••••',
        processing: 'Przetwarzanie...',
        signInBtn: 'Zaloguj się',
        signUpBtn: 'Zarejestruj się',
        noAccountYet: 'Nie masz jeszcze konta?',
        switchToSignUp: 'Przejdź do rejestracji',
        alreadyHaveAccount: 'Masz już konto?',
        switchToSignIn: 'Przejdź do logowania',
        heroLoginTitle: 'Pełna kontrola nad projektami.',
        heroLoginSubtitle: 'Zarządzaj swoimi projektami z najwyższą precyzją. Doświadcz przejrzystości myśli i sprawnej realizacji zadań.',
        heroRegisterTitle: 'Stworzone dla zespołów.',
        heroRegisterSubtitle: 'Dołącz do ProjectHub i zaprowadź porządek. Twoje przestrzenie robocze czekają.',
        passwordsMismatch: 'Hasła nie są identyczne.',
        unexpectedError: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.'
    },
    dashboard: {
        title: 'Workspaces',
        subtitle: 'Manage your team environment',
        newWorkspace: 'Nowy obszar roboczy',
        noWorkspaces: 'Nie znaleziono obszarów roboczych',
        noWorkspacesDesc: 'Nie należysz jeszcze do żadnego obszaru roboczego. Poproś administratora o zaproszenie lub utwórz nowy, jeśli posiadasz uprawnienia.',
        createWorkspace: 'Utwórz obszar roboczy',
        loading: 'Ładowanie obszarów roboczych...',
        createdOn: 'Utworzono',
        deleteConfirm: 'Czy na pewno chcesz usunąć ten obszar roboczy? Wszystkie zawarte w nim projekty i zadania zostaną bezpowrotnie utracone.',
        deleteSuccess: 'Obszar roboczy został pomyślnie usunięty.',
        deleteError: 'Nie udało się usunąć obszaru roboczego.',
        fetchError: 'Nie udało się pobrać obszarów roboczych.'
    },
    workspaceDetails: {
        title: 'Eksplorator projektów',
        pageTitle: 'Szczegóły obszaru roboczego',
        subtitle: 'Zarządzaj aktywnymi projektami w tym obszarze roboczym',
        backButton: 'Wróć do listy',
        newProject: 'Nowy projekt',
        noProjects: 'Nie znaleziono projektów',
        noProjectsDesc: 'Ten obszar roboczy nie zawiera jeszcze żadnych projektów. Utwórz pierwszy projekt, aby rozpocząć organizację zadań.',
        loading: 'Ładowanie projektów...',
        createdOn: 'Utworzono',
        noDescription: 'Brak opisu.',
        deleteConfirm: 'Czy na pewno chcesz usunąć ten projekt? Ta operacja jest nieodwracalna.',
        deleteSuccess: 'Projekt został pomyślnie usunięty.',
        deleteError: 'Nie udało się usunąć projektu.',
        fetchError: 'Nie udało się pobrać projektów obszaru roboczego.'
    },
    projectKanban: {
        pageTitle: 'Kanban Board',
        subtitle: 'Kanban Board',
        backButton: 'Back to Projects',
        loading: 'Ładowanie zadań...',
        liveConnectError: 'Nie udało się połączyć z serwerem aktualizacji na żywo.',
        fetchError: 'Nie udało się pobrać listy zadań z serwera.',
        cannotCloseWithoutAssignee: 'Operacja niemożliwa: zadanie nie może zostać zamknięte bez przypisanego użytkownika.',
        adminOnlyAction: 'Tylko administrator może wykonać tę operację.',
        statusUpdateError: 'Wystąpił błąd podczas aktualizacji statusu zadania.',
        unassigned: 'Nieprzypisany',
        columns: {
            todo: 'Do zrobienia',
            inProgress: 'W trakcie',
            review: 'Przegląd',
            done: 'Zakończone'
        },
        priorities: {
            low: 'Niski',
            medium: 'Średni',
            high: 'Wysoki',
            critical: 'Krytyczny',
            unknown: 'Nieznany'
        }
    },
    myTasks: {
        title: 'Moje zadania',
        subtitle: 'Wszystkie zadania przypisane do Twojego konta w różnych projektach i przestrzeniach.',
        noTasks: 'Brak przypisanych zadań',
        noTasksDesc: 'Nie masz obecnie żadnych otwartych zadań przypisanych do Twojego profilu.',
        loading: 'Pobieranie Twoich zadań...',
        fetchError: 'Nie udało się pobrać Twoich zadań.'
    },
    adminPanel: {
        title: 'Panel administratora',
        subtitle: 'Zarządzaj kontami użytkowników, rolami oraz uprawnieniami w systemie.',
        addUser: 'Dodaj użytkownika',
        emailAccount: 'Konto e-mail',
        fullName: 'Imię i nazwisko',
        notSpecified: 'Nie podano',
        role: 'Rola',
        actions: 'Akcje',
        noUsers: 'Brak zarejestrowanych użytkowników w systemie.',
        deleteConfirm: 'Czy na pewno chcesz usunąć tego użytkownika?',
        deleteSuccess: 'Użytkownik został pomyślnie usunięty.',
        deleteError: 'Nie udało się usunąć użytkownika.',
        loading: 'Ładowanie panelu administratora...',
        youBadge: '(Twoje konto)'
    },
    settings: {
        title: 'Ustawienia i profil',
        subtitle: 'Zarządzaj informacjami o swoim profilu, wyglądem aplikacji oraz bezpieczeństwem konta.',
        profileOverview: {
            memberSince: 'Członek od',
            administrator: 'Administrator',
            standardUser: 'Użytkownik'
        },
        avatarSection: {
            title: 'Awatar profilu',
            subtitle: 'Wybierz gotowy awatar dla swojego konta.',
            avatars: {
                anonymous: 'Anonimowy',
                'avatar-1': 'Astronauta',
                'avatar-2': 'Programista',
                'avatar-3': 'Innowator',
                'avatar-4': 'Czarodziej',
                'avatar-5': 'Android',
                'avatar-6': 'Lider',
                'avatar-7': 'Ognik'
            }
        },
        personalInfo: {
            title: 'Dane osobowe',
            firstName: 'Imię',
            firstNamePlaceholder: 'Wpisz swoje imię',
            lastName: 'Nazwisko',
            lastNamePlaceholder: 'Wpisz swoje nazwisko',
            email: 'Adres email',
            emailNotice: 'Adres email jest powiązany z danymi logowania.',
            role: 'Rola i uprawnienia',
            roleNotice: 'Przydzielane przez administratorów systemu.'
        },
        accentColor: {
            title: 'Kolor akcentu aplikacji',
            subtitle: 'Wybierz preferowany kolor przewodni. Zmiany zostaną zastosowane w całej aplikacji po zapisaniu.',
            colors: {
                fiery: 'Ognisty pomarańcz',
                yellow: 'Słoneczny żółty',
                red: 'Karmazynowa czerwień',
                purple: 'Królewski fiolet',
                green: 'Szmaragdowa zieleń',
                blue: 'Szafirowy błękit'
            }
        },
        languageSection: {
            title: 'Język interfejsu',
            subtitle: 'Wybierz preferowany język dla etykiet interfejsu i powiadomień.',
            english: 'English (US)',
            polish: 'Polski (PL)'
        },
        security: {
            title: 'Zmiana hasła',
            subtitle: 'Pozostaw te pola puste, jeśli nie chcesz zmieniać hasła.',
            currentPassword: 'Aktualne hasło',
            currentPasswordPlaceholder: 'Wpisz aktualne hasło',
            newPassword: 'Nowe hasło',
            newPasswordPlaceholder: 'Wpisz nowe hasło',
            confirmPassword: 'Potwierdź nowe hasło',
            confirmPasswordPlaceholder: 'Wpisz ponownie nowe hasło',
            passwordsMatch: 'Hasła są identyczne',
            passwordsDoNotMatch: 'Hasła muszą być identyczne'
        },
        notifications: {
            saveSuccess: 'Ustawienia profilu zostały pomyślnie zapisane.',
            saveError: 'Nie udało się zaktualizować ustawień profilu.',
            currentPasswordRequired: 'Aktualne hasło jest wymagane do zmiany hasła.',
            minPasswordLength: 'Nowe hasło musi mieć co najmniej 8 znaków.',
            passwordsMismatch: 'Nowe hasła nie są identyczne.'
        }
    },
    modals: {
        workspace: {
            createTitle: 'Utwórz nowy obszar roboczy',
            editTitle: 'Edytuj obszar roboczy',
            nameLabel: 'Nazwa obszaru roboczego',
            namePlaceholder: 'np. Zespół Inżynierii',
            themeColorLabel: 'Kolor motywu',
            createSuccess: 'Obszar roboczy został pomyślnie utworzony.',
            updateSuccess: 'Obszar roboczy został zaktualizowany.'
        },
        project: {
            createTitle: 'Utwórz nowy projekt',
            editTitle: 'Edytuj projekt',
            nameLabel: 'Nazwa projektu',
            namePlaceholder: 'np. Nowy portal internetowy',
            descriptionLabel: 'Opis (opcjonalnie)',
            descriptionPlaceholder: 'Krótko opisz projekt...',
            themeColorLabel: 'Kolor motywu',
            createSuccess: 'Projekt został pomyślnie utworzony.',
            updateSuccess: 'Projekt został zaktualizowany.'
        },
        createTask: {
            modalTitle: 'Dodaj nowe zadanie',
            titleLabel: 'Tytuł zadania',
            titlePlaceholder: 'np. Implementacja autoryzacji',
            descriptionLabel: 'Opis',
            descriptionPlaceholder: 'Dodaj szczegóły...',
            priorityLabel: 'Priorytet',
            submitBtn: 'Dodaj zadanie'
        },
        taskDetails: {
            tabs: {
                details: 'Szczegóły',
                comments: 'Komentarze',
                admin: 'Administracja'
            },
            noDescription: 'Brak opisu.',
            updateSuccess: 'Szczegóły zadania zostały zaktualizowane.',
            assignSuccess: 'Użytkownik został przypisany do zadania.',
            prioritySuccess: 'Priorytet zadania został zaktualizowany.',
            deleteConfirm: 'Czy na pewno chcesz usunąć to zadanie?',
            deleteSuccess: 'Zadanie zostało trwale usunięte.',
            commentsSection: {
                noComments: 'Brak komentarzy.',
                placeholder: 'Napisz komentarz...'
            },
            adminSection: {
                priorityOverride: 'Zmiana priorytetu',
                assigneeManagement: 'Zarządzanie przypisaniem',
                unassigned: 'Nieprzypisany',
                dangerZone: 'Strefa niebezpieczna',
                dangerDesc: 'Usunięcie zadania jest nieodwracalne. Wszystkie powiązane komentarze zostaną usunięte.',
                deletePermanently: 'Usuń zadanie na stałe'
            },
            apiErrors: {
                conflict: 'Operacja nie może zostać wykonana z powodu konfliktu logiki biznesowej.',
                forbidden: 'Tylko administrator może wykonać tę czynność.',
                serverError: 'Wystąpił nieoczekiwany błąd serwera.',
                connectionError: 'Błąd połączenia z serwerem.'
            }
        },
        user: {
            createTitle: 'Utwórz nowego użytkownika',
            editTitle: 'Edytuj użytkownika',
            avatarLabel: 'Awatar',
            firstNameLabel: 'Imię',
            firstNamePlaceholder: 'np. Jan',
            lastNameLabel: 'Nazwisko',
            lastNamePlaceholder: 'np. Kowalski',
            emailLabel: 'Adres email',
            emailPlaceholder: 'uzytkownik@firma.pl',
            emailImmutableNotice: 'Adres email jest trwale powiązany z kontem użytkownika.',
            roleLabel: 'Rola',
            passwordLabel: 'Hasło',
            newPasswordLabel: 'Nowe hasło (opcjonalnie)',
            passwordCreatePlaceholder: 'Min. 8 znaków (A-Z, a-z, 0-9)',
            passwordEditPlaceholder: 'Pozostaw puste, aby zachować obecne',
            newPasswordNotice: 'Jeśli wpiszesz nowe hasło, zastąpi ono obecne hasło użytkownika.',
            confirmPasswordLabel: 'Potwierdź hasło',
            passwordsMismatch: 'Hasła nie są identyczne.',
            passwordRequired: 'Hasło jest wymagane podczas tworzenia nowego użytkownika.',
            createSuccess: 'Użytkownik został pomyślnie dodany.',
            updateSuccess: 'Użytkownik został zaktualizowany.'
        }
    }
};
