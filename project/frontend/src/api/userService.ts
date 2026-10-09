import { axiosClient } from './axiosClient';
import type { UserResponse } from '../types/api';

export const userService = {
    getAll: async (): Promise<UserResponse[]> => {
        const response = await axiosClient.get('/users');
        return response.data.items || response.data;
    }
};
