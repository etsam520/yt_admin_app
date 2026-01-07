import { defineStore } from 'pinia';
import { apiClient } from '@/service/apiService';

export const usePermissionStore = defineStore('permissions', {
    state: () => ({
        permissions: {},
        role: null,
        loading: false,
        error: null
    }),

    getters: {
        isLoading: (state) => state.loading,
        hasError: (state) => !!state.error,
        isInitialized: (state) => Object.keys(state.permissions).length > 0 || state.role !== null
    },

    actions: {
        // Initialize permissions from localStorage if available
        initializeFromStorage() {
            try {
                const storedPermissions = localStorage.getItem('permissions');
                const storedRole = localStorage.getItem('role');
                
                if (storedPermissions) {
                    this.permissions = JSON.parse(storedPermissions);
                }
                if (storedRole) {
                    this.role = storedRole;
                }
                
                console.log('Initialized permissions from storage:', this.permissions);
                console.log('Initialized role from storage:', this.role);
            } catch (error) {
                console.error('Error initializing permissions from storage:', error);
                this.clearPermissions();
            }
        },

        async fetchPermissions() {
            this.loading = true;
            this.error = null;
            
            try {
                const response = await apiClient.get('/permissions');
                console.log('Full API response:', response.data);
                
                const permissions = response.data.data.permissions || {};
                const role = response.data.data.role || null;
                
                // Update state
                this.permissions = permissions;
                this.role = role;
                
                // Update localStorage
                localStorage.setItem('permissions', JSON.stringify(permissions));
                localStorage.setItem('role', role || '');
                
                console.log('Fetched and stored permissions:', this.permissions);
                console.log('Fetched and stored role:', this.role);
            } catch (error) {
                console.error('Failed to fetch permissions:', error);
                this.error = error;
                this.clearPermissions();
            } finally {
                this.loading = false;
            }
        },

        clearPermissions() {
            this.permissions = {};
            this.role = null;
            this.error = null;
            
            // Clear localStorage
            localStorage.removeItem('permissions');
            localStorage.removeItem('role');
            
            console.log('Cleared all permissions and role data');
        },

        has(resource, action) {
            // Check if user has specific permission for a resource
            // Usage: permissionStore.has('user', 'create')
            return this.permissions[resource] && this.permissions[resource].includes(action);
        },

        hasAny(resource, actions = []) {
            // Check if user has any of the specified permissions for a resource
            // Usage: permissionStore.hasAny('user', ['create', 'update'])
            if (!this.permissions[resource]) return false;
            return actions.some((action) => this.permissions[resource].includes(action));
        },

        canManage(resource) {
            // Check if user can manage a specific resource
            return this.has(resource, 'manage');
        },

        hasRole(role) {
            // Check if user has a specific role
            return this.role === role;
        }
    }
});

export const ROLES = {
    ADMIN: 'admin',
    TEACHER : 'teacher',
    EDITOR: 'editor',
    VIEWER: 'viewer',
};

export const RESOURCE = {
    USER: 'user',
    ORGANIZATION: 'organization',
    CATEGORY: 'category',
    QUESTION: 'question',
    QUESTION_SET: 'question_set',
    COURSE: 'course',
    COURSE_SECTION: 'course_section',
    COURSE_MATERIAL: 'course_material',
    FILE: 'file',
    TRADE_NODE: 'trade_node',
    QUESTION_BANK: 'question_bank',
    QUESTION_SET_META: 'question_set_meta',
    QUESTION_SET_QUESTION: 'question_set_question',
    QUESTION_SET_QUESTION_META: 'question_set_question_meta'
};
export const ACTIONS = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    MANAGE: 'manage'
};
