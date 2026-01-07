<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useDialog } from 'primevue/usedialog';

const emit = defineEmits(['submit']);
const props = defineProps({
    teacher: {
        type: Object,
        required: true
    }
});

const teachingMethods = ref([
    { label: 'Live Online Classes', value: 'liveOnline' },
    { label: 'Pre-recorded Lectures', value: 'prerecorded' },
    { label: 'One-on-One Tutoring', value: 'tutoring' },
    { label: 'Hybrid (Online & In-person)', value: 'hybrid' },
    { label: 'Project-Based Learning', value: 'projectBased' }
]);

const editForm = ref({
    firstName: '',
    lastName: '',
    title: '',
    organization: '',
    bio: '',
    education: '',
    experience: 0,
    memberSince: '',
    specialization: [],
    skills: [],
    languages: [],
    avatarPreview: null,
    coverPreview: null,
    social: {
        linkedin: '',
        twitter: '',
        website: ''
    },
    available: true,
    teachingMethods: [],
    officeHours: ''
});

// Initialize form with teacher data
onMounted(() => {
    const nameParts = props.teacher?.name.split(' ');
    editForm.value = {
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
        title: props.teacher.title,
        organization: props.teacher.organization,
        bio: props.teacher.bio,
        education: props.teacher.education,
        experience: props.teacher.experience,
        memberSince: props.teacher.memberSince,
        specialization: [...props.teacher.specialization],
        skills: [...props.teacher.skills],
        languages: [...props.teacher.languages],
        avatarPreview: null,
        coverPreview: null,
        social: {
            linkedin: '',
            twitter: '',
            website: ''
        },
        available: true,
        teachingMethods: ['liveOnline', 'prerecorded'],
        officeHours: ''
    };
});

