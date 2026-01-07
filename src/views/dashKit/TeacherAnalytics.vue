<script>
import { ref } from 'vue';

export default {
    props: {
        teachers: {
            type: Array,
            required: true
        }
    },
    setup(props) {
        const performanceChartData = ref({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [
                {
                    label: 'Average Rating',
                    backgroundColor: '#6366F1',
                    data: [4.2, 4.3, 4.5, 4.4, 4.6, 4.7, 4.8]
                },
                {
                    label: 'Completion Rate %',
                    backgroundColor: '#10B981',
                    data: [78, 82, 85, 83, 87, 89, 91]
                }
            ]
        });

        const engagementMetrics = ref([
            { title: 'Active Teachers', value: '42', change: 5.2, icon: 'pi pi-user-edit', color: '#6366F1' },
            { title: 'Live Sessions', value: '18', change: 12.7, icon: 'pi pi-video', color: '#EC4899' },
            { title: 'Course Completion', value: '89%', change: 3.4, icon: 'pi pi-check-circle', color: '#10B981' },
            { title: 'Student Satisfaction', value: '4.7/5', change: 1.8, icon: 'pi pi-star', color: '#F59E0B' }
        ]);

        const topTeachers = ref([
            { rank: 1, name: 'Dr. Sarah Johnson', subject: 'Mathematics', rating: 4.9, completionRate: '98%' },
            { rank: 2, name: 'Prof. Michael Chen', subject: 'Physics', rating: 4.8, completionRate: '96%' },
            { rank: 3, name: 'Dr. Emily Wilson', subject: 'Chemistry', rating: 4.7, completionRate: '94%' },
            { rank: 4, name: 'Prof. David Kim', subject: 'Biology', rating: 4.6, completionRate: '92%' },
            { rank: 5, name: 'Dr. Lisa Rodriguez', subject: 'Computer Science', rating: 4.5, completionRate: '90%' }
        ]);

        const liveTeachers = ref([
            { id: 1, name: 'Dr. Sarah Johnson', subject: 'Calculus II', students: 45, duration: '1h 22m', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
            { id: 2, name: 'Prof. Michael Chen', subject: 'Quantum Physics', students: 32, duration: '45m', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
            { id: 3, name: 'Dr. Emily Wilson', subject: 'Organic Chemistry', students: 28, duration: '1h 05m', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' }
        ]);

        const liveTeachingData = ref({
            labels: ['Active Teachers', 'On Break', 'Available', 'Offline'],
            datasets: [
                {
                    data: [18, 5, 12, 15],
                    backgroundColor: ['#6366F1', '#F59E0B', '#10B981', '#6B7280']
                }
            ]
        });

        const progressChartData = ref({
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [
                {
                    label: 'New Content Added',
                    data: [12, 15, 18, 22],
                    fill: false,
                    borderColor: '#6366F1',
                    tension: 0.4
                },
                {
                    label: 'Student Engagement',
                    data: [65, 72, 78, 85],
                    fill: false,
                    borderColor: '#10B981',
                    tension: 0.4
                }
            ]
        });

        const distributionChartData = ref({
            labels: ['Mathematics', 'Science', 'Languages', 'Humanities', 'Arts'],
            datasets: [
                {
                    data: [28, 24, 18, 15, 15],
                    backgroundColor: ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6']
                }
            ]
        });

        const distributionStats = ref([
            { label: 'Mathematics', value: '28 teachers', percentage: 28, color: '#6366F1' },
            { label: 'Science', value: '24 teachers', percentage: 24, color: '#10B981' },
            { label: 'Languages', value: '18 teachers', percentage: 18, color: '#F59E0B' },
            { label: 'Humanities', value: '15 teachers', percentage: 15, color: '#EC4899' },
            { label: 'Arts', value: '15 teachers', percentage: 15, color: '#8B5CF6' }
        ]);

        const chartOptions = ref({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        });

        const getRankSeverity = (rank) => {
            switch (rank) {
                case 1:
                    return 'success';
                case 2:
                    return 'info';
                case 3:
                    return 'warning';
                default:
                    return null;
            }
        };

        return {
            performanceChartData,
            engagementMetrics,
            topTeachers,
            liveTeachers,
            liveTeachingData,
            progressChartData,
            distributionChartData,
            distributionStats,
            chartOptions,
            getRankSeverity
        };
    }
};
</script>

<template>
    <div class="teacher-analytics">
        <div class="grid">
            <!-- Teacher Performance Overview -->
            <Card class="performance-card">
                <template #title>Teacher Performance Overview</template>
                <template #content>
                    <Chart type="bar" :data="performanceChartData" :options="chartOptions" height="300px" />
                </template>
            </Card>

            <!-- Engagement Metrics -->
            <Card class="engagement-card">
                <template #title>Engagement Metrics</template>
                <template #content>
                    <div class="engagement-metrics">
                        <div class="metric" v-for="metric in engagementMetrics" :key="metric.title">
                            <div class="metric-icon" :style="{ backgroundColor: metric.color }">
                                <i :class="metric.icon"></i>
                            </div>
                            <div class="metric-info">
                                <span class="metric-title">{{ metric.title }}</span>
                                <span class="metric-value">{{ metric.value }}</span>
                                <span class="metric-change" :style="{ color: metric.change >= 0 ? '#10B981' : '#EF4444' }">
                                    <i :class="metric.change >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                                    {{ Math.abs(metric.change) }}%
                                </span>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Top Performing Teachers -->
            <Card class="top-teachers-card">
                <template #title>Top Performing Teachers</template>
                <template #content>
                    <DataTable :value="topTeachers" :paginator="true" :rows="5" responsiveLayout="scroll">
                        <Column field="rank" header="Rank">
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.rank" :severity="getRankSeverity(slotProps.data.rank)" />
                            </template>
                        </Column>
                        <Column field="name" header="Name"></Column>
                        <Column field="subject" header="Subject"></Column>
                        <Column field="rating" header="Rating">
                            <template #body="slotProps">
                                <Rating :modelValue="slotProps.data.rating" :readonly="true" :cancel="false" />
                            </template>
                        </Column>
                        <Column field="completionRate" header="Completion Rate"></Column>
                        <Column header="Actions">
                            <template #body>
                                <Button icon="pi pi-chart-line" class="p-button-rounded p-button-text" />
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>

            <!-- Live Teaching Activity -->
            <Card class="live-teaching-card">
                <template #title>Live Teaching Activity</template>
                <template #content>
                    <div class="live-teaching-container">
                        <div class="live-teachers">
                            <div v-for="teacher in liveTeachers" :key="teacher.id" class="live-teacher">
                                <Avatar :image="teacher.avatar" shape="circle" size="large" />
                                <div class="teacher-details">
                                    <span class="teacher-name">{{ teacher.name }}</span>
                                    <span class="teacher-subject">{{ teacher.subject }}</span>
                                </div>
                                <div class="teacher-stats">
                                    <span class="students-count"> <i class="pi pi-users"></i> {{ teacher.students }} </span>
                                    <span class="duration"> <i class="pi pi-clock"></i> {{ teacher.duration }} </span>
                                </div>
                                <Button icon="pi pi-eye" class="p-button-rounded p-button-text" />
                            </div>
                        </div>
                        <div class="live-chart">
                            <Chart type="doughnut" :data="liveTeachingData" :options="chartOptions" height="250px" />
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Teaching Progress Over Time -->
            <Card class="progress-card">
                <template #title>Teaching Progress Over Time</template>
                <template #content>
                    <Chart type="line" :data="progressChartData" :options="chartOptions" height="300px" />
                </template>
            </Card>

            <!-- Teacher Distribution -->
            <Card class="distribution-card">
                <template #title>Teacher Distribution</template>
                <template #content>
                    <div class="distribution-container">
                        <Chart type="pie" :data="distributionChartData" :options="chartOptions" height="250px" />
                        <div class="distribution-stats">
                            <div v-for="stat in distributionStats" :key="stat.label" class="distribution-stat">
                                <span class="stat-label">{{ stat.label }}</span>
                                <span class="stat-value">{{ stat.value }}</span>
                                <ProgressBar :value="stat.percentage" :showValue="false" :style="{ '--progress-color': stat.color }" />
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.teacher-analytics {
    padding: 0.5rem;
}

.grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 1.5rem;
}

.performance-card {
    grid-column: span 8;
}

.engagement-card {
    grid-column: span 4;
}

.top-teachers-card {
    grid-column: span 6;
}

.live-teaching-card {
    grid-column: span 6;
}

.progress-card {
    grid-column: span 7;
}

.distribution-card {
    grid-column: span 5;
}

.engagement-metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

.metric {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    background-color: var(--surface-ground);
}

.metric-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
}

.metric-info {
    display: flex;
    flex-direction: column;
}

.metric-title {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.metric-value {
    font-weight: 600;
    font-size: 1.25rem;
}

.metric-change {
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.live-teaching-container {
    display: flex;
    gap: 2rem;
}

.live-teachers {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.live-teacher {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: var(--surface-ground);
    border-radius: 8px;
}

.teacher-details {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.teacher-name {
    font-weight: 600;
}

.teacher-subject {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.teacher-stats {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
}

.students-count,
.duration {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.live-chart {
    width: 250px;
}

.distribution-container {
    display: flex;
    gap: 2rem;
}

.distribution-stats {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.distribution-stat {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.stat-label {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.stat-value {
    font-weight: 600;
}

::v-deep(.p-progressbar) {
    height: 6px;
    background-color: var(--surface-border);
}

::v-deep(.p-progressbar-value) {
    background-color: var(--progress-color);
}

@media (max-width: 1200px) {
    .performance-card,
    .engagement-card,
    .top-teachers-card,
    .live-teaching-card,
    .progress-card,
    .distribution-card {
        grid-column: span 12;
    }

    .live-teaching-container {
        flex-direction: column;
    }

    .live-chart {
        width: 100%;
    }

    .distribution-container {
        flex-direction: column;
    }
}

@media (max-width: 768px) {
    .engagement-metrics {
        grid-template-columns: 1fr;
    }
}
</style>
