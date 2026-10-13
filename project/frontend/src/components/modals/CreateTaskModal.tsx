import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { taskService } from '../../api/taskService';
import { type TaskItemResponse, ProjectTaskStatus, TaskPriority } from '../../types/api';
import { useTranslation } from '../../context/LanguageContext';
import { AxiosError } from 'axios';

interface CreateTaskModalProps {
    isOpen: boolean;
    projectId: string;
    initialStatus?: ProjectTaskStatus;
    onClose: () => void;
    onCreated: (newTask: TaskItemResponse) => void;
}

export const CreateTaskModal = ({ isOpen, projectId, initialStatus = ProjectTaskStatus.ToDo, onClose, onCreated }: CreateTaskModalProps) => {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

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
            setTitle('');
            setDescription('');
            setPriority(TaskPriority.Medium);
            onClose();
        } catch (err) {
            if (err instanceof AxiosError && err.response?.data) {
                setError(err.response.data.message || err.response.data.detail || t.projectKanban.statusUpdateError);
            } else {
                setError(t.modals.taskDetails.apiErrors.serverError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md animate-fade-in p-4">
            <div className="glass-panel-elevated animate-modal-enter w-full max-w-md p-6 relative bg-rain-900/90 backdrop-blur-3xl border border-white/25 shadow-2xl overflow-hidden">
                {/* Laser top highlight */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-rain-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Header Section */}
                <h3 className="text-xl font-extrabold text-white mb-4 tracking-tight">
                    {t.modals.createTask.modalTitle}
                </h3>

                {error && (
                    <div className="bg-red-500/20 text-red-100 border border-red-400/40 px-4 py-2.5 rounded-xl mb-4 text-xs shadow-glow-crimson/20 backdrop-blur-md">
                        {error}
                    </div>
                )}

                {/* Task Creation Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                            {t.modals.createTask.titleLabel}
                        </label>
                        <input
                            type="text"
                            required
                            className="input-glass"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t.modals.createTask.titlePlaceholder}
                            maxLength={200}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                            {t.modals.createTask.descriptionLabel}
                        </label>
                        <textarea
                            className="input-glass min-h-[90px] resize-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t.modals.createTask.descriptionPlaceholder}
                            maxLength={1000}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                            {t.modals.createTask.priorityLabel}
                        </label>
                        <select
                            className="input-glass cursor-pointer bg-rain-950 text-white"
                            value={priority}
                            onChange={(e) => setPriority(Number(e.target.value) as TaskPriority)}
                        >
                            <option value={TaskPriority.Low} className="bg-rain-900 text-white">{t.projectKanban.priorities.low}</option>
                            <option value={TaskPriority.Medium} className="bg-rain-900 text-white">{t.projectKanban.priorities.medium}</option>
                            <option value={TaskPriority.High} className="bg-rain-900 text-white">{t.projectKanban.priorities.high}</option>
                            <option value={TaskPriority.Critical} className="bg-rain-900 text-white">{t.projectKanban.priorities.critical}</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="glass-btn-ghost px-4 py-2 text-sm"
                        >
                            {t.common.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !title.trim()}
                            className="btn-fiery px-5 py-2 text-sm"
                        >
                            <span>{isLoading ? t.common.saving : t.modals.createTask.submitBtn}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
