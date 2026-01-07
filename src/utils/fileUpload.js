import { apiClient } from '@/service/apiService';
import axios from 'axios';

export const uploadFile = async (formData) => {
    try {
        const response = await apiClient.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

export const deleteFile = async (fileId) => {
    try {
        const _file = { _method: 'DELETE' };
        await apiClient.post(`/upload/${fileId}`, _file);
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};
