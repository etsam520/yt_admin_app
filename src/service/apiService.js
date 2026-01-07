import { getHostname } from '@/utils/helpers';
import axios from 'axios';

// const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || import.meta.env.VUE_APP_API_BASE_URL;
const API_BASE_URL = getHostname() + 'api/';
// const API_BASE_URL = "http://192.168.1.11/easyway_yt/api/";
// const API_BASE_URL = "https://yt.givnidigital.com/api/";

if (!API_BASE_URL) {
    console.warn('API_BASE_URL is not defined. Please check your .env files.');
} else {
    console.log('API_BASE_URL:', API_BASE_URL);
}

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-type': 'application/json',
        // Example: Add a default Authorization header if you have a token
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`
    }
    // withCredentials: false,
});

// Optional: Interceptors for global request/response handling (e.g., auth, error)
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.log('Unauthorized request. Redirecting to login or refreshing token.');
            // Example: Redirect to login page using Vue Router (if available)
            // router.push('/login');
        }
        return Promise.reject(error);
    }
);

export { apiClient, API_BASE_URL };
