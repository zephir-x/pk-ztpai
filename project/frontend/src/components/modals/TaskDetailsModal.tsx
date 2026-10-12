import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Edit2, Save, Send, AlignLeft, MessageSquare, ShieldAlert } from 'lucide-react';
import { taskService } from '../../api/taskService';
import { userService } from '../../api/userService';
import { commentService } from '../../api/commentService';
import { type TaskItemResponse, TaskPriority, ProjectTaskStatus, type UserResponse, type CommentResponse } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { Avatar } from '../Avatar';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import type { ModalViewMode } from '../../pages/ProjectKanban';

interface TaskDetailsModalProps {
    isOpen: boolean;
    task: TaskItemResponse | null;
    initialView: ModalViewMode;
    onClose: () => void;
    onUpdate: (updatedTask: TaskItemResponse) => void;
    onDelete: (taskId: string) => void;
}

const PRIORITY_COLOR_MAP: Record<TaskPriority, string> = {
    [TaskPriority.Critical]: '#ef4444',
    [TaskPriority.High]: '#f97316',
    [TaskPriority.Medium]: '#3b82f6',
    [TaskPriority.Low]: '#64748b'
};

export const TaskDetailsModal = ({ isOpen, task, initialView, onClose, onUpdate, onDelete }: TaskDetailsModalProps) => {
    const { isAdmin } = useAuth();
    const { t } = useTranslation();

    const [activeTab, setActiveTab] = useState<ModalViewMode>(initialView);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const [users, setUsers] = useState<UserResponse[]>([]);
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [newComment, setNewComment] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [isCommenting, setIsCommenting] = useState(false);

    // Synchronize tab mode when initialView changes or modal re-opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialView);
        }
    }, [isOpen, initialView]);

    // Synchronize local form and detail states when task changes
    useEffect(() => {
        if (isOpen && task) {
            setEditTitle(task.title);
            setEditDescription(task.description || '');
            setIsEditing(false);
            if (isAdmin) fetchUsers();
            fetchComments(task.id);
        }
    }, [isOpen, task?.id, isAdmin]);

    const fetchUsers = async () => {
        try {
            const data = await userService.getAll();
            setUsers(data);
        } catch {}
    };

    const fetchComments = async (taskId: string) => {
        try {
            const data = await commentService.getByTask(taskId);
            setComments(data);
        } catch {}
    };

    const handleSaveEdits = async () => {
        if (!editTitle.trim()) return;
        setIsLoading(true);
        try {
            const updated = await taskService.update(task!.id, {
                title: editTitle,
                description: editDescription,
                status: task!.status,
                priority: task!.priority,
                assigneeId: task!.assigneeId
            });
            onUpdate(updated);
            setIsEditing(false);
            toast.success(t.modals.taskDetails.updateSuccess);
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Instant update handler for admin overrides
    const handleInstantUpdate = async (field: 'priority' | 'assigneeId', value: any) => {
        try {
            if (field === 'assigneeId') {
                const selectedUser = value ? users.find(u => u.id === value) : null;
                const updatedTask: TaskItemResponse = {
                    ...task!,
                    assigneeId: value,
                    assigneeFirstName: selectedUser ? selectedUser.firstName : null,
                    assigneeLastName: selectedUser ? selectedUser.lastName : null,
                    assigneeAvatarUrl: selectedUser ? selectedUser.avatarUrl : null
                };

                await taskService.changeAssignee(task!.id, value);
                onUpdate(updatedTask);
                toast.success(t.modals.taskDetails.assignSuccess);
                onClose();
            } else {
                const updated = await taskService.update(task!.id, {
                    title: task!.title,
                    description: task!.description,
                    status: task!.status,
                    priority: value,
                    assigneeId: task!.assigneeId
                });
                onUpdate(updated);
                toast.success(t.modals.taskDetails.prioritySuccess);
            }
        } catch (err) {
            handleApiError(err);
        }
    };

    // Ensure task deletion cascades properly on the frontend list
    const handleDelete = async () => {
        if (!window.confirm(t.modals.taskDetails.deleteConfirm)) return;
        setIsLoading(true);
        try {
            await taskService.delete(task!.id);
            onDelete(task!.id);
            toast.success(t.modals.taskDetails.deleteSuccess);
            onClose();
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsCommenting(true);
        try {
            const added = await commentService.create({ content: newComment, taskItemId: task!.id });
            setComments(prev => [...prev, added]);
            setNewComment('');
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsCommenting(false);
        }
    };

    const handleApiError = (err: unknown) => {
        if (err instanceof AxiosError && err.response) {
            const { status, data } = err.response;
            if (status === 409) toast.error(data?.message || data?.detail || t.modals.taskDetails.apiErrors.conflict);
            else if (status === 403) toast.error(t.modals.taskDetails.apiErrors.forbidden);
            else toast.error(data?.message || data?.detail || t.modals.taskDetails.apiErrors.serverError);
        } else {
            toast.error(t.modals.taskDetails.apiErrors.connectionError);
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

    const getStatusLabel = (status: ProjectTaskStatus) => {
        switch (status) {
            case ProjectTaskStatus.ToDo: return t.projectKanban.columns.todo;
            case ProjectTaskStatus.InProgress: return t.projectKanban.columns.inProgress;
            case ProjectTaskStatus.Review: return t.projectKanban.columns.review;
            case ProjectTaskStatus.Done: return t.projectKanban.columns.done;
            default: return '';
        }
    };

    // Formats comment text and creates glowing accent pills for user mentions (@user)
    const renderCommentContent = (content: string) => {
        const parts = content.split(/(@[a-zA-Z0-9_.-]+)/g);
        return parts.map((part, index) => {
            if (part.startsWith('@') && part.length > 1) {
                return (
                    <span
                        key={index}
                        className="inline-flex items-center gap-0.5 font-bold text-xs px-2 py-0.5 mx-0.5 rounded-lg bg-fiery/15 text-fiery border border-fiery/30 shadow-[0_0_12px_rgba(var(--accent-rgb),0.25)] hover:bg-fiery/25 transition-colors cursor-default align-baseline"
                    >
                        <span className="text-fiery-light">@</span>
                        <span>{part.slice(1)}</span>
                    </span>
                );
            }
            return part;
        });
    };

    if (!isOpen || !task) return null;

    const priorityColor = PRIORITY_COLOR_MAP[task.priority] || '#64748b';

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md animate-fade-in p-4 sm:p-6">
            <div className="glass-panel-elevated animate-modal-enter relative bg-rain-900/95 backdrop-blur-3xl border border-white/25 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden transition-[height,max-height] duration-300 ease-in-out">
                {/* Laser top highlight */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                {/* Navigation Tabs Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/15 bg-white/5 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                                activeTab === 'details'
                                    ? 'bg-white/15 text-fiery border border-white/25 shadow-glow-accent'
                                    : 'text-rain-200 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <AlignLeft size={16} />
                            <span>{t.modals.taskDetails.tabs.details}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('comments')}
                            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                                activeTab === 'comments'
                                    ? 'bg-white/15 text-fiery border border-white/25 shadow-glow-accent'
                                    : 'text-rain-200 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <MessageSquare size={16} />
                            <span>{t.modals.taskDetails.tabs.comments}</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-white/15 font-bold">
                                {comments.length}
                            </span>
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('admin')}
                                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                                    activeTab === 'admin'
                                        ? 'bg-white/15 text-fiery border border-white/25 shadow-glow-accent'
                                        : 'text-rain-200 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <ShieldAlert size={16} />
                                <span>{t.modals.taskDetails.tabs.admin}</span>
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-rain-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title={t.common.cancel}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content Area with Smooth Dissolve Animation on Tab Switch */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-7 transition-all duration-300 ease-in-out">
                    <div key={activeTab} className="w-full animate-blur-in">
                        {/* Details Tab */}
                        {activeTab === 'details' && (
                            <div className="w-full space-y-6">
                                {isEditing ? (
                                    <div className="space-y-4 bg-rain-950/60 p-6 rounded-2xl border border-white/15 backdrop-blur-md">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                                                {t.modals.createTask.titleLabel}
                                            </label>
                                            <input
                                                type="text"
                                                className="input-glass text-base font-bold"
                                                value={editTitle}
                                                onChange={e => setEditTitle(e.target.value)}
                                                maxLength={200}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                                                {t.modals.createTask.descriptionLabel}
                                            </label>
                                            <textarea
                                                className="input-glass min-h-[160px] resize-none text-sm"
                                                value={editDescription}
                                                onChange={e => setEditDescription(e.target.value)}
                                                maxLength={1000}
                                            />
                                        </div>
                                        <div className="flex items-center justify-end gap-3 pt-2">
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="glass-btn-ghost text-sm px-5 py-2.5"
                                            >
                                                {t.common.cancel}
                                            </button>
                                            <button
                                                onClick={handleSaveEdits}
                                                disabled={isLoading}
                                                className="btn-fiery text-sm px-6 py-2.5 flex items-center gap-2"
                                            >
                                                <Save size={16} />
                                                <span>{t.common.save}</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Task Title & Edit Button Header */}
                                        <div className="flex items-start justify-between gap-4">
                                            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug drop-shadow-sm flex-1">
                                                {task.title}
                                            </h2>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="p-2.5 rounded-xl text-rain-200 hover:text-fiery hover:bg-white/10 border border-white/15 hover:border-white/30 transition-all cursor-pointer shrink-0"
                                                    title={t.common.edit}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Unified Meta Badges Row */}
                                        <div className="flex flex-wrap items-center gap-3 pt-1">
                                            {/* Status Badge */}
                                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rain-950/70 border border-white/15 backdrop-blur-md">
                                                <span className="w-2 h-2 rounded-full bg-white/70" />
                                                <span className="text-xs font-semibold text-white/90">
                                                    {getStatusLabel(task.status)}
                                                </span>
                                            </div>

                                            {/* Priority Badge */}
                                            <div
                                                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rain-950/70 border border-white/15 backdrop-blur-md"
                                                style={{ boxShadow: `0 0 14px ${priorityColor}25` }}
                                            >
                                                <span
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: priorityColor, boxShadow: `0 0 8px ${priorityColor}` }}
                                                />
                                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: priorityColor }}>
                                                    {getPriorityLabel(task.priority)}
                                                </span>
                                            </div>

                                            {/* Assignee Badge */}
                                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rain-950/70 border border-white/15 backdrop-blur-md">
                                                {task.assigneeId ? (
                                                    <>
                                                        <Avatar
                                                            avatarUrl={task.assigneeAvatarUrl}
                                                            name={task.assigneeFirstName}
                                                            size="xs"
                                                        />
                                                        <span className="text-xs text-white/90 font-medium">
                                                            {task.assigneeFirstName} {task.assigneeLastName || ''}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/50 border border-white/15">
                                                            ?
                                                        </div>
                                                        <span className="text-xs text-rain-300 font-medium">
                                                            {t.modals.taskDetails.adminSection.unassigned}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Task Description Section */}
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-wider text-rain-300 mb-2">
                                                {t.modals.createTask.descriptionLabel}
                                            </div>
                                            <div className="w-full text-white/90 whitespace-pre-wrap leading-relaxed text-sm bg-rain-950/50 p-5 rounded-2xl border border-white/15 backdrop-blur-md min-h-[140px]">
                                                {task.description ? (
                                                    task.description
                                                ) : (
                                                    <span className="text-rain-400 italic font-medium">
                                                        {t.modals.taskDetails.noDescription}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Comments Tab */}
                        {activeTab === 'comments' && (
                            <div className="w-full flex flex-col space-y-5">
                                <div className="relative w-full [mask-image:linear-gradient(to_bottom,transparent_0%,black_32px,black_calc(100%-32px),transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_32px,black_calc(100%-32px),transparent_100%)]">
                                    <div className="space-y-3.5 max-h-[46vh] overflow-y-auto pr-1 py-4">
                                    {comments.length === 0 ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-center">
                                            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 mb-3 text-rain-300">
                                                <MessageSquare size={28} />
                                            </div>
                                            <p className="text-rain-300 italic text-sm font-medium">
                                                {t.modals.taskDetails.commentsSection.noComments}
                                            </p>
                                        </div>
                                    ) : (
                                        comments.map(comment => {
                                            const authorFullName = `${comment.authorFirstName || ''} ${comment.authorLastName || ''}`.trim();
                                            const authorDisplayName = authorFullName || `User ${comment.authorId.substring(0, 8)}`;
                                            return (
                                                <div
                                                    key={comment.id}
                                                    className="bg-rain-950/60 p-4 rounded-2xl border border-white/15 backdrop-blur-md shadow-glass-sm space-y-2"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2.5">
                                                            <Avatar
                                                                avatarUrl={comment.authorAvatarUrl}
                                                                name={authorDisplayName}
                                                                size="xs"
                                                            />
                                                            <span className="font-bold text-sm text-white">{authorDisplayName}</span>
                                                        </div>
                                                        <span className="text-xs text-rain-300 font-medium">
                                                            {new Date(comment.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-white/85 text-sm pl-8 leading-relaxed whitespace-pre-wrap">
                                                        {renderCommentContent(comment.content)}
                                                    </p>
                                                </div>
                                            );
                                        })
                                    )}
                                    </div>
                                </div>

                                {/* Comment Creation Bar */}
                                <form onSubmit={handleAddComment} className="flex gap-2.5 w-full bg-rain-950/70 p-2.5 rounded-2xl border border-white/20 backdrop-blur-md shadow-glass-md">
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-2 bg-transparent outline-none text-sm text-white placeholder-rain-300 font-medium"
                                        placeholder={t.modals.taskDetails.commentsSection.placeholder}
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        disabled={isCommenting}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isCommenting || !newComment.trim()}
                                        className="btn-fiery p-2.5 rounded-xl cursor-pointer disabled:opacity-50"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Admin Management Tab */}
                        {activeTab === 'admin' && isAdmin && (
                            <div className="w-full space-y-6">
                                {/* Management Card with 2-Column Responsive Grid */}
                                <div className="bg-rain-950/60 p-6 rounded-2xl border border-white/15 backdrop-blur-md">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-2">
                                                {t.modals.taskDetails.adminSection.priorityOverride}
                                            </label>
                                            <select
                                                className="w-full input-glass cursor-pointer bg-rain-950 text-white"
                                                value={task.priority}
                                                onChange={(e) => handleInstantUpdate('priority', Number(e.target.value))}
                                                disabled={isLoading}
                                            >
                                                <option value={TaskPriority.Low} className="bg-rain-900 text-white">{t.projectKanban.priorities.low}</option>
                                                <option value={TaskPriority.Medium} className="bg-rain-900 text-white">{t.projectKanban.priorities.medium}</option>
                                                <option value={TaskPriority.High} className="bg-rain-900 text-white">{t.projectKanban.priorities.high}</option>
                                                <option value={TaskPriority.Critical} className="bg-rain-900 text-white">{t.projectKanban.priorities.critical}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-2">
                                                {t.modals.taskDetails.adminSection.assigneeManagement}
                                            </label>
                                            <select
                                                className="w-full input-glass cursor-pointer bg-rain-950 text-white"
                                                value={task.assigneeId || ''}
                                                onChange={(e) => handleInstantUpdate('assigneeId', e.target.value || null)}
                                                disabled={isLoading}
                                            >
                                                <option value="" className="bg-rain-900 text-white">{t.modals.taskDetails.adminSection.unassigned}</option>
                                                {users.map(u => {
                                                    const uName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
                                                    const label = uName ? `${uName} (${u.email})` : u.email;
                                                    return <option key={u.id} value={u.id} className="bg-rain-900 text-white">{label}</option>;
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Red-Themed Delete Action Tile (No Danger Zone module) */}
                                <div className="bg-red-950/20 p-5 rounded-2xl border border-red-500/25 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-red-200">
                                            {t.modals.taskDetails.adminSection.deletePermanently}
                                        </h4>
                                        <p className="text-xs text-red-300/70 mt-0.5">
                                            {t.modals.taskDetails.deleteConfirm}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isLoading}
                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 hover:border-red-500/60 text-red-100 hover:text-white font-semibold text-sm transition-all shadow-glow-crimson/20 cursor-pointer shrink-0 disabled:opacity-50"
                                    >
                                        <Trash2 size={16} className="text-red-300" />
                                        <span>{t.common.delete}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
