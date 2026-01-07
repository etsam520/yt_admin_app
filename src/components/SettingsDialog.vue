<template>
    <Dialog 
        v-model:visible="visible" 
        modal 
        header="Configuration Settings" 
        :style="{ width: '50rem' }"
        :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
        @update:visible="onDialogClose"
    >
        <div class="settings-container">
            <!-- Settings Categories -->
            <div class="settings-sidebar">
                <div class="category-list">
                    <div 
                        v-for="category in categories" 
                        :key="category.key"
                        :class="['category-item', { active: activeCategory === category.key }]"
                        @click="selectCategory(category.key)"
                    >
                        <i :class="category.icon"></i>
                        <span>{{ category.label }}</span>
                    </div>
                </div>
            </div>

            <!-- Settings Content -->
            <div class="settings-content">
                <div v-if="loading" class="loading-state">
                    <ProgressSpinner />
                    <p>Loading settings...</p>
                </div>

                <div v-else-if="error" class="error-state">
                    <Message severity="error" :closable="false">
                        {{ error }}
                    </Message>
                </div>

                <div v-else class="settings-form">
                    <!-- Question Preferences -->
                    <div v-if="activeCategory === 'questions'" class="setting-section">
                        <h3>Question Preferences</h3>
                        <div class="form-grid">
                            <div class="form-field">
                                <label for="defaultDifficulty">Display Language Preference</label>
                                <Dropdown 
                                    id="defaultDifficulty"
                                    v-model="settings.questions.displayLanguagePreference"
                                    :options="displayLanguageOptions"
                                    option-label="label"
                                    option-value="value"
                                    placeholder="Select display language"
                                    @change="saveSetting('questions', 'displayLanguagePreference', $event.value)"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Language Settings -->
                    <div v-if="activeCategory === 'languages'" class="setting-section">
                        <h3>Language Settings</h3>
                        <div class="form-grid">
                            <div class="form-field">
                                <label for="defaultLanguage">Default Language</label>
                                <Dropdown 
                                    id="defaultLanguage"
                                    v-model="settings.languages.defaultLanguage"
                                    :options="languageOptions"
                                    option-label="label"
                                    option-value="value"
                                    placeholder="Select default language"
                                    @change="saveSetting('languages', 'defaultLanguage', $event.value)"
                                />
                            </div>
                            
                            <div class="form-field" v-if="false">
                                <label for="dateFormat">Date Format</label>
                                <Dropdown 
                                    id="dateFormat"
                                    v-model="settings.languages.dateFormat"
                                    :options="dateFormatOptions"
                                    option-label="label"
                                    option-value="value"
                                    placeholder="Select date format"
                                    @change="saveSetting('languages', 'dateFormat', $event.value)"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- General Settings -->
                    <div v-if="activeCategory === 'general' && false" class="setting-section">
                        <h3>General Settings</h3>
                        <div class="form-grid">
                            <div class="form-field">
                                <label for="theme">Theme</label>
                                <Dropdown 
                                    id="theme"
                                    v-model="settings.general.theme"
                                    :options="themeOptions"
                                    option-label="label"
                                    option-value="value"
                                    placeholder="Select theme"
                                    @change="saveSetting('general', 'theme', $event.value)"
                                />
                            </div>
                            <div class="form-field">
                                <label for="timezone">Timezone</label>
                                <Dropdown 
                                    id="timezone"
                                    v-model="settings.general.timezone"
                                    :options="timezoneOptions"
                                    option-label="label"
                                    option-value="value"
                                    placeholder="Select timezone"
                                    filter
                                    @change="saveSetting('general', 'timezone', $event.value)"
                                />
                            </div>
                            <div class="form-field">
                                <label for="notifications">Push Notifications</label>
                                <ToggleButton 
                                    id="notifications"
                                    v-model="settings.general.notifications"
                                    on-label="Enabled"
                                    off-label="Disabled"
                                    @change="saveSetting('general', 'notifications', $event.value)"
                                />
                            </div>
                        </div>
                        
                        <!-- Demo/Debug Section -->
                        <div class="debug-section">
                            <h4>Debug Information</h4>
                            <div class="debug-info">
                                <p><strong>API Token:</strong> 89|avJ4j1jv0HzeUKVhjoWLEoaEa7YAJelSqi3k6zmf643bc69d</p>
                                <p><strong>Current Category:</strong> {{ activeCategory }}</p>
                                <p><strong>Loading:</strong> {{ loading ? 'Yes' : 'No' }}</p>
                                <p><strong>Error:</strong> {{ error || 'None' }}</p>
                            </div>
                            <div class="debug-actions">
                                <Button 
                                    label="Test API Connection" 
                                    icon="pi pi-wifi"
                                    @click="testApiConnection" 
                                    :loading="testingApi"
                                    size="small"
                                />
                                <Button 
                                    label="Reset Category" 
                                    icon="pi pi-refresh"
                                    severity="secondary"
                                    @click="resetCategory" 
                                    size="small"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Toast for notifications -->
        <Toast />
    </Dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useSettings } from '@/composables/useSettings.js';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue']);

