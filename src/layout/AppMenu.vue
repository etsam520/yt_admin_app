<script setup>
import { ref, computed } from 'vue';
import InputText from 'primevue/inputtext';

import AppMenuItem from './AppMenuItem.vue';
import { ACTIONS, RESOURCE, ROLES, usePermissionStore } from '@/stores/permissionStore';

const permissions = usePermissionStore();

// Base menu structure - this will never change
const baseMenuModel = [
    {
        label: 'Main',
        items: [
            { 
                label: 'Dashboard', 
                icon: 'pi pi-fw pi-home', 
                to: '/dashboard',
                badge: 'New',
                badgeClass: 'p-badge-success'
            }
        ]
    },
    {
        label: 'Management',
        items: [
            { 
                label: 'Users', 
                icon: 'pi pi-fw pi-users', 
                to: '/users',
                tooltip: 'Manage system users',
                requiresPermission: { resource: RESOURCE.USER, action: ACTIONS.MANAGE }
            },
            { 
                label: 'Organizations', 
                icon: 'pi pi-fw pi-building', 
                to: '/orgaizations', 
                old: '/trade-groups',
                tooltip: 'Manage organizations',
                requiresPermission: { resource: RESOURCE.ORGANIZATION, action: ACTIONS.MANAGE }
            },
            { 
                label: 'Subjects', 
                icon: 'pi pi-fw pi-book', 
                to: '/categories',
                tooltip: 'View all subjects'
            }
        ]
    },
    {
        label: 'Content Creation',
        items: [
            {
                label: 'Subject Builder',
                icon: 'pi pi-fw pi-sitemap',
                tooltip: 'Build subject hierarchy',
                requiresPermission: { resource: RESOURCE.QUESTION, action: ACTIONS.CREATE },
                items: [
                    { 
                        label: 'Subjects', 
                        icon: 'pi pi-fw pi-book', 
                        to: '/build-subject',
                        tooltip: 'Create and manage subjects'
                    },
                    { 
                        label: 'Chapters', 
                        icon: 'pi pi-fw pi-list', 
                        to: '/build-chapter',
                        tooltip: 'Create and manage chapters'
                    },
                    { 
                        label: 'Topics', 
                        icon: 'pi pi-fw pi-tag', 
                        to: '/build-topic',
                        tooltip: 'Create and manage topics'
                    }
                ]
            },
            {
                label: 'Question Bank',
                icon: 'pi pi-fw pi-database',
                tooltip: 'Manage question repositories',
                items: [
                    { 
                        label: 'Previous Year Questions', 
                        icon: 'pi pi-fw pi-history', 
                        to: '/question-bank-pyq',
                        tooltip: 'PYQ management'
                    },
                    { 
                        label: 'New Practice Questions', 
                        icon: 'pi pi-fw pi-plus-circle', 
                        to: '/question-bank-npq',
                        tooltip: 'NPQ management'
                    },
                    { 
                        label: 'Current Affairs', 
                        icon: 'pi pi-fw pi-globe', 
                        to: '/question-bank-ca',
                        tooltip: 'Current affairs questions'
                    }
                ],
                requiresRole : ROLES.ADMIN
            },
            {
                label: 'QuestionBank (Teacher)',
                icon: 'pi pi-fw pi-user-edit',
                tooltip: 'Teacher-specific tools',
                to: '/teacher-question-bank-npq',
                requiresRole: ROLES.TEACHER
            },
            { 
                label: 'Question Sets', 
                icon: 'pi pi-fw pi-clipboard', 
                to: '/question-set',
                tooltip: 'Create and manage question sets'
            }
        ]
    },
    {
        label: 'Personal',
        items: [
            { 
                label: 'Profile', 
                icon: 'pi pi-fw pi-user', 
                to: '/profile',
                tooltip: 'Manage your profile'
            },
            { 
                label: 'Logout', 
                icon: 'pi pi-fw pi-sign-out', 
                to: '/logout',
                class: 'logout-item',
                tooltip: 'Sign out of your account'
            }
        ]
    }
];

