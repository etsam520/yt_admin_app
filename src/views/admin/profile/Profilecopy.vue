<script>
import { ref } from 'vue';
// import '@fullcalendar/vue3/src/index'; // solves problem with Vite
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ProfileEdit from './ProfileEdit.vue';

export default {
    components: {
        FullCalendar
    },
    setup() {
        const teacher = ref({
            id: 1,
            name: 'Dr. Sarah Johnson',
            subject: 'Professor of Mathematics',
            rating: 4.8,
            reviews: 124,
            status: 'Active',
            students: 245,
            experience: '8 years',
            avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
            bio: 'Passionate mathematics educator with a PhD in Applied Mathematics from Stanford University. Specializing in calculus, linear algebra, and differential equations. Committed to making complex mathematical concepts accessible to all students through innovative teaching methods.',
            institution: 'Stanford University',
            education: 'PhD in Applied Mathematics, Stanford University (2015)',
            languages: ['English', 'French', 'Spanish'],
            specialization: ['Calculus', 'Linear Algebra', 'Differential Equations'],
            courses: 18,
            exams: 42,
            completionRate: 92,
            studentEngagement: 88,
            metrics: {
                courseQuality: 95,
                communication: 89,
                responsiveness: 91
            },
            reviewList: [
                {
                    id: 1,
                    name: 'Michael Chen',
                    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
                    date: '2 weeks ago',
                    rating: 5,
                    content: 'Dr. Johnson is an exceptional teacher who explains complex concepts with clarity. Her calculus course transformed my understanding of mathematics.',
                    course: 'Advanced Calculus'
                },
                {
                    id: 2,
                    name: 'Emily Wilson',
                    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
                    date: '1 month ago',
                    rating: 4,
                    content: 'Great course overall, but sometimes the pace was a bit fast. Office hours were very helpful though.',
                    course: 'Linear Algebra'
                },
                {
                    id: 3,
                    name: 'David Kim',
                    avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
                    date: '2 months ago',
                    rating: 5,
                    content: "Best math teacher I've ever had. Her explanations are crystal clear and she's always available to help.",
                    course: 'Differential Equations'
                }
            ],
            currentCourses: [
                {
                    id: 1,
                    title: 'Advanced Calculus',
                    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
                    students: 84,
                    rating: 4.9,
                    progress: 75
                },
                {
                    id: 2,
                    title: 'Linear Algebra',
                    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
                    students: 62,
                    rating: 4.7,
                    progress: 42
                },
                {
                    id: 3,
                    title: 'Differential Equations',
                    image: 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
                    students: 56,
                    rating: 4.8,
                    progress: 63
                }
            ],
            achievements: [
                {
                    id: 1,
                    title: 'Teacher of the Year 2022',
                    date: 'May 2022',
                    icon: 'pi pi-trophy',
                    color: '#F59E0B'
                },
                {
                    id: 2,
                    title: 'Excellence in Online Teaching',
                    date: 'December 2021',
                    icon: 'pi pi-desktop',
                    color: '#6366F1'
                },
                {
                    id: 3,
                    title: 'Innovative Teaching Award',
                    date: 'March 2021',
                    icon: 'pi pi-lightbulb',
                    color: '#10B981'
                }
            ]
        });

        const calendarOptions = ref({
            plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
            initialView: 'timeGridWeek',
            headerToolbar: {
                left: 'prev,next',
                center: 'title',
                right: 'timeGridWeek,timeGridDay'
            },
            events: [
                {
                    title: 'Calculus Lecture',
                    start: '2023-05-01T10:00:00',
                    end: '2023-05-01T11:30:00',
                    color: '#6366F1'
                },
                {
                    title: 'Office Hours',
                    start: '2023-05-01T13:00:00',
                    end: '2023-05-01T15:00:00',
                    color: '#10B981'
                },
                {
                    title: 'Linear Algebra',
                    start: '2023-05-02T09:00:00',
                    end: '2023-05-02T10:30:00',
                    color: '#EC4899'
                },
                {
                    title: 'Department Meeting',
                    start: '2023-05-03T14:00:00',
                    end: '2023-05-03T15:30:00',
                    color: '#F59E0B'
                },
                {
                    title: 'Differential Equations',
                    start: '2023-05-04T11:00:00',
                    end: '2023-05-04T12:30:00',
                    color: '#8B5CF6'
                }
            ],
            height: 'auto'
        });

        const getStatusSeverity = (status) => {
            switch (status) {
                case 'Active':
                    return 'success';
                case 'On Leave':
                    return 'warning';
                case 'Inactive':
                    return 'danger';
                default:
                    return 'info';
            }
        };

        return {
            teacher,
            calendarOptions,
            getStatusSeverity,
            ProfileEdit
        };
    }
};
</script>

