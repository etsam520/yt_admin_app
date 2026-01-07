<script setup>
import AppMenu from './AppMenu.vue';
import SettingsDialog from '@/components/SettingsDialog.vue';
import { ref, onMounted } from 'vue';
import { getUser } from '@/stores/helpers.js';

const user = ref({
    name: '',
    role: 'User',
    avatar: null,
    initials: 'GU'
});

const showSettingsDialog = ref(false);

const openSettings = () => {
    showSettingsDialog.value = true;
};

onMounted(async () => {
    const userData = await getUser();
    if (userData) {
        user.value = {
            name: userData.name || '',
            role: userData.role || 'User',
            avatar: userData.avatar || null,
            initials: userData.name ? userData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'GU'
        };
    }
});
</script>

<template>
    <div class="layout-sidebar">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
            <div class="app-logo">
                <i class="pi pi-graduation-cap text-3xl text-primary"></i>
                <span class="app-name">YT Admin</span>
            </div>
            
            <!-- User Profile Section -->
            <div class="user-profile">
                <div class="user-avatar">
                    <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
                    <span v-else class="avatar-initials">{{ user.initials }}</span>
                </div>
                <div class="user-info">
                    <span class="user-name">{{ user.name }}</span>
                    <span class="user-role">{{ user.role }}</span>
                </div>
            </div>
        </div>

        <!-- Menu -->
        <div class="sidebar-menu">
            <app-menu></app-menu>
        </div>

        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
            <div class="footer-action" @click="openSettings">
                <i class="pi pi-cog"></i>
                <span>Settings</span>
            </div>
        </div>

        <!-- Settings Dialog -->
        <SettingsDialog v-model="showSettingsDialog" />
    </div>
</template>

<style lang="scss" scoped>
.sidebar-header {
    padding: 1.5rem 1rem;
    border-bottom: 1px solid var(--surface-border);
    margin-bottom: 1rem;

    .app-logo {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
        
        .app-name {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-color);
            background: linear-gradient(135deg, var(--primary-color), var(--primary-color-text));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
    }

    .user-profile {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: var(--surface-ground);
        border-radius: var(--border-radius);
        transition: background-color 0.3s ease;

        &:hover {
            background: var(--surface-hover);
        }

        .user-avatar {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 50%;
            overflow: hidden;
            background: var(--primary-color);
            display: flex;
            align-items: center;
            justify-content: center;

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .avatar-initials {
                color: white;
                font-weight: 600;
                font-size: 0.875rem;
            }
        }

        .user-info {
            display: flex;
            flex-direction: column;
            min-width: 0;
            flex: 1;

            .user-name {
                font-weight: 600;
                color: var(--text-color);
                font-size: 0.875rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .user-role {
                font-size: 0.75rem;
                color: var(--text-color-secondary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
    }
}

.sidebar-menu {
    flex: 1;
    overflow-y: auto;
    padding: 0 0.5rem;
}

.sidebar-footer {
    padding: 1rem;
    border-top: 1px solid var(--surface-border);
    margin-top: auto;

    .footer-action {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        color: var(--text-color-secondary);
        cursor: pointer;
        border-radius: var(--border-radius);
        transition: all 0.3s ease;
        font-size: 0.875rem;

        &:hover {
            background: var(--surface-hover);
            color: var(--primary-color);
        }

        i {
            font-size: 1rem;
        }
    }
}
</style>