// Reactive computed property that filters menu based on permissions
const model = computed(() => {
    const filterMenuItems = (items) => {
        return items.filter(item => {
            // Check permission requirements
            if (item.requiresPermission) {
                const { resource, action } = item.requiresPermission;
                if (!permissions.has(resource, action)) {
                    return false;
                }
            }

            // Check role requirements
            if (item.requiresRole) {
                if (!permissions.hasRole(item.requiresRole)) {
                    return false; 
                }
            }

            // If item has children, filter them recursively
            if (item.items) {
                const filteredChildren = filterMenuItems(item.items);
                // If no children remain after filtering, hide the parent too
                if (filteredChildren.length === 0) {
                    return false;
                }
                // Update the item with filtered children
                return { ...item, items: filteredChildren };
            }

            return true;
        }).map(item => {
            // Apply filtering to children if they exist
            if (item.items) {
                return { ...item, items: filterMenuItems(item.items) };
            }
            return item;
        });
    };

    return filterMenuItems(baseMenuModel);
});

const model2 = [
    {
        label: 'UI Components',
        items: [
            { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', to: '/uikit/formlayout' },
            { label: 'Input', icon: 'pi pi-fw pi-check-square', to: '/uikit/input' },
            { label: 'Button', icon: 'pi pi-fw pi-mobile', to: '/uikit/button', class: 'rotated-icon' },
            { label: 'Table', icon: 'pi pi-fw pi-table', to: '/uikit/table' },
            { label: 'List', icon: 'pi pi-fw pi-list', to: '/uikit/list' },
            { label: 'Tree', icon: 'pi pi-fw pi-share-alt', to: '/uikit/tree' },
            { label: 'Panel', icon: 'pi pi-fw pi-tablet', to: '/uikit/panel' },
            { label: 'Overlay', icon: 'pi pi-fw pi-clone', to: '/uikit/overlay' },
            { label: 'Media', icon: 'pi pi-fw pi-image', to: '/uikit/media' },
            { label: 'Menu', icon: 'pi pi-fw pi-bars', to: '/uikit/menu' },
            { label: 'Message', icon: 'pi pi-fw pi-comment', to: '/uikit/message' },
            { label: 'File', icon: 'pi pi-fw pi-file', to: '/uikit/file' },
            { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', to: '/uikit/charts' },
            { label: 'Timeline', icon: 'pi pi-fw pi-calendar', to: '/uikit/timeline' },
            { label: 'Misc', icon: 'pi pi-fw pi-circle', to: '/uikit/misc' }
        ]
    },
    {
        label: 'Pages',
        icon: 'pi pi-fw pi-briefcase',
        to: '/pages',
        items: [
            {
                label: 'Landing',
                icon: 'pi pi-fw pi-globe',
                to: '/landing'
            },
            {
                label: 'Auth',
                icon: 'pi pi-fw pi-user',
                items: [
                    {
                        label: 'Login',
                        icon: 'pi pi-fw pi-sign-in',
                        to: '/auth/login'
                    },
                    {
                        label: 'Error',
                        icon: 'pi pi-fw pi-times-circle',
                        to: '/auth/error'
                    },
                    {
                        label: 'Access Denied',
                        icon: 'pi pi-fw pi-lock',
                        to: '/auth/access'
                    }
                ]
            },
            {
                label: 'Crud',
                icon: 'pi pi-fw pi-pencil',
                to: '/pages/crud'
            },
            {
                label: 'Not Found',
                icon: 'pi pi-fw pi-exclamation-circle',
                to: '/pages/notfound'
            },
            {
                label: 'Empty',
                icon: 'pi pi-fw pi-circle-off',
                to: '/pages/empty'
            }
        ]
    },
    {
        label: 'Hierarchy',
        items: [
            {
                label: 'Submenu 1',
                icon: 'pi pi-fw pi-bookmark',
                items: [
                    {
                        label: 'Submenu 1.1',
                        icon: 'pi pi-fw pi-bookmark',
                        items: [
                            { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
                            { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
                            { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' }
                        ]
                    },
                    {
                        label: 'Submenu 1.2',
                        icon: 'pi pi-fw pi-bookmark',
                        items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }]
                    }
                ]
            },
            {
                label: 'Submenu 2',
                icon: 'pi pi-fw pi-bookmark',
                items: [
                    {
                        label: 'Submenu 2.1',
                        icon: 'pi pi-fw pi-bookmark',
                        items: [
                            { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
                            { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' }
                        ]
                    },
                    {
                        label: 'Submenu 2.2',
                        icon: 'pi pi-fw pi-bookmark',
                        items: [{ label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' }]
                    }
                ]
            }
        ]
    },
    {
        label: 'Get Started',
        items: [
            {
                label: 'Documentation',
                icon: 'pi pi-fw pi-book',
                to: '/documentation'
            },
            {
                label: 'View Source',
                icon: 'pi pi-fw pi-github',
                url: 'https://github.com/primefaces/sakai-vue',
                target: '_blank'
            }
        ]
    }
];
// model.value.push(...model2);

const searchTerm = ref('');

// Filter menu items based on search term
const filteredModel = computed(() => {
    if (!searchTerm.value) return model.value;
    
    const term = searchTerm.value.toLowerCase();
    
    const filterItems = (items) => {
        return items.filter(item => {
            // Check if item label matches
            const labelMatch = item.label.toLowerCase().includes(term);
            
            // Check if any child items match
            let childMatch = false;
            if (item.items) {
                const filteredChildren = filterItems(item.items);
                if (filteredChildren.length > 0) {
                    childMatch = true;
                    // Return item with filtered children
                    return { ...item, items: filteredChildren };
                }
            }
            
            return labelMatch || childMatch;
        }).map(item => {
            if (item.items) {
                return { ...item, items: filterItems(item.items) };
            }
            return item;
        });
    };
    
    return filterItems(model.value);
});
</script>

<template>
    <div class="menu-container">
        <!-- Quick Search -->
        <div class="menu-search">
            <div class="p-input-icon-left">
                <i class="pi pi-search"></i>
                <InputText 
                    v-model="searchTerm" 
                    placeholder="Search menu..." 
                    class="w-full menu-search-input"
                />
            </div>
        </div>

        <!-- Menu Items -->
        <ul class="layout-menu">
            <template v-for="(item, i) in filteredModel" :key="item">
                <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
                <li v-if="item.separator" class="menu-separator"></li>
            </template>
        </ul>

        <!-- No Results -->
        <div v-if="searchTerm && filteredModel.length === 0" class="no-results">
            <i class="pi pi-search text-4xl text-surface-400"></i>
            <p class="text-surface-500 mt-3">No menu items found</p>
            <small class="text-surface-400">Try a different search term</small>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.menu-container {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.menu-search {
    padding: 0.75rem 0.5rem 1.5rem 0.5rem;
    border-bottom: 1px solid var(--surface-border);
    margin-bottom: 1rem;

    .menu-search-input {
        font-size: 0.875rem;
        border-radius: var(--border-radius);
        background: var(--surface-ground);
        border: 1px solid var(--surface-border);
        
        &:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 2px var(--primary-color-alpha-20);
        }
    }

    .p-input-icon-left {
        i {
            color: var(--text-color-secondary);
        }
    }
}

.layout-menu {
    flex: 1;
    overflow-y: auto;
}

.no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    text-align: center;
    flex: 1;

    p {
        margin: 0;
        font-weight: 500;
    }

    small {
        margin-top: 0.5rem;
    }
}

// Custom styling for logout item
:deep(.logout-item) {
    color: var(--red-500) !important;
    
    &:hover {
        background: var(--red-50) !important;
        color: var(--red-600) !important;
    }
}

// Badge styling
:deep(.p-badge) {
    font-size: 0.6rem;
    min-width: 1.2rem;
    height: 1.2rem;
    line-height: 1.2rem;
    margin-left: auto;
}
</style>
