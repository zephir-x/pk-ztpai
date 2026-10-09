import { useState } from 'react';
import { X } from 'lucide-react';
import { taskService } from '../../api/taskService';
import { type TaskItemResponse, ProjectTaskStatus, TaskPriority } from '../../types/api';
import { AxiosError } from 'axios';

interface CreateTaskModalProps {
    isOpen: boolean;
    projectId: string;
    initialStatus?: ProjectTaskStatus; 
    onClose: () => void;
    onCreated: (newTask: TaskItemResponse) => void;
}

export const CreateTaskModal = ({ isOpen, projectId, initialStatus = ProjectTaskStatus.ToDo, onClose, onCreated }: CreateTaskModalProps) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Prevent rendering when inactive to save resources
    if (!isOpen) return null;

    // Construct payload with predefined status and default assignee
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const newTask = await taskService.create({
                title,
                description: description || null,
                status: initialStatus,
                priority: priority,
                projectId: projectId,
                assigneeId: null
            });
            onCreated(newTask);
            // Reset state to ensure clean form on next open
            setTitle('');
            setDescription('');
            setPriority(TaskPriority.Medium);
            onClose();
        } catch (err) {
            if (err instanceof AxiosError && err.response?.data) {
                setError(err.response.data.message || 'Failed to create task.');
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Render modal overlay and structural wrapper
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-matte-dark/60 backdrop-blur-sm animate-fade-in p-4">
            <div className="glass-panel w-full max-w-md p-6 relative shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-matte-dark transition-colors">
                    <X size={20} />
                </button>

                {/* Header Section */}
                <h3 className="text-xl font-bold text-matte-dark mb-4">Add New Task</h3>

                {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm border border-red-200">{error}</div>}

                {/* Task Creation Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-matte-dark mb-1">Task Title</label>
                        <input
                            type="text"
                            required
                            className="input-glass"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Implement authentication"
                            maxLength={200}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-matte-dark mb-1">Description</label>
                        <textarea
                            className="input-glass min-h-[80px] resize-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add details..."
                            maxLength={1000}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-matte-dark mb-1">Priority</label>
                        <select
                            className="input-glass cursor-pointer"
                            value={priority}
                            onChange={(e) => setPriority(Number(e.target.value) as TaskPriority)}
                        >
                            <option value={TaskPriority.Low}>Low</option>
                            <option value={TaskPriority.Medium}>Medium</option>
                            <option value={TaskPriority.High}>High</option>
                            <option value={TaskPriority.Critical}>Critical</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                        <button type="submit" disabled={isLoading || !title.trim()} className="btn-fiery">
                            {isLoading ? 'Saving...' : 'Add Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
