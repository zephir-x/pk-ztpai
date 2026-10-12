using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Domain.Entities;
using ProjectHub.Api.Domain.Enums;
using ProjectHub.Api.DTOs.StressTest;
using ProjectHub.Api.Infrastructure.Data;

namespace ProjectHub.Api.Services.StressTest;

public class StressTestService : IStressTestService
{
    private readonly ProjectHubDbContext _context;

    public StressTestService(ProjectHubDbContext context)
    {
        _context = context;
    }

    public async Task<StressTestStatusDto> GetStatusAsync(CancellationToken ct = default)
    {
        var isStressActive = await _context.Users.AnyAsync(u => u.Email.StartsWith("stress."), ct)
                             || await _context.Workspaces.AnyAsync(w => w.Name.StartsWith("[STRESS]"), ct)
                             || await _context.Projects.AnyAsync(p => p.Name.StartsWith("[STRESS]"), ct);

        var wsCount = await _context.Workspaces.CountAsync(ct);
        var projCount = await _context.Projects.CountAsync(ct);
        var taskCount = await _context.Tasks.CountAsync(ct);
        var userCount = await _context.Users.CountAsync(ct);
        var commentCount = await _context.Comments.CountAsync(ct);
        var notifCount = await _context.Notifications.CountAsync(ct);

        return new StressTestStatusDto(
            isStressActive,
            wsCount,
            projCount,
            taskCount,
            userCount,
            commentCount,
            notifCount
        );
    }

