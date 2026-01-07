<template>
    <div class="settings-demo">
        <div class="demo-header">
            <h1>Settings Configuration Demo</h1>
            <p>This page demonstrates the settings dialog with API integration for:</p>
            <ul>
                <li>Question Preferences</li>
                <li>Language Settings</li>
                <li>General Configuration</li>
            </ul>
        </div>

        <div class="demo-content">
            <Card>
                <template #title>Settings Demo</template>
                <template #content>
                    <div class="demo-info">
                        <div class="info-item">
                            <i class="pi pi-info-circle"></i>
                            <div>
                                <h4>Bearer Token</h4>
                                <p class="token">89|avJ4j1jv0HzeUKVhjoWLEoaEa7YAJelSqi3k6zmf643bc69d</p>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <i class="pi pi-server"></i>
                            <div>
                                <h4>API Endpoints</h4>
                                <ul class="api-list">
                                    <li><code>GET /api/admin/dashboard-settings</code> - Get all settings</li>
                                    <li><code>POST /api/admin/dashboard-settings</code> - Set setting</li>
                                    <li><code>GET /api/admin/dashboard-settings/{key}</code> - Get specific setting</li>
                                    <li><code>DELETE /api/admin/dashboard-settings/{key}</code> - Delete setting</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <i class="pi pi-cog"></i>
                            <div>
                                <h4>Settings Categories</h4>
                                <ul class="category-list">
                                    <li><strong>Questions:</strong> Default difficulty, questions per page, auto-save, hints</li>
                                    <li><strong>Languages:</strong> Default language, enabled languages, RTL support, date format</li>
                                    <li><strong>General:</strong> Theme, timezone, notifications</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="demo-actions">
                        <Button 
                            label="Open Settings Dialog" 
                            icon="pi pi-cog"
                            @click="showSettings = true"
                            size="large"
                        />
                        
                        <Button 
                            label="Test API Connection" 
                            icon="pi pi-wifi"
                            severity="secondary"
                            @click="testConnection"
                            :loading="testing"
                        />
                    </div>
                </template>
            </Card>
        </div>

        <!-- Settings Dialog -->
        <SettingsDialog v-model="showSettings" />
        
        <!-- Toast for notifications -->
        <Toast />
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import SettingsDialog from '@/components/SettingsDialog.vue';

const showSettings = ref(false);
const testing = ref(false);
const toast = useToast();

const testConnection = async () => {
    testing.value = true;
    try {
        const response = await fetch('/api/admin/dashboard-settings', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer 89|avJ4j1jv0HzeUKVhjoWLEoaEa7YAJelSqi3k6zmf643bc69d',
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            toast.add({
                severity: 'success',
                summary: 'API Connection Successful',
                detail: `Connected to settings API. Status: ${response.status}`,
                life: 3000
            });
        } else {
            toast.add({
                severity: 'warn',
                summary: 'API Response',
                detail: `API responded with status: ${response.status}`,
                life: 4000
            });
        }
    } catch (err) {
        console.error('Connection test error:', err);
        toast.add({
            severity: 'info',
            summary: 'API Connection',
            detail: 'Settings API endpoint not available (expected for demo)',
            life: 3000
        });
    } finally {
        testing.value = false;
    }
};
</script>

<style lang="scss" scoped>
.settings-demo {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.demo-header {
    margin-bottom: 2rem;
    text-align: center;

    h1 {
        color: var(--text-color);
        margin-bottom: 1rem;
        font-size: 2.5rem;
        font-weight: 700;
    }

    p {
        color: var(--text-color-secondary);
        font-size: 1.125rem;
        margin-bottom: 1rem;
    }

    ul {
        display: inline-block;
        text-align: left;
        color: var(--text-color-secondary);
        
        li {
            margin: 0.5rem 0;
        }
    }
}

.demo-content {
    .demo-info {
        margin-bottom: 2rem;

        .info-item {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: var(--surface-50);
            border-radius: var(--border-radius);
            border-left: 4px solid var(--primary-color);

            i {
                font-size: 1.5rem;
                color: var(--primary-color);
                margin-top: 0.25rem;
            }

            h4 {
                margin: 0 0 0.5rem 0;
                color: var(--text-color);
                font-weight: 600;
            }

            p, ul {
                margin: 0;
                color: var(--text-color-secondary);
                font-size: 0.875rem;
                line-height: 1.5;
            }

            .token {
                font-family: 'Courier New', monospace;
                background: var(--surface-100);
                padding: 0.5rem;
                border-radius: 4px;
                word-break: break-all;
            }

            .api-list, .category-list {
                li {
                    margin: 0.5rem 0;

                    code {
                        background: var(--surface-100);
                        padding: 0.25rem 0.5rem;
                        border-radius: 4px;
                        font-family: 'Courier New', monospace;
                        color: var(--primary-color);
                    }

                    strong {
                        color: var(--text-color);
                    }
                }
            }
        }
    }

    .demo-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
    }
}
</style>