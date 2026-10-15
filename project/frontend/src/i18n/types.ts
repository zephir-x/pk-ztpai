export type SupportedLanguage = 'en' | 'pl';

export interface Translations {
    common: {
        save: string;
        saving: string;
        cancel: string;
        delete: string;
        edit: string;
        create: string;
        loading: string;
        actions: string;
        close: string;
        confirm: string;
        admin: string;
        user: string;
        unassigned: string;
        pagination: {
            showing: (from: number, to: number, total: number) => string;
            previous: string;
            next: string;
        };
    };
    navigation: {
        dashboard: string;
        myTasks: string;
        notifications: string;
        adminPanel: string;
        settings: string;
        logout: string;
    };
    notificationsView: {
        pageTitle: string;
        title: string;
        subtitle: string;
        markAllAsRead: string;
        noNotifications: string;
        noNotificationsDesc: string;
        loading: string;
        fetchError: string;
        types: {
            mention: string;
            taskAssigned: string;
            directMessage: string;
        };
        templates: {
            mentionTitle: string;
            mentionDesc: (taskTitle: string) => string;
            assignedTitle: string;
            assignedDesc: (taskTitle: string) => string;
            fromUserTitle: (senderName: string) => string;
            fromAdminTitle: (senderName: string) => string;
        };
        directMessageCard: {
            userTitle: string;
            userSubtitle: string;
            placeholder: string;
            sendButton: string;
            sending: string;
            sendSuccess: string;
            replyTitle: string;
            replyPlaceholder: string;
            replyButton: string;
            replying: string;
            replySuccess: string;
        };
        actions: {
            openTask: string;
            reply: string;
            delete: string;
            markAsRead: string;
        };
    };
    auth: {
        signIn: string;
        signUp: string;
        welcomeBack: string;
        welcomeBackSubtitle: string;
        createAccount: string;
        createAccountSubtitle: string;
        email: string;
        emailPlaceholder: string;
        password: string;
        passwordPlaceholder: string;
        confirmPassword: string;
        confirmPasswordPlaceholder: string;
        processing: string;
        signInBtn: string;
        signUpBtn: string;
        noAccountYet: string;
        switchToSignUp: string;
        alreadyHaveAccount: string;
        switchToSignIn: string;
        heroLoginTitle: string;
        heroLoginSubtitle: string;
        heroRegisterTitle: string;
        heroRegisterSubtitle: string;
        passwordsMismatch: string;
        unexpectedError: string;
    };
    dashboard: {
        title: string;
        subtitle: string;
        newWorkspace: string;
        noWorkspaces: string;
        noWorkspacesDesc: string;
        createWorkspace: string;
        loading: string;
        createdOn: string;
        deleteConfirm: string;
        deleteSuccess: string;
        deleteError: string;
        fetchError: string;
    };
    workspaceDetails: {
        title: string;
        pageTitle: string;
        subtitle: string;
        backButton: string;
        newProject: string;
        noProjects: string;
        noProjectsDesc: string;
        loading: string;
        createdOn: string;
        noDescription: string;
        deleteConfirm: string;
        deleteSuccess: string;
        deleteError: string;
        fetchError: string;
    };
    projectKanban: {
        pageTitle: string;
        subtitle: string;
        backButton: string;
        loading: string;
        liveConnectError: string;
        fetchError: string;
        cannotCloseWithoutAssignee: string;
        adminOnlyAction: string;
        statusUpdateError: string;
        unassigned: string;
        columns: {
            todo: string;
            inProgress: string;
            review: string;
            done: string;
        };
        priorities: {
            low: string;
            medium: string;
            high: string;
            critical: string;
            unknown: string;
        };
    };
    myTasks: {
        title: string;
        subtitle: string;
        noTasks: string;
        noTasksDesc: string;
        loading: string;
        fetchError: string;
    };
    adminPanel: {
        title: string;
        subtitle: string;
        addUser: string;
        emailAccount: string;
        fullName: string;
        notSpecified: string;
        role: string;
        actions: string;
        noUsers: string;
        deleteConfirm: string;
        deleteSuccess: string;
        deleteError: string;
        loading: string;
        youBadge: string;
        pagination: {
            showing: (from: number, to: number, total: number) => string;
            previous: string;
            next: string;
        };
        stressTest: {
            title: string;
            subtitle: string;
            statusTitle: string;
            statusActive: string;
            statusClean: string;
            statsSummary: (ws: number, p: number, t: number, u: number, c: number, n: number) => string;
            seedBtn: string;
            seeding: string;
            cleanupBtn: string;
            cleaning: string;
            seedSuccess: string;
            cleanupSuccess: string;
            confirmCleanup: string;
        };
    };
    settings: {
        title: string;
        subtitle: string;
        profileOverview: {
            memberSince: string;
            administrator: string;
            standardUser: string;
        };
        avatarSection: {
            title: string;
            subtitle: string;
            avatars: Record<string, string>;
        };
        personalInfo: {
            title: string;
            firstName: string;
            firstNamePlaceholder: string;
            lastName: string;
            lastNamePlaceholder: string;
            email: string;
            emailNotice: string;
            role: string;
            roleNotice: string;
        };
        accentColor: {
            title: string;
            subtitle: string;
            colors: {
                fiery: string;
                yellow: string;
                red: string;
                purple: string;
                green: string;
                blue: string;
            };
        };
        languageSection: {
            title: string;
            subtitle: string;
            english: string;
            polish: string;
        };
        security: {
            title: string;
            subtitle: string;
            currentPassword: string;
            currentPasswordPlaceholder: string;
            newPassword: string;
            newPasswordPlaceholder: string;
            confirmPassword: string;
            confirmPasswordPlaceholder: string;
            passwordsMatch: string;
            passwordsDoNotMatch: string;
        };
        notifications: {
            saveSuccess: string;
            saveError: string;
            currentPasswordRequired: string;
            minPasswordLength: string;
            passwordsMismatch: string;
        };
    };
    modals: {
        workspace: {
            createTitle: string;
            editTitle: string;
            nameLabel: string;
            namePlaceholder: string;
            themeColorLabel: string;
            createSuccess: string;
            updateSuccess: string;
        };
        project: {
            createTitle: string;
            editTitle: string;
            nameLabel: string;
            namePlaceholder: string;
            descriptionLabel: string;
            descriptionPlaceholder: string;
            themeColorLabel: string;
            createSuccess: string;
            updateSuccess: string;
        };
        createTask: {
            modalTitle: string;
            titleLabel: string;
            titlePlaceholder: string;
            descriptionLabel: string;
            descriptionPlaceholder: string;
            priorityLabel: string;
            submitBtn: string;
        };
        taskDetails: {
            tabs: {
                details: string;
                comments: string;
                admin: string;
            };
            noDescription: string;
            updateSuccess: string;
            assignSuccess: string;
            prioritySuccess: string;
            deleteConfirm: string;
            deleteSuccess: string;
            commentsSection: {
                noComments: string;
                placeholder: string;
                editComment: string;
                deleteComment: string;
                deleteCommentConfirm: string;
                editCommentSuccess: string;
                deleteCommentSuccess: string;
            };
            adminSection: {
                priorityOverride: string;
                assigneeManagement: string;
                unassigned: string;
                dangerZone: string;
                dangerDesc: string;
                deletePermanently: string;
            };
            apiErrors: {
                conflict: string;
                forbidden: string;
                serverError: string;
                connectionError: string;
            };
        };
        user: {
            createTitle: string;
            editTitle: string;
            avatarLabel: string;
            firstNameLabel: string;
            firstNamePlaceholder: string;
            lastNameLabel: string;
            lastNamePlaceholder: string;
            emailLabel: string;
            emailPlaceholder: string;
            emailImmutableNotice: string;
            roleLabel: string;
            passwordLabel: string;
            newPasswordLabel: string;
            passwordCreatePlaceholder: string;
            passwordEditPlaceholder: string;
            newPasswordNotice: string;
            confirmPasswordLabel: string;
            passwordsMismatch: string;
            passwordRequired: string;
            createSuccess: string;
            updateSuccess: string;
        };
    };
}
