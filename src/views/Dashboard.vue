<script setup>
import { onMounted, ref, computed } from 'vue';
import { getUser } from '@/stores/helpers.js';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Chart from 'primevue/chart';
import ProgressBar from 'primevue/progressbar';

const user = ref({
    name: 'Guest User',
    avatar: null,
    initials: 'GU',
    role: 'User',
    lastLogin: '2 hours ago'
});

const stats = ref({
    totalQuestions: 1247,
    totalTeachers: 28,
    activeExams: 12,
    totalStudents: 856,
    monthlyGrowth: 15.2,
    completedTests: 342,
    avgScore: 78.5,
    newRegistrations: 45
});

const recentActivities = ref([
    {
        id: 1,
        time: '5 mins ago',
        title: 'New Question Set Created',
        description: 'Mathematics - Calculus II',
        icon: 'pi pi-plus-circle',
        color: 'text-green-500',
        bgColor: 'bg-green-50'
    },
    {
        id: 2,
        time: '1 hour ago',
        title: 'Student Exam Completed',
        description: '15 students completed Physics mock test',
        icon: 'pi pi-check-circle',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50'
    },
    {
        id: 3,
        time: '3 hours ago',
        title: 'New Teacher Onboarded',
        description: 'Dr. Sarah Wilson joined Chemistry department',
        icon: 'pi pi-user-plus',
        color: 'text-purple-500',
        bgColor: 'bg-purple-50'
    },
    {
        id: 4,
        time: 'Yesterday',
        title: 'Weekly Report Generated',
        description: 'Performance analytics sent to administrators',
        icon: 'pi pi-chart-bar',
        color: 'text-orange-500',
        bgColor: 'bg-orange-50'
    }
]);

const quickActions = ref([
    { label: 'Create Question Set', icon: 'pi pi-plus', route: '/question-set', color: 'success' },
    { label: 'Manage Teachers', icon: 'pi pi-users', route: '/users', color: 'info' },
    { label: 'View Analytics', icon: 'pi pi-chart-line', route: '#', color: 'warning' },
    { label: 'System Settings', icon: 'pi pi-cog', route: '#', color: 'help' }
]);

const chartData = ref({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
        {
            label: 'Questions Created',
            data: [65, 59, 80, 81, 56, 89],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 2,
            tension: 0.4
        },
        {
            label: 'Tests Taken',
            data: [28, 48, 40, 59, 86, 67],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 2,
            tension: 0.4
        }
    ]
});

const chartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top'
        }
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
});

onMounted(() => {
    const userData = getUser();
    if (userData) {
        user.value = {
            name: userData.name || 'Guest User',
            avatar: userData.avatar || null,
            initials: userData.name ? userData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'GU',
            role: userData.role || 'User',
            lastLogin: '2 hours ago'
        };
    }
});

const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
};
</script>