const visible = ref(props.modelValue);
const activeCategory = ref('questions');
const toast = useToast();
const testingApi = ref(false);

// Use the settings composable
const { settings, loading, error, getSettings, updateSetting, resetSettings } = useSettings();

// Category definitions
const categories = [
    { key: 'questions', label: 'Question Preferences', icon: 'pi pi-question-circle' },
    { key: 'languages', label: 'Languages', icon: 'pi pi-globe' },
    { key: 'general', label: 'General', icon: 'pi pi-cog' }
];

// Options for dropdowns
const displayLanguageOptions = [
    { label: 'English', value: 'en' },
    {label : 'Hindi', value : 'hi'}
];

const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Spanish', value: 'es' },
    { label: 'French', value: 'fr' },
    { label: 'German', value: 'de' },
    { label: 'Arabic', value: 'ar' },
    { label: 'Chinese', value: 'zh' },
    { label: 'Japanese', value: 'ja' }
];

const dateFormatOptions = [
    { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
    { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
    { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
];

const themeOptions = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'Auto', value: 'auto' }
];

const timezoneOptions = [
    { label: 'UTC', value: 'UTC' },
    { label: 'America/New_York', value: 'America/New_York' },
    { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
    { label: 'Europe/London', value: 'Europe/London' },
    { label: 'Europe/Paris', value: 'Europe/Paris' },
    { label: 'Asia/Tokyo', value: 'Asia/Tokyo' },
    { label: 'Asia/Dubai', value: 'Asia/Dubai' }
];

// Watch for prop changes
watch(() => props.modelValue, (newValue) => {
    visible.value = newValue;
    if (newValue) {
        loadSettings();
    }
});

watch(settings, (newSettings) => {
    console.log('Settings updated:', newSettings);
}, { deep: true });

// Methods
const selectCategory = (categoryKey) => {
    activeCategory.value = categoryKey;
    loadSettings();
};

const onDialogClose = (newValue) => {
    emit('update:modelValue', newValue);
};

const loadSettings = async () => {
    if (!visible.value) return;
    
    try {
         await getSettings(activeCategory.value);
    } catch (err) {
        console.error('Error loading settings:', err);
        
        // Show a warning toast instead of blocking the UI
        toast.add({
            severity: 'warn',
            summary: 'Settings Load Warning',
            detail: 'Using default settings. API may not be available.',
            life: 4000
        });
    }
};

const saveSetting = async (category, key, value) => {
    try {
        await updateSetting(category, key, value);
        
        // Show success toast
        toast.add({
            severity: 'success',
            summary: 'Settings Saved',
            detail: `${key} has been updated successfully`,
            life: 3000
        });
        
        console.log(`Setting ${category}.${key} saved successfully`);
    } catch (err) {
        console.error('Error saving setting:', err);
        
        // Show error toast
        toast.add({
            severity: 'error',
            summary: 'Save Failed',
            detail: err.response?.data?.message || 'Failed to save setting',
            life: 5000
        });
        
        // Reload settings to revert changes
        loadSettings();
    }
};

// Load initial settings when component mounts
onMounted(() => {
    if (visible.value) {
        loadSettings();
    }
});

// Test API connection
const testApiConnection = async () => {
    testingApi.value = true;
    try {
        // Test the getAllSettings endpoint
        const response = await fetch('/api/admin/dashboard-settings', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer 89|avJ4j1jv0HzeUKVhjoWLEoaEa7YAJelSqi3k6zmf643bc69d',
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            toast.add({
                severity: 'success',
                summary: 'API Connection Test',
                detail: `API is working! Status: ${response.status}`,
                life: 3000
            });
            console.log('API Test Result:', data);
        } else {
            toast.add({
                severity: 'warn',
                summary: 'API Connection Test',
                detail: `API responded with status: ${response.status}`,
                life: 4000
            });
        }
    } catch (err) {
        console.error('API Test Error:', err);
        toast.add({
            severity: 'info',
            summary: 'API Connection Test',
            detail: 'API endpoint not available (expected for demo)',
            life: 3000
        });
    } finally {
        testingApi.value = false;
    }
};

// Reset current category
const resetCategory = async () => {
    try {
        await resetSettings(activeCategory.value);
        toast.add({
            severity: 'success',
            summary: 'Settings Reset',
            detail: `${activeCategory.value} settings have been reset to defaults`,
            life: 3000
        });
        loadSettings();
    } catch (err) {
        console.error('Error resetting settings:', err);
        toast.add({
            severity: 'error',
            summary: 'Reset Failed',
            detail: 'Failed to reset settings',
            life: 4000
        });
    }
};
</script>

<style lang="scss" scoped>
.settings-container {
    display: flex;
    min-height: 500px;
    gap: 1.5rem;
}

.settings-sidebar {
    width: 200px;
    flex-shrink: 0;

    .category-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        .category-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            border-radius: var(--border-radius);
            cursor: pointer;
            transition: all 0.2s;
            color: var(--text-color-secondary);
            font-size: 0.875rem;

            &:hover {
                background: var(--surface-hover);
                color: var(--text-color);
            }

            &.active {
                background: var(--primary-color);
                color: white;
            }

            i {
                font-size: 1rem;
            }
        }
    }
}