const onAvatarUpload = (event) => {
    const file = event.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            editForm.value.avatarPreview = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

const onCoverUpload = (event) => {
    const file = event.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            editForm.value.coverPreview = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

const saveProfile = () => {
    const updatedProfile = {
        ...editForm.value,
        name: `${editForm.value.firstName} ${editForm.value.lastName}`,
        avatar: editForm.value.avatarPreview || props.teacher.avatar,
        coverPhoto: editForm.value.coverPreview || props.teacher.coverPhoto
    };
    emit('save', updatedProfile);
};

const cancelEditing = () => {
    emit('cancel');
};
function avatarImage() {
    return this.editForm.avatarPreview || this.teacher?.avatar || null;
}

computed(() => {
    avatarImage();
});
</script>

<template>
    <div class="teacher-profile-edit">
        <!-- Header Section -->
        <div class="edit-header p-d-flex p-ai-center p-jc-between p-p-4">
            <h1>Edit Profile</h1>
            <div class="edit-actions">
                <Button label="Cancel" class="p-button-text" @click="cancelEditing" />
                <Button label="Save Changes" icon="pi pi-check" @click="saveProfile" />
            </div>
        </div>

        <!-- Main Edit Form -->
        <div class="edit-form-container">
            <!-- Left Column -->
            <div class="left-column">
                <!-- Basic Information Section -->
                <Card class="edit-section">
                    <template #title>
                        <div class="section-title">
                            <i class="pi pi-user"></i>
                            <span>Basic Information</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="p-fluid form-grid">
                            <div class="p-field p-col-12 p-md-6">
                                <label for="firstName">First Name</label>
                                <InputText id="firstName" v-model="editForm.firstName" />
                            </div>
                            <div class="p-field p-col-12 p-md-6">
                                <label for="lastName">Last Name</label>
                                <InputText id="lastName" v-model="editForm.lastName" />
                            </div>
                            <div class="p-field p-col-12">
                                <label for="title">Title/Position</label>
                                <InputText id="title" v-model="editForm.title" />
                            </div>
                            <div class="p-field p-col-12">
                                <label for="organization">Institution/Organization</label>
                                <InputText id="organization" v-model="editForm.organization" />
                            </div>
                            <div class="p-field p-col-12">
                                <label for="bio">Bio</label>
                                <Textarea id="bio" v-model="editForm.bio" :autoResize="true" rows="5" />
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Education & Experience -->
                <Card class="edit-section">
                    <template #title>
                        <div class="section-title">
                            <i class="pi pi-graduation-cap"></i>
                            <span>Education & Experience</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="p-fluid form-grid">
                            <div class="p-field p-col-12">
                                <label for="education">Education</label>
                                <InputText id="education" v-model="editForm.education" />
                            </div>
                            <div class="p-field p-col-12 p-md-6">
                                <label for="experience">Years of Experience</label>
                                <InputNumber id="experience" v-model="editForm.experience" :min="0" :max="50" />
                            </div>
                            <div class="p-field p-col-12 p-md-6">
                                <label for="memberSince">Member Since</label>
                                <Calendar id="memberSince" v-model="editForm.memberSince" dateFormat="yy-mm-dd" />
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Skills & Specialization -->
                <Card class="edit-section">
                    <template #title>
                        <div class="section-title">
                            <i class="pi pi-tags"></i>
                            <span>Skills & Specialization</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="p-fluid">
                            <div class="p-field p-col-12">
                                <label for="specialization">Specialization Areas</label>
                                <Chips id="specialization" v-model="editForm.specialization" separator="," />
                            </div>
                            <div class="p-field p-col-12">
                                <label for="skills">Skills</label>
                                <Chips id="skills" v-model="editForm.skills" separator="," />
                            </div>
                            <div class="p-field p-col-12">
                                <label for="languages">Languages</label>
                                <Chips id="languages" v-model="editForm.languages" separator="," />
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Right Column -->
            <div class="right-column">
                <!-- Profile Media -->
                <Card class="edit-section">
                    <template #title>
                        <div class="section-title">
                            <i class="pi pi-image"></i>
                            <span>Profile Media</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="media-upload-section">
                            <div class="avatar-upload">
                                <label>Profile Picture</label>
                                <div class="upload-container">
                                    <Avatar :image="editForm.avatarPreview || teacher?.avatar" size="xlarge" shape="circle" />

                                    <FileUpload mode="basic" name="avatar" accept="image/*" :maxFileSize="1000000" @uploader="onAvatarUpload" chooseLabel="Change" class="upload-button" />
                                </div>
                            </div>

                            <Divider />

                            <div class="cover-upload">
                                <label>Cover Photo</label>
                                <div class="cover-preview" :style="{ backgroundImage: `url(${editForm.coverPreview || teacher?.coverPhoto})` }">
                                    <FileUpload mode="basic" name="cover" accept="image/*" :maxFileSize="2000000" @uploader="onCoverUpload" chooseLabel="Change Cover" class="cover-upload-button" />
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Social Links -->
                <Card class="edit-section">
                    <template #title>
                        <div class="section-title">
                            <i class="pi pi-share-alt"></i>
                            <span>Social Links</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="p-fluid">
                            <div class="p-field p-col-12">
                                <label for="linkedin">LinkedIn</label>
                                <InputText id="linkedin" v-model="editForm.social.linkedin" placeholder="https://linkedin.com/in/username" />
                            </div>
                            <div class="p-field p-col-12">
                                <label for="twitter">Twitter</label>
                                <InputText id="twitter" v-model="editForm.social.twitter" placeholder="https://twitter.com/username" />
                            </div>
                            <div class="p-field p-col-12">
                                <label for="website">Personal Website</label>
                                <InputText id="website" v-model="editForm.social.website" placeholder="https://yourwebsite.com" />
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Teaching Preferences -->
                <Card class="edit-section">
                    <template #title>
                        <div class="section-title">
                            <i class="pi pi-cog"></i>
                            <span>Teaching Preferences</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="p-fluid">
                            <div class="p-field p-col-12">
                                <label>Available for Teaching</label>
                                <div class="p-d-flex p-ai-center">
                                    <InputSwitch v-model="editForm.available" />
                                    <span class="p-ml-2">{{ editForm.available ? 'Available' : 'Not Available' }}</span>
                                </div>
                            </div>

                            <div class="p-field p-col-12">
                                <label>Preferred Teaching Methods</label>
                                <div class="preference-checkboxes">
                                    <div v-for="method in teachingMethods" :key="method.value" class="p-field-checkbox">
                                        <Checkbox :id="method.value" name="teachingMethods" :value="method.value" v-model="editForm.teachingMethods" />
                                        <label :for="method.value">{{ method.label }}</label>
                                    </div>
                                </div>
                            </div>

                            <div class="p-field p-col-12">
                                <label for="officeHours">Office Hours</label>
                                <Textarea id="officeHours" v-model="editForm.officeHours" :autoResize="true" rows="3" placeholder="Example: Mondays 2-4pm, Wednesdays 10am-12pm" />
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>

<style scoped>
.teacher-profile-edit {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
}

.edit-header {
    background-color: var(--surface-card);
    border-radius: 12px 12px 0 0;
    margin-bottom: 1px;
}

.edit-form-container {
    display: flex;
    gap: 1.5rem;
}

.left-column {
    flex: 2;
}

.right-column {
    flex: 1;
}

.edit-section {
    margin-bottom: 1.5rem;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--primary-color);
}

.form-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.p-field {
    margin-bottom: 1rem;
}

.media-upload-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.avatar-upload,
.cover-upload {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.upload-container {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.upload-button {
    width: auto;
}

.cover-preview {
    height: 150px;
    background-size: cover;
    background-position: center;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.cover-upload-button {
    position: relative;
    z-index: 1;
}

.cover-preview::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
}

.preference-checkboxes {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.p-field-checkbox {
    display: flex;
    align-items: center;
}

.p-field-checkbox label {
    margin-left: 0.5rem;
}

@media (max-width: 960px) {
    .edit-form-container {
        flex-direction: column;
    }
}

@media (max-width: 768px) {
    .edit-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .edit-actions {
        width: 100%;
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
    }
}
</style>
