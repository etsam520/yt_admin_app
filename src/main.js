import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons';

import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import '@/assets/styles.scss';
import { usePermissionStore } from './stores/permissionStore';
// import '@/utils/echo';

library.add(faUser, faLock);
const pinia = createPinia();
const app = createApp(App);

app.component('font-awesome-icon', FontAwesomeIcon);
// Initialize auth store early if needed
app.use(pinia);
app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);

// Now that Pinia is set up, we can use the store
const permissionStore = usePermissionStore();

// Initialize permissions from localStorage first (for immediate UI updates)
permissionStore.initializeFromStorage();

// Then fetch fresh permissions from server and update
const initializeApp = async () => {
    const token = localStorage.getItem('auth_token');
    
    if (token) {
        // Only fetch permissions if user is logged in
        try {
            await permissionStore.fetchPermissions();
        } catch (error) {
            console.error('Failed to fetch permissions on app init:', error);
            // If permission fetch fails, clear stored data
            permissionStore.clearPermissions();
        }
    }
    
    // Mount the app
    app.mount('#app');
};

initializeApp();
// app.mount('#app');
