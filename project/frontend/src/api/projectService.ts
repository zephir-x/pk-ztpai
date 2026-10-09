import { axiosClient } from './axiosClient';
import { type ProjectResponse, ThemeColor } from '../types/api';

export const projectService = {
    getByWorkspace: async (workspaceId: string): Promise<ProjectResponse[]> => {
        const response = await axiosClient.get(`/projects/workspace/${workspaceId}`);
        return response.data.items || response.data;
    },
    create: async (name: string, description: string | null, themeColor: ThemeColor, workspaceId: string): Promise<ProjectResponse> => {
        const response = await axiosClient.post('/projects', { name, description, themeColor, workspaceId });
        return response.data;
    },
    update: async (id: string, name: string, description: string | null, themeColor: ThemeColor): Promise<void> => {
        await axiosClient.put(`/projects/${id}`, { name, description, themeColor });
    },
    delete: async (id: string): Promise<void> => {
        await axiosClient.delete(`/projects/${id}`);
    }
};
