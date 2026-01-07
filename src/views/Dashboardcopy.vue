<script>
import { ref, onMounted } from 'vue';
import WelcomeSection from '@/views/dashKit/WelcomeSection.vue';
import StatCard from '@/views/dashKit/StatCard.vue';
import TeacherCard from '@/views/dashKit/TeacherCard.vue';
import TeacherAnalytics from '@/views/dashKit/TeacherAnalytics.vue';
import StudentEngagement from '@/views/dashKit/StudentEngagement.vue';
import { getUser } from '@/stores/helpers';

export default {
    components: {
        WelcomeSection,
        StatCard,
        TeacherCard,
        TeacherAnalytics,
        StudentEngagement
    },
    setup() {
        const sidebarVisible = ref(true);
        const currentUser = ref({
            name: 'Admin User',
            avatar: 'demo/images/access/users-icon.jpg',
            role: 'Administrator',
            lastLogin: '2 hours ago'
        });

        const stats = ref({
            totalStudents: 1245,
            studentChange: 12.5,
            activeTeachers: 86,
            teacherChange: 5.2,
            liveExams: 9,
            examChange: -3.1,
            totalRevenue: 42.8,
            revenueChange: 18.7
        });

        const navItems = ref([
            { label: 'Dashboard', icon: 'pi pi-home' },
            { label: 'Messages', icon: 'pi pi-envelope', badge: 5 },
            { label: 'Notifications', icon: 'pi pi-bell', badge: 3 },
            { label: 'Calendar', icon: 'pi pi-calendar' }
        ]);

        const questionMenuItems = ref([
            { label: 'Create Questions', icon: 'pi pi-plus' },
            { label: 'Question Bank', icon: 'pi pi-database' },
            { label: 'Question Sets', icon: 'pi pi-list' },
            { label: 'Import Questions', icon: 'pi pi-upload' }
        ]);

        const userMenuItems = ref([
            { label: 'Manage Students', icon: 'pi pi-users' },
            { label: 'Manage Teachers', icon: 'pi pi-user-edit' },
            { label: 'User Permissions', icon: 'pi pi-lock' },
            { label: 'User Activity', icon: 'pi pi-chart-line' }
        ]);

        const examMenuItems = ref([
            { label: 'Create Exams', icon: 'pi pi-file-edit' },
            { label: 'Schedule Exams', icon: 'pi pi-calendar-plus' },
            { label: 'Live Exams', icon: 'pi pi-clock' },
            { label: 'Exam Results', icon: 'pi pi-chart-bar' }
        ]);

        const analyticsMenuItems = ref([
            { label: 'Performance Reports', icon: 'pi pi-chart-pie' },
            { label: 'Revenue Analytics', icon: 'pi pi-money-bill' },
            { label: 'Engagement Metrics', icon: 'pi pi-heart' },
            { label: 'Export Reports', icon: 'pi pi-download' }
        ]);

        const enrollmentChartData = ref({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [
                {
                    label: 'Students Enrolled',
                    backgroundColor: '#6366F1',
                    data: [65, 59, 80, 81, 56, 55, 40]
                },
                {
                    label: 'Exams Taken',
                    backgroundColor: '#10B981',
                    data: [28, 48, 40, 19, 86, 27, 90]
                }
            ]
        });

        const teacherDistributionData = ref({
            labels: ['Active', 'On Leave', 'New', 'Featured'],
            datasets: [
                {
                    data: [54, 12, 8, 12],
                    backgroundColor: ['#6366F1', '#10B981', '#F59E0B', '#EC4899'],
                    hoverBackgroundColor: ['#8183f4', '#3fc391', '#f7b750', '#ee6ba6']
                }
            ]
        });

        const examPerformanceData = ref({
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [
                {
                    label: 'Average Score',
                    data: [65, 59, 80, 81],
                    fill: false,
                    borderColor: '#6366F1',
                    tension: 0.4
                },
                {
                    label: 'Completion Rate',
                    data: [28, 48, 40, 19],
                    fill: false,
                    borderColor: '#10B981',
                    tension: 0.4
                }
            ]
        });

        const featuredTeachers = ref([
            { id: 1, name: 'Dr. Sarah Johnson', subject: 'Mathematics', rating: 4.9, students: 245, avatar: 'demo/images/access/users-icon.jpg' },
            { id: 2, name: 'Prof. Michael Chen', subject: 'Physics', rating: 4.8, students: 198, avatar: 'demo/images/access/users-icon.jpg' },
            { id: 3, name: 'Dr. Emily Wilson', subject: 'Chemistry', rating: 4.7, students: 176, avatar: 'demo/images/access/users-icon.jpg' },
            { id: 4, name: 'Prof. David Kim', subject: 'Biology', rating: 4.6, students: 154, avatar: 'demo/images/access/users-icon.jpg' },
            { id: 5, name: 'Dr. Lisa Rodriguez', subject: 'Computer Science', rating: 4.9, students: 221, avatar: 'demo/images/access/users-icon.jpg' }
        ]);

        const liveExams = ref([
            { id: 1, title: 'Advanced Calculus Midterm', teacher: 'Dr. Sarah Johnson', students: 124, status: 'Active' },
            { id: 2, title: 'Quantum Physics Quiz', teacher: 'Prof. Michael Chen', students: 98, status: 'Active' },
            { id: 3, title: 'Organic Chemistry Test', teacher: 'Dr. Emily Wilson', students: 87, status: 'Starting Soon' },
            { id: 4, title: 'Genetics Final Exam', teacher: 'Prof. David Kim', students: 112, status: 'Active' },
            { id: 5, title: 'Data Structures Exam', teacher: 'Dr. Lisa Rodriguez', students: 76, status: 'Ending Soon' }
        ]);

        const recentActivities = ref([
            {
                title: 'New Exam Created',
                content: 'Dr. Johnson created a new exam for Calculus II',
                time: '10 minutes ago',
                icon: 'pi pi-file-edit',
                color: '#6366F1',
                action: 'View Exam'
            },
            {
                title: 'Student Enrollment',
                content: '32 new students enrolled in Physics 101',
                time: '1 hour ago',
                icon: 'pi pi-users',
                color: '#10B981',
                action: 'See Students'
            },
            {
                title: 'System Update',
                content: 'New dashboard features deployed successfully',
                time: '3 hours ago',
                icon: 'pi pi-cloud-upload',
                color: '#F59E0B',
                action: 'View Changelog'
            },
            {
                title: 'Revenue Report',
                content: 'Monthly revenue increased by 18% compared to last month',
                time: 'Yesterday',
                icon: 'pi pi-chart-line',
                color: '#EC4899',
                action: 'View Report'
            }
        ]);

        const carouselResponsiveOptions = ref([
            {
                breakpoint: '1024px',
                numVisible: 3,
                numScroll: 1
            },
            {
                breakpoint: '768px',
                numVisible: 2,
                numScroll: 1
            },
            {
                breakpoint: '560px',
                numVisible: 1,
                numScroll: 1
            }
        ]);

        const chartOptions = ref({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        });

        const getStatusSeverity = (status) => {
            switch (status) {
                case 'Active':
                    return 'success';
                case 'Starting Soon':
                    return 'warning';
                case 'Ending Soon':
                    return 'danger';
                default:
                    return 'info';
            }
        };

        // Simulate data loading
        onMounted(async () => {
            currentUser.value = await getUser();
            // In a regital app, you would fetch data from API here
        });

        return {
            sidebarVisible,
            currentUser,
            stats,
            navItems,
            questionMenuItems,
            userMenuItems,
            examMenuItems,
            analyticsMenuItems,
            enrollmentChartData,
            teacherDistributionData,
            examPerformanceData,
            featuredTeachers,
            liveExams,
            recentActivities,
            carouselResponsiveOptions,
            chartOptions,
            getStatusSeverity
        };
    }
};
</script>

