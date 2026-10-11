import { axiosClient } from './axiosClient';
import type { CommentResponse, CreateCommentRequest } from '../types/api';

export const commentService = {
    getByTask: async (taskId: string): Promise<CommentResponse[]> => {
        const response = await axiosClient.get(`/comments/task/${taskId}`);
        return response.data.items || response.data;
    },
    create: async (request: CreateCommentRequest): Promise<CommentResponse> => {
        const response = await axiosClient.post('/comments', request);
        return response.data;
    }
};
