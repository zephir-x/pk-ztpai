import { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, type DropResult, type DraggableProvided, type DraggableStateSnapshot } from '@hello-pangea/dnd';
import { taskService } from '../api/taskService';
import { projectService } from '../api/projectService';
import { type TaskItemResponse, ProjectTaskStatus, TaskPriority } from '../types/api';
import { CreateTaskModal } from '../components/modals/CreateTaskModal';
import { TaskDetailsModal } from '../components/modals/TaskDetailsModal';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { Avatar } from '../components/Avatar';
import { Plus, ArrowLeft, MoreHorizontal, MessageSquare, Kanban } from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

export type ModalViewMode = 'details' | 'comments' | 'admin';

const PRIORITY_COLOR_MAP: Record<TaskPriority, string> = {
    [TaskPriority.Critical]: '#ef4444',
    [TaskPriority.High]: '#f97316',
    [TaskPriority.Medium]: '#3b82f6',
    [TaskPriority.Low]: '#64748b'
};

export default function ProjectKanban() {
    const { projectId } = useParams<{ projectId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [workspaceId, setWorkspaceId] = useState<string | null>(location.state?.workspaceId || null);
    const [projectName, setProjectName] = useState<string>(location.state?.projectName || 'Project Board');
    const { isAdmin } = useAuth();
    const { t } = useTranslation();

    usePageTitle(`${projectName} - ${t.projectKanban.pageTitle}`);

    const kanbanColumns = useMemo(() => [
        { id: ProjectTaskStatus.ToDo, title: t.projectKanban.columns.todo, border: 'border-slate-400', color: '#94a3b8', borderColor: 'rgba(148, 163, 184, 0.45)' },
        { id: ProjectTaskStatus.InProgress, title: t.projectKanban.columns.inProgress, border: 'border-sky-400', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.55)' },
        { id: ProjectTaskStatus.Review, title: t.projectKanban.columns.review, border: 'border-amber-400', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.55)' },
        { id: ProjectTaskStatus.Done, title: t.projectKanban.columns.done, border: 'border-emerald-400', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.55)' }
    ], [t]);

    const [tasks, setTasks] = useState<TaskItemResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [targetColumn, setTargetColumn] = useState<ProjectTaskStatus>(ProjectTaskStatus.ToDo);

    const [selectedTask, setSelectedTask] = useState<TaskItemResponse | null>(null);
    const [modalMode, setModalMode] = useState<ModalViewMode>('details');

    // Resolves project and workspace details if missing from navigation state
    useEffect(() => {
        if (!projectId) return;

        if (!workspaceId) {
            projectService.getById(projectId)
                .then(proj => {
                    setWorkspaceId(proj.workspaceId);
                    setProjectName(proj.name);
                })
                .catch(err => {
                    console.error('Failed to resolve project details:', err);
                });
        }
    }, [projectId, workspaceId]);

    useEffect(() => {
        if (projectId) fetchTasks(projectId);
    }, [projectId]);

    useEffect(() => {
        if (!projectId || !workspaceId) return;

        // Initialize real-time synchronization via SignalR
        const hubUrl = import.meta.env.VITE_HUB_URL || '/kanbanHub';
        const hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, { accessTokenFactory: () => localStorage.getItem('token') || '' })
            .withAutomaticReconnect()
            .build();

        let isMounted = true;
        hubConnection.start()
            .then(() => { if (isMounted) hubConnection.invoke('JoinWorkspaceGroup', workspaceId); })
            .catch(() => { if (isMounted) toast.error(t.projectKanban.liveConnectError); });

        hubConnection.on("TaskUpdated", (updatedTask: TaskItemResponse) => {
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
            setSelectedTask(prev => prev?.id === updatedTask.id ? updatedTask : prev);
        });

        hubConnection.on("TaskCreated", (newTask: TaskItemResponse) => {
            setTasks(prev => prev.find(t => t.id === newTask.id) ? prev : [newTask, ...prev]);
        });

        hubConnection.on("TaskDeleted", (deletedId: string) => {
            setTasks(prev => prev.filter(t => t.id !== deletedId));
            setSelectedTask(prev => prev?.id === deletedId ? null : prev);
        });

        hubConnection.on("TaskAssigneeChanged", (data: { TaskId: string; AssigneeId: string | null; AssigneeFirstName?: string | null; AssigneeLastName?: string | null; AssigneeAvatarUrl?: string | null }) => {
            setTasks(prev => prev.map(task => {
                if (task.id === data.TaskId) {
                    return {
                        ...task,
                        assigneeId: data.AssigneeId,
                        assigneeFirstName: data.AssigneeFirstName,
                        assigneeLastName: data.AssigneeLastName,
                        assigneeAvatarUrl: data.AssigneeAvatarUrl
                    };
                }
                return task;
            }));
            setSelectedTask(prev => {
                if (prev && prev.id === data.TaskId) {
                    return {
                        ...prev,
                        assigneeId: data.AssigneeId,
                        assigneeFirstName: data.AssigneeFirstName,
                        assigneeLastName: data.AssigneeLastName,
                        assigneeAvatarUrl: data.AssigneeAvatarUrl
                    };
                }
                return prev;
            });
        });

        return () => {
            isMounted = false;
            if (hubConnection.state === signalR.HubConnectionState.Connected) {
                hubConnection.invoke("LeaveWorkspaceGroup", workspaceId).then(() => hubConnection.stop());
            } else {
                hubConnection.stop();
            }
        };
    }, [projectId, workspaceId, t]);

    const fetchTasks = async (id: string) => {
        try {
            setIsLoading(true);
            const data = await taskService.getByProject(id);
            setTasks(data);

            // Handles deep-linking directly to specific task from notification
            const openTaskId = location.state?.openTaskId;
            const openMode = (location.state?.openTaskMode as ModalViewMode) || 'details';
            if (openTaskId) {
                const foundTask = data.find(item => item.id === openTaskId);
                if (foundTask) {
                    setSelectedTask(foundTask);
                    setModalMode(openMode);
                } else {
                    try {
                        const directTask = await taskService.getById(openTaskId);
                        setSelectedTask(directTask);
                        setModalMode(openMode);
                    } catch (err) {
                        console.error('Failed to load deep-linked task:', err);
                    }
                }
            }
        } catch {
            toast.error(t.projectKanban.fetchError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTaskCreated = (newTask: TaskItemResponse) => {
        setTasks(prev => [newTask, ...prev]);
    };

    const openCreateModal = (status: ProjectTaskStatus) => {
        setTargetColumn(status);
        setIsCreateModalOpen(true);
    };

    const openTaskModal = (task: TaskItemResponse, mode: ModalViewMode, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setModalMode(mode);
        setSelectedTask(task);
    };

    // Manage task drag & drop reordering and instantaneous status update
    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const draggedTask = tasks.find(t => t.id === draggableId);
        if (!draggedTask) return;

        const originalStatus = draggedTask.status;
        const newStatus = Number(destination.droppableId) as ProjectTaskStatus;
        const isStatusChanged = originalStatus !== newStatus;

        // Perform optimistic array reordering for seamless board display
        const previousTasks = [...tasks];
        const nextTasks = [...tasks];
        const taskIndex = nextTasks.findIndex(t => t.id === draggableId);
        if (taskIndex === -1) return;

        const [removedTask] = nextTasks.splice(taskIndex, 1);
        const updatedTask = { ...removedTask, status: newStatus };

        const destColumnTasks = nextTasks.filter(t => t.status === newStatus);
        if (destination.index >= destColumnTasks.length) {
            if (destColumnTasks.length === 0) {
                nextTasks.push(updatedTask);
            } else {
                const lastTask = destColumnTasks[destColumnTasks.length - 1];
                const lastIdx = nextTasks.indexOf(lastTask);
                nextTasks.splice(lastIdx + 1, 0, updatedTask);
            }
        } else {
            const targetTask = destColumnTasks[destination.index];
            const targetIdx = nextTasks.indexOf(targetTask);
            nextTasks.splice(targetIdx, 0, updatedTask);
        }

        // Apply updated order and status immediately to frontend state
        setTasks(nextTasks);

        if (isStatusChanged) {
            try {
                await taskService.update(draggableId, {
                    title: draggedTask.title,
                    description: draggedTask.description,
                    status: newStatus,
                    priority: draggedTask.priority,
                    assigneeId: draggedTask.assigneeId
                });
            } catch (err) {
                // Revert on domain failure
                setTasks(previousTasks);

                if (err instanceof AxiosError && err.response?.status === 409) {
                    toast.error(err.response.data?.message || err.response.data?.detail || t.projectKanban.cannotCloseWithoutAssignee);
                } else if (err instanceof AxiosError && err.response?.status === 403) {
                    toast.error(t.projectKanban.adminOnlyAction);
                } else {
                    toast.error(t.projectKanban.statusUpdateError);
                }
            }
        }
    };

    const getPriorityLabel = (priority: TaskPriority) => {
        switch (priority) {
            case TaskPriority.Critical: return t.projectKanban.priorities.critical;
            case TaskPriority.High: return t.projectKanban.priorities.high;
            case TaskPriority.Medium: return t.projectKanban.priorities.medium;
            case TaskPriority.Low: return t.projectKanban.priorities.low;
            default: return t.projectKanban.priorities.unknown;
        }
    };

    // Card renderer: perfectly positions under cursor because column has no containing block transforms/filters
    const renderTaskCard = (
        task: TaskItemResponse,
        provided: DraggableProvided,
        snapshot: DraggableStateSnapshot
    ) => {
        const priorityHex = PRIORITY_COLOR_MAP[task.priority] || '#64748b';

        return (
            <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                onClick={(e) => {
                    if (!snapshot.isDragging) {
                        openTaskModal(task, 'details', e);
                    }
                }}
                style={provided.draggableProps.style}
                className={`w-full relative overflow-hidden p-4 pt-5 cursor-pointer group rounded-2xl border border-white/20 select-none ${
                    snapshot.isDragging
                        ? 'bg-rain-950/45 backdrop-blur-md shadow-[0_22px_50px_rgba(0,0,0,0.75)] ring-2 ring-fiery border-white/40 z-50'
                        : 'bg-rain-950/30 backdrop-blur-md hover:bg-rain-950/40 hover:border-white/35 transition-all duration-150'
                }`}
            >
                {/* Top horizontal colored ribbon beam with matching glow */}
                <div
                    className="absolute top-0 left-0 right-0 h-1.5 group-hover:h-2 transition-all duration-300 z-10"
                    style={{
                        backgroundColor: priorityHex,
                        boxShadow: `0 0 16px ${priorityHex}`
                    }}
                />

                {/* Laser-cut highlight line under top ribbon */}
                <div className="absolute top-1.5 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-10" />

                {/* Ambient bloom layer on hover / dragging */}
                <div
                    className={`absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 ${
                        snapshot.isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    style={{
                        boxShadow: `inset 0 0 35px ${priorityHex}25, 0 10px 30px -5px ${priorityHex}35`
                    }}
                />

                <div className="flex justify-between items-start mb-2.5 relative z-10">
                    <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rain-950/60 backdrop-blur-md border border-white/15"
                        style={{
                            color: priorityHex,
                            boxShadow: `0 0 12px ${priorityHex}35`
                        }}
                    >
                        {getPriorityLabel(task.priority)}
                    </span>

                    {isAdmin && (
                        <button
                            onClick={(e) => openTaskModal(task, 'admin', e)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                            title={t.common.actions}
                        >
                            <MoreHorizontal size={16} />
                        </button>
                    )}
                </div>

                <h4 className="text-white font-semibold text-sm leading-snug mb-3.5 group-hover:text-fiery transition-colors pr-2 relative z-10 drop-shadow-sm">
                    {task.title}
                </h4>

                <div className="flex items-center justify-between mt-auto relative z-10">
                    <div className="flex items-center gap-2 min-w-0">
                        {task.assigneeId ? (
                            <>
                                <Avatar
                                    avatarUrl={task.assigneeAvatarUrl}
                                    name={task.assigneeFirstName}
                                    size="xs"
                                />
                                {task.assigneeFirstName && (
                                    <span
                                        className="text-xs text-white/80 font-medium truncate max-w-[110px]"
                                        title={task.assigneeFirstName}
                                    >
                                        {task.assigneeFirstName}
                                    </span>
                                )}
                            </>
                        ) : (
                            <div
                                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/50 border border-white/15 shrink-0"
                                title={t.projectKanban.unassigned}
                            >
                                ?
                            </div>
                        )}
                    </div>

                    <button
                        onClick={(e) => openTaskModal(task, 'comments', e)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white/60 hover:text-fiery hover:bg-white/10 transition-all cursor-pointer ml-auto shrink-0"
                        title={t.modals.taskDetails.tabs.comments}
                    >
                        <MessageSquare size={14} />
                    </button>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-12">
                <div className="glass-panel px-6 py-4 flex items-center gap-3 text-white border border-white/20 shadow-glass-md">
                    <div className="w-3.5 h-3.5 rounded-full bg-fiery animate-ping" />
                    <span className="text-sm font-semibold tracking-wide">{t.projectKanban.loading}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full min-h-0 flex flex-col">
            {/* Header Section: Aligned with identical coordinates as Dashboard & WorkspaceDetails */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7 relative z-10 shrink-0">
                <div>
                    {/* Back Navigation Button: Bright white text with luminous fiery arrow */}
                    <button
                        onClick={() => navigate(workspaceId ? `/workspace/${workspaceId}` : '/dashboard')}
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white hover:text-fiery-light transition-colors mb-2.5 group cursor-pointer bg-transparent border-0 p-0 drop-shadow-md"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform text-fiery drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]" />
                        <span>{t.projectKanban.backButton}</span>
                    </button>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3 drop-shadow-md">
                        <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 shadow-glass-sm ring-1 ring-fiery/40">
                            <Kanban className="text-fiery drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.7)]" size={26} />
                        </div>
                        <span>{projectName}</span>
                    </h2>
                    <p className="text-rain-200 text-sm mt-2 font-medium drop-shadow-sm">
                        {t.projectKanban.subtitle}
                    </p>
                </div>
            </div>

            {/* Kanban Board Area: Horizontal scrollable container with Smooth Left and Right Fade Masks */}
            <div className="relative flex-1 min-h-0 [mask-image:linear-gradient(to_right,transparent_0px,black_32px,black_calc(100%-32px),transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0px,black_32px,black_calc(100%-32px),transparent_100%)]">
                <div className="h-full overflow-x-auto overflow-y-hidden pt-8 pb-4">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="flex gap-6 h-full w-full min-w-[1100px] items-start px-2">
                            {kanbanColumns.map(column => {
                                const columnTasks = tasks.filter(t => t.status === column.id);
                                const isEmpty = columnTasks.length === 0;

                                return (
                                    <div
                                        key={column.id}
                                        style={{
                                            '--column-color': column.color,
                                            '--column-border': column.borderColor
                                        } as React.CSSProperties}
                                        className="flex-1 min-w-[260px] kanban-column-beam rounded-2xl shadow-none shrink-0 flex flex-col max-h-full"
                                    >
                                        <div className="flex flex-col rounded-2xl max-h-full overflow-hidden">
                                            {/* Column Header */}
                                            <div className={`p-3.5 border-t-2 ${column.border} bg-white/5 border-b border-white/10 flex justify-between items-center rounded-t-2xl shrink-0`}>
                                                <div className="flex items-center gap-2.5">
                                                    <h3 className="font-bold text-white text-sm tracking-wide">{column.title}</h3>
                                                    <span
                                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-all select-none"
                                                        style={{
                                                            backgroundColor: `${column.color}25`,
                                                            borderColor: column.color,
                                                            color: column.color,
                                                            boxShadow: `0 0 10px ${column.color}40`
                                                        }}
                                                    >
                                                        {columnTasks.length}
                                                    </span>
                                                </div>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => openCreateModal(column.id)}
                                                        className="p-1.5 rounded-lg text-white/70 hover:text-fiery hover:bg-white/10 transition-colors cursor-pointer"
                                                        title={t.common.create}
                                                    >
                                                        <Plus size={18} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Droppable Task Column: scrollable when tasks overflow! */}
                                            <Droppable droppableId={column.id.toString()}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        className={`flex-1 min-h-0 overflow-y-auto transition-colors duration-150 rounded-b-2xl ${
                                                            isEmpty
                                                                ? `p-2 flex items-center justify-center ${
                                                                    snapshot.isDraggingOver ? 'bg-white/10 ring-1 ring-white/25' : 'bg-transparent'
                                                                  }`
                                                                : `p-3 space-y-3 ${
                                                                    snapshot.isDraggingOver ? 'bg-white/5' : ''
                                                                 }`
                                                        }`}
                                                    >
                                                        {columnTasks.map((task, index) => (
                                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                                                {(provided, snapshot) => renderTaskCard(task, provided, snapshot)}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </DragDropContext>
                </div>
            </div>

            {/* Modals with createPortal and Glassmorphism */}
            {projectId && (
                <CreateTaskModal
                    isOpen={isCreateModalOpen}
                    projectId={projectId}
                    initialStatus={targetColumn}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={handleTaskCreated}
                />
            )}

            <TaskDetailsModal
                isOpen={!!selectedTask}
                task={selectedTask}
                initialView={modalMode}
                onClose={() => setSelectedTask(null)}
                onUpdate={(updated) => {
                    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
                    setSelectedTask(updated);
                }}
                onDelete={(deletedId) => {
                    setTasks(prev => prev.filter(t => t.id !== deletedId));
                    setSelectedTask(null);
                }}
            />
        </div>
    );
}
