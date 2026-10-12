import type { Translations } from '../types';

export const en: Translations = {
    common: {
        save: 'Save Changes',
        saving: 'Saving...',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        loading: 'Loading...',
        actions: 'Actions',
        close: 'Close',
        confirm: 'Confirm',
        admin: 'Admin',
        user: 'User',
        unassigned: 'Unassigned'
    },
    navigation: {
        dashboard: 'Dashboard',
        myTasks: 'My Tasks',
        notifications: 'Notifications',
        adminPanel: 'Admin Panel',
        settings: 'Settings',
        logout: 'Log out'
    },
    notificationsView: {
        pageTitle: 'Notifications',
        title: 'Notifications & Messages',
        subtitle: 'Stay updated with your mentions, task assignments, and direct communications.',
        markAllAsRead: 'Mark all as read',
        noNotifications: 'No notifications',
        noNotificationsDesc: 'You do not have any notifications yet. Everything is caught up!',
        loading: 'Loading notifications...',
        fetchError: 'Failed to retrieve notifications.',
        types: {
            mention: 'Mention',
            taskAssigned: 'Task Assignment',
            directMessage: 'Direct Message'
        },
        templates: {
            mentionTitle: 'Mention in comment',
            mentionDesc: (taskTitle: string) => `You were mentioned in task: ${taskTitle}`,
            assignedTitle: 'Task assignment',
            assignedDesc: (taskTitle: string) => `You were assigned to task: ${taskTitle}`,
            fromUserTitle: (senderName: string) => `Message from ${senderName}`,
            fromAdminTitle: (senderName: string) => `Administrative reply from ${senderName}`
        },
        directMessageCard: {
            userTitle: 'Contact Administrator',
            userSubtitle: 'Have a question or encounter an issue? Send a direct message to system administrators.',
            placeholder: 'Type your message for administrators here...',
            sendButton: 'Send Message',
            sending: 'Sending...',
            sendSuccess: 'Your message has been delivered to administrators.',
            replyTitle: 'Reply to User',
            replyPlaceholder: 'Write your administrative reply...',
            replyButton: 'Send Reply',
            replying: 'Sending...',
            replySuccess: 'Your reply has been delivered to the user.'
        },
        actions: {
            openTask: 'View Task',
            reply: 'Reply',
            delete: 'Delete',
            markAsRead: 'Mark as read'
        }
    },
    auth: {
        signIn: 'Sign In',
        signUp: 'Sign Up',
        welcomeBack: 'Welcome back',
        welcomeBackSubtitle: 'Sign in to access your workspaces',
        createAccount: 'Create Account',
        createAccountSubtitle: 'Set up your profile in seconds',
        email: 'Email Address',
        emailPlaceholder: 'name@company.com',
        password: 'Password',
        passwordPlaceholder: '••••••••',
        confirmPassword: 'Confirm Password',
        confirmPasswordPlaceholder: '••••••••',
        processing: 'Processing...',
        signInBtn: 'Sign In',
        signUpBtn: 'Sign Up',
        noAccountYet: "Don't have an account yet?",
        switchToSignUp: 'Switch to Sign Up',
        alreadyHaveAccount: 'Already part of the team?',
        switchToSignIn: 'Switch to Sign In',
        heroLoginTitle: 'Passionately Curious.',
        heroLoginSubtitle: 'Manage your projects with extreme precision. Experience the clarity of thought and execution.',
        heroRegisterTitle: 'Built for Teams.',
        heroRegisterSubtitle: 'Join ProjectHub and bring order to chaos. Your workspaces await.',
        passwordsMismatch: 'Passwords do not match.',
        unexpectedError: 'An unexpected error occurred. Please try again.'
    },
    dashboard: {
        title: 'Workspaces',
        subtitle: 'Manage your team environment',
        newWorkspace: 'New Workspace',
        noWorkspaces: 'No workspaces found',
        noWorkspacesDesc: "You don't have access to any workspaces yet.",
        createWorkspace: 'Create Workspace',
        loading: 'Loading workspaces...',
        createdOn: 'Created on',
        deleteConfirm: 'Are you sure you want to delete this workspace? This operation cannot be undone.',
        deleteSuccess: 'The workspace has been deleted.',
        deleteError: 'Failed to remove the workspace.',
        fetchError: 'Failed to retrieve workspaces.'
    },
    workspaceDetails: {
        title: 'Projects Explorer',
        pageTitle: 'Workspace Details',
        subtitle: 'Manage active projects within this workspace',
        backButton: 'Back to Workspaces',
        newProject: 'New Project',
        noProjects: 'No projects found',
        noProjectsDesc: 'This workspace is currently empty.',
        loading: 'Loading workspace projects...',
        createdOn: 'Created on',
        noDescription: 'No description provided.',
        deleteConfirm: 'Are you sure you want to delete this project? This operation cannot be undone.',
        deleteSuccess: 'The project has been deleted.',
        deleteError: 'Failed to remove the project.',
        fetchError: 'Failed to retrieve workspace projects.'
    },
    projectKanban: {
        pageTitle: 'Kanban Board',
        subtitle: 'Kanban Board',
        backButton: 'Back to Projects',
        loading: 'Loading tasks...',
        liveConnectError: 'Failed to connect to the live update server.',
        fetchError: 'Failed to retrieve the task list from the server.',
        cannotCloseWithoutAssignee: 'Operation impossible: the task cannot be closed without an assigned user.',
        adminOnlyAction: 'Only the administrator can perform this activity.',
        statusUpdateError: 'An error occurred while updating the task status.',
        unassigned: 'Unassigned',
        columns: {
            todo: 'To Do',
            inProgress: 'In Progress',
            review: 'Review',
            done: 'Done'
        },
        priorities: {
            low: 'LOW',
            medium: 'MEDIUM',
            high: 'HIGH',
            critical: 'CRITICAL',
            unknown: 'UNKNOWN'
        }
    },
    myTasks: {
        title: 'My Tasks',
        subtitle: 'All tasks currently assigned to you across workspaces.',
        noTasks: 'No assigned tasks',
        noTasksDesc: 'You are all caught up! There are no tasks currently assigned to you.',
        loading: 'Loading your tasks...',
        fetchError: 'Failed to retrieve your tasks.'
    },
    adminPanel: {
        title: 'System Administration',
        subtitle: 'Manage platform users and global settings',
        addUser: 'Add User',
        emailAccount: 'Email Account',
        fullName: 'Full Name',
        notSpecified: 'Not specified',
        role: 'Role',
        actions: 'Actions',
        noUsers: 'No users found in the system.',
        deleteConfirm: 'Are you sure you want to delete this user?',
        deleteSuccess: 'User has been successfully deleted.',
        deleteError: 'Failed to delete user.',
        loading: 'Loading administration panel...',
        youBadge: '(You)'
    },
    settings: {
        title: 'Settings & Profile',
        subtitle: 'Manage your profile information, appearance preferences, and system security.',
        profileOverview: {
            memberSince: 'Member since',
            administrator: 'Administrator',
            standardUser: 'User'
        },
        avatarSection: {
            title: 'Profile Avatar',
            subtitle: 'Choose a predefined avatar preset for your account.',
            avatars: {
                anonymous: 'Anonymous',
                'avatar-1': 'Astronaut',
                'avatar-2': 'Developer',
                'avatar-3': 'Innovator',
                'avatar-4': 'Wizard',
                'avatar-5': 'Android',
                'avatar-6': 'Leader',
                'avatar-7': 'Firestarter'
            }
        },
        personalInfo: {
            title: 'Personal Information',
            firstName: 'First Name',
            firstNamePlaceholder: 'Enter your first name',
            lastName: 'Last Name',
            lastNamePlaceholder: 'Enter your last name',
            email: 'Email Address',
            emailNotice: 'Email address is linked to your login credentials.',
            role: 'Role & Permissions',
            roleNotice: 'Assigned by system administrators.'
        },
        accentColor: {
            title: 'App Theme Accent Color',
            subtitle: 'Select your preferred visual highlight color. Changes take effect across the entire app upon saving.',
            colors: {
                fiery: 'Fiery Orange',
                yellow: 'Amber Yellow',
                red: 'Crimson Red',
                purple: 'Royal Purple',
                green: 'Emerald Green',
                blue: 'Sapphire Blue'
            }
        },
        languageSection: {
            title: 'Interface Language',
            subtitle: 'Select your preferred language for all interface labels and notifications.',
            english: 'English (US)',
            polish: 'Polski (PL)'
        },
        security: {
            title: 'Change Password',
            subtitle: 'Leave these fields empty if you do not wish to change your password.',
            currentPassword: 'Current Password',
            currentPasswordPlaceholder: 'Enter current password',
            newPassword: 'New Password',
            newPasswordPlaceholder: 'Enter new password',
            confirmPassword: 'Confirm New Password',
            confirmPasswordPlaceholder: 'Re-enter new password',
            passwordsMatch: 'Passwords match',
            passwordsDoNotMatch: 'Passwords must match'
        },
        notifications: {
            saveSuccess: 'Profile settings have been saved successfully.',
            saveError: 'Failed to update profile settings.',
            currentPasswordRequired: 'Current password is required to change password.',
            minPasswordLength: 'New password must be at least 8 characters long.',
            passwordsMismatch: 'The new passwords do not match.'
        }
    },
    modals: {
        workspace: {
            createTitle: 'Create New Workspace',
            editTitle: 'Edit Workspace',
            nameLabel: 'Workspace Name',
            namePlaceholder: 'e.g. Engineering Team',
            themeColorLabel: 'Theme Color',
            createSuccess: 'The workspace has been successfully created.',
            updateSuccess: 'The workspace has been updated.'
        },
        project: {
            createTitle: 'Create New Project',
            editTitle: 'Edit Project',
            nameLabel: 'Project Name',
            namePlaceholder: 'e.g. Website Redesign',
            descriptionLabel: 'Description (Optional)',
            descriptionPlaceholder: 'Briefly describe the project... ',
            themeColorLabel: 'Theme Color',
            createSuccess: 'The project has been successfully created.',
            updateSuccess: 'The project has been updated.'
        },
        createTask: {
            modalTitle: 'Add New Task',
            titleLabel: 'Task Title',
            titlePlaceholder: 'e.g. Implement authentication',
            descriptionLabel: 'Description',
            descriptionPlaceholder: 'Add details...',
            priorityLabel: 'Priority',
            submitBtn: 'Add Task'
        },
        taskDetails: {
            tabs: {
                details: 'Details',
                comments: 'Comments',
                admin: 'Admin'
            },
            noDescription: 'No description provided.',
            updateSuccess: 'The task details have been updated.',
            assignSuccess: 'The user has been assigned to the task.',
            prioritySuccess: 'The task priority has been updated.',
            deleteConfirm: 'Are you sure you want to delete this task?',
            deleteSuccess: 'The task has been permanently deleted.',
            commentsSection: {
                noComments: 'No comments yet.',
                placeholder: 'Write a comment...'
            },
            adminSection: {
                priorityOverride: 'Priority Override',
                assigneeManagement: 'Assignee Management',
                unassigned: 'Unassigned',
                dangerZone: 'Danger Zone',
                dangerDesc: 'Deleting a task cannot be undone. All associated comments will be lost.',
                deletePermanently: 'Delete Task Permanently'
            },
            apiErrors: {
                conflict: 'The operation cannot be performed due to a business logic conflict.',
                forbidden: 'Only the administrator can perform this activity.',
                serverError: 'An unexpected server error occurred.',
                connectionError: 'Server connection error.'
            }
        },
        user: {
            createTitle: 'Create New User',
            editTitle: 'Edit User',
            avatarLabel: 'Avatar',
            firstNameLabel: 'First Name',
            firstNamePlaceholder: 'e.g. John',
            lastNameLabel: 'Last Name',
            lastNamePlaceholder: 'e.g. Doe',
            emailLabel: 'Email Address',
            emailPlaceholder: 'user@projecthub.com',
            emailImmutableNotice: 'Email address is permanently bound to the user account.',
            roleLabel: 'Role',
            passwordLabel: 'Password',
            newPasswordLabel: 'New Password (Optional)',
            passwordCreatePlaceholder: 'Min. 8 chars (A-Z, a-z, 0-9)',
            passwordEditPlaceholder: 'Leave blank to keep current',
            newPasswordNotice: "If you set a new password, it will override the user's current password.",
            confirmPasswordLabel: 'Confirm Password',
            passwordsMismatch: 'The passwords do not match.',
            passwordRequired: 'A password is required when creating a new user.',
            createSuccess: 'The user has been successfully added.',
            updateSuccess: 'The user has been updated.'
        }
    }
};