<template>
    <div class="admin-dashboard">
        <!-- Top Navigation -->
        <Menubar :model="navItems" class="dashboard-nav">
            <template #start>
                <span class="app-title">Your Text Book</span>
            </template>
            <template #end>
                <div class="user-controls">
                    <Button icon="pi pi-bell" class="p-button-rounded p-button-text p-button-plain" badge="3" />
                    <Avatar :image="currentUser.avatar" shape="circle" size="large" class="user-avatar" />
                    <span class="user-name">{{ currentUser.name }}</span>
                    <Button icon="pi pi-cog" class="p-button-rounded p-button-text p-button-plain" />
                </div>
            </template>
        </Menubar>

        <div class="dashboard-container">
            <!-- Sidebar -->
            <Sidebar v-model:visible="sidebarVisible" position="left" class="dashboard-sidebar" v-if="!navItems.length > 0">
                <div class="sidebar-header">
                    <h3>Navigation</h3>
                </div>
                <Accordion :multiple="true" :activeIndex="[0]">
                    <AccordionTab header="Question Management">
                        <Menu :model="questionMenuItems" />
                    </AccordionTab>
                    <AccordionTab header="User Management">
                        <Menu :model="userMenuItems" />
                    </AccordionTab>
                    <AccordionTab header="Exam Management">
                        <Menu :model="examMenuItems" />
                    </AccordionTab>
                    <AccordionTab header="Analytics & Reports">
                        <Menu :model="analyticsMenuItems" />
                    </AccordionTab>
                </Accordion>
            </Sidebar>

            <!-- Main Content -->
            <div class="dashboard-content">
                <!-- Welcome Section -->
                <WelcomeSection :user="currentUser" />

                <!-- Stats Overview -->
                <div class="stats-overview">
                    <StatCard title="Total Students" :value="stats.totalStudents" icon="pi pi-users" color="#6366F1" :change="stats.studentChange" />

                    <StatCard title="Active Teachers" :value="stats.activeTeachers" icon="pi pi-user-edit" color="#10B981" :change="stats.teacherChange" />

                    <StatCard title="Live Exams" :value="stats.liveExams" icon="pi pi-clock" color="#F59E0B" :change="stats.examChange" />

                    <StatCard title="Total Revenue" :value="`₹${stats.totalRevenue}k`" icon="pi pi-wallet" color="#EC4899" :change="stats.revenueChange" />
                </div>

                <!-- Main Content Tabs -->
                <TabView class="dashboard-tabs">
                    <TabPanel header="Overview">
                        <div class="overview-grid">
                            <!-- Row 1 -->
                            <div class="chart-container">
                                <Chart type="bar" :data="enrollmentChartData" :options="chartOptions" />
                            </div>

                            <div class="chart-container">
                                <Chart type="doughnut" :data="teacherDistributionData" :options="chartOptions" />
                            </div>

                            <!-- Row 2 -->
                            <div class="featured-teachers">
                                <h3>Featured Teachers</h3>
                                <Carousel :value="featuredTeachers" :numVisible="3" :numScroll="1" :responsiveOptions="carouselResponsiveOptions">
                                    <template #item="slotProps">
                                        <TeacherCard :teacher="slotProps.data" />
                                    </template>
                                </Carousel>
                            </div>

                            <div class="recent-activity">
                                <h3>Recent Activity</h3>
                                <Timeline :value="recentActivities" align="alternate" class="custom-timeline">
                                    <template #marker="slotProps">
                                        <span class="custom-marker" :style="{ backgroundColor: slotProps.item.color }">
                                            <i :class="slotProps.item.icon"></i>
                                        </span>
                                    </template>
                                    <template #content="slotProps">
                                        <Card>
                                            <template #title>{{ slotProps.item.title }}</template>
                                            <template #subtitle>{{ slotProps.item.time }}</template>
                                            <template #content>
                                                <p>{{ slotProps.item.content }}</p>
                                                <Button v-if="slotProps.item.action" :label="slotProps.item.action" icon="pi pi-arrow-right" class="p-button-text p-button-sm" />
                                            </template>
                                        </Card>
                                    </template>
                                </Timeline>
                            </div>

                            <!-- Row 3 -->
                            <div class="live-exams">
                                <h3>Live Exams</h3>
                                <DataTable :value="liveExams" :paginator="true" :rows="5" responsiveLayout="scroll">
                                    <Column field="title" header="Exam Title"></Column>
                                    <Column field="teacher" header="Teacher"></Column>
                                    <Column field="students" header="Students"></Column>
                                    <Column field="status" header="Status">
                                        <template #body="slotProps">
                                            <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
                                        </template>
                                    </Column>
                                    <Column header="Action">
                                        <template #body>
                                            <Button icon="pi pi-eye" class="p-button-rounded p-button-text" />
                                        </template>
                                    </Column>
                                </DataTable>
                            </div>

                            <div class="exam-stats">
                                <h3>Exam Statistics</h3>
                                <Chart type="line" :data="examPerformanceData" :options="chartOptions" />
                            </div>
                        </div>
                    </TabPanel>

                    <TabPanel header="Teacher Analytics">
                        <TeacherAnalytics :teachers="teachers" />
                    </TabPanel>

                    <TabPanel header="Student Engagement">
                        <StudentEngagement :students="students" />
                    </TabPanel>
                </TabView>
            </div>
        </div>
    </div>
