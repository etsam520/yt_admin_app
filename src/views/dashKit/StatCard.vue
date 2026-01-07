<script>
import { computed } from 'vue';

export default {
    props: {
        title: String,
        value: [String, Number],
        icon: String,
        color: String,
        change: Number
    },
    setup(props) {
        const changeColor = computed(() => {
            return props.change >= 0 ? '#10B981' : '#EF4444';
        });

        const changeIcon = computed(() => {
            return props.change >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
        });

        return {
            changeColor,
            changeIcon
        };
    }
};
</script>

<template>
    <Card class="stat-card">
        <template #title>
            <div class="stat-title">
                <i :class="icon" :style="{ color: color }"></i>
                <span>{{ title }}</span>
            </div>
        </template>
        <template #content>
            <div class="stat-content">
                <div class="stat-value">{{ value }}</div>
                <div class="stat-change" :style="{ color: changeColor }">
                    <i :class="changeIcon"></i>
                    <span>{{ change }}% from last month</span>
                </div>
            </div>
        </template>
    </Card>
</template>

<style scoped>
.stat-card {
    height: 100%;
}

.stat-card ::v-deep(.p-card-title) {
    margin-bottom: 0.5rem;
}

.stat-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1rem;
}

.stat-title i {
    font-size: 1.25rem;
}

.stat-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.stat-value {
    font-size: 1.75rem;
    font-weight: 600;
    line-height: 1;
}

.stat-change {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
}

.stat-change i {
    font-size: 0.75rem;
}
</style>
