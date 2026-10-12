import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { Avatar } from '../components/Avatar';
import { Pagination } from '../components/Pagination';
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

    usePageTitle(t.notificationsView.pageTitle);

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

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [animationDirection, setAnimationDirection] = useState<'right' | 'left'>('right');
    const NOTIFICATIONS_PER_PAGE = 8;

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

    const handlePageChange = (newPage: number, direction: 'left' | 'right') => {
        setAnimationDirection(direction);
        setCurrentPage(newPage);
    };

    const getTypeBadge = (type: NotificationType) => {
        switch (type) {
            case NotificationType.Mention:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-sky-500/15 text-sky-300 border border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.2)] backdrop-blur-md">
                        <MessageSquare size={12} />
                        {t.notificationsView.types.mention}
                    </span>
                );
            case NotificationType.TaskAssigned:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 shadow-[0_0_12px_rgba(52,211,153,0.2)] backdrop-blur-md">
                        <UserCheck size={12} />
                        {t.notificationsView.types.taskAssigned}
                    </span>
                );
            case NotificationType.DirectMessage:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 shadow-[0_0_12px_rgba(245,158,11,0.2)] backdrop-blur-md">
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

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(notifications.length / NOTIFICATIONS_PER_PAGE));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * NOTIFICATIONS_PER_PAGE;
    const endIndex = Math.min(startIndex + NOTIFICATIONS_PER_PAGE, notifications.length);
    const paginatedNotifications = notifications.slice(startIndex, endIndex);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-12">
                <div className="glass-panel px-6 py-4 flex items-center gap-3 text-white border border-white/20 shadow-glass-md">
                    <div className="w-3.5 h-3.5 rounded-full bg-fiery animate-ping" />
                    <span className="text-sm font-semibold tracking-wide">{t.notificationsView.loading}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
            {/* Header Section: lowered by pt-[26px] for universal page alignment */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7 relative z-10 pt-[26px] shrink-0">
                <div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3 drop-shadow-md">
                        <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 shadow-glass-sm ring-1 ring-fiery/40">
                            <Bell className="text-fiery drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.7)]" size={26} />
                        </div>
                        <span>{t.notificationsView.title}</span>
                    </h2>
                    <p className="text-rain-200 text-sm mt-2 font-medium drop-shadow-sm">
                        {t.notificationsView.subtitle}
                    </p>
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="glass-btn-ghost flex items-center gap-2 text-sm px-4 py-2.5 self-start cursor-pointer hover:border-fiery/50 hover:text-fiery-light transition-all"
                    >
                        <CheckCheck size={16} />
                        <span>{t.notificationsView.markAllAsRead}</span>
                    </button>
                )}
            </div>

            {/* Scrollable Feed Container with Smooth Top and Bottom Fade Transition */}
            <div className="relative flex-1 min-h-0 [mask-image:linear-gradient(to_bottom,transparent_0px,black_32px,black_calc(100%-32px),transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0px,black_32px,black_calc(100%-32px),transparent_100%)]">
                <div className="h-full overflow-y-auto pt-8 pr-1 pb-6">
                    {/* Direct Message Form for Regular Users */}
                    {!isAdmin && (
                        <div className="mb-6 relative rounded-2xl p-5 border border-white/15 bg-rain-950/60 backdrop-blur-2xl shadow-none overflow-hidden">
                            {/* Top highlight rim */}
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                            <div className="flex items-center gap-2.5 mb-1.5">
                                <div className="p-2 rounded-xl bg-white/10 border border-white/15 text-fiery shadow-glass-sm">
                                    <Mail size={18} />
                                </div>
                                <h3 className="font-bold text-white text-base tracking-wide">
                                    {t.notificationsView.directMessageCard.userTitle}
                                </h3>
                            </div>
                            <p className="text-rain-200 text-xs mb-3">
                                {t.notificationsView.directMessageCard.userSubtitle}
                            </p>

                            <form onSubmit={handleSendUserMessage} className="space-y-3">
                                <textarea
                                    value={userMessage}
                                    onChange={(e) => setUserMessage(e.target.value)}
                                    placeholder={t.notificationsView.directMessageCard.placeholder}
                                    rows={3}
                                    className="input-glass text-sm resize-none min-h-[80px]"
                                    required
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSendingUserMessage || !userMessage.trim()}
                                        className="btn-fiery flex items-center gap-2 px-5 py-2.5 text-sm cursor-pointer disabled:opacity-50"
                                    >
                                        <Send size={15} />
                                        <span>
                                            {isSendingUserMessage
                                                ? t.notificationsView.directMessageCard.sending
                                                : t.notificationsView.directMessageCard.sendButton}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                    {notifications.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-white/25 bg-rain-900/50 backdrop-blur-2xl rounded-2xl shadow-none">
                            <div className="p-4 rounded-2xl bg-white/10 border border-white/20 shadow-glass-sm mb-4">
                                <BellOff size={48} className="text-white/80 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">
                                {t.notificationsView.noNotifications}
                            </h3>
                            <p className="text-white/80 max-w-md text-sm leading-relaxed font-medium">
                                {t.notificationsView.noNotificationsDesc}
                            </p>
                        </div>
                    ) : (
                        <div
                            key={validCurrentPage}
                            className={`space-y-4 ${
                                animationDirection === 'right' ? 'animate-slide-right' : 'animate-slide-left'
                            }`}
                        >
                            {paginatedNotifications.map((item) => (
                                <div
                                    key={item.id}
                                    className={`group relative rounded-2xl border transition-all duration-300 p-5 backdrop-blur-2xl shadow-none overflow-hidden ${
                                        !item.isRead
                                            ? 'bg-rain-950/70 border-white/25 shadow-[0_0_25px_-5px_rgba(var(--accent-rgb),0.25)]'
                                            : 'bg-rain-950/40 border-white/15 hover:border-white/30 opacity-90 hover:opacity-100'
                                    }`}
                                >
                                    {/* Left vertical status ribbon */}
                                    <div
                                        className={`absolute top-0 bottom-0 left-0 w-1.5 transition-all duration-300 z-10 ${
                                            !item.isRead
                                                ? 'bg-fiery shadow-[0_0_16px_rgba(var(--accent-rgb),0.8)]'
                                                : 'bg-transparent'
                                        }`}
                                    />

                                    {/* Card Header */}
                                    <div className="flex items-start justify-between gap-4 mb-3 pl-2">
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                avatarUrl={item.senderAvatarUrl || 'anonymous'}
                                                name={item.senderName || t.common.user}
                                                size="sm"
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-white leading-none">
                                                    {item.senderName || t.common.user}
                                                </p>
                                                <p className="text-[11px] text-rain-300 mt-1">
                                                    {new Date(item.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {getTypeBadge(item.type)}

                                            {!item.isRead && (
                                                <button
                                                    onClick={() => markAsRead(item.id)}
                                                    className="p-1.5 text-rain-300 hover:text-emerald-400 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                                                    title={t.notificationsView.actions.markAsRead}
                                                >
                                                    <Check size={16} />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => deleteNotification(item.id)}
                                                className="p-1.5 text-rain-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-white/10 hover:border-rose-400/25 transition-all cursor-pointer"
                                                title={t.notificationsView.actions.delete}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Title & Message Body */}
                                    <div className="pl-2 sm:pl-12">
                                        <h4 className="text-sm font-bold text-white tracking-tight drop-shadow-sm">
                                            {getNotificationTitle(item)}
                                        </h4>
                                        <p className="text-sm text-white/85 mt-1 leading-relaxed whitespace-pre-line font-normal">
                                            {getNotificationMessage(item)}
                                        </p>

                                        {/* Action Buttons */}
                                        <div className="mt-4 flex flex-wrap items-center gap-3">
                                            {item.projectId && item.taskItemId && (
                                                <button
                                                    onClick={() => handleOpenTask(item)}
                                                    className="btn-fiery inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold cursor-pointer"
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
                                                    className="glass-btn-ghost inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold cursor-pointer hover:border-fiery/40 hover:text-fiery-light transition-all"
                                                >
                                                    <CornerDownLeft size={13} />
                                                    <span>{t.notificationsView.actions.reply}</span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Inline Admin Reply Form with Smooth Slide Expansion */}
                                        {isAdmin && item.type === NotificationType.DirectMessage && item.senderId && (
                                            <div
                                                className={`grid transition-all duration-300 ease-out overflow-hidden ${
                                                    replyingNotificationId === item.id
                                                        ? 'grid-rows-[1fr] opacity-100 mt-4'
                                                        : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
                                                }`}
                                            >
                                                <div className="min-h-0 overflow-hidden">
                                                    <div className="p-4 bg-rain-950/80 border border-white/15 rounded-2xl backdrop-blur-md space-y-3">
                                                        <p className="text-xs font-bold uppercase tracking-wider text-rain-200">
                                                            {t.notificationsView.directMessageCard.replyTitle}
                                                        </p>
                                                        <textarea
                                                            value={replyingNotificationId === item.id ? replyText : ''}
                                                            onChange={(e) => setReplyText(e.target.value)}
                                                            placeholder={t.notificationsView.directMessageCard.replyPlaceholder}
                                                            rows={3}
                                                            className="input-glass text-sm resize-none"
                                                        />
                                                        <div className="flex justify-end gap-2.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setReplyingNotificationId(null);
                                                                    setReplyText('');
                                                                }}
                                                                className="glass-btn-ghost text-xs px-4 py-2 cursor-pointer"
                                                            >
                                                                <span>{t.common.cancel}</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSendReply(item)}
                                                                disabled={isSubmittingReply || !replyText.trim()}
                                                                className="btn-fiery inline-flex items-center gap-1.5 text-xs px-4 py-2 cursor-pointer disabled:opacity-50"
                                                            >
                                                                <Send size={12} />
                                                                <span>
                                                                    {isSubmittingReply
                                                                        ? t.notificationsView.directMessageCard.replying
                                                                        : t.notificationsView.directMessageCard.replyButton}
                                                                </span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination Bar pinned at the bottom */}
            {notifications.length > 0 && (
                <div className="pt-4 shrink-0 pb-0">
                    <Pagination
                        currentPage={validCurrentPage}
                        totalPages={totalPages}
                        totalItems={notifications.length}
                        itemsPerPage={NOTIFICATIONS_PER_PAGE}
                        onPageChange={handlePageChange}
                        className="border border-white/15 bg-rain-950/60 backdrop-blur-2xl rounded-2xl shadow-none"
                    />
                </div>
            )}
        </div>
    );
}
