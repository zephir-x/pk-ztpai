import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as signalR from '@microsoft/signalr';
import { toast } from 'react-hot-toast';
import { notificationService } from '../api/notificationService';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { 
    NotificationType,
    type NotificationResponse, 
    type SendUserMessageRequest, 
    type ReplyMessageRequest 
} from '../types/api';

interface NotificationContextType {
    notifications: NotificationResponse[];
    unreadCount: number;
    isLoading: boolean;
    fetchNotifications: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    sendMessageToAdmin: (message: string) => Promise<void>;
    replyToUser: (recipientId: string, message: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { user, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Synchronizes the unread counter from the backend
    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (err) {
            console.error('Failed to retrieve unread notification count:', err);
        }
    }, [isAuthenticated]);

    // Synchronizes the full notification list from the backend
    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            setIsLoading(true);
            const data = await notificationService.getAll();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error('Failed to retrieve notifications:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    // Marks a single notification as read with optimistic state mutation
    const markAsRead = useCallback(async (id: string) => {
        const target = notifications.find(n => n.id === id);
        if (!target || target.isRead) return;

        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await notificationService.markAsRead(id);
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
            // Revert on failure
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
            setUnreadCount(prev => prev + 1);
        }
    }, [notifications]);

    // Marks all active user notifications as read
    const markAllAsRead = useCallback(async () => {
        const previous = [...notifications];
        const previousUnread = unreadCount;

        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        try {
            await notificationService.markAllAsRead();
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
            setNotifications(previous);
            setUnreadCount(previousUnread);
        }
    }, [notifications, unreadCount]);

    // Soft-deletes a notification
    const deleteNotification = useCallback(async (id: string) => {
        const target = notifications.find(n => n.id === id);
        if (!target) return;

        const previous = [...notifications];
        const previousUnread = unreadCount;

        setNotifications(prev => prev.filter(n => n.id !== id));
        if (!target.isRead) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        try {
            await notificationService.delete(id);
        } catch (err) {
            console.error('Failed to delete notification:', err);
            setNotifications(previous);
            setUnreadCount(previousUnread);
        }
    }, [notifications, unreadCount]);

    // Dispatches a message to administrators
    const sendMessageToAdmin = useCallback(async (message: string) => {
        const request: SendUserMessageRequest = { message };
        await notificationService.sendMessageToAdmin(request);
    }, []);

    // Dispatches an administrative reply to a user
    const replyToUser = useCallback(async (recipientId: string, message: string) => {
        const request: ReplyMessageRequest = { recipientId, message };
        await notificationService.replyToUser(request);
    }, []);

    // Initial data synchronization when user authentication state changes
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            fetchUnreadCount();
            fetchNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated, user?.id, fetchUnreadCount, fetchNotifications]);

    // Persistent WebSocket connection management for personal notifications via SignalR
    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;

        const hubUrl = import.meta.env.VITE_HUB_URL || '/kanbanHub';
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => localStorage.getItem('token') || ''
            })
            .withAutomaticReconnect()
            .build();

        let isMounted = true;

        connection.start()
            .then(() => {
                if (isMounted) {
                    connection.invoke('JoinUserGroup', user.id).catch(err => {
                        console.error('Failed to join personal user notification group:', err);
                    });
                }
            })
            .catch(err => {
                console.error('SignalR connection failed for notifications hub:', err);
            });

        // Handles incoming real-time notifications pushed by backend
        connection.on('ReceiveNotification', (newNotification: NotificationResponse) => {
            setNotifications(prev => [newNotification, ...prev.filter(n => n.id !== newNotification.id)]);
            setUnreadCount(prev => prev + 1);

            const taskTitle = newNotification.taskTitle || (newNotification.message.includes(': ') ? newNotification.message.split(': ').slice(1).join(': ') : newNotification.message);
            let displayTitle = newNotification.title;
            let displayMessage = newNotification.message;

            if (newNotification.type === NotificationType.Mention) {
                displayTitle = t.notificationsView.templates.mentionTitle;
                displayMessage = t.notificationsView.templates.mentionDesc(taskTitle);
            } else if (newNotification.type === NotificationType.TaskAssigned) {
                displayTitle = t.notificationsView.templates.assignedTitle;
                displayMessage = t.notificationsView.templates.assignedDesc(taskTitle);
            }

            // Displays real-time toast alert
            toast((toastInstance) => (
                <div 
                    onClick={() => toast.dismiss(toastInstance.id)}
                    className="flex flex-col cursor-pointer"
                >
                    <span className="font-semibold text-sm text-white">
                        {displayTitle}
                    </span>
                    <span className="text-xs text-gray-300 mt-1 line-clamp-2">
                        {displayMessage}
                    </span>
                </div>
            ), {
                duration: 5000,
                style: {
                    background: '#1f2937',
                    color: '#ffffff',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '12px 16px'
                }
            });
        });

        return () => {
            isMounted = false;
            if (connection.state === signalR.HubConnectionState.Connected) {
                connection.invoke('LeaveUserGroup', user.id)
                    .catch(() => {})
                    .finally(() => connection.stop());
            } else {
                connection.stop();
            }
        };
    }, [isAuthenticated, user?.id, t]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                isLoading,
                fetchNotifications,
                fetchUnreadCount,
                markAsRead,
                markAllAsRead,
                deleteNotification,
                sendMessageToAdmin,
                replyToUser
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
