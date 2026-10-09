import { axiosClient } from './axiosClient';
import type {TaskItemResponse, CreateTaskRequest, UpdateTaskRequest, MyTaskResponse} from '../types/api';

export const taskService = {

    getMyTasks: async (): Promise<MyTaskResponse[]> => {
        const response = await axiosClient.get('/taskitems/my-tasks');
        return response.data.items || response.data;
    },

    getByProject: async (projectId: string): Promise<TaskItemResponse[]> => {
        const response = await axiosClient.get(`/taskitems/project/${projectId}`);
        return response.data.items || response.data;
    },

    create: async (request: CreateTaskRequest): Promise<TaskItemResponse> => {
        const response = await axiosClient.post('/taskitems', request);
        return response.data;
    },

    update: async (id: string, request: UpdateTaskRequest): Promise<TaskItemResponse> => {
        const response = await axiosClient.put(`/taskitems/${id}`, request);
        return response.data;
    },

    changeAssignee: async (id: string, assigneeId: string | null): Promise<void> => {
        await axiosClient.patch(`/taskitems/${id}/assignee`, { assigneeId });
    },

    delete: async (id: string): Promise<void> => {
        await axiosClient.delete(`/taskitems/${id}`);
    }
};