    public async Task<StressTestResultDto> SeedAsync(Guid currentAdminId, CancellationToken ct = default)
    {
        // 1. Purge any prior stress test mock data to guarantee idempotent execution
        await CleanupAsync(ct);

        var now = DateTime.UtcNow;
        var defaultPasswordHash = BCrypt.Net.BCrypt.EnhancedHashPassword("Password123!");

        // 2. Identify target admins and pre-existing users
        var existingAdmin = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentAdminId, ct)
                            ?? await _context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin, ct)
                            ?? await _context.Users.FirstAsync(ct);

        var existingDev = await _context.Users.FirstOrDefaultAsync(u => u.Email == "frontend.dev@projecthub.com", ct);

        var allAdmins = await _context.Users.Where(u => u.Role == UserRole.Admin).ToListAsync(ct);
        if (!allAdmins.Any(a => a.Id == existingAdmin.Id))
        {
            allAdmins.Add(existingAdmin);
        }

        // 3. Locate primary workspace and primary project
        var primaryProject = await _context.Projects.FirstOrDefaultAsync(p => p.Name == "ProjectHub React App", ct)
                             ?? await _context.Projects.FirstOrDefaultAsync(ct);

        var primaryWorkspace = primaryProject != null
            ? await _context.Workspaces.FirstOrDefaultAsync(w => w.Id == primaryProject.WorkspaceId, ct)
            : await _context.Workspaces.FirstOrDefaultAsync(w => w.Name == "Engineering Department", ct)
              ?? await _context.Workspaces.FirstOrDefaultAsync(ct);

        // 4. Generate 24 Stress Users
        var stressUsers = new List<User>();
        var userNames = new[]
        {
            ("Aleksander", "Nowicki", "avatar-1", "fiery"),
            ("Barbara", "Kowalczyk", "avatar-2", "ocean"),
            ("Cezary", "Wojciechowski", "avatar-3", "emerald"),
            ("Dominika", "Zielinska", "avatar-4", "purple"),
            ("Edward", "Szymanski", "avatar-5", "rose"),
            ("Felicja", "Wozniak", "avatar-6", "amber"),
            ("Grzegorz", "Kozlowski", "avatar-7", "cyan"),
            ("Helena", "Jankowska", "avatar-1", "fiery"),
            ("Ignacy", "Mazurkiewicz", "avatar-2", "ocean"),
            ("Julia", "Kwiatkowska", "avatar-3", "emerald"),
            ("Kamil", "Piotrowski", "avatar-4", "purple"),
            ("Laura", "Grabowska", "avatar-5", "rose"),
            ("Michal", "Pawlak", "avatar-6", "amber"),
            ("Natalia", "Michalska", "avatar-7", "cyan"),
            ("Oskar", "Nowakowski", "avatar-1", "fiery"),
            ("Patrycja", "Adamczyk", "avatar-2", "ocean"),
            ("Robert", "Dudek", "avatar-3", "emerald"),
            ("Sylwia", "Zajac", "avatar-4", "purple"),
            ("Tomasz", "Wieczorek", "avatar-5", "rose"),
            ("Urszula", "Jablonska", "avatar-6", "amber"),
            ("Wiktor", "Majewski", "avatar-7", "cyan"),
            ("Zofia", "Olszewska", "avatar-1", "fiery"),
            ("Artur", "Jaworski", "avatar-2", "ocean"),
            ("Bogumila", "Malinowska", "avatar-3", "emerald")
        };

        for (int i = 0; i < userNames.Length; i++)
        {
            var (firstName, lastName, avatar, accent) = userNames[i];
            stressUsers.Add(new User
            {
                Id = Guid.NewGuid(),
                Email = $"stress.user{i + 1}@projecthub.com",
                PasswordHash = defaultPasswordHash,
                Role = UserRole.User,
                FirstName = firstName,
                LastName = lastName,
                AvatarUrl = avatar,
                AccentColor = accent,
                Language = i % 2 == 0 ? "en" : "pl",
                CreatedAt = now.AddDays(-i)
            });
        }

        await _context.Users.AddRangeAsync(stressUsers, ct);

        // 5. Generate 24 Stress Workspaces (Forces multiple screen viewport scrolls)
        var themeColors = Enum.GetValues<ThemeColor>();
        var workspaceNames = new[]
        {
            "Cloud Infrastructure & DevOps Core",
            "Mobile Client iOS & Android Engine",
            "AI & Data Science Analytics Platform",
            "Enterprise Core Microservices Hub",
            "Customer Experience & Support Services",
            "Global Supply Logistics Architecture",
            "Security Compliance & Pentesting Ops",
            "Design System & Creative Assets 2026",
            "High-Frequency Trading Gateway",
            "Distributed Edge Cache Network",
            "Realtime Telemetry & Metrics Pipeline",
            "Authentication & Identity Governance",
            "Decentralized Storage & IPFS Nodes",
            "Billing, Subscriptions & Stripe Engine",
            "Content Delivery & Media Processing",
            "Automated QA & Regression Test Bed",
            "Machine Learning Model Registry",
            "Kubernetes Cluster Mesh Operations",
            "Partner Developer Ecosystem API",
            "Internal Knowledge Base & Docs",
            "Hardware Firmware Integration",
            "Disaster Recovery & Redundancy Center",
            "Marketing Growth Experimentation",
            "Executive Business Intelligence"
        };

        var stressWorkspaces = new List<Workspace>();
        for (int i = 0; i < workspaceNames.Length; i++)
        {
            stressWorkspaces.Add(new Workspace
            {
                Id = Guid.NewGuid(),
                Name = $"[STRESS] {workspaceNames[i]}",
                ThemeColor = themeColors[i % themeColors.Length],
                OwnerId = existingAdmin.Id,
                CreatedAt = now.AddDays(-i)
            });
        }

        await _context.Workspaces.AddRangeAsync(stressWorkspaces, ct);

        // 6. Generate Projects (40+ projects)
        var stressProjects = new List<Project>();

        // Part A: Inject 16 projects directly into primaryWorkspace (e.g. Engineering Department)
        // This guarantees that when entering the primary workspace, the project grid scrolls extensively.
        if (primaryWorkspace != null)
        {
            for (int i = 0; i < 16; i++)
            {
                stressProjects.Add(new Project
                {
                    Id = Guid.NewGuid(),
                    Name = $"[STRESS] Department Project #{i + 1} - Module {char.ConvertFromUtf32(65 + (i % 26))}",
                    Description = i % 2 == 0
                        ? "High-density stress test project testing grid layout, container wrapping, and multiline descriptions."
                        : "Diagnostic project instance validating responsive card heights and theme color ribbon rendering.",
                    ThemeColor = themeColors[i % themeColors.Length],
                    WorkspaceId = primaryWorkspace.Id,
                    CreatedAt = now.AddDays(-i)
                });
            }
        }

        // Part B: Inject 1 project per stress workspace (24 projects)
        for (int i = 0; i < stressWorkspaces.Count; i++)
        {
            var ws = stressWorkspaces[i];
            stressProjects.Add(new Project
            {
                Id = Guid.NewGuid(),
                Name = $"[STRESS] {workspaceNames[i]} Project Alpha",
                Description = $"Dedicated project unit within {ws.Name} for load verification.",
                ThemeColor = ws.ThemeColor,
                WorkspaceId = ws.Id,
                CreatedAt = now.AddDays(-i)
            });
        }

        await _context.Projects.AddRangeAsync(stressProjects, ct);

        // 7. Generate Tasks (Targeted heavy concentration on primaryProject Kanban Board)
        var stressTasks = new List<TaskItem>();
        var priorities = new[] { TaskPriority.Low, TaskPriority.Medium, TaskPriority.High, TaskPriority.Critical };

        var allAssignableUsers = new List<User> { existingAdmin };
        if (existingDev != null) allAssignableUsers.Add(existingDev);
        allAssignableUsers.AddRange(stressUsers);

        // Maintain strict adherence to Business Rule 2: Max 1 active Critical task per user
        var usersWithActiveCritical = new HashSet<Guid>();
        var existingCriticalAssignees = await _context.Tasks
            .Where(t => t.Priority == TaskPriority.Critical && t.Status != ProjectTaskStatus.Done && t.AssigneeId.HasValue)
            .Select(t => t.AssigneeId!.Value)
            .ToListAsync(ct);
        foreach (var uid in existingCriticalAssignees)
        {
            usersWithActiveCritical.Add(uid);
        }

        var targetKanbanProject = primaryProject ?? stressProjects[0];

        // Part A: Heavy Kanban load in targetKanbanProject (18 To Do, 12 In Progress, 8 Review, 8 Done = 46 tasks)
        var kanbanDistributions = new (ProjectTaskStatus status, int count)[]
        {
            (ProjectTaskStatus.ToDo, 18),
            (ProjectTaskStatus.InProgress, 12),
            (ProjectTaskStatus.Review, 8),
            (ProjectTaskStatus.Done, 8)
        };

        int taskCounter = 1;
        foreach (var (status, count) in kanbanDistributions)
        {
            for (int i = 0; i < count; i++)
            {
                var rawPriority = priorities[i % priorities.Length];
                Guid? assigneeId = null;
                var priority = rawPriority;

                if (priority == TaskPriority.Critical && status != ProjectTaskStatus.Done)
                {
                    var candidate = allAssignableUsers.FirstOrDefault(u => !usersWithActiveCritical.Contains(u.Id));
                    if (candidate != null)
                    {
                        assigneeId = candidate.Id;
                        usersWithActiveCritical.Add(candidate.Id);
                    }
                    else
                    {
                        assigneeId = null;
                    }
                }
                else
                {
                    assigneeId = allAssignableUsers[taskCounter % allAssignableUsers.Count].Id;
                }

                string title;
                string description;

                if (i % 5 == 0)
                {
                    title = $"[STRESS] Ultra-Long Task Title #{taskCounter} For Layout Boundary Stress Verification Across Kanban Drag Containers Without Horizontal Overflow Break";
                    description = "Comprehensive stress testing task item with detailed description paragraph. Verify that multiline ellipsis, badge spacing, author avatars, and drag handles do not clip or create unnatural scrollbars within column cards.";
                }
                else if (i % 5 == 1)
                {
                    title = $"[STRESS] Quick Patch #{taskCounter}";
                    description = "Short description.";
                }
                else
                {
                    title = $"[STRESS] Task Item #{taskCounter} ({status})";
                    description = $"Automated diagnostic load task verifying status {status} and priority {priority} display metrics.";
                }

                stressTasks.Add(new TaskItem
                {
                    Id = Guid.NewGuid(),
                    Title = title,
                    Description = description,
                    Status = status,
                    Priority = priority,
                    ProjectId = targetKanbanProject.Id,
                    AssigneeId = assigneeId,
                    CreatedAt = now.AddHours(-taskCounter)
                });

                taskCounter++;
            }
        }

        // Part B: 40 tasks distributed across other stress projects
        for (int i = 0; i < 40; i++)
        {
            var project = stressProjects[i % stressProjects.Count];
            var status = (ProjectTaskStatus)(i % 4);
            var priority = priorities[i % priorities.Length];

            Guid? assigneeId = null;
            if (priority == TaskPriority.Critical && status != ProjectTaskStatus.Done)
            {
                var candidate = allAssignableUsers.FirstOrDefault(u => !usersWithActiveCritical.Contains(u.Id));
                if (candidate != null)
                {
                    assigneeId = candidate.Id;
                    usersWithActiveCritical.Add(candidate.Id);
                }
            }
            else
            {
                assigneeId = allAssignableUsers[i % allAssignableUsers.Count].Id;
            }

            stressTasks.Add(new TaskItem
            {
                Id = Guid.NewGuid(),
                Title = $"[STRESS] Module Task #{i + 1}",
                Description = $"Diagnostic verification task inside project {project.Name}.",
                Status = status,
                Priority = priority,
                ProjectId = project.Id,
                AssigneeId = assigneeId,
                CreatedAt = now.AddDays(-i)
            });
        }

        await _context.Tasks.AddRangeAsync(stressTasks, ct);

        // 8. Generate Comments Across Multiple Visible Tasks
        // Add comments to both existing seeded tasks in targetKanbanProject AND new stress tasks in targetKanbanProject
        var existingTasksInTarget = await _context.Tasks
            .Where(t => t.ProjectId == targetKanbanProject.Id)
            .Take(10)
            .ToListAsync(ct);

        var topTasksToComment = new List<TaskItem>();
        topTasksToComment.AddRange(existingTasksInTarget);
        topTasksToComment.AddRange(stressTasks.Where(t => t.ProjectId == targetKanbanProject.Id).Take(10));

        var stressComments = new List<Comment>();
        int commentIndex = 0;

        foreach (var task in topTasksToComment)
        {
            // Add 4 to 6 comments on EVERY task in topTasksToComment
            int commentsForThisTask = 4 + (commentIndex % 4);
            for (int c = 0; c < commentsForThisTask; c++)
            {
                var author = allAssignableUsers[(commentIndex + c) % allAssignableUsers.Count];
                var mentionText = c % 3 == 0 ? " @admin please check this out." : (c % 3 == 1 ? " @frontend.dev noted." : "");
                var longText = c % 2 == 0
                    ? "Detailed comment thread entry testing vertical comment stream scrolling, timestamps, avatar rendering, and mention tag highlights."
                    : $"Stress comment #{commentIndex + 1} verifying discussion activity on task {task.Title}.";

                stressComments.Add(new Comment
                {
                    Id = Guid.NewGuid(),
                    Content = $"[STRESS] {longText}{mentionText}",
                    TaskItemId = task.Id,
                    AuthorId = author.Id,
                    CreatedAt = now.AddMinutes(-((50 - commentIndex) * 15))
                });

                commentIndex++;
            }
        }

        await _context.Comments.AddRangeAsync(stressComments, ct);

        // 9. Generate Notifications Directly For All Admin Users (15 Unread per Admin)
        var stressNotifications = new List<Notification>();
        var notifTypes = new[] { NotificationType.Mention, NotificationType.TaskAssigned, NotificationType.DirectMessage };

        foreach (var admin in allAdmins)
        {
            for (int i = 0; i < 25; i++)
            {
                var sender = stressUsers[i % stressUsers.Count];
                var notifType = notifTypes[i % notifTypes.Length];
                var isRead = i >= 15; // First 15 notifications are unread to display badge count

                var relatedTask = stressTasks[i % stressTasks.Count];

                stressNotifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    RecipientId = admin.Id,
                    SenderId = sender.Id,
                    Type = notifType,
                    Title = $"[STRESS] Notification #{i + 1}",
                    Message = notifType == NotificationType.DirectMessage
                        ? $"[STRESS] Direct inquiry message from {sender.FirstName} {sender.LastName}: 'Could you please review the pending architecture updates?'"
                        : $"[STRESS] System update triggered by {sender.FirstName} {sender.LastName} for task '{relatedTask.Title}'.",
                    TaskItemId = notifType == NotificationType.DirectMessage ? null : relatedTask.Id,
                    ProjectId = notifType == NotificationType.DirectMessage ? null : relatedTask.ProjectId,
                    IsRead = isRead,
                    CreatedAt = now.AddHours(-i)
                });
            }
        }

        await _context.Notifications.AddRangeAsync(stressNotifications, ct);

        // Commit all entities atomically
        await _context.SaveChangesAsync(ct);

        return new StressTestResultDto(
            "High-volume stress test dataset successfully generated and persisted.",
            stressWorkspaces.Count,
            stressProjects.Count,
            stressTasks.Count,
            stressUsers.Count,
            stressComments.Count,
            stressNotifications.Count
        );
    }

    public async Task<StressTestResultDto> CleanupAsync(CancellationToken ct = default)
    {
        // Execute direct SQL hard deletes to remove all mock stress data without triggering soft-delete intercepts
        var notifDeleted = await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM \"Notifications\" WHERE \"Title\" LIKE '[STRESS]%' OR \"Message\" LIKE '[STRESS]%' OR \"RecipientId\" IN (SELECT \"Id\" FROM \"Users\" WHERE \"Email\" LIKE 'stress.%') OR \"SenderId\" IN (SELECT \"Id\" FROM \"Users\" WHERE \"Email\" LIKE 'stress.%');",
            ct
        );

        var commentsDeleted = await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM \"Comments\" WHERE \"Content\" LIKE '[STRESS]%' OR \"AuthorId\" IN (SELECT \"Id\" FROM \"Users\" WHERE \"Email\" LIKE 'stress.%');",
            ct
        );

        var tasksDeleted = await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM \"Tasks\" WHERE \"Title\" LIKE '[STRESS]%' OR \"ProjectId\" IN (SELECT \"Id\" FROM \"Projects\" WHERE \"Name\" LIKE '[STRESS]%');",
            ct
        );

        var projectsDeleted = await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM \"Projects\" WHERE \"Name\" LIKE '[STRESS]%';",
            ct
        );

        var workspacesDeleted = await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM \"Workspaces\" WHERE \"Name\" LIKE '[STRESS]%';",
            ct
        );

        var usersDeleted = await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM \"Users\" WHERE \"Email\" LIKE 'stress.%';",
            ct
        );

        return new StressTestResultDto(
            "All stress test mock data has been purged from the database.",
            workspacesDeleted,
            projectsDeleted,
            tasksDeleted,
            usersDeleted,
            commentsDeleted,
            notifDeleted
        );
    }
}
