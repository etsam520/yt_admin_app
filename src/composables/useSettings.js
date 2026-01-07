import { ref, reactive } from 'vue';
import { apiClient } from '@/service/apiService.js';

export function useSettings() {
    const loading = ref(false);
    const error = ref('');
    const settings = reactive({
        questions: {
            // defaultDifficulty: 'medium',
            // questionsPerPage: 20,
            // autoSave: true,
            // showHints: false
        },
        languages: {
            defaultLanguage: 'en',
            enabledLanguages: ['en'],
            rtlSupport: false,
            dateFormat: 'MM/DD/YYYY'
        },
        general: {
            theme: 'light',
            timezone: 'UTC',
            notifications: true
        }
    });

    // Get settings for a specific category
    const getSettings = async (category) => {
        loading.value = true;
        error.value = '';
        
        try {
            const response = await apiClient.get(`admin/dashboard-settings/${category}`);
            
            if (response.data.data?.[category]) {
                // Update the settings object with the fetched data
                Object.assign(settings[category], response.data.data[category] || {});
                return response.data.data;
            }
            
            // If no data, use default values
            console.warn(`No data returned for ${category} settings, using defaults`);
            return settings[category];
        } catch (err) {
            console.error(`Error loading ${category} settings:`, err);
            
            // If it's a 404 or 500, just use default values (API endpoint might not exist yet)
            if (err.response?.status === 404 || err.response?.status === 500) {
                console.warn(`Settings API not available for ${category}, using default values`);
                return settings[category];
            }
            
            error.value = err.response?.data?.message || `Failed to load ${category} settings`;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Update a specific setting
    const updateSetting = async (category, key, value) => {
        try {
            const payload = {
                key: `${category}.${key}`,
                value: value
            };
            
            const response = await apiClient.post('admin/dashboard-settings', payload);
            
            if (response.data) {
                // Update local settings
                settings[category][key] = value;
                return true;
            }
            
            throw new Error('Failed to update setting');
        } catch (err) {
            console.error(`Error updating ${category}.${key}:`, err);
            
            // For demo purposes, if API doesn't exist, just update locally
            if (err.response?.status === 404 || err.response?.status === 500) {
                console.warn(`Settings API not available, updating locally only`);
                settings[category][key] = value;
                return true;
            }
            
            error.value = err.response?.data?.message || 'Failed to save setting';
            throw err;
        }
    };

    // Update multiple settings at once
    const updateSettings = async (category, settingsObject) => {
        try {
            const response = await apiClient.put(`admin/dashboard-settings/${category}`, settingsObject);
            
            if (response.data && response.data.success) {
                // Update local settings
                Object.assign(settings[category], settingsObject);
                return true;
            }
            
            throw new Error('Failed to update settings');
        } catch (err) {
            console.error(`Error updating ${category} settings:`, err);
            error.value = err.response?.data?.message || 'Failed to save settings';
            throw err;
        }
    };

    // Get all settings
    const getAllSettings = async () => {
        loading.value = true;
        error.value = '';
        
        try {
            const response = await apiClient.get('admin/dashboard-settings');
            
            if (response.data) {
                // Update all settings from the API response
                Object.keys(settings).forEach(category => {
                    if (response.data[category]) {
                        Object.assign(settings[category], response.data[category]);
                    }
                });
                return settings;
            }
            
            return settings;
        } catch (err) {
            console.error('Error loading all settings:', err);
            
            // If API not available, use defaults
            if (err.response?.status === 404 || err.response?.status === 500) {
                console.warn('Settings API not available, using default values');
                return settings;
            }
            
            error.value = 'Failed to load settings';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Reset settings to default
    const resetSettings = async (category) => {
        try {
            const response = await apiClient.delete(`admin/dashboard-settings/${category}`);
            
            if (response.data && response.data.success) {
                // Reset local settings to default
                await getSettings(category);
                return true;
            }
            
            throw new Error('Failed to reset settings');
        } catch (err) {
            console.error(`Error resetting ${category} settings:`, err);
            error.value = err.response?.data?.message || 'Failed to reset settings';
            throw err;
        }
    };

    return {
        settings,
        loading,
        error,
        getSettings,
        updateSetting,
        updateSettings,
        getAllSettings,
        resetSettings
    };
}