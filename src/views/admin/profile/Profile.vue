<script setup>
import router from '@/router';
import { apiClient } from '@/service/apiService';
import { getAssetUrl } from '@/utils/helpers';
import { Toast, useToast } from 'primevue';
import { handleError, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import ProfileEdit from './ProfileEdit.vue';

const route = useRoute();
const toast = useToast();

const isEdit = ref(false);

const teacher = ref({
    name: 'Dr. Sarah Johnson',
    title: 'Professor of Mathematics',
    organization: 'Stanford University',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    coverPhoto: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    isLive: true,
    followers: 1245,
    courses: 18,
    students: 2450,
    experience: 8,
    rating: 4.8,
    reviews: 124,
    ratingDistribution: [5, 12, 18, 35, 30], // Percentage for 1-5 stars
    bio: 'Passionate mathematics educator with a PhD in Applied Mathematics from Stanford University. Specializing in calculus, linear algebra, and differential equations. Committed to making complex mathematical concepts accessible to all students through innovative teaching methods.',
    education: 'PhD in Applied Mathematics, Stanford University',
    languages: ['English', 'French', 'Spanish'],
    specialization: ['Calculus', 'Linear Algebra', 'Differential Equations'],
    memberSince: 'March 2015',
    completionRate: 92,
    studentEngagement: 88,
    satisfaction: 95,
    skills: ['Curriculum Development', 'Online Teaching', 'Student Assessment', 'Educational Technology', 'Data Analysis', 'Problem Solving', 'Research', 'Mentoring'],
    reviewList: [
        {
            id: 1,
            name: 'Michael Chen',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
            date: '2 weeks ago',
            rating: 5,
            content: 'Dr. Johnson is an exceptional teacher who explains complex concepts with clarity. Her calculus course transformed my understanding of mathematics.',
            course: 'Advanced Calculus',
            likes: 24
        },
        {
            id: 2,
            name: 'Emily Wilson',
            avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
            date: '1 month ago',
            rating: 4,
            content: 'Great course overall, but sometimes the pace was a bit fast. Office hours were very helpful though.',
            course: 'Linear Algebra',
            likes: 8
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
        }
    ],
    upcomingEvents: [
        {
            id: 1,
            title: 'Calculus Midterm Review',
            day: '15',
            month: 'MAY',
            time: '10:00 AM - 11:30 AM',
            location: 'Online'
        },
        {
            id: 2,
            title: 'Department Meeting',
            day: '18',
            month: 'MAY',
            time: '2:00 PM - 3:30 PM',
            location: 'Math Building, Room 302'
        }
    ],
    certifications: [
        {
            id: 1,
            title: 'Advanced Teaching Certificate',
            organization: 'National Education Association',
            date: 'June 2021',
            icon: 'pi pi-certificate',
            color: '#6366F1'
        },
        {
            id: 2,
            title: 'Online Teaching Specialist',
            organization: 'Digital Learning Institute',
            date: 'March 2020',
            icon: 'pi pi-desktop',
            color: '#10B981'
        }
    ]
});

const teacherProfile = reactive({
    id: null,
    name: '',
    email: '',
    phone: null,
    image: '',
    email_verified_at: null,
    role: '',
    meta: []
});

const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

function handleProfileEdit() {
    // router.replace('/profile/edit');
    isEdit.value = true;
}

onMounted(() => {
    fetchTeacherProfile();
});

const fetchTeacherProfile = async () => {
    try {
        const response = await apiClient.get('admin/teacher/profile');

        // ✅ Proper way to update reactive object
        Object.assign(teacherProfile, response.data.data);

        // const mta = teacherProfile.meta.filter(meta => meta.key == 'cover_photo');
        // console.log(teacherProfile.meta.find(meta => meta.key == 'cover_photo').file_path);
        // console.log(mta);
        console.log(teacherProfile);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Fetch Error',
            detail: error.response?.data?.message || error.message,
            life: 5000
        });
    }
};
</script>

