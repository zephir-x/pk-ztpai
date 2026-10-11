import { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { taskService } from '../api/taskService';
import { projectService } from '../api/projectService';
import { type TaskItemResponse, ProjectTaskStatus, TaskPriority } from '../types/api';
import { CreateTaskModal } from '../components/modals/CreateTaskModal';
import { TaskDetailsModal } from '../components/modals/TaskDetailsModal';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { Avatar } from '../components/Avatar';
import { Plus, ArrowLeft, MoreHorizontal, MessageSquare } from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

export type ModalViewMode = 'details' | 'comments' | 'admin';

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
        { id: ProjectTaskStatus.ToDo, title: t.projectKanban.columns.todo, border: 'border-gray-300' },
        { id: ProjectTaskStatus.InProgress, title: t.projectKanban.columns.inProgress, border: 'border-blue-400' },
        { id: ProjectTaskStatus.Review, title: t.projectKanban.columns.review, border: 'border-amber-400' },
        { id: ProjectTaskStatus.Done, title: t.projectKanban.columns.done, border: 'border-emerald-400' }
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
        const hubUrl = import.meta.env.VITE_HUB_URL;
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

    // Manage task drag & drop reordering and optimistic status update
    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

        const draggedTask = tasks.find(t => t.id === draggableId);
        if (!draggedTask) return;

        const originalStatus = draggedTask.status;
        const newStatus = Number(destination.droppableId) as ProjectTaskStatus;

        // Optimistic UI Update
        setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t));

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
            setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: originalStatus } : t));

            if (err instanceof AxiosError && err.response?.status === 409) {
                toast.error(err.response.data?.message || err.response.data?.detail || t.projectKanban.cannotCloseWithoutAssignee);
            } else if (err instanceof AxiosError && err.response?.status === 403) {
                toast.error(t.projectKanban.adminOnlyAction);
            } else {
                toast.error(t.projectKanban.statusUpdateError);
            }
        }
    };

    const getPriorityColor = (priority: TaskPriority) => {
        switch (priority) {
            case TaskPriority.Critical: return 'bg-red-100 text-red-700 border-red-200';
            case TaskPriority.High: return 'bg-orange-100 text-orange-700 border-orange-200';
            case TaskPriority.Medium: return 'bg-blue-50 text-blue-700 border-blue-200';
            case TaskPriority.Low: return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
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

    if (isLoading) return <div className="text-gray-500 animate-pulse p-8">{t.projectKanban.loading}</div>;

    return (
        <div className="h-full flex flex-col">
            {/* Top Navigation */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-fiery transition-colors mb-6 font-medium"
            >
                <ArrowLeft size={16} />
                {t.projectKanban.backButton}
            </button>

            {/* Header Section */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-matte-dark">{projectName}</h2>
                    <p className="text-gray-500 text-sm mt-1">{t.projectKanban.subtitle}</p>
                </div>
            </div>

            {/* Kanban Board Area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-6 h-full min-w-max items-start">
                        {kanbanColumns.map(column => {
                            const columnTasks = tasks.filter(t => t.status === column.id);

                            return (
                                <div key={column.id} className="w-80 flex flex-col bg-gray-100/50 rounded-xl max-h-full">
                                    <div className={`p-4 border-t-4 ${column.border} bg-white/40 rounded-t-xl flex justify-between items-center backdrop-blur-sm`}>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-matte-dark">{column.title}</h3>
                                            <span className="bg-gray-200 text-gray-600 text-xs py-0.5 px-2 rounded-full font-medium">
                                                {columnTasks.length}
                                            </span>
                                        </div>
                                        {isAdmin && (
                                            <button onClick={() => openCreateModal(column.id)} className="text-gray-400 hover:text-fiery transition-colors p-1">
                                                <Plus size={20} />
                                            </button>
                                        )}
                                    </div>

                                    <Droppable droppableId={column.id.toString()}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`flex-1 overflow-y-auto p-3 space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-gray-200/50' : ''}`}
                                            >
                                                {columnTasks.map((task, index) => (
                                                    <Draggable key={task.id} draggableId={task.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                onClick={() => openTaskModal(task, 'details')}
                                                                style={{ ...provided.draggableProps.style }}
                                                                className={`bg-white p-4 rounded-lg shadow-sm border transition-all group ${
                                                                    snapshot.isDragging ? 'shadow-lg ring-2 ring-fiery border-transparent opacity-90' : 'border-gray-200 hover:border-fiery/50 hover:shadow-md cursor-pointer'
                                                                }`}
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                                                                        {getPriorityLabel(task.priority)}
                                                                    </span>
                                                                    {isAdmin && (
                                                                        <button
                                                                            onClick={(e) => openTaskModal(task, 'admin', e)}
                                                                            className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            <MoreHorizontal size={16} />
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                <h4 className="text-matte-dark font-medium leading-tight mb-3">
                                                                    {task.title}
                                                                </h4>

                                                                <div className="flex items-center justify-between mt-auto">
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        {task.assigneeId ? (
                                                                            <>
                                                                                <Avatar
                                                                                    avatarUrl={task.assigneeAvatarUrl}
                                                                                    name={task.assigneeFirstName}
                                                                                    size="xs"
                                                                                />
                                                                                {task.assigneeFirstName && (
                                                                                    <span className="text-xs text-gray-600 font-medium truncate max-w-[110px]" title={task.assigneeFirstName}>
                                                                                        {task.assigneeFirstName}
                                                                                    </span>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <div
                                                                                className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400 border border-white shrink-0"
                                                                                title={t.projectKanban.unassigned}
                                                                            >
                                                                                ?
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <button 
                                                                        onClick={(e) => openTaskModal(task, 'comments', e)}
                                                                        className="flex items-center text-gray-400 hover:text-fiery transition-colors gap-1 text-xs cursor-pointer ml-auto"
                                                                    >
                                                                        <MessageSquare size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>

            {/* Modals */}
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
