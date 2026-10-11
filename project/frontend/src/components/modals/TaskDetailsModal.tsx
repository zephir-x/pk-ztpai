import { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Save, Send, AlignLeft, MessageSquare, ShieldAlert } from 'lucide-react';
import { taskService } from '../../api/taskService';
import { userService } from '../../api/userService';
import { commentService } from '../../api/commentService';
import { type TaskItemResponse, TaskPriority, type UserResponse, type CommentResponse } from '../../types/api';
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

    // Sync local state when modal opens or task changes
    useEffect(() => {
        if (isOpen && task) {
            setActiveTab(initialView);
            setEditTitle(task.title);
            setEditDescription(task.description || '');
            setIsEditing(false);
            if (isAdmin) fetchUsers();
            fetchComments(task.id);
        }
    }, [isOpen, task, initialView, isAdmin]);

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

    // Optimistic UI update before API request completes
    const handleInstantUpdate = async (field: 'priority' | 'assigneeId', value: any) => {
        const originalValue = task![field];
        onUpdate({ ...task!, [field]: value });

        try {
            if (field === 'assigneeId') {
                await taskService.changeAssignee(task!.id, value);
                toast.success(t.modals.taskDetails.assignSuccess);
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
            onUpdate({ ...task!, [field]: originalValue });
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

    // Prevent rendering when inactive to save resources
    if (!isOpen || !task) return null;

    // Render modal overlay and structural wrapper
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-matte-dark/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-gray-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Navigation Tabs */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`pb-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'details' ? 'border-fiery text-fiery' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            <AlignLeft size={16} /> {t.modals.taskDetails.tabs.details}
                        </button>
                        <button
                            onClick={() => setActiveTab('comments')}
                            className={`pb-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'comments' ? 'border-fiery text-fiery' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            <MessageSquare size={16} /> {t.modals.taskDetails.tabs.comments} ({comments.length})
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('admin')}
                                className={`pb-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'admin' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                <ShieldAlert size={16} /> {t.modals.taskDetails.tabs.admin}
                            </button>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 -mt-4"><X size={20} /></button>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    {/* Details Tab */}
                    {activeTab === 'details' && (
                        <div className="max-w-2xl animate-fade-in">
                            {isEditing ? (
                                <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <input type="text" className="input-glass border-gray-300 bg-white" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                                    <textarea className="input-glass border-gray-300 bg-white min-h-[150px] resize-none" value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={handleSaveEdits} disabled={isLoading} className="btn-fiery text-sm px-4 py-2 flex items-center gap-2"><Save size={16} /> {t.common.save}</button>
                                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">{t.common.cancel}</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="group flex items-start justify-between">
                                        <h2 className="text-2xl font-bold text-matte-dark pr-8">{task.title}</h2>
                                        {isAdmin && (<button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-fiery transition-colors p-2 rounded hover:bg-gray-200/50"><Edit2 size={16} /></button>)}
                                    </div>
                                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {task.description || <span className="text-gray-400 italic">{t.modals.taskDetails.noDescription}</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Comments Tab */}
                    {activeTab === 'comments' && (
                        <div className="flex flex-col h-full animate-fade-in max-w-2xl">
                            <div className="flex-1 space-y-4 mb-6">
                                {comments.length === 0 ? (
                                    <p className="text-gray-500 italic text-sm text-center py-8">{t.modals.taskDetails.commentsSection.noComments}</p>
                                ) : (
                                    comments.map(comment => {
                                        const authorFullName = `${comment.authorFirstName || ''} ${comment.authorLastName || ''}`.trim();
                                        const authorDisplayName = authorFullName || `User ${comment.authorId.substring(0, 8)}`;
                                        return (
                                            <div key={comment.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <Avatar
                                                            avatarUrl={comment.authorAvatarUrl}
                                                            name={authorDisplayName}
                                                            size="xs"
                                                        />
                                                        <span className="font-bold text-sm text-matte-dark">{authorDisplayName}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-gray-700 text-sm pl-8">{comment.content}</p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <form onSubmit={handleAddComment} className="flex gap-2 shrink-0 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                                <input
                                    type="text"
                                    className="flex-1 px-4 py-2 bg-transparent outline-none text-sm"
                                    placeholder={t.modals.taskDetails.commentsSection.placeholder}
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    disabled={isCommenting}
                                />
                                <button type="submit" disabled={isCommenting || !newComment.trim()} className="btn-fiery p-2 rounded-lg">
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Admin Management Tab */}
                    {activeTab === 'admin' && isAdmin && (
                        <div className="max-w-md space-y-6 animate-fade-in">
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-matte-dark uppercase tracking-wider mb-2">{t.modals.taskDetails.adminSection.priorityOverride}</label>
                                    <select className="w-full input-glass border-gray-200 bg-gray-50 cursor-pointer" value={task.priority} onChange={(e) => handleInstantUpdate('priority', Number(e.target.value))} disabled={isLoading}>
                                        <option value={TaskPriority.Low}>{t.projectKanban.priorities.low}</option>
                                        <option value={TaskPriority.Medium}>{t.projectKanban.priorities.medium}</option>
                                        <option value={TaskPriority.High}>{t.projectKanban.priorities.high}</option>
                                        <option value={TaskPriority.Critical}>{t.projectKanban.priorities.critical}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-matte-dark uppercase tracking-wider mb-2">{t.modals.taskDetails.adminSection.assigneeManagement}</label>
                                    <select className="w-full input-glass border-gray-200 bg-gray-50 cursor-pointer" value={task.assigneeId || ''} onChange={(e) => handleInstantUpdate('assigneeId', e.target.value || null)} disabled={isLoading}>
                                        <option value="">{t.modals.taskDetails.adminSection.unassigned}</option>
                                        {users.map(u => {
                                            const uName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
                                            const label = uName ? `${uName} (${u.email})` : u.email;
                                            return <option key={u.id} value={u.id}>{label}</option>;
                                        })}
                                    </select>
                                </div>
                            </div>

                            <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                                <h4 className="text-sm font-bold text-red-700 mb-2">{t.modals.taskDetails.adminSection.dangerZone}</h4>
                                <p className="text-xs text-red-500 mb-4">{t.modals.taskDetails.adminSection.dangerDesc}</p>
                                <button onClick={handleDelete} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm">
                                    <Trash2 size={16} /> {t.modals.taskDetails.adminSection.deletePermanently}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