<template>
    <div class="dashboard-container">
        <!-- Header Section -->
        <div class="dashboard-header">
            <div class="header-content">
                <div class="welcome-section">
                    <h1 class="dashboard-title">
                        Welcome back, <span class="user-name">{{ user.name }}</span>!
                    </h1>
                    <p class="dashboard-subtitle">Here's what's happening in your education platform today</p>
                </div>
                <div class="header-avatar">
                    <div class="user-avatar-large">
                        <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
                        <span v-else>{{ user.initials }}</span>
                    </div>
                    <div class="user-info">
                        <span class="user-role">{{ user.role }}</span>
                        <small class="last-login">Last login: {{ user.lastLogin }}</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
            <Card class="stat-card primary">
                <template #content>
                    <div class="stat-content">
                        <div class="stat-icon">
                            <i class="pi pi-question-circle"></i>
                        </div>
                        <div class="stat-details">
                            <h3 class="stat-number">{{ formatNumber(stats.totalQuestions) }}</h3>
                            <p class="stat-label">Total Questions</p>
                            <small class="stat-growth positive">+{{ stats.monthlyGrowth }}% this month</small>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="stat-card success">
                <template #content>
                    <div class="stat-content">
                        <div class="stat-icon">
                            <i class="pi pi-users"></i>
                        </div>
                        <div class="stat-details">
                            <h3 class="stat-number">{{ formatNumber(stats.totalTeachers) }}</h3>
                            <p class="stat-label">Active Teachers</p>
                            <small class="stat-growth positive">+3 new this week</small>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="stat-card warning">
                <template #content>
                    <div class="stat-content">
                        <div class="stat-icon">
                            <i class="pi pi-clipboard"></i>
                        </div>
                        <div class="stat-details">
                            <h3 class="stat-number">{{ formatNumber(stats.activeExams) }}</h3>
                            <p class="stat-label">Active Exams</p>
                            <small class="stat-growth neutral">5 ending soon</small>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="stat-card info">
                <template #content>
                    <div class="stat-content">
                        <div class="stat-icon">
                            <i class="pi pi-user-plus"></i>
                        </div>
                        <div class="stat-details">
                            <h3 class="stat-number">{{ formatNumber(stats.totalStudents) }}</h3>
                            <p class="stat-label">Total Students</p>
                            <small class="stat-growth positive">+{{ stats.newRegistrations }} new registrations</small>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Main Content Grid -->
        <div class="content-grid">
            <!-- Quick Actions -->
            <Card class="quick-actions-card">
                <template #title>
                    <div class="card-header">
                        <h2>Quick Actions</h2>
                        <i class="pi pi-bolt"></i>
                    </div>
                </template>
                <template #content>
                    <div class="quick-actions-grid">
                        <Button 
                            v-for="action in quickActions" 
                            :key="action.label"
                            :label="action.label"
                            :icon="action.icon"
                            :class="`p-button-outlined p-button-${action.color} quick-action-btn`"
                            @click="$router.push(action.route)"
                        />
                    </div>
                </template>
            </Card>

            <!-- Performance Chart -->
            <Card class="chart-card">
                <template #title>
                    <div class="card-header">
                        <h2>Platform Activity</h2>
                        <i class="pi pi-chart-line"></i>
                    </div>
                </template>
                <template #content>
                    <div class="chart-container">
                        <Chart type="line" :data="chartData" :options="chartOptions" />
                    </div>
                </template>
            </Card>

            <!-- Recent Activities -->
            <Card class="activities-card">
                <template #title>
                    <div class="card-header">
                        <h2>Recent Activities</h2>
                        <i class="pi pi-history"></i>
                    </div>
                </template>
                <template #content>
                    <div class="activities-list">
                        <div 
                            v-for="activity in recentActivities" 
                            :key="activity.id"
                            class="activity-item"
                        >
                            <div class="activity-icon" :class="activity.bgColor">
                                <i :class="[activity.icon, activity.color]"></i>
                            </div>
                            <div class="activity-content">
                                <h4 class="activity-title">{{ activity.title }}</h4>
                                <p class="activity-description">{{ activity.description }}</p>
                                <small class="activity-time">{{ activity.time }}</small>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Performance Metrics -->
            <Card class="metrics-card">
                <template #title>
                    <div class="card-header">
                        <h2>Performance Overview</h2>
                        <i class="pi pi-chart-pie"></i>
                    </div>
                </template>
                <template #content>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <div class="metric-label">Completed Tests</div>
                            <div class="metric-value">{{ formatNumber(stats.completedTests) }}</div>
                            <ProgressBar :value="75" class="metric-progress" />
                        </div>
                        <div class="metric-item">
                            <div class="metric-label">Average Score</div>
                            <div class="metric-value">{{ stats.avgScore }}%</div>
                            <ProgressBar :value="stats.avgScore" class="metric-progress" />
                        </div>
                        <div class="metric-item">
                            <div class="metric-label">Monthly Growth</div>
                            <div class="metric-value">+{{ stats.monthlyGrowth }}%</div>
                            <ProgressBar :value="stats.monthlyGrowth" class="metric-progress" />
                        </div>
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.dashboard-container {
    padding: 1.5rem;
    background: var(--surface-ground);
    min-height: 100vh;
}

/* Header Styles */
.dashboard-header {
    margin-bottom: 2rem;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-600) 100%);
    padding: 2rem;
    border-radius: 1rem;
    color: white;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.welcome-section {
    flex: 1;
}

.dashboard-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    line-height: 1.2;
}

