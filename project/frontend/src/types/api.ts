// Standard paginated response wrapper
export interface PagedResponse<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
}

// === Core Domain Entities mapped from backend representations ===
export interface WorkspaceResponse {
    id: string;
    name: string;
    themeColor: ThemeColor;
    ownerId: string;
    createdAt: string;
}

export interface ProjectResponse {
    id: string;
    name: string;
    description: string | null;
    themeColor: ThemeColor;
    workspaceId: string;
    createdAt: string;
}

export const ThemeColor = {
    Blue: 0,
    Red: 1,
    Green: 2,
    Yellow: 3,
    Purple: 4,
    Pink: 5,
    Gray: 6,
    Cyan: 7
} as const;

export type ThemeColor = typeof ThemeColor[keyof typeof ThemeColor];

// === Task Status and Priority Enums ===
export const ProjectTaskStatus = {
    ToDo: 0,
    InProgress: 1,
    Review: 2,
    Done: 3
} as const;

export type ProjectTaskStatus = typeof ProjectTaskStatus[keyof typeof ProjectTaskStatus];

export const TaskPriority = {
    Low: 0,
    Medium: 1,
    High: 2,
    Critical: 3
} as const;

export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

// === Task Management DTOs ===
export interface MyTaskResponse {
    id: string;
    title: string;
    description: string | null;
    status: ProjectTaskStatus;
    priority: TaskPriority;
    projectId: string;
    projectName: string;
    projectThemeColor: ThemeColor;
    workspaceId: string;
    workspaceName: string;
    workspaceThemeColor: ThemeColor;
    assigneeId: string | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface TaskItemResponse {
    id: string;
    title: string;
    description: string | null;
    status: ProjectTaskStatus;
    priority: TaskPriority;
    projectId: string;
    assigneeId: string | null;
    assigneeFirstName?: string | null;
    assigneeLastName?: string | null;
    assigneeAvatarUrl?: string | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface CreateTaskRequest {
    title: string;
    description: string | null;
    status: ProjectTaskStatus;
    priority: TaskPriority;
    projectId: string;
    assigneeId: string | null;
}

export interface UpdateTaskRequest {
    title: string;
    description: string | null;
    status: ProjectTaskStatus;
    priority: TaskPriority;
    assigneeId: string | null;
}

// === User and Communication DTOs ===
export const UserRole = {
    User: 0,
    Admin: 1
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface UserResponse {
    id: string;
    email: string;
    role: string | UserRole;
    firstName: string;
    lastName: string;
    avatarUrl: string;
    createdAt: string;
}

export interface UserProfileResponse {
    id: string;
    email: string;
    role: string | UserRole;
    firstName: string;
    lastName: string;
    avatarUrl: string;
    language: string;
    accentColor: string;
    createdAt: string;
}

export interface UpdateProfileRequest {
    firstName: string;
    lastName: string;
    avatarUrl: string;
    language: string;
    accentColor: string;
    currentPassword?: string;
    newPassword?: string;
}

export interface CreateUserRequest {
    email: string;
    password?: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
}

export interface UpdateUserRequest {
    email: string;
    password?: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
}

export interface CommentResponse {
    id: string;
    content: string;
    taskItemId: string;
    authorId: string;
    authorFirstName?: string | null;
    authorLastName?: string | null;
    authorAvatarUrl?: string | null;
    createdAt: string;
}

export interface CreateCommentRequest {
    content: string;
    taskItemId: string;
}

// === Notification and Messaging DTOs ===
export const NotificationType = {
    Mention: 0,
    TaskAssigned: 1,
    DirectMessage: 2
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export interface NotificationResponse {
    id: string;
    recipientId: string;
    senderId: string | null;
    senderName: string | null;
    senderAvatarUrl: string | null;
    type: NotificationType;
    title: string;
    message: string;
    taskItemId: string | null;
    taskTitle?: string | null;
    projectId: string | null;
    isRead: boolean;
    createdAt: string;
}

export interface SendUserMessageRequest {
    message: string;
}

export interface ReplyMessageRequest {
    recipientId: string;
    message: string;
}
