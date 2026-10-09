import { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Save, Send, AlignLeft, MessageSquare, ShieldAlert } from 'lucide-react';
import { taskService } from '../../api/taskService';
import { userService } from '../../api/userService';
import { commentService } from '../../api/commentService';
import { type TaskItemResponse, TaskPriority, type UserResponse, type CommentResponse } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
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
    }

    const fetchComments = async (taskId: string) => {
        try {
            const data = await commentService.getByTask(taskId);
            setComments(data);
        } catch {}
    }

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
            toast.success('The task details have been updated.');
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
                toast.success('The user has been assigned to the task.');
            } else {
                const updated = await taskService.update(task!.id, {
                    title: task!.title,
                    description: task!.description,
                    status: task!.status,
                    priority: value,
                    assigneeId: task!.assigneeId
                });
                onUpdate(updated);
                toast.success('The task priority has been updated.');
            }
        } catch (err) {
            onUpdate({ ...task!, [field]: originalValue });
            handleApiError(err);
        }
    };

    // Ensure task deletion cascades properly on the frontend list
    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        setIsLoading(true);
        try {
            await taskService.delete(task!.id);
            onDelete(task!.id);
            toast.success('The task has been permanently deleted.');
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
            if (status === 409) toast.error(data?.message || "The operation cannot be performed due to a business logic conflict.");
            else if (status === 403) toast.error("Only the administrator can perform this activity.");
            else toast.error(data?.message || "An unexpected server error occurred.");
        } else {
            toast.error("Server connection error.");
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
                            <AlignLeft size={16} /> Details
                        </button>
                        <button
                            onClick={() => setActiveTab('comments')}
                            className={`pb-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'comments' ? 'border-fiery text-fiery' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            <MessageSquare size={16} /> Comments ({comments.length})
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('admin')}
                                className={`pb-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'admin' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                <ShieldAlert size={16} /> Admin
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
                                        <button onClick={handleSaveEdits} disabled={isLoading} className="btn-fiery text-sm px-4 py-2 flex items-center gap-2"><Save size={16} /> Save Changes</button>
                                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="group flex items-start justify-between">
                                        <h2 className="text-2xl font-bold text-matte-dark pr-8">{task.title}</h2>
                                        {isAdmin && (<button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-fiery transition-colors p-2 rounded hover:bg-gray-200/50"><Edit2 size={16} /></button>)}
                                    </div>
                                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {task.description || <span className="text-gray-400 italic">No description provided.</span>}
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
                                    <p className="text-gray-500 italic text-sm text-center py-8">No comments yet.</p>
                                ) : (
                                    comments.map(comment => (
                                        <div key={comment.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-sm text-matte-dark">User {comment.authorId.substring(0, 8)}</span>
                                                <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p className="text-gray-700 text-sm">{comment.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <form onSubmit={handleAddComment} className="flex gap-2 shrink-0 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                                <input
                                    type="text"
                                    className="flex-1 px-4 py-2 bg-transparent outline-none text-sm"
                                    placeholder="Write a comment... use @ to mention"
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
                                    <label className="block text-xs font-bold text-matte-dark uppercase tracking-wider mb-2">Priority Override</label>
                                    <select className="w-full input-glass border-gray-200 bg-gray-50 cursor-pointer" value={task.priority} onChange={(e) => handleInstantUpdate('priority', Number(e.target.value))} disabled={isLoading}>
                                        <option value={TaskPriority.Low}>Low</option>
                                        <option value={TaskPriority.Medium}>Medium</option>
                                        <option value={TaskPriority.High}>High</option>
                                        <option value={TaskPriority.Critical}>Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-matte-dark uppercase tracking-wider mb-2">Assignee Management</label>
                                    <select className="w-full input-glass border-gray-200 bg-gray-50 cursor-pointer" value={task.assigneeId || ''} onChange={(e) => handleInstantUpdate('assigneeId', e.target.value || null)} disabled={isLoading}>
                                        <option value="">Unassigned</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                                <h4 className="text-sm font-bold text-red-700 mb-2">Danger Zone</h4>
                                <p className="text-xs text-red-500 mb-4">Deleting a task cannot be undone. All associated comments will be lost.</p>
                                <button onClick={handleDelete} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm">
                                    <Trash2 size={16} /> Delete Task Permanently
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
