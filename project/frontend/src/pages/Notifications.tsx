import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { Avatar } from '../components/Avatar';
import { NotificationType, type NotificationResponse } from '../types/api';
import { 
    Bell, 
    BellOff, 
    CheckCheck, 
    Check, 
    Trash2, 
    ArrowRight, 
    Send, 
    CornerDownLeft, 
    MessageSquare, 
    UserCheck, 
    Mail 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Notifications() {
    const { isAdmin } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    usePageTitle(`${t.notificationsView.pageTitle} - ProjectHub`);

    const { 
        notifications, 
        unreadCount, 
        isLoading, 
        markAsRead, 
        markAllAsRead, 
        deleteNotification, 
        sendMessageToAdmin, 
        replyToUser 
    } = useNotifications();

    // User contact admin form state
    const [userMessage, setUserMessage] = useState('');
    const [isSendingUserMessage, setIsSendingUserMessage] = useState(false);

    // Admin reply form state
    const [replyingNotificationId, setReplyingNotificationId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    const handleSendUserMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userMessage.trim()) return;

        try {
            setIsSendingUserMessage(true);
            await sendMessageToAdmin(userMessage.trim());
            toast.success(t.notificationsView.directMessageCard.sendSuccess);
            setUserMessage('');
        } catch {
            toast.error(t.common.actions);
        } finally {
            setIsSendingUserMessage(false);
        }
    };

    const handleSendReply = async (notification: NotificationResponse) => {
        if (!replyText.trim() || !notification.senderId) return;

        try {
            setIsSubmittingReply(true);
            await replyToUser(notification.senderId, replyText.trim());
            toast.success(t.notificationsView.directMessageCard.replySuccess);
            setReplyText('');
            setReplyingNotificationId(null);
            // Marks original user direct message as read
            if (!notification.isRead) {
                await markAsRead(notification.id);
            }
        } catch {
            toast.error(t.common.actions);
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const handleOpenTask = (notification: NotificationResponse) => {
        if (!notification.projectId || !notification.taskItemId) return;

        if (!notification.isRead) {
            markAsRead(notification.id);
        }

        const openTaskMode = notification.type === NotificationType.Mention ? 'comments' : 'details';
        navigate(`/projects/${notification.projectId}`, {
            state: {
                openTaskId: notification.taskItemId,
                openTaskMode
            }
        });
    };

    const getTypeBadge = (type: NotificationType) => {
        switch (type) {
            case NotificationType.Mention:
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        <MessageSquare size={12} />
                        {t.notificationsView.types.mention}
                    </span>
                );
            case NotificationType.TaskAssigned:
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <UserCheck size={12} />
                        {t.notificationsView.types.taskAssigned}
                    </span>
                );
            case NotificationType.DirectMessage:
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        <Mail size={12} />
                        {t.notificationsView.types.directMessage}
                    </span>
                );
            default:
                return null;
        }
    };

    // Resolves localized title dynamically based on active language
    const getNotificationTitle = (item: NotificationResponse) => {
        switch (item.type) {
            case NotificationType.Mention:
                return t.notificationsView.templates.mentionTitle;
            case NotificationType.TaskAssigned:
                return t.notificationsView.templates.assignedTitle;
            case NotificationType.DirectMessage:
                return isAdmin
                    ? t.notificationsView.templates.fromUserTitle(item.senderName || t.common.user)
                    : t.notificationsView.templates.fromAdminTitle(item.senderName || t.common.admin);
            default:
                return item.title;
        }
    };

    // Resolves localized description dynamically based on active language
    const getNotificationMessage = (item: NotificationResponse) => {
        const resolvedTaskTitle = item.taskTitle || (item.message.includes(': ') ? item.message.split(': ').slice(1).join(': ') : item.message);

        switch (item.type) {
            case NotificationType.Mention:
                return t.notificationsView.templates.mentionDesc(resolvedTaskTitle);
            case NotificationType.TaskAssigned:
                return t.notificationsView.templates.assignedDesc(resolvedTaskTitle);
            case NotificationType.DirectMessage:
                return item.message;
            default:
                return item.message;
        }
    };

    return (
        <div className="h-full flex flex-col overflow-y-auto pr-2 pb-8 max-w-5xl mx-auto w-full">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-matte-dark flex items-center gap-2">
                        <Bell className="text-fiery" /> {t.notificationsView.title}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">{t.notificationsView.subtitle}</p>
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-fiery/50 text-gray-700 hover:text-fiery text-sm font-semibold rounded-lg shadow-sm transition-all"
                    >
                        <CheckCheck size={16} />
                        {t.notificationsView.markAllAsRead}
                    </button>
                )}
            </div>

            {/* Direct Message Form for Regular Users */}
            {!isAdmin && (
                <div className="glass-panel p-6 mb-8 border border-gray-200 bg-white shadow-sm rounded-xl">
                    <div className="flex items-center gap-2.5 mb-2">
                        <Mail size={18} className="text-fiery" />
                        <h3 className="font-bold text-matte-dark text-base">
                            {t.notificationsView.directMessageCard.userTitle}
                        </h3>
                    </div>
                    <p className="text-gray-500 text-xs mb-4">
                        {t.notificationsView.directMessageCard.userSubtitle}
                    </p>

                    <form onSubmit={handleSendUserMessage} className="space-y-3">
                        <textarea
                            value={userMessage}
                            onChange={(e) => setUserMessage(e.target.value)}
                            placeholder={t.notificationsView.directMessageCard.placeholder}
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-matte-dark focus:outline-none focus:ring-2 focus:ring-fiery/50 focus:border-fiery transition-all resize-none"
                            required
                        />
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSendingUserMessage || !userMessage.trim()}
                                className="flex items-center gap-2 px-5 py-2.5 bg-fiery hover:bg-fiery-dark text-white rounded-lg text-sm font-semibold shadow-md transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                            >
                                <Send size={15} />
                                {isSendingUserMessage
                                    ? t.notificationsView.directMessageCard.sending
                                    : t.notificationsView.directMessageCard.sendButton}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Notifications Feed */}
            {isLoading ? (
                <div className="text-gray-500 animate-pulse p-8 text-center">
                    {t.notificationsView.loading}
                </div>
            ) : notifications.length === 0 ? (
                <div className="glass-panel p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-gray-300 mt-4 rounded-xl">
                    <BellOff size={48} className="text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-matte-dark mb-2">
                        {t.notificationsView.noNotifications}
                    </h3>
                    <p className="text-gray-500 max-w-md">
                        {t.notificationsView.noNotificationsDesc}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((item) => (
                        <div
                            key={item.id}
                            className={`p-5 rounded-xl border transition-all duration-200 shadow-sm ${
                                !item.isRead
                                    ? 'bg-white border-l-4 border-l-fiery border-t-gray-200 border-r-gray-200 border-b-gray-200 shadow-md ring-1 ring-fiery/10'
                                    : 'bg-white/80 border-l-4 border-l-transparent border-gray-200 hover:border-gray-300 opacity-95'
                            }`}
                        >
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        avatarUrl={item.senderAvatarUrl || 'anonymous'}
                                        name={item.senderName || t.common.user}
                                        size="sm"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-matte-dark leading-none">
                                            {item.senderName || t.common.user}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            {new Date(item.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {getTypeBadge(item.type)}

                                    {!item.isRead && (
                                        <button
                                            onClick={() => markAsRead(item.id)}
                                            className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-md hover:bg-gray-100 transition-colors"
                                            title={t.common.save}
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}

                                    <button
                                        onClick={() => deleteNotification(item.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-100 transition-colors"
                                        title={t.notificationsView.actions.delete}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Title & Body */}
                            <div className="pl-11">
                                <h4 className="text-sm font-bold text-matte-dark">
                                    {getNotificationTitle(item)}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1 leading-relaxed whitespace-pre-line">
                                    {getNotificationMessage(item)}
                                </p>

                                {/* Action Buttons */}
                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    {item.projectId && item.taskItemId && (
                                        <button
                                            onClick={() => handleOpenTask(item)}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-matte-dark hover:bg-fiery rounded-lg transition-colors cursor-pointer shadow-sm"
                                        >
                                            <span>{t.notificationsView.actions.openTask}</span>
                                            <ArrowRight size={13} />
                                        </button>
                                    )}

                                    {isAdmin && item.type === NotificationType.DirectMessage && item.senderId && (
                                        <button
                                            onClick={() => {
                                                setReplyingNotificationId(
                                                    replyingNotificationId === item.id ? null : item.id
                                                );
                                                setReplyText('');
                                            }}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <CornerDownLeft size={13} />
                                            <span>{t.notificationsView.actions.reply}</span>
                                        </button>
                                    )}
                                </div>

                                {/* Inline Admin Reply Form */}
                                {isAdmin && replyingNotificationId === item.id && (
                                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                                        <p className="text-xs font-bold text-gray-700">
                                            {t.notificationsView.directMessageCard.replyTitle}
                                        </p>
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder={t.notificationsView.directMessageCard.replyPlaceholder}
                                            rows={3}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-matte-dark focus:outline-none focus:ring-2 focus:ring-fiery/50 focus:border-fiery resize-none"
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setReplyingNotificationId(null);
                                                    setReplyText('');
                                                }}
                                                className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                {t.common.cancel}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSendReply(item)}
                                                disabled={isSubmittingReply || !replyText.trim()}
                                                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-fiery hover:bg-fiery-dark rounded-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-sm"
                                            >
                                                <Send size={12} />
                                                {isSubmittingReply
                                                    ? t.notificationsView.directMessageCard.replying
                                                    : t.notificationsView.directMessageCard.replyButton}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
