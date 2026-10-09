import { axiosClient } from './axiosClient';
import { type UserResponse, type CreateUserRequest, type UpdateUserRequest } from '../types/api';

export const userService = {
    getAll: async (): Promise<UserResponse[]> => {
        const response = await axiosClient.get('/users');
        return response.data;
    },
    create: async (data: CreateUserRequest): Promise<UserResponse> => {
        const response = await axiosClient.post('/users', data);
        return response.data;
    },
    update: async (id: string, data: UpdateUserRequest): Promise<void> => {
        await axiosClient.put(`/users/${id}`, data);
    },
    delete: async (id: string): Promise<void> => {
        await axiosClient.delete(`/users/${id}`);
    }
};
