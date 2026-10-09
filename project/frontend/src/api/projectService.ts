import { axiosClient } from './axiosClient';
import { type ProjectResponse } from '../types/api';

export const projectService = {
    getByWorkspace: async (workspaceId: string): Promise<ProjectResponse[]> => {
        const response = await axiosClient.get(`/projects/workspace/${workspaceId}`);
        return response.data.items || response.data;
    },
    create: async (name: string, description: string | null, workspaceId: string): Promise<ProjectResponse> => {
        const response = await axiosClient.post('/projects', { name, description, workspaceId });
        return response.data;
    }
};
