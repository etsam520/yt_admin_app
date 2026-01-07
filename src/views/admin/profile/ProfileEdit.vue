<script>
import { ref, reactive, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import axios from 'axios';
import { apiClient } from '@/service/apiService';
import { getAssetUrl } from '@/utils/helpers';

export default {
    props: {
        teacher: {
            type: Object,
            required: true
        }
    },
    setup(props, { emit }) {
        const toast = useToast();
        const saving = ref(false);
        const avatarPreview = ref(null);
        const coverPreview = ref(null);
        const errors = reactive({});

        const form = reactive({
            firstName: 'Sanj',
            lastName: 'khn',
            title: 'dummy title',
            organization: 'orginas',
            bio: 'Hloe the',
            education: 'Bcodn',
            experience: 0,
            memberSince: '2003',
            specialization: [], // Ensure this is always an array
            avatarFile: null,
            coverFile: null,
            social: { // Ensure this is always an object
                linkedin: 'as',
                twitter: 'as',
                website: 'rf'
            },
            available: true
        });

        // Initialize form with teacher data
        onMounted(() => {
            console.log(props.teacher);
            const nameParts = props.teacher?.name.split(' ');
            form.firstName = nameParts && nameParts.length > 0 ? nameParts[0] : '';
            form.lastName = nameParts && nameParts.length > 0 ? nameParts.slice(1).join(' ') : '';
            form.title = props.teacher.meta.find((meta) => meta.key == 'profession_title')?.value || '';
            form.bio = props.teacher.meta.find((meta) => meta.key == 'bio')?.value || '';
            form.education = props.teacher.meta.find((meta) => meta.key == 'education')?.value || '';
            form.experience = props.teacher.meta.find((meta) => meta.key == 'experience')?.value || '';
            form.memberSince = props.teacher.meta.find((meta) => meta.key == 'member_since')?.value || '';
            
            // Handle specialization field - ensure it's always an array
            const specializationMeta = props.teacher.meta.find((meta) => meta.key == 'specialization')?.value || '[]';
            try {
                const parsed = JSON.parse(specializationMeta);
                // If it's a string with comma-separated values, split it
                if (typeof parsed === 'string') {
                    form.specialization = parsed.split(',').map(s => s.trim()).filter(s => s);
                }
                // If it's already an array, use it
                else if (Array.isArray(parsed)) {
                    form.specialization = parsed;
                }
                // If it's an object or anything else, convert to empty array
                else {
                    form.specialization = [];
                }
            } catch (error) {
                // If JSON parsing fails, treat as comma-separated string
                form.specialization = specializationMeta.split(',').map(s => s.trim()).filter(s => s);
            }
            
            form.organization = props.teacher.meta.find((meta) => meta.key == 'organization')?.value || '';
            
            // Handle social field - ensure it's always an object
            const socialMeta = props.teacher.meta.find((meta) => meta.key == 'social')?.value || '{}';
            try {
                const parsed = JSON.parse(socialMeta);
                form.social = (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
            } catch (error) {
                form.social = {};
            }
            
            avatarPreview.value = getAssetUrl(props.teacher.meta.find((meta) => meta.key == 'avatar')?.file_path || null);
            coverPreview.value = getAssetUrl(props.teacher.meta.find((meta) => meta.key == 'cover_photo')?.file_path || null);
            console.log( props.teacher.meta, 'Printing availability of teacher');
            form.available = props.teacher.meta.find((m) => m.key === 'available')?.value == 'true';
            console.log(coverPreview.value);
            // form.available = props.teacher?.available !== false;
        });

        const onAvatarSelect = (event) => {
            const file = event.files[0];
            if (file) {
                form.avatarFile = file;
                const reader = new FileReader();
                reader.onload = (e) => {
                    avatarPreview.value = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };

        const onCoverSelect = (event) => {
            const file = event.files[0];
            if (file) {
                form.coverFile = file;
                const reader = new FileReader();
                reader.onload = (e) => {
                    coverPreview.value = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };

        const validateForm = () => {
            let isValid = true;
            // Clear previous errors
            Object.keys(errors).forEach((key) => delete errors[key]);

            // Validate required fields
            if (!form.firstName.trim()) {
                errors.firstName = 'First name is required';
                isValid = false;
            }

            if (!form.lastName.trim()) {
                errors.lastName = 'Last name is required';
                isValid = false;
            }

            if (!form.title.trim()) {
                errors.title = 'Professional title is required';
                isValid = false;
            }

            if (!form.bio.trim() || form.bio.trim().length < 50) {
                errors.bio = 'Bio must be at least 50 characters';
                isValid = false;
            }

            if (!form.education.trim()) {
                errors.education = 'Education information is required';
                isValid = false;
            }

            if (form.experience < 0) {
                errors.experience = 'Experience cannot be negative';
                isValid = false;
            }

            if (!Array.isArray(form.specialization) || form.specialization.length === 0) {
                errors.specialization = 'At least one specialization is required';
                isValid = false;
            }

            return isValid;
        };

        const submitForm = async () => {
            if (!validateForm()) {
                toast.add({
                    severity: 'error',
                    summary: 'Validation Error',
                    detail: 'Please fill all required fields correctly',
                    life: 5000
                });
                return;
            }

            saving.value = true;

            try {
                const formData = new FormData();
                formData.append('firstName', form.firstName);
                formData.append('lastName', form.lastName);
                formData.append('title', form.title);
                formData.append('organization', form.organization);
                formData.append('bio', form.bio);
                formData.append('education', form.education);
                formData.append('experience', form.experience);
                formData.append('memberSince', form.memberSince instanceof Date ? form.memberSince.toISOString().split('T')[0] : new Date(form.memberSince).toISOString().split('T')[0]);
                
                // Ensure specialization is always an array before processing
                if (Array.isArray(form.specialization) && form.specialization.length > 0) {
                    form.specialization.forEach((item, index) => formData.append(`specialization[${index}]`, item));
                }
                if (form.social && typeof form.social === 'object') {
                    if (form.social.linkedin) {
                        formData.append('social[linkedin]', form.social.linkedin);
                    }
                    if (form.social.twitter) {
                        formData.append('social[twitter]', form.social.twitter);
                    }
                    if (form.social.website) {
                        formData.append('social[website]', form.social.website);
                    }
                }

                // formData.append('specialization',form.specialization);
                // formData.append('social', form.social);
                formData.append('available', form.available);

                formData.append('image', form.image);
                if (form.avatarFile) {
                    formData.append('avatar', form.avatarFile);
                }

                if (form.coverFile) {
                    formData.append('coverPhoto', form.coverFile);
                }

                const response = await apiClient.post('/admin/teacher/profile', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                console.log('response', response);
                if (response) {
                    toast.add({
                        severity: 'success',
                        summary: 'Profile Updated',
                        detail: 'Your changes have been saved successfully',
                        life: 3000
                    });

                    emit('saved', response.data);
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                let errorMessage = 'There was an error saving your profile. Please try again.';

                if (error.response && error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }

                toast.add({
                    severity: 'error',
                    summary: 'Update Failed',
                    detail: errorMessage,
                    life: 5000
                });
            } finally {
                saving.value = false;
            }
        };

        const cancelEditing = () => {
            emit('cancel');
        };

        return {
            form,
            errors,
            saving,
            avatarPreview,
            coverPreview,
            onAvatarSelect,
            onCoverSelect,
            submitForm,
            cancelEditing
        };
    }
};
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Header with Save Controls -->
        <div class="bg-white shadow-sm sticky top-0 z-50">
            <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <div class="flex items-center">
                    <i class="pi pi-user-edit text-primary-500 text-xl mr-3"></i>
                    <h1 class="text-xl font-semibold text-gray-800">Edit Teacher Profile</h1>
                </div>
                <div class="flex space-x-3">
                    <Button label="Cancel" icon="pi pi-times" class="p-button-text text-gray-600 hover:text-gray-800" @click="cancelEditing" />
                    <Button label="Save Changes" icon="pi pi-check" :loading="saving" class="bg-primary-500 hover:bg-primary-600 border-primary-500" @click="submitForm" />
                </div>
            </div>
        </div>

        <!-- Main Form Content -->
        <div class="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column (2/3 width) -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Basic Information Card -->
                <Card class="shadow-sm rounded-lg border border-gray-100">
                    <template #title>
                        <div class="flex items-center text-primary-500">
                            <i class="pi pi-id-card mr-2"></i>
                            <span class="font-medium">Basic Information</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
                                <InputText id="firstName" v-model.trim="form.firstName" :class="{ 'p-invalid': errors.firstName, 'w-full': true }" />
                                <small class="p-error text-xs" v-if="errors.firstName">{{ errors.firstName }}</small>
                            </div>
                            <div>
                                <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
                                <InputText id="lastName" v-model.trim="form.lastName" :class="{ 'p-invalid': errors.lastName, 'w-full': true }" />
                                <small class="p-error text-xs" v-if="errors.lastName">{{ errors.lastName }}</small>
                            </div>
                            <div class="md:col-span-2">
                                <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Professional Title*</label>
                                <InputText id="title" v-model.trim="form.title" :class="{ 'p-invalid': errors.title, 'w-full': true }" />
                                <small class="p-error text-xs" v-if="errors.title">{{ errors.title }}</small>
                            </div>
                            <div class="md:col-span-2">
                                <label for="organization" class="block text-sm font-medium text-gray-700 mb-1">Institution/Organization</label>
                                <InputText id="organization" v-model.trim="form.organization" class="w-full" />
                            </div>
                            <div class="md:col-span-2">
                                <label for="bio" class="block text-sm font-medium text-gray-700 mb-1">Professional Bio*</label>
                                <Textarea id="bio" v-model.trim="form.bio" :autoResize="true" rows="5" :class="{ 'p-invalid': errors.bio, 'w-full': true }" />
                                <small class="p-error text-xs" v-if="errors.bio">{{ errors.bio }}</small>
                                <small class="text-xs text-gray-500">Briefly describe your teaching philosophy and experience (min. 50 characters)</small>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Education & Expertise Card -->
                <Card class="shadow-sm rounded-lg border border-gray-100">
                    <template #title>
                        <div class="flex items-center text-primary-500">
                            <i class="pi pi-graduation-cap mr-2"></i>
                            <span class="font-medium">Education & Expertise</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="md:col-span-2">
                                <label for="education" class="block text-sm font-medium text-gray-700 mb-1">Education*</label>
                                <InputText id="education" v-model.trim="form.education" :class="{ 'p-invalid': errors.education, 'w-full': true }" placeholder="Degrees, certifications, etc." />
                                <small class="p-error text-xs" v-if="errors.education">{{ errors.education }}</small>
                            </div>
                            <div>
                                <label for="experience" class="block text-sm font-medium text-gray-700 mb-1">Years of Experience*</label>
                                <InputNumber id="experience" v-model="form.experience" :min="0" :max="50" :class="{ 'p-invalid': errors.experience, 'w-full': true }" />
                                <small class="p-error text-xs" v-if="errors.experience">{{ errors.experience }}</small>
                            </div>
                            <div>
                                <label for="memberSince" class="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                                <Calendar id="memberSince" v-model="form.memberSince" dateFormat="yy-mm-dd" :class="{ 'p-invalid': errors.memberSince, 'w-full': true }" />
                                <small class="p-error text-xs" v-if="errors.memberSince">{{ errors.memberSince }}</small>
                            </div>
                            <div class="md:col-span-2">
                                <label for="specialization" class="block text-sm font-medium text-gray-700 mb-1">Specialization Areas*</label>
                                <Chips id="specialization" v-model="form.specialization" separator="," :class="{ 'p-invalid': errors.specialization }" class="w-full" />
                                <small class="p-error text-xs" v-if="errors.specialization">{{ errors.specialization }}</small>
                                <small class="text-xs text-gray-500">Separate with commas (e.g., Calculus, Algebra)</small>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Right Column (1/3 width) -->
            <div class="space-y-6">
                <!-- Profile Media Card -->
                <Card class="shadow-sm rounded-lg border border-gray-100">
                    <template #title>
                        <div class="flex items-center text-primary-500">
                            <i class="pi pi-image mr-2"></i>
                            <span class="font-medium">Profile Media</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="space-y-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                                <div class="flex flex-col items-center">
                                    <Avatar :image="avatarPreview || teacher?.avatar" size="xlarge" shape="circle" class="w-32 h-32 border-4 border-white shadow-md mb-3" />
                                    <FileUpload mode="basic" name="avatar" accept="image/*" :maxFileSize="1000000" @select="onAvatarSelect" chooseLabel="Change Photo" :class="{ 'p-invalid': errors.avatar }" />
                                    <small class="p-error text-xs mt-1" v-if="errors.avatar">{{ errors.avatar }}</small>
                                </div>
                            </div>

                            <Divider class="my-4" />

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Cover Photo</label>
                                <div class="relative rounded-lg overflow-hidden border border-gray-200 h-40">
                                    <div class="absolute inset-0 bg-cover bg-center" :style="{ backgroundImage: `url(${coverPreview || teacher?.coverPhoto})` }">
                                        <div class="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                            <FileUpload mode="basic" name="cover" accept="image/*" :maxFileSize="2000000" @select="onCoverSelect" chooseLabel="Change Cover" />
                                        </div>
                                    </div>
                                </div>
                                <small class="text-xs text-gray-500 mt-1 block">Recommended size: 1200×400 pixels</small>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Social & Preferences Card -->
                <Card class="shadow-sm rounded-lg border border-gray-100">
                    <template #title>
                        <div class="flex items-center text-primary-500">
                            <i class="pi pi-share-alt mr-2"></i>
                            <span class="font-medium">Social & Preferences</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="space-y-4">
                            <div>
                                <label for="linkedin" class="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
                                <InputText id="linkedin" v-model.trim="form.social.linkedin" class="w-full" placeholder="https://linkedin.com/in/username" />
                            </div>
                            <div>
                                <label for="twitter" class="block text-sm font-medium text-gray-700 mb-1">Twitter Handle</label>
                                <InputText id="twitter" v-model.trim="form.social.twitter" class="w-full" placeholder="https://twitter.com/username" />
                            </div>
                            <div>
                                <label for="website" class="block text-sm font-medium text-gray-700 mb-1">Personal Website</label>
                                <InputText id="website" v-model.trim="form.social.website" class="w-full" placeholder="https://yourwebsite.com" />
                            </div>

                            <Divider class="my-4" />

                            <div class="flex items-center">
                                <InputSwitch v-model="form.available" />
                                <span class="ml-3 text-sm font-medium text-gray-700">
                                    {{ form.available ? 'Available for teaching' : 'Not currently available' }}
                                </span>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Toast Notification -->
        <Toast position="top-right" />
    </div>
</template>

<style>
/* Custom overrides to blend PrimeVue with Tailwind */
.p-card {
    @apply bg-white rounded-lg shadow-sm border border-gray-100;
}

.p-card-title {
    @apply text-lg font-semibold text-gray-800 mb-4;
}

.p-card-content {
    @apply p-0;
}

.p-inputtext {
    @apply w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500;
}

.p-inputtext:disabled {
    @apply bg-gray-100;
}

.p-chips {
    @apply w-full;
}

.p-chips-token {
    @apply bg-primary-100 text-primary-800 rounded-full px-3 py-1 text-sm;
}

.p-chips-input-token input {
    @apply text-sm;
}

.p-calendar {
    @apply w-full;
}

.p-fileupload-choose {
    @apply bg-white border border-gray-300 text-gray-700 hover:bg-gray-50;
}

.p-error {
    @apply text-red-500 text-xs mt-1;
}

/* Custom primary color */
.bg-primary-500 {
    background-color: #6366f1;
}
.hover\:bg-primary-600:hover {
    background-color: #4f46e5;
}
.border-primary-500 {
    border-color: #6366f1;
}
.text-primary-500 {
    color: #6366f1;
}
</style>
