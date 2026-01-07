<script>
export default {
    props: {
        user: {
            type: Object,
            required: true
        }
    }
};
</script>

<template>
    <Card class="welcome-section">
        <template #content>
            <div class="welcome-content">
                <div class="welcome-text">
                    <h2>Welcome back, {{ user.name }}!</h2>
                    <p class="subtitle">Here's what's happening with your platform today</p>
                    <p class="last-login">Last login: {{ user.lastLogin }}</p>
                </div>
                <div class="welcome-actions">
                    <Button label="Quick Stats Report" icon="pi pi-download" class="p-button-outlined" />
                    <Button label="View Notifications" icon="pi pi-bell" class="p-button-outlined" />
                </div>
            </div>
        </template>
    </Card>
</template>

<style scoped>
.welcome-section {
    margin-bottom: 1.5rem;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
    color: white;
}

.welcome-section ::v-deep(.p-card-body) {
    padding: 2rem;
}

.welcome-section ::v-deep(.p-card-content) {
    padding: 0;
}

.welcome-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.welcome-text h2 {
    margin: 0;
    font-size: 1.75rem;
}

.subtitle {
    margin: 0.5rem 0 0;
    opacity: 0.9;
}

.last-login {
    margin: 0.25rem 0 0;
    font-size: 0.875rem;
    opacity: 0.7;
}

.welcome-actions {
    display: flex;
    gap: 1rem;
}

@media (max-width: 768px) {
    .welcome-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 1.5rem;
    }
}
</style>
