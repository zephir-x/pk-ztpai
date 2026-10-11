import { axiosClient } from './axiosClient';
import type { 
    NotificationResponse, 
    SendUserMessageRequest, 
    ReplyMessageRequest 
} from '../types/api';

// HTTP service client for notifications and administrative messaging
export const notificationService = {
    getAll: async (): Promise<NotificationResponse[]> => {
        const response = await axiosClient.get<NotificationResponse[]>('/notifications');
        return response.data;
    },
    
    getUnreadCount: async (): Promise<number> => {
        const response = await axiosClient.get<{ count: number }>('/notifications/unread-count');
        return response.data.count;
    },
    
    markAsRead: async (id: string): Promise<void> => {
        await axiosClient.patch(`/notifications/${id}/read`);
    },
    
    markAllAsRead: async (): Promise<void> => {
        await axiosClient.patch('/notifications/read-all');
    },
    
    delete: async (id: string): Promise<void> => {
        await axiosClient.delete(`/notifications/${id}`);
    },
    
    sendMessageToAdmin: async (request: SendUserMessageRequest): Promise<void> => {
        await axiosClient.post('/notifications/messages/send-to-admin', request);
    },
    
    replyToUser: async (request: ReplyMessageRequest): Promise<void> => {
        await axiosClient.post('/notifications/messages/reply', request);
    }
};