.settings-content {
    flex: 1;
    min-height: 400px;
}

.loading-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    gap: 1rem;

    p {
        color: var(--text-color-secondary);
        margin: 0;
    }
}

.settings-form {
    .setting-section {
        h3 {
            color: var(--text-color);
            margin-bottom: 1.5rem;
            font-size: 1.25rem;
            font-weight: 600;
        }

        .form-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem;

            @media (min-width: 768px) {
                grid-template-columns: repeat(2, 1fr);
            }

            .form-field {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;

                label {
                    font-weight: 500;
                    color: var(--text-color);
                    font-size: 0.875rem;
                }

                .p-inputnumber,
                .p-dropdown,
                .p-multiselect,
                .p-togglebutton {
                    width: 100%;
                }
            }
        }
    }
}

.debug-section {
    margin-top: 2rem;
    padding: 1.5rem;
    background: var(--surface-50);
    border-radius: var(--border-radius);
    border-left: 4px solid var(--primary-color);

    h4 {
        color: var(--text-color);
        margin-bottom: 1rem;
        font-size: 1rem;
        font-weight: 600;
    }

    .debug-info {
        margin-bottom: 1rem;
        
        p {
            margin: 0.5rem 0;
            font-size: 0.875rem;
            color: var(--text-color-secondary);
            
            strong {
                color: var(--text-color);
            }
        }
    }

    .debug-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
    }
}

// Override PrimeVue dialog styles
:deep(.p-dialog) {
    .p-dialog-header {
        background: var(--surface-card);
        border-bottom: 1px solid var(--surface-border);
    }

    .p-dialog-content {
        padding: 1.5rem;
    }
}
</style>