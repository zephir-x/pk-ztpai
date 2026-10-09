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
    ownerId: string;
    createdAt: string;
}

export interface ProjectResponse {
    id: string;
    name: string;
    description: string | null;
    workspaceId: string;
    createdAt: string;
}

export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
}

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
export interface TaskItemResponse {
    id: string;
    title: string;
    description: string | null;
    status: ProjectTaskStatus;
    priority: TaskPriority;
    projectId: string;
    assigneeId: string | null;
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
export interface UserResponse {
    id: string;
    email: string;
    role: string;
}

export interface CommentResponse {
    id: string;
    content: string;
    taskItemId: string;
    authorId: string;
    createdAt: string;
}

export interface CreateCommentRequest {
    content: string;
    taskItemId: string;
}
