import { axiosClient } from './axiosClient';
import { type WorkspaceResponse } from '../types/api';

export const workspaceService = {
    getAll: async (): Promise<WorkspaceResponse[]> => {
        const response = await axiosClient.get('/workspaces');
        return response.data.items || response.data;
    },
    create: async (name: string): Promise<WorkspaceResponse> => {
        const response = await axiosClient.post('/workspaces', { name });
        return response.data;
    },
    delete: async (id: string): Promise<void> => {
        await axiosClient.delete(`/workspaces/${id}`);
    }
};