<template>
    <div class="teacher-profile">
        <!-- Header Section -->
        <div class="profile-header p-d-flex p-ai-center p-p-4">
            <div class="p-mr-4">
                <Avatar :image="teacher.avatar" size="xlarge" shape="circle" class="profile-avatar" />
            </div>
            <div class="profile-info">
                <h1>{{ teacher.name }}</h1>
                <div class="p-d-flex p-ai-center p-mb-2">
                    <span class="p-mr-3">{{ teacher.subject }}</span>
                    <Rating :modelValue="teacher.rating" :readonly="true" :cancel="false" class="p-mr-3" />
                    <span>{{ teacher.rating.toFixed(1) }} ({{ teacher.reviews }} reviews)</span>
                </div>
                <div class="p-d-flex p-ai-center">
                    <Tag :value="teacher.status" :severity="getStatusSeverity(teacher.status)" class="p-mr-3" />
                    <span class="p-mr-3"><i class="pi pi-users"></i> {{ teacher.students }} students</span>
                    <span><i class="pi pi-clock"></i> Teaching for {{ teacher.experience }}</span>
                </div>
            </div>
            <div class="profile-actions">
                <Button label="Send Message" icon="pi pi-envelope" class="p-button-outlined p-mr-2" />
                <Button label="Schedule Meeting" icon="pi pi-calendar" class="p-button-outlined p-mr-2" />
                <Button label="Follow" icon="pi pi-user-plus" class="p-button-primary" />
            </div>
        </div>

        <!-- Main Content -->
        <div class="profile-content">
            <!-- Left Column -->
            <div class="left-column">
                <!-- About Section -->
                <Card class="p-mb-4">
                    <template #title>About</template>
                    <template #content>
                        <p>{{ teacher.bio }}</p>
                        <Divider />
                        <div class="about-details">
                            <div class="detail-item">
                                <span class="detail-label"><i class="pi pi-building"></i> Institution:</span>
                                <span>{{ teacher.institution }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label"><i class="pi pi-graduation-cap"></i> Education:</span>
                                <span>{{ teacher.education }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label"><i class="pi pi-globe"></i> Languages:</span>
                                <span>{{ teacher.languages.join(', ') }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label"><i class="pi pi-star"></i> Specialization:</span>
                                <span>{{ teacher.specialization.join(', ') }}</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Statistics Section -->
                <Card class="p-mb-4">
                    <template #title>Statistics</template>
                    <template #content>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-value">{{ teacher.courses }}</div>
                                <div class="stat-label">Courses Created</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">{{ teacher.exams }}</div>
                                <div class="stat-label">Exams Conducted</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">{{ teacher.completionRate }}%</div>
                                <div class="stat-label">Completion Rate</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">{{ teacher.studentEngagement }}%</div>
                                <div class="stat-label">Student Engagement</div>
                            </div>
                        </div>
                        <Divider />
                        <div class="progress-stats">
                            <div class="progress-item">
                                <span>Course Quality</span>
                                <ProgressBar :value="teacher.metrics.courseQuality" :showValue="false" />
                                <span>{{ teacher.metrics.courseQuality }}%</span>
                            </div>
                            <div class="progress-item">
                                <span>Communication</span>
                                <ProgressBar :value="teacher.metrics.communication" :showValue="false" />
                                <span>{{ teacher.metrics.communication }}%</span>
                            </div>
                            <div class="progress-item">
                                <span>Responsiveness</span>
                                <ProgressBar :value="teacher.metrics.responsiveness" :showValue="false" />
                                <span>{{ teacher.metrics.responsiveness }}%</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Reviews Section -->
                <Card>
                    <template #title>Student Reviews</template>
                    <template #subtitle>{{ teacher.reviews }} reviews</template>
                    <template #content>
                        <div class="reviews-list">
                            <div v-for="review in teacher.reviewList" :key="review.id" class="review-item p-mb-4">
                                <div class="p-d-flex p-ai-center p-mb-2">
                                    <Avatar :image="review.avatar" shape="circle" size="normal" class="p-mr-2" />
                                    <div>
                                        <div class="reviewer-name">{{ review.name }}</div>
                                        <div class="review-date">{{ review.date }}</div>
                                    </div>
                                    <Rating :modelValue="review.rating" :readonly="true" :cancel="false" class="p-ml-auto" />
                                </div>
                                <p class="review-content">{{ review.content }}</p>
                                <div class="review-course">Course: {{ review.course }}</div>
                            </div>
                        </div>
                        <Button label="Load More Reviews" icon="pi pi-refresh" class="p-button-text" />
                    </template>
                </Card>
            </div>

            <!-- Right Column -->
            <div class="right-column">
                <!-- Current Courses -->
                <Card class="p-mb-4">
                    <template #title>Current Courses</template>
                    <template #content>
                        <div class="courses-list">
                            <div v-for="course in teacher.currentCourses" :key="course.id" class="course-item p-mb-3">
                                <div class="p-d-flex p-ai-center">
                                    <img :src="course.image" :alt="course.title" class="course-image p-mr-3" />
                                    <div>
                                        <div class="course-title">{{ course.title }}</div>
                                        <div class="course-meta">
                                            <span class="p-mr-3"><i class="pi pi-users"></i> {{ course.students }} students</span>
                                            <span><i class="pi pi-star"></i> {{ course.rating.toFixed(1) }}</span>
                                        </div>
                                    </div>
                                </div>
                                <Divider />
                                <div class="course-progress">
                                    <span>Completion: {{ course.progress }}%</span>
                                    <ProgressBar :value="course.progress" :showValue="false" />
                                </div>
                                <div class="course-actions p-d-flex p-jc-between p-mt-2">
                                    <Button label="View Course" icon="pi pi-eye" class="p-button-text p-button-sm" />
                                    <Button label="Enroll" icon="pi pi-check" class="p-button-sm" />
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Upcoming Schedule -->
                <Card class="p-mb-4">
                    <template #title>Upcoming Schedule</template>
                    <template #content>
                        <FullCalendar :options="calendarOptions" />
                    </template>
                </Card>

                <!-- Achievements -->
                <Card>
                    <template #title>Achievements</template>
                    <template #content>
                        <div class="achievements-list">
                            <div v-for="achievement in teacher.achievements" :key="achievement.id" class="achievement-item p-mb-3">
                                <div class="p-d-flex p-ai-center">
                                    <Avatar :icon="achievement.icon" shape="circle" size="large" class="p-mr-3" :style="{ backgroundColor: achievement.color }" />
                                    <div>
                                        <div class="achievement-title">{{ achievement.title }}</div>
                                        <div class="achievement-date">{{ achievement.date }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </div>

    <!-- <ProfileEdit /> -->
</template>

<style scoped>
.teacher-profile {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
}

.profile-header {
    background-color: var(--surface-card);
    border-radius: 12px;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.profile-avatar {
    width: 120px;
    height: 120px;
    border: 4px solid white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.profile-info h1 {
    margin: 0;
    font-size: 1.75rem;
    color: var(--text-color);
}

.profile-actions {
    margin-left: auto;
}

.profile-content {
    display: flex;
    gap: 1.5rem;
}

.left-column {
    flex: 2;
}

.right-column {
    flex: 1;
}

.about-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.detail-label {
    font-weight: 600;
    color: var(--text-color-secondary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.stat-card {
    background-color: var(--surface-ground);
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
}

.stat-value {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--primary-color);
}

.stat-label {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.progress-stats {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.progress-item {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.progress-item span:first-child {
    width: 120px;
    font-size: 0.875rem;
}

.progress-item span:last-child {
    width: 40px;
    text-align: right;
    font-size: 0.875rem;
    font-weight: 600;
}

::v-deep(.p-progressbar) {
    flex: 1;
    height: 8px;
}

.review-item {
    padding: 1rem;
    background-color: var(--surface-ground);
    border-radius: 8px;
}

.reviewer-name {
    font-weight: 600;
}

.review-date {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

.review-content {
    margin: 0.5rem 0;
}

.review-course {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    font-style: italic;
}

.course-item {
    padding: 1rem;
    background-color: var(--surface-ground);
    border-radius: 8px;
}

.course-image {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 8px;
}

.course-title {
    font-weight: 600;
}

.course-meta {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    display: flex;
}

.course-progress {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.875rem;
}

.achievement-item {
    padding: 0.75rem;
    border-radius: 8px;
    transition: background-color 0.2s;
}

.achievement-item:hover {
    background-color: var(--surface-ground);
}

.achievement-title {
    font-weight: 600;
}

.achievement-date {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

@media (max-width: 960px) {
    .profile-content {
        flex-direction: column;
    }

    .about-details {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .profile-header {
        flex-direction: column;
        text-align: center;
    }

    .profile-info {
        text-align: center;
        margin: 1rem 0;
    }

    .profile-actions {
        margin-left: 0;
        margin-top: 1rem;
    }

    .stats-grid {
        grid-template-columns: 1fr;
    }
}
</style>