<template>
    <div v-if="!isEdit" class="teacher-profile-container">
        <!-- Profile Header with Cover Photo -->
        <div class="profile-header">
            <div
                class="cover-photo"
                :style="{
                    backgroundImage: teacherProfile.meta.find((meta) => meta.key === 'cover_photo')?.file_path ? 'url(' + getAssetUrl(teacherProfile.meta.find((meta) => meta.key === 'cover_photo').file_path) + ')' : null
                }"
            ></div>

            <div class="profile-header-content">
                <div class="avatar-container">
                    <Avatar :image="teacherProfile.meta.find((meta) => meta.key === 'avatar')?.file_path ? getAssetUrl(teacherProfile.meta.find((meta) => meta.key === 'avatar').file_path) : 'demo/images/access/users-icon.jpg'" size="xlarge" shape="circle" class="profile-avatar" />
                    <Badge v-if="teacher.isLive && false" value="LIVE" severity="danger" class="live-badge"></Badge>
                </div>
                <div class="profile-info">
                    <div class="name-and-actions">
                        <div>
                            <h1>{{ teacherProfile.name }}</h1>
                            <div class="title-and-org">
                                <span class="title">{{ teacherProfile.meta.find((meta) => meta.key == 'profession_title')?.value || 'Na' }}</span>
                                <span class="organization"> <i class="pi pi-building"></i> {{ teacherProfile.meta.find((meta) => meta.key == 'organization')?.value || 'Na' }} </span>
                            </div>
                        </div>
                        <div class="header-actions">
                            <Button icon="pi pi-envelope" v-if="false" class="p-button-rounded p-button-outlined p-button-secondary" />
                            <Button icon="pi pi-pencil" @click="handleProfileEdit" class="p-button-rounded p-button-outlined p-button-secondary" />
                            <Button icon="pi pi-bookmark" v-if="false" class="p-button-rounded p-button-outlined p-button-secondary" />
                            <Button icon="pi pi-share-alt" class="p-button-rounded p-button-outlined p-button-secondary" />
                            <Button v-if="false" label="Follow" icon="pi pi-user-plus" class="p-button-rounded" />
                        </div>
                    </div>

                    <div class="stats-and-rating">
                        <div class="stats">
                            <div class="stat-item">
                                <span class="stat-number">{{ formatNumber(0) }}</span>
                                <span class="stat-label">Followers</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">{{ 0 }}</span>
                                <span class="stat-label">Courses</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">{{ 0 }}</span>
                                <span class="stat-label">Students</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">{{ teacherProfile.meta.find((meta) => meta.key == 'experience')?.value || 'Na' }}+</span>
                                <span class="stat-label">Years Exp</span>
                            </div>
                        </div>

                        <div class="rating-container">
                            <Rating :modelValue="teacher.rating" :readonly="true" :cancel="false" />
                            <span class="rating-text">{{ teacher.rating.toFixed(1) }} ({{ 2 }} reviews)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="profile-content">
            <!-- Left Column -->
            <div class="left-column">
                <!-- About Section -->
                <Card class="about-section">
                    <template #title>
                        <div class="section-title">
                            <i class="pi pi-user"></i>
                            <span>About</span>
                        </div>
                    </template>
                    <template #content>
                        <p class="bio">{{ teacherProfile.meta.find((meta) => meta.key == 'bio')?.value || 'Na' }}</p>

                        <div class="details-grid">
                            <div class="detail-item">
                                <i class="pi pi-graduation-cap"></i>
                                <div>
                                    <span class="detail-label">Education</span>
                                    <span class="detail-value">{{ teacherProfile.meta.find((meta) => meta.key == 'education')?.value || 'Na' }}</span>
                                </div>
                            </div>

                            <div class="detail-item">
                                <i class="pi pi-globe"></i>
                                <div>
                                    <span class="detail-label">Languages</span>
                                    <span class="detail-value">{{ teacherProfile.meta.find((meta) => meta.key == 'languages')?.value || 'Hindi, English' }}</span>
                                </div>
                            </div>

                            <div class="detail-item">
                                <i class="pi pi-star"></i>
                                <div>
                                    <span class="detail-label">Specialization</span>
                                    <span class="detail-value">{{ JSON.parse(teacherProfile.meta.find((meta) => meta.key === 'specialization')?.value || '[]').join(', ') || 'Na' }}</span>
                                </div>
                            </div>

                            <div class="detail-item">
                                <i class="pi pi-calendar"></i>
                                <div>
                                    <span class="detail-label">Member Since</span>
                                    <span class="detail-value">{{ teacherProfile.meta.find((meta) => meta.key == 'member_since')?.value || 'Na' }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Teaching Stats -->
                <Card class="stats-section">
                    <template #title>
                        <div class="section-title">
                            <i class="pi pi-chart-bar"></i>
                            <span>Teaching Statistics</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="stats-cards">
                            <div class="stat-card">
                                <div class="stat-icon" style="background-color: #6366f1">
                                    <i class="pi pi-book"></i>
                                </div>
                                <div class="stat-info">
                                    <span class="stat-value mr-5">{{ 0 }}</span>
                                    <span class="stat-label">Test Created</span>
                                </div>
                            </div>

                            <div class="stat-card" v-if="false">
                                <div class="stat-icon" style="background-color: #10b981">
                                    <i class="pi pi-check-circle"></i>
                                </div>
                                <div class="stat-info">
                                    <span class="stat-value">{{ teacher.completionRate }}%</span>
                                    <span class="stat-label">Completion Rate</span>
                                </div>
                            </div>

                            <div class="stat-card" v-if="false">
                                <div class="stat-icon" style="background-color: #f59e0b">
                                    <i class="pi pi-users"></i>
                                </div>
                                <div class="stat-info">
                                    <span class="stat-value mr-5">{{ 0 }}%</span>
                                    <span class="stat-label">Engagement</span>
                                </div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-icon" style="background-color: #ec4899">
                                    <i class="pi pi-thumbs-up"></i>
                                </div>
                                <div class="stat-info">
                                    <span class="stat-value">{{ 0 }}%</span>
                                    <span class="stat-label">Satisfaction</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Skills & Expertise -->
                <Card class="skills-section" v-if="false">
                    <template #title>
                        <div class="section-title">
                            <i class="pi pi-tags"></i>
                            <span>Skills & Expertise</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="skills-list">
                            <Chip v-for="(skill, index) in teacher.skills" :key="index" :label="skill" class="skill-chip" />
                        </div>
                    </template>
                </Card>

                <!-- Reviews Section -->
                <Card class="reviews-section">
                    <template #title>
                        <div class="section-title">
                            <i class="pi pi-comments"></i>
                            <span>Student Reviews ({{ 2 }})</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="reviews-summary">
                            <div class="overall-rating">
                                <span class="rating-number">{{ teacher.rating.toFixed(1) }}</span>
                                <Rating :modelValue="teacher.rating" :readonly="true" :cancel="false" />
                                <span class="rating-count">{{ teacher.reviews }} reviews</span>
                            </div>

                            <div class="rating-bars">
                                <div class="rating-bar" v-for="n in 5" :key="n">
                                    <span class="star-count">{{ 6 - n }} <i class="pi pi-star"></i></span>
                                    <ProgressBar :value="teacher.ratingDistribution[5 - n]" :showValue="false" />
                                    <span class="percentage">{{ teacher.ratingDistribution[5 - n] }}%</span>
                                </div>
                            </div>
                        </div>

                        <Divider />

                        <div class="reviews-list" v-if="false">
                            <div v-for="review in teacher.reviewList" :key="review.id" class="review-item">
                                <div class="reviewer-info">
                                    <Avatar :image="review.avatar" shape="circle" size="large" />
                                    <div class="reviewer-details">
                                        <span class="reviewer-name">{{ review.name }}</span>
                                        <span class="review-date">{{ review.date }}</span>
                                    </div>
                                    <Rating :modelValue="review.rating" :readonly="true" :cancel="false" class="review-rating" />
                                </div>
                                <p class="review-content">{{ review.content }}</p>
                                <div class="review-footer">
                                    <span class="review-course">{{ review.course }}</span>
                                    <div class="review-actions">
                                        <Button icon="pi pi-thumbs-up" class="p-button-text p-button-plain p-button-sm" />
                                        <span class="likes-count">{{ review.likes }}</span>
                                        <Button icon="pi pi-ellipsis-h" class="p-button-text p-button-plain p-button-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button label="See All Reviews" icon="pi pi-chevron-down" class="p-button-text" />
                    </template>
                </Card>
            </div>

            <!-- Right Column -->
            <div class="right-column">
                <!-- Current Courses -->
                <Card class="courses-section" v-if="false">
                    <template #title>
                        <div class="section-title">
                            <i class="pi pi-book"></i>
                            <span>Current Courses</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="courses-list">
                            <div v-for="course in teacher.currentCourses" :key="course.id" class="course-card">
                                <img :src="course.image" :alt="course.title" class="course-image" />
                                <div class="course-content">
                                    <h3 class="course-title">{{ course.title }}</h3>
                                    <div class="course-meta">
                                        <span class="students-count"><i class="pi pi-users"></i> {{ course.students }}</span>
                                        <Rating :modelValue="course.rating" :readonly="true" :cancel="false" :stars="5" />
                                    </div>
                                    <div class="course-progress">
                                        <span>Progress: {{ course.progress }}%</span>
                                        <ProgressBar :value="course.progress" :showValue="false" />
                                    </div>
                                    <div class="course-actions">
                                        <Button label="Continue" icon="pi pi-play" class="p-button-sm" />
                                        <Button icon="pi pi-ellipsis-h" class="p-button-sm p-button-text" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Upcoming Events -->
                <Card class="events-section">
                    <template #title>
                        <div class="section-title">
                            <i class="pi pi-calendar"></i>
                            <span>Upcoming Events</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="events-list">
                            <div v-for="event in teacher.upcomingEvents" :key="event.id" class="event-item">
                                <div class="event-date">
                                    <span class="day">{{ event.day }}</span>
                                    <span class="month">{{ event.month }}</span>
                                </div>
                                <div class="event-details">
                                    <h4 class="event-title">{{ event.title }}</h4>
                                    <div class="event-meta">
                                        <span><i class="pi pi-clock"></i> {{ event.time }}</span>
                                        <span><i class="pi pi-map-marker"></i> {{ event.location }}</span>
                                    </div>
                                </div>
                                <Button icon="pi pi-ellipsis-h" class="p-button-text p-button-plain" />
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Certifications -->
                <Card class="certifications-section" v-if="false">
                    <template #title>
                        <div class="section-title">
                            <i class="pi pi-certificate"></i>
                            <span>Certifications</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="certifications-list">
                            <div v-for="cert in teacher.certifications" :key="cert.id" class="certification-item">
                                <Avatar :icon="cert.icon" shape="circle" size="large" :style="{ backgroundColor: cert.color }" />
                                <div class="cert-details">
                                    <h4 class="cert-title">{{ cert.title }}</h4>
                                    <span class="cert-org">{{ cert.organization }}</span>
                                    <span class="cert-date">Issued {{ cert.date }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </div>
    <!-- <ProfileEdit /> -->
    <ProfileEdit
        v-if="!!isEdit"
        @cancel="isEdit = false"
        :teacher="teacherProfile"
        @saved="
            () => {
                isEdit = false;
                fetchTeacherProfile();
            }
        "
    />
</template>

<style scoped>
.teacher-profile-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.profile-header {
    position: relative;
    margin-bottom: 6rem;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.cover-photo {
    height: 200px;
    background-size: cover;
    background-position: center;
}

.profile-header-content {
    position: relative;
    padding: 0 2rem 2rem;
    background-color: var(--surface-card);
}

.avatar-container {
    position: relative;
    display: inline-block;
    margin-top: -60px;
}

.profile-avatar {
    width: 120px;
    height: 120px;
    border: 4px solid var(--surface-card);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.live-badge {
    position: absolute;
    top: -10px;
    right: -10px;
}

.profile-info {
    margin-top: 1rem;
}

.name-and-actions {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.title-and-org {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 0.5rem;
    color: var(--text-color-secondary);
}

.title-and-org .title {
    font-weight: 500;
}

.organization {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
}

.header-actions {
    display: flex;
    gap: 0.5rem;
}

.stats-and-rating {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.stats {
    display: flex;
    gap: 2rem;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-number {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--primary-color);
}

.stat-label {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.rating-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.rating-text {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.profile-content {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.left-column {
    flex: 2;
}

.right-column {
    flex: 1;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--primary-color);
}

.bio {
    margin-bottom: 1.5rem;
    line-height: 1.6;
}

.details-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

.detail-item {
    display: flex;
    gap: 1rem;
    padding: 0.75rem;
    border-radius: 8px;
    transition: background-color 0.2s;
}

.detail-item:hover {
    background-color: var(--surface-ground);
}

.detail-item i {
    font-size: 1.25rem;
    color: var(--primary-color);
}

.detail-label {
    display: block;
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    margin-bottom: 0.25rem;
}

.detail-value {
    font-size: 0.875rem;
    font-weight: 500;
}

.stats-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

.stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    background-color: var(--surface-ground);
}

.stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
}

.stat-value {
    font-size: 1.25rem;
    font-weight: 600;
}

.stat-label {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.skills-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.skill-chip {
    background-color: var(--surface-ground);
}

.reviews-summary {
    display: flex;
    gap: 2rem;
    margin-bottom: 1.5rem;
}

.overall-rating {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 120px;
}

.rating-number {
    font-size: 2.5rem;
    font-weight: 600;
    line-height: 1;
}

.rating-count {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.rating-bars {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.rating-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.star-count {
    width: 50px;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.percentage {
    width: 40px;
    font-size: 0.875rem;
    text-align: right;
}

.review-item {
    padding: 1.5rem 0;
    border-bottom: 1px solid var(--surface-border);
}

.review-item:last-child {
    border-bottom: none;
}

.reviewer-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.reviewer-details {
    flex: 1;
}

.reviewer-name {
    font-weight: 600;
    display: block;
}

.review-date {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

.review-rating {
    margin-left: auto;
}

.review-content {
    margin-bottom: 1rem;
    line-height: 1.6;
}

.review-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.review-course {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    font-style: italic;
}

.review-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.likes-count {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.courses-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.course-card {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    background-color: var(--surface-ground);
}

.course-image {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 8px;
}

.course-content {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.course-title {
    margin: 0 0 0.5rem;
    font-size: 1rem;
}

.course-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.students-count {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.course-progress {
    margin: 0.5rem 0;
}

.course-progress span {
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
    display: block;
}

.course-actions {
    display: flex;
    justify-content: space-between;
    margin-top: auto;
}

.events-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.event-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    background-color: var(--surface-ground);
}

.event-date {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 50px;
}

.event-date .day {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1;
}

.event-date .month {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: var(--text-color-secondary);
}

.event-details {
    flex: 1;
}

.event-title {
    margin: 0 0 0.25rem;
    font-size: 1rem;
}

.event-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.event-meta span {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.certifications-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.certification-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    background-color: var(--surface-ground);
}

.cert-details {
    flex: 1;
}

.cert-title {
    margin: 0 0 0.25rem;
    font-size: 1rem;
}

.cert-org {
    display: block;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin-bottom: 0.25rem;
}

.cert-date {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

@media (max-width: 960px) {
    .profile-content {
        flex-direction: column;
    }

    .details-grid {
        grid-template-columns: 1fr;
    }

    .stats-cards {
        grid-template-columns: 1fr;
    }

    .reviews-summary {
        flex-direction: column;
        gap: 1rem;
    }
}

@media (max-width: 768px) {
    .stats-and-rating {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .stats {
        gap: 1rem;
    }

    .name-and-actions {
        flex-direction: column;
        gap: 1rem;
    }

    .header-actions {
        width: 100%;
        justify-content: flex-end;
    }
}
</style>
