using System;

namespace ProjectHub.Api.DTOs.StressTest;

public record StressTestStatusDto(
    bool IsStressDataActive,
    int WorkspacesCount,
    int ProjectsCount,
    int TasksCount,
    int UsersCount,
    int CommentsCount,
    int NotificationsCount
);

public record StressTestResultDto(
    string Message,
    int WorkspacesCreated,
    int ProjectsCreated,
    int TasksCreated,
    int UsersCreated,
    int CommentsCreated,
    int NotificationsCreated
);