</template>

<style scoped>
.admin-dashboard {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: var(--surface-ground);
}

.dashboard-nav {
    border-radius: 0;
    border: none;
    border-bottom: 1px solid var(--surface-border);
    padding: 0.5rem 2rem;
    background: var(--surface-card);
}

.app-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--primary-color);
}

.user-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.user-avatar {
    cursor: pointer;
    transition: transform 0.2s;
}

.user-avatar:hover {
    transform: scale(1.05);
}

.user-name {
    font-weight: 500;
}

.dashboard-container {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.dashboard-sidebar {
    width: 280px;
    background: var(--surface-card);
    border-right: 1px solid var(--surface-border);
    box-shadow: none;
}

.sidebar-header {
    padding: 1rem;
    border-bottom: 1px solid var(--surface-border);
}

.dashboard-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
}

.stats-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.dashboard-tabs ::v-deep(.p-tabview-panels) {
    padding: 1rem 0;
}

.overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
}

.chart-container {
    background: var(--surface-card);
    padding: 1rem;
    border-radius: 12px;
    height: 300px;
}

.featured-teachers,
.recent-activity,
.live-exams,
.exam-stats {
    background: var(--surface-card);
    padding: 1rem;
    border-radius: 12px;
}

.featured-teachers h3,
.recent-activity h3,
.live-exams h3,
.exam-stats h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--text-color);
}

.custom-timeline ::v-deep(.p-timeline-event-content) {
    padding-bottom: 1rem;
}

.custom-timeline ::v-deep(.p-timeline-event-opposite) {
    display: none;
}

.custom-marker {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    color: white;
}

@media (max-width: 960px) {
    .dashboard-sidebar {
        position: fixed;
        z-index: 1000;
        height: 100vh;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
    }

    .dashboard-sidebar.sidebar-visible {
        transform: translateX(0);
    }

    .overview-grid {
        grid-template-columns: 1fr;
    }
}
</style>
