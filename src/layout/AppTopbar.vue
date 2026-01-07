<script setup>
import { useLayout } from '@/layout/composables/layout';
import AppConfigurator from './AppConfigurator.vue';

const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-start">
            <button class="layout-menu-button layout-topbar-action" @click="toggleMenu">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/" class="layout-topbar-logo">
                <div class="logo-content">
                    <i class="pi pi-graduation-cap logo-icon"></i>
                    <span class="logo-text">YT Admin</span>
                </div>
            </router-link>
        </div>

        <div class="layout-topbar-end">
            <div class="layout-topbar-actions">
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode" title="Toggle theme">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>
                
                <button type="button" class="layout-topbar-action" title="Notifications">
                    <i class="pi pi-bell"></i>
                    <span class="notification-badge">3</span>
                </button>

                <div class="relative">
                    <button
                        v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                        type="button"
                        class="layout-topbar-action"
                        title="Theme configurator"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <AppConfigurator />
                </div>

                <div class="topbar-divider"></div>

                <button
                    class="layout-topbar-menu-button layout-topbar-action"
                    v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                    title="User menu"
                >
                    <i class="pi pi-user"></i>
                </button>

                <div class="layout-topbar-menu hidden">
                    <div class="layout-topbar-menu-content">
                        <button type="button" class="layout-topbar-action" @click="$router.push('/profile')">
                            <i class="pi pi-user"></i>
                            <span>Profile</span>
                        </button>
                        <button type="button" class="layout-topbar-action">
                            <i class="pi pi-cog"></i>
                            <span>Settings</span>
                        </button>
                        <button type="button" class="layout-topbar-action" @click="$router.push('/logout')">
                            <i class="pi pi-sign-out"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.layout-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    background: var(--surface-card);
    border-bottom: 1px solid var(--surface-border);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    position: sticky;
    top: 0;
    z-index: 1000;
    backdrop-filter: blur(10px);
}

.layout-topbar-start {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.layout-menu-button {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--text-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.layout-menu-button:hover {
    background: var(--surface-hover);
    color: var(--primary-color);
}

.layout-topbar-logo {
    text-decoration: none;
}

.logo-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.logo-icon {
    font-size: 2rem;
    color: var(--primary-color);
}

.logo-text {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-color);
    background: linear-gradient(135deg, var(--primary-color), var(--primary-600));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.layout-topbar-end {
    display: flex;
    align-items: center;
}

.layout-topbar-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.layout-topbar-action {
    position: relative;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--text-color-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    font-size: 1.1rem;
}

.layout-topbar-action:hover {
    background: var(--surface-hover);
    color: var(--primary-color);
    transform: scale(1.05);
}

.notification-badge {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    background: var(--red-500);
    color: white;
    border-radius: 50%;
    width: 1rem;
    height: 1rem;
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
}

.topbar-divider {
    width: 1px;
    height: 1.5rem;
    background: var(--surface-border);
    margin: 0 0.5rem;
}

.layout-topbar-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    background: var(--surface-overlay);
    border: 1px solid var(--surface-border);
    border-radius: 0.75rem;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    min-width: 12rem;
    z-index: 1001;
}

.layout-topbar-menu-content {
    padding: 0.5rem;
}

.layout-topbar-menu .layout-topbar-action {
    width: 100%;
    height: 2.75rem;
    border-radius: 0.5rem;
    justify-content: flex-start;
    padding: 0 0.75rem;
    gap: 0.75rem;
    font-size: 0.875rem;
    text-align: left;
}

.layout-topbar-menu .layout-topbar-action span {
    font-weight: 500;
}

.layout-topbar-menu .layout-topbar-action:hover {
    background: var(--surface-hover);
}

/* Responsive Design */
@media (max-width: 768px) {
    .layout-topbar {
        padding: 0.75rem 1rem;
    }
    
    .logo-text {
        display: none;
    }
    
    .layout-topbar-actions {
        gap: 0.25rem;
    }
    
    .layout-topbar-action {
        width: 2.25rem;
        height: 2.25rem;
        font-size: 1rem;
    }
}

@media (max-width: 480px) {
    .layout-topbar {
        padding: 0.5rem 0.75rem;
    }
    
    .layout-topbar-action {
        width: 2rem;
        height: 2rem;
        font-size: 0.9rem;
    }
    
    .notification-badge {
        width: 0.875rem;
        height: 0.875rem;
        font-size: 0.6rem;
    }
}
</style>
