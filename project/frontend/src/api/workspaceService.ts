import { axiosClient } from './axiosClient';
import { type WorkspaceResponse, ThemeColor } from '../types/api';

export const workspaceService = {
    getAll: async (): Promise<WorkspaceResponse[]> => {
        const response = await axiosClient.get('/workspaces');
        return response.data.items || response.data;
    },
    create: async (name: string, themeColor: ThemeColor): Promise<WorkspaceResponse> => {
        const response = await axiosClient.post('/workspaces', { name, themeColor });
        return response.data;
    },
    update: async (id: string, name: string, themeColor: ThemeColor): Promise<void> => {
        await axiosClient.put(`/workspaces/${id}`, { name, themeColor });
    },
    delete: async (id: string): Promise<void> => {
        await axiosClient.delete(`/workspaces/${id}`);
    }
};
