import { apiClient } from '@/service/apiService.js';

export class SettingsService {
    // Get settings for a specific category
    static async getSettings(category) {
        try {
            const response = await apiClient.get(`admin/dashboard-settings/${category}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching ${category} settings:`, error);
            throw error;
        }
    }

    // Get all settings
    static async getAllSettings() {
        try {
            const response = await apiClient.get('admin/dashboard-settings');
            return response.data;
        } catch (error) {
            console.error('Error fetching all settings:', error);
            throw error;
        }
    }

    // Update a single setting - using POST as per API routes
    static async updateSetting(category, key, value) {
        try {
            const payload = {
                key: `${category}.${key}`,
                value: value
            };
            const response = await apiClient.post('admin/dashboard-settings', payload);
            return response.data;
        } catch (error) {
            console.error(`Error updating ${category}.${key}:`, error);
            throw error;
        }
    }

    // Update multiple settings at once
    static async updateSettings(category, settings) {
        try {
            const promises = Object.entries(settings).map(([key, value]) => 
                this.updateSetting(category, key, value)
            );
            const results = await Promise.all(promises);
            return results;
        } catch (error) {
            console.error(`Error updating ${category} settings:`, error);
            throw error;
        }
    }

    // Reset settings to default values
    static async resetSettings(category) {
        try {
            const response = await apiClient.delete(`admin/dashboard-settings/${category}`);
            return response.data;
        } catch (error) {
            console.error(`Error resetting ${category} settings:`, error);
            throw error;
        }
    }

    // Get all settings categories
    static async getAllSettings() {
        try {
            const categories = ['questions', 'languages', 'general'];
            const promises = categories.map(category => this.getSettings(category));
            const results = await Promise.allSettled(promises);
            
            const settings = {};
            results.forEach((result, index) => {
                const category = categories[index];
                if (result.status === 'fulfilled' && result.value?.success) {
                    settings[category] = result.value.data || {};
                } else {
                    settings[category] = {};
                    console.error(`Failed to load ${category} settings:`, result.reason);
                }
            });
            
            return settings;
        } catch (error) {
            console.error('Error loading all settings:', error);
            throw error;
        }
    }

    // Export settings as JSON
    static async exportSettings() {
        try {
            const response = await apiClient.get('admin/dashboard-settings/export');
            return response.data;
        } catch (error) {
            console.error('Error exporting settings:', error);
            throw error;
        }
    }

    // Import settings from JSON
    static async importSettings(settingsData) {
        try {
            const response = await apiClient.post('admin/dashboard-settings/import', settingsData);
            return response.data;
        } catch (error) {
            console.error('Error importing settings:', error);
            throw error;
        }
    }

    // Validate settings before saving
    static validateSettings(category, settings) {
        const validators = {
            questions: this.validateQuestionSettings,
            languages: this.validateLanguageSettings,
            general: this.validateGeneralSettings
        };

        const validator = validators[category];
        if (validator) {
            return validator(settings);
        }

        return { valid: true, errors: [] };
    }

    // Validate question settings
    static validateQuestionSettings(settings) {
        const errors = [];

        if (settings.questionsPerPage && (settings.questionsPerPage < 1 || settings.questionsPerPage > 100)) {
            errors.push('Questions per page must be between 1 and 100');
        }

        if (settings.defaultDifficulty && !['easy', 'medium', 'hard'].includes(settings.defaultDifficulty)) {
            errors.push('Invalid default difficulty level');
        }

        return { valid: errors.length === 0, errors };
    }

    // Validate language settings
    static validateLanguageSettings(settings) {
        const errors = [];
        const validLanguages = ['en', 'es', 'fr', 'de', 'ar', 'zh', 'ja'];

        if (settings.defaultLanguage && !validLanguages.includes(settings.defaultLanguage)) {
            errors.push('Invalid default language');
        }

        if (settings.enabledLanguages && settings.enabledLanguages.some(lang => !validLanguages.includes(lang))) {
            errors.push('One or more enabled languages are invalid');
        }

        if (settings.dateFormat && !['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].includes(settings.dateFormat)) {
            errors.push('Invalid date format');
        }

        return { valid: errors.length === 0, errors };
    }

    // Validate general settings
    static validateGeneralSettings(settings) {
        const errors = [];

        if (settings.theme && !['light', 'dark', 'auto'].includes(settings.theme)) {
            errors.push('Invalid theme selection');
        }

        return { valid: errors.length === 0, errors };
    }
}