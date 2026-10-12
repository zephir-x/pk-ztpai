import { axiosClient } from './axiosClient';
import type { StressTestStatusResponse, StressTestResultResponse } from '../types/api';

export const stressTestService = {
    getStatus: async (): Promise<StressTestStatusResponse> => {
        const response = await axiosClient.get<StressTestStatusResponse>('/admin/stress-test/status');
        return response.data;
    },

    seed: async (): Promise<StressTestResultResponse> => {
        const response = await axiosClient.post<StressTestResultResponse>('/admin/stress-test/seed');
        return response.data;
    },

    cleanup: async (): Promise<StressTestResultResponse> => {
        const response = await axiosClient.post<StressTestResultResponse>('/admin/stress-test/cleanup');
        return response.data;
    }
};