.user-name {
    color: var(--primary-50);
}

.dashboard-subtitle {
    font-size: 1.1rem;
    opacity: 0.9;
    margin: 0;
    font-weight: 400;
}

.header-avatar {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.user-avatar-large {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 600;
    overflow: hidden;
    border: 3px solid rgba(255, 255, 255, 0.3);
}

.user-avatar-large img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.user-role {
    font-size: 1rem;
    font-weight: 600;
    opacity: 0.95;
}

.last-login {
    opacity: 0.8;
    font-size: 0.875rem;
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    border-radius: 1rem;
    overflow: hidden;
    transition: all 0.3s ease;
    border: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.stat-card.primary {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
    color: white;
}

.stat-card.success {
    background: linear-gradient(135deg, var(--green-500), var(--green-600));
    color: white;
}

.stat-card.warning {
    background: linear-gradient(135deg, var(--orange-500), var(--orange-600));
    color: white;
}

.stat-card.info {
    background: linear-gradient(135deg, var(--blue-500), var(--blue-600));
    color: white;
}

.stat-content {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0;
}

.stat-icon {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
}

.stat-details {
    flex: 1;
}

.stat-number {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
    line-height: 1;
}

.stat-label {
    font-size: 1rem;
    margin: 0 0 0.5rem 0;
    opacity: 0.9;
    font-weight: 500;
}

.stat-growth {
    font-size: 0.875rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.2);
    display: inline-block;
}

.stat-growth.positive {
    background: rgba(76, 175, 80, 0.2);
}

.stat-growth.neutral {
    background: rgba(255, 193, 7, 0.2);
}

/* Content Grid */
.content-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 1.5rem;
}

.quick-actions-card {
    grid-column: span 12;
}

.chart-card {
    grid-column: span 12;
}

.activities-card {
    grid-column: span 12;
}

.metrics-card {
    grid-column: span 12;
}

@media (min-width: 1024px) {
    .quick-actions-card {
        grid-column: span 6;
    }
    
    .chart-card {
        grid-column: span 6;
    }
    
    .activities-card {
        grid-column: span 8;
    }
    
    .metrics-card {
        grid-column: span 4;
    }
}

/* Card Styles */
:deep(.p-card) {
    border-radius: 1rem;
    border: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
}

:deep(.p-card:hover) {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
}

.card-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
}

.card-header i {
    color: var(--primary-color);
    font-size: 1.25rem;
}

/* Quick Actions */
.quick-actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.quick-action-btn {
    height: 3rem;
    border-radius: 0.75rem;
    font-weight: 500;
    transition: all 0.3s ease;
}

.quick-action-btn:hover {
    transform: translateY(-2px);
}

/* Chart */
.chart-container {
    height: 300px;
}

/* Activities */
.activities-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 400px;
    overflow-y: auto;
}

.activity-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: var(--surface-card);
    border-radius: 0.75rem;
    border-left: 4px solid var(--primary-color);
    transition: all 0.3s ease;
}

.activity-item:hover {
    background: var(--surface-hover);
    transform: translateX(4px);
}

.activity-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.activity-content {
    flex: 1;
    min-width: 0;
}

.activity-title {
    margin: 0 0 0.25rem 0;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text-color);
}

.activity-description {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    line-height: 1.4;
}

.activity-time {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    opacity: 0.8;
}

/* Metrics */
.metrics-grid {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.metric-item {
    padding: 1rem;
    background: var(--surface-card);
    border-radius: 0.75rem;
    border: 1px solid var(--surface-border);
}

.metric-label {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin-bottom: 0.5rem;
}

.metric-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 0.75rem;
}

.metric-progress {
    height: 0.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
    .dashboard-container {
        padding: 1rem;
    }
    
    .header-content {
        flex-direction: column;
        text-align: center;
        gap: 1.5rem;
    }
    
    .dashboard-title {
        font-size: 2rem;
    }
    
    .stats-grid {
        grid-template-columns: 1fr;
    }
    
    .content-grid {
        grid-template-columns: 1fr;
    }
    
    .quick-actions-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 480px) {
    .dashboard-title {
        font-size: 1.75rem;
    }
    
    .stat-number {
        font-size: 2rem;
    }
}
</style>
