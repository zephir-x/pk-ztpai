import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskService } from '../api/taskService';
import { type MyTaskResponse, ProjectTaskStatus, TaskPriority } from '../types/api';
import { THEME_COLOR_MAP } from '../components/modals/WorkspaceModal';
import { Pagination } from '../components/Pagination';
import { usePageTitle } from '../hooks/usePageTitle';
import { useTranslation } from '../context/LanguageContext';
import { CheckSquare, ArrowRight, LayoutGrid, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PRIORITY_COLOR_MAP: Record<TaskPriority, string> = {
    [TaskPriority.Critical]: '#ef4444',
    [TaskPriority.High]: '#f97316',
    [TaskPriority.Medium]: '#3b82f6',
    [TaskPriority.Low]: '#64748b'
};

export default function MyTasks() {
    const { t } = useTranslation();
    usePageTitle(t.myTasks.title);
    const navigate = useNavigate();

    const [tasks, setTasks] = useState<MyTaskResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [animationDirection, setAnimationDirection] = useState<'right' | 'left'>('right');
    const TASKS_PER_PAGE = 6;

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setIsLoading(true);
            const data = await taskService.getMyTasks();
            setTasks(data);
        } catch {
            toast.error(t.myTasks.fetchError);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (newPage: number, direction: 'left' | 'right') => {
        setAnimationDirection(direction);
        setCurrentPage(newPage);
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

    const getStatusLabel = (status: ProjectTaskStatus) => {
        switch (status) {
            case ProjectTaskStatus.ToDo: return t.projectKanban.columns.todo;
            case ProjectTaskStatus.InProgress: return t.projectKanban.columns.inProgress;
            case ProjectTaskStatus.Review: return t.projectKanban.columns.review;
            case ProjectTaskStatus.Done: return t.projectKanban.columns.done;
            default: return '';
        }
    };

    // Calculate pagination slices
    const totalPages = Math.max(1, Math.ceil(tasks.length / TASKS_PER_PAGE));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * TASKS_PER_PAGE;
    const endIndex = Math.min(startIndex + TASKS_PER_PAGE, tasks.length);
    const paginatedTasks = tasks.slice(startIndex, endIndex);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-12">
                <div className="glass-panel px-6 py-4 flex items-center gap-3 text-white border border-white/20 shadow-glass-md">
                    <div className="w-3.5 h-3.5 rounded-full bg-fiery animate-ping" />
                    <span className="text-sm font-semibold tracking-wide">{t.myTasks.loading}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header Section: Stationary top position lowered by pt-[26px] to vertically align with other views */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7 relative z-10 pt-[26px] shrink-0">
                <div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3 drop-shadow-md">
                        <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 shadow-glass-sm ring-1 ring-fiery/40">
                            <CheckSquare className="text-fiery drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.7)]" size={26} />
                        </div>
                        <span>{t.myTasks.title}</span>
                    </h2>
                    <p className="text-rain-200 text-sm mt-2 font-medium drop-shadow-sm">
                        {t.myTasks.subtitle}
                    </p>
                </div>
            </div>

            {/* Scrollable MyTasks Area with Smooth Top and Bottom Fade Mask */}
            <div className="relative flex-1 min-h-0 [mask-image:linear-gradient(to_bottom,transparent_0px,black_32px,black_calc(100%-32px),transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0px,black_32px,black_calc(100%-32px),transparent_100%)]">
                <div className="h-full overflow-y-auto pt-8 pr-1 pb-6">
                    {tasks.length === 0 ? (
                        <div className="glass-panel p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-white/25 bg-rain-900/50 backdrop-blur-2xl rounded-2xl">
                            <div className="p-4 rounded-2xl bg-white/10 border border-white/20 shadow-glass-sm mb-4">
                                <CheckSquare size={48} className="text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{t.myTasks.noTasks}</h3>
                            <p className="text-white/80 max-w-xl text-sm leading-relaxed font-medium">{t.myTasks.noTasksDesc}</p>
                        </div>
                    ) : (
                        <div
                            key={validCurrentPage}
                            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${
                                animationDirection === 'right' ? 'animate-slide-right' : 'animate-slide-left'
                            }`}
                        >
                            {paginatedTasks.map(task => {
                                const projectColor = THEME_COLOR_MAP[task.projectThemeColor] || '#f97316';
                                const workspaceColor = THEME_COLOR_MAP[task.workspaceThemeColor] || '#38bdf8';
                                const priorityHex = PRIORITY_COLOR_MAP[task.priority] || '#64748b';

                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => navigate(`/projects/${task.projectId}`, {
                                            state: {
                                                openTaskId: task.id,
                                                openTaskMode: 'details',
                                                projectName: task.projectName,
                                                workspaceId: task.workspaceId
                                            }
                                        })}
                                        className="group relative rounded-2xl border border-white/20 glass-card-unified backdrop-blur-2xl p-6 transition-all duration-300 hover:border-white/40 cursor-pointer shadow-glass-sm overflow-hidden flex flex-col justify-between"
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

                                        {/* Ambient bloom layer on hover */}
                                        <div
                                            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                            style={{
                                                boxShadow: `inset 0 0 40px ${priorityHex}20, 0 12px 35px -8px ${priorityHex}30`
                                            }}
                                        />

                                        <div className="relative z-10 pt-1">
                                            {/* Workspace > Project Breadcrumb Path & Priority Pill */}
                                            <div className="flex justify-between items-center mb-3.5 gap-2">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold min-w-0">
                                                    <LayoutGrid size={13} className="text-white/50 shrink-0" />
                                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: workspaceColor }} />
                                                    <span className="truncate max-w-[120px] text-rain-200 font-medium" title={task.workspaceName}>{task.workspaceName}</span>
                                                    <ArrowRight size={11} className="text-white/35 shrink-0" />
                                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: projectColor }} />
                                                    <span className="truncate max-w-[120px] text-white/95 font-bold group-hover:text-fiery-light transition-colors" title={task.projectName}>{task.projectName}</span>
                                                </div>
                                                <span
                                                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rain-950/60 backdrop-blur-md border border-white/15 shrink-0"
                                                    style={{
                                                        color: priorityHex,
                                                        boxShadow: `0 0 12px ${priorityHex}35`
                                                    }}
                                                >
                                                    {getPriorityLabel(task.priority)}
                                                </span>
                                            </div>

                                            {/* Task Title */}
                                            <h4 className="text-lg font-bold text-white mb-2 group-hover:text-fiery transition-colors line-clamp-2 leading-snug drop-shadow-sm">
                                                {task.title}
                                            </h4>

                                            {/* Task Description */}
                                            {task.description && (
                                                <p className="text-xs text-white/75 mb-4 line-clamp-2 leading-relaxed font-normal">
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Card Footer: Creation date & Status pill */}
                                        <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60 relative z-10">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={13} className="text-white/50" />
                                                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <span className="font-semibold text-white/90 bg-white/10 border border-white/15 px-3 py-1 rounded-full text-[11px] shadow-sm backdrop-blur-md">
                                                {getStatusLabel(task.status)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Pinned Stationary Pagination Bar at bottom */}
            {tasks.length > 0 && (
                <div className="pt-4 shrink-0 pb-6">
                    <Pagination
                        currentPage={validCurrentPage}
                        totalPages={totalPages}
                        totalItems={tasks.length}
                        itemsPerPage={TASKS_PER_PAGE}
                        onPageChange={handlePageChange}
                        className="glass-panel border border-white/20 bg-rain-950/60 backdrop-blur-2xl rounded-2xl"
                    />
                </div>
            )}
        </div>
    );
}
