import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskService } from '../api/taskService';
import { type MyTaskResponse, ProjectTaskStatus, TaskPriority } from '../types/api';
import { THEME_COLOR_MAP } from '../components/modals/WorkspaceModal';
import { usePageTitle } from '../hooks/usePageTitle';
import { CheckSquare, ArrowRight, LayoutGrid, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function MyTasks() {
    usePageTitle('My Tasks');
    const navigate = useNavigate();

    const [tasks, setTasks] = useState<MyTaskResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setIsLoading(true);
            const data = await taskService.getMyTasks();
            setTasks(data);
        } catch {
            toast.error('Failed to retrieve your tasks.');
        } finally {
            setIsLoading(false);
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
            case TaskPriority.Critical: return 'CRITICAL';
            case TaskPriority.High: return 'HIGH';
            case TaskPriority.Medium: return 'MEDIUM';
            case TaskPriority.Low: return 'LOW';
            default: return 'UNKNOWN';
        }
    };

    const getStatusLabel = (status: ProjectTaskStatus) => {
        switch (status) {
            case ProjectTaskStatus.ToDo: return 'To Do';
            case ProjectTaskStatus.InProgress: return 'In Progress';
            case ProjectTaskStatus.Review: return 'Review';
            case ProjectTaskStatus.Done: return 'Done';
            default: return 'Unknown';
        }
    };

    if (isLoading) return <div className="text-gray-500 animate-pulse p-8">Loading your tasks...</div>;

    return (
        <div className="h-full flex flex-col overflow-y-auto pr-2 pb-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-fiery/10 flex items-center justify-center text-fiery">
                    <CheckSquare size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-matte-dark">My Tasks</h2>
                    <p className="text-gray-500 text-sm mt-1">All tasks currently assigned to you across workspaces.</p>
                </div>
            </div>

            {tasks.length === 0 ? (
                <div className="glass-panel p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-gray-300 mt-4">
                    <CheckSquare size={48} className="text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-matte-dark mb-2">No assigned tasks</h3>
                    <p className="text-gray-500 max-w-md">You are all caught up! There are no tasks currently assigned to you.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {tasks.map(task => (
                        <div 
                            key={task.id}
                            onClick={() => navigate('/projects/' + task.projectId)}
                            className="glass-panel relative overflow-hidden p-5 flex flex-col hover:shadow-lg transition-all duration-300 cursor-pointer group border border-gray-100 hover:border-fiery/30"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300" style={{ backgroundColor: THEME_COLOR_MAP[task.projectThemeColor] }}></div>
                            
                            <div className="flex justify-between items-start mb-3 pl-3">
                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                                    <LayoutGrid size={14} className="text-gray-400" />
                                    <span style={{ color: THEME_COLOR_MAP[task.workspaceThemeColor] }}>{task.workspaceName}</span>
                                    <ArrowRight size={12} className="text-gray-300" />
                                    <span style={{ color: THEME_COLOR_MAP[task.projectThemeColor] }}>{task.projectName}</span>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                                    {getPriorityLabel(task.priority)}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-matte-dark mb-2 pl-3 group-hover:text-fiery transition-colors">
                                {task.title}
                            </h3>
                            
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 pl-3 flex-1">
                                {task.description || 'No description provided.'}
                            </p>

                            <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto pl-3">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                    <Clock size={14} />
                                    {getStatusLabel(task.status)}
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Go to board <ArrowRight size={14} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
