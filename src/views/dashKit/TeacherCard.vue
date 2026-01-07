<script>
export default {
    props: {
        teacher: {
            type: Object,
            required: true
        }
    }
};
</script>

<template>
    <Card class="teacher-card">
        <template #header>
            <div class="teacher-avatar-container">
                <Avatar :image="teacher.avatar" shape="circle" size="xlarge" class="teacher-avatar" />
                <Rating :modelValue="teacher.rating" :readonly="true" :cancel="false" class="teacher-rating" />
            </div>
        </template>
        <template #title>{{ teacher.name }}</template>
        <template #subtitle>{{ teacher.subject }}</template>
        <template #content>
            <div class="teacher-stats">
                <div class="stat">
                    <i class="pi pi-users"></i>
                    <span>{{ teacher.students }} students</span>
                </div>
            </div>
        </template>
        <template #footer>
            <div class="teacher-actions">
                <Button label="View Profile" icon="pi pi-user" class="p-button-text p-button-sm" />
                <Button label="Message" icon="pi pi-envelope" class="p-button-text p-button-sm" />
            </div>
        </template>
    </Card>
</template>

<style scoped>
.teacher-card {
    margin: 0.5rem;
    text-align: center;
}

.teacher-avatar-container {
    position: relative;
    margin-bottom: 1rem;
}

.teacher-avatar {
    width: 100px;
    height: 100px;
    margin: 0 auto;
}

.teacher-rating {
    position: absolute;
    bottom: -0.75rem;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    padding: 0.25rem 0.5rem;
    border-radius: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.teacher-stats {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 1rem;
}

.stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.teacher-actions {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
}
</style>
