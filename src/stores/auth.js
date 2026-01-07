import { defineStore } from 'pinia';
import axios from 'axios'; // For API calls
import { apiClient } from '@/service/apiService';
import { usePermissionStore } from './permissionStore';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('auth_token'),
        user: localStorage.getItem('user_name') // You might store user details here
    }),
    getters: {
        isAuthenticated: (state) => !!state.token // `!!` converts to boolean
        // You could also add: isLoggedIn: (state) => !!state.token && !!state.user
    },
    actions: {
        async logout() {
            try {
                apiClient.post('/logout'); // Optional: hit backend logout endpoint
            } catch (error) {
                console.warn('Logout API failed or not needed', error);
            }

            // Clear localStorage and state
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_name');
            localStorage.removeItem('user');
            this.token = null;
            this.user = null;

            // Clear permissions when logging out
            const permissionStore = usePermissionStore();
            permissionStore.clearPermissions();
        },
        // Action to initialize auth state from localStorage on app load
        initializeAuth() {
            if (localStorage.getItem('auth_token')) {
                this.token = localStorage.getItem('auth_token');
                this.user = localStorage.getItem('user_name'); // Load user details if stored
            } else {
                apiClient
                    .get('/user')
                    .then((response) => (this.user = response.data))
                    .catch(() => this.logout());
            }
        }
    }
});
