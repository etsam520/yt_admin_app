<script setup>
import { ref, reactive, computed, onMounted, toRaw } from 'vue';
import { useToast } from 'primevue/usetoast';
import { apiClient } from '@/service/apiService';

const props = defineProps({
    isEdit: Boolean,
    initialData: {
        type: Object,
        default: () => ({
            name: '',
            description: '',
            is_active: true,
            is_public: false,
            password: null,
            organization: null,
            subject_id: null,
            chapter_id: null,
            topic_id: null,
            total_marks: 0,
            negative_mark: 0
        })
    }
});

const emit = defineEmits(['save', 'update', 'cancel']);

const toast = useToast();
const submitted = ref(false);
// const subjects = ref([])
// const chapters = ref([])
// const topics = ref([])

const form = reactive({
    ...props.initialData,
    folder_id: props.initialData.folder_id || null
});

const errors = reactive({
    name: '',
    password: '',
    description: '',
    organization: '',
    total_marks: '',
    negative_mark: ''
});

const validationErrors = ref({});
const validationMessage = ref('');
const showValidationAlert = ref(false);

const organizations = ref([
    { name: 'Banking', value: 1 },
    { name: 'SSC', value: 2 },
    { name: 'ETS', value: 3 },
    { name: 'Railway', value: 4 }
]);

const statusOptions = ref([
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
]);

const visibilityOptions = ref([
    { label: 'Public', value: true },
    { label: 'Private', value: false }
]);

/*()
const requireChapter = computed(() => {
  if (!form.subject_id) return false
  const subject = subjects.value.find(s => s.id === form.subject_id)
  return subject?.has_chapters || false
})

const requireTopic = computed(() => {
  if (!form.chapter_id) return false
  const chapter = chapters.value.find(c => c.id === form.chapter_id)
  return chapter?.has_topics || false
})
*/
onMounted(async () => {
    // alert('SetForm mountedd');
    // await loadSubjects()
    loadOrganizations();

    // if (props.isEdit && form.subject_id) {
    //   await loadChapters()
    //   if (form.chapter_id) {
    //     await loadTopics()
    //   }
    // }
});

/*async function loadSubjects() {
  try {
    const response = await apiClient.get('/admin/category-by-depth-index', {
      params: { depth_index: 'subject' }
    })
    subjects.value = response.data.data.map(subject => ({
      ...subject,
      has_chapters: subject.children && subject.children.length > 0
    }))
  } catch (error) {
    showError('Failed to load subjects', error)
  }
}*/

const loadOrganizations = () => {
    // fetch data from API
    apiClient
        .get('/admin/organizations')
        .then((response) => {
            organizations.value = response.data.data;
        })
        .catch((error) => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load organizations', life: 3000 });
        });
};
/*
async function loadChapters() {
  form.chapter_id = null
  form.topic_id = null
  chapters.value = []
  topics.value = []
  
  if (!form.subject_id) return
  
  try {
    const response = await apiClient.get('/admin/category-by-depth-index', {
      params: { 
        parent_id: form.subject_id,
        depth_index: 'chapter'
      }
    })
    chapters.value = response.data.data.map(chapter => ({
      ...chapter,
      has_topics: chapter.children && chapter.children.length > 0
    }))
  } catch (error) {
    showError('Failed to load chapters', error)
  }
}

async function loadTopics() {
  form.topic_id = null
  topics.value = []
  
  if (!form.chapter_id) return
  
  try {
    const response = await apiClient.get('/admin/category-by-depth-index', {
      params: { 
        parent_id: form.chapter_id,
        depth_index: 'topic'
      }
    })
    topics.value = response.data.data
  } catch (error) {
    showError('Failed to load topics', error)
  }
}
*/
function clearValidationErrors() {
    validationErrors.value = {};
    validationMessage.value = '';
    showValidationAlert.value = false;
    
    // Clear individual field errors
    Object.keys(errors).forEach(key => {
        errors[key] = '';
    });
}

function displayValidationErrors(errorResponse) {
    if (errorResponse.response?.data) {
        const data = errorResponse.response.data;
        
        if (data.message) {
            validationMessage.value = data.message;
            showValidationAlert.value = true;
        }
        
        if (data.errors) {
            validationErrors.value = data.errors;
            
            // Map API errors to form errors
            Object.keys(data.errors).forEach(field => {
                if (errors.hasOwnProperty(field)) {
                    errors[field] = Array.isArray(data.errors[field]) 
                        ? data.errors[field][0] 
                        : data.errors[field];
                }
            });
        }
    }
}

function validateForm() {
    submitted.value = true;
    clearValidationErrors();
    let isValid = true;

    // Client-side validation
    if (!form.name || form.name.trim().length === 0) {
        errors.name = 'Name is required';
        isValid = false;
    } else if (form.name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters';
        isValid = false;
    } else {
        errors.name = '';
    }

    if (!form.password && !props.isEdit) {
        errors.password = 'Password is required';
        isValid = false;
    } else if (form.password && form.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
        isValid = false;
    } else {
        errors.password = '';
    }

    if (!form.organization) {
        errors.organization = 'Organization is required';
        isValid = false;
    } else {
        errors.organization = '';
    }

    if (form.total_marks < 0) {
        errors.total_marks = 'Total marks must be a positive number';
        isValid = false;
    } else {
        errors.total_marks = '';
    }

    if (form.negative_mark < 0 || form.negative_mark > form.total_marks) {
        errors.negative_mark = 'Negative mark must be between 0 and total marks';
        isValid = false;
    } else {
        errors.negative_mark = '';
    }

    return isValid;
}

async function submitForm() {
    if (!validateForm()) return;

    try {
        if (props.isEdit) {
            // Update existing set
            const _set = { ...toRaw(form) };
            _set._method = 'PUT';
            await apiClient.post(`/admin/question-sets/${form.id}`, _set);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Set updated successfully',
                life: 3000
            });
            emit('update', form);
        } else {
            // Create new set
            const formData = { ...form };
            if (formData.folder_id === null || formData.folder_id === undefined) {
                delete formData.folder_id; // Don't send null folder_id
            }
            const response = await apiClient.post('/admin/question-sets', formData);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Set created successfully',
                life: 3000
            });
            emit('save', response.data);
        }
    } catch (error) {
        if (error.response?.status === 422) {
            // Validation error
            displayValidationErrors(error);
        } else {
            showError(props.isEdit ? 'Failed to update set' : 'Failed to create set', error);
        }
    }
}

function showError(message, error) {
    console.error(error);
    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000
    });
}
</script>

<template>
    <div class="p-6 bg-white shadow-xl rounded-2xl max-w-4xl mx-auto">
        <h2 class="text-2xl font-semibold mb-6 text-gray-800">
            {{ isEdit ? 'Edit Set' : 'Create New Set' }}
        </h2>

        <!-- Validation Error Alert -->
        <Message 
            v-if="showValidationAlert" 
            severity="error" 
            :closable="true" 
            @close="showValidationAlert = false"
            class="mb-4"
        >
            <div>
                <div class="font-semibold mb-2">{{ validationMessage || 'Validation failed' }}</div>
                <div v-if="Object.keys(validationErrors).length > 0">
                    <div class="text-sm">
                        <div v-for="(errorMessages, field) in validationErrors" :key="field" class="mb-1">
                            <strong>{{ field.charAt(0).toUpperCase() + field.slice(1) }}:</strong>
                            <ul class="list-disc list-inside ml-2">
                                <li v-for="error in (Array.isArray(errorMessages) ? errorMessages : [errorMessages])" :key="error">
                                    {{ error }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </Message>

        <div class="mb-4">
            <label for="name" class="block text-sm font-medium text-gray-700">Name *</label>
            <InputText 
                id="name" 
                v-model="form.name" 
                :class="[
                    'mt-1 block w-full rounded-md border-gray-300 shadow-sm', 
                    { 'p-invalid border-red-500': errors.name || validationErrors.name }
                ]" 
                required 
            />
            <small v-if="errors.name || validationErrors.name" class="p-error text-red-500 block mt-1">
                {{ errors.name || (validationErrors.name && validationErrors.name[0]) }}
            </small>
        </div>

        <div class="mb-4">
            <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
            <Textarea 
                id="description" 
                v-model="form.description" 
                rows="3" 
                :class="[
                    'mt-1 block w-full rounded-md border-gray-300 shadow-sm',
                    { 'p-invalid': errors.description || validationErrors.description }
                ]" 
            />
            <small v-if="errors.description || validationErrors.description" class="p-error text-red-500 block mt-1">
                {{ errors.description || (validationErrors.description && validationErrors.description[0]) }}
            </small>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
            <div>
                <label for="is_active" class="block text-sm font-medium text-gray-700">Status</label>
                <Select id="is_active" v-model="form.is_active" :options="statusOptions" optionLabel="label" optionValue="value" class="mt-1 w-full" />
            </div>

            <div>
                <label for="is_public" class="block text-sm font-medium text-gray-700">Visibility</label>
                <Select id="is_public" v-model="form.is_public" :options="visibilityOptions" optionLabel="label" optionValue="value" class="mt-1 w-full" />
            </div>
        </div>
        <!-- Marks Section -->
        <div class="mb-6 grid grid-cols-2 gap-4 mt-4">
            <div>
                <label class="block font-medium mb-2">Total Marks:</label>
                <InputNumber 
                    v-model="form.total_marks" 
                    :class="[
                        'w-full',
                        { 'p-invalid': errors.total_marks || validationErrors.total_marks }
                    ]" 
                    :min="0" 
                />
                <small v-if="errors.total_marks || validationErrors.total_marks" class="p-error text-red-500 block mt-1">
                    {{ errors.total_marks || (validationErrors.total_marks && validationErrors.total_marks[0]) }}
                </small>
            </div>
            <div>
                <label class="block font-medium mb-2">Negative Mark:</label>
                <InputNumber 
                    v-model="form.negative_mark" 
                    :class="[
                        'w-full',
                        { 'p-invalid': errors.negative_mark || validationErrors.negative_mark }
                    ]" 
                    :min="0" 
                    :max="Math.ceil(form.total_marks * 0.02)" 
                />
                <small v-if="errors.negative_mark || validationErrors.negative_mark" class="p-error text-red-500 block mt-1">
                    {{ errors.negative_mark || (validationErrors.negative_mark && validationErrors.negative_mark[0]) }}
                </small>
            </div>
            <div>
                <label for="organization" class="block text-sm font-medium text-gray-700">Organization *</label>
                <Dropdown 
                    id="organization" 
                    v-model="form.organization" 
                    :options="organizations" 
                    optionLabel="name" 
                    optionValue="id" 
                    placeholder="Select Organization" 
                    :class="{ 
                        'p-invalid': errors.organization || validationErrors.organization || (submitted && !form.organization) 
                    }" 
                />
                <small class="p-error" v-if="errors.organization || validationErrors.organization || (submitted && !form.organization)">
                    {{ errors.organization || (validationErrors.organization && validationErrors.organization[0]) || 'Organization is required.' }}
                </small>
            </div>
        </div>

        <div class="mt-6" v-if="!isEdit">
            <label for="password" class="block text-sm font-medium text-gray-700">Password *</label>
            <Password 
                id="password" 
                v-model="form.password" 
                :feedback="false" 
                toggleMask 
                :class="[
                    'mt-1 block w-full', 
                    { 'p-invalid border-red-500': errors.password || validationErrors.password }
                ]" 
                required 
            />
            <small v-if="errors.password || validationErrors.password" class="p-error text-red-500 block mt-1">
                {{ errors.password || (validationErrors.password && validationErrors.password[0]) }}
            </small>
        </div>

        <div class="grid md:grid-cols-2 gap-6 mt-6" v-if="false">
            <div>
                <label for="subject" class="block text-sm font-medium text-gray-700">Subject *</label>
                <Select id="subject" v-model="form.subject_id" :options="subjects" optionLabel="name" optionValue="id" placeholder="Select Subject" :class="{ 'p-invalid': submitted && !form.subject_id }" @change="loadChapters" />
                <small class="p-error" v-if="submitted && !form.subject_id"> Subject is required. </small>
            </div>

            <div>
                <label for="chapter" class="block text-sm font-medium text-gray-700">Chapter</label>
                <Select
                    id="chapter"
                    :disabled="chapters.length == 0"
                    v-model="form.chapter_id"
                    :options="chapters"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select Chapter"
                    :class="{ 'p-invalid': submitted && requireChapter && !form.chapter_id }"
                    @change="loadTopics"
                />
                <small class="p-error" v-if="submitted && requireChapter && !form.chapter_id"> Chapter is required for this subject. </small>
            </div>

            <div>
                <label for="topic" class="block text-sm font-medium text-gray-700">Topic</label>
                <Select id="topic" :desabled="topics.length == 0" v-model="form.topic_id" :options="topics" optionLabel="name" optionValue="id" placeholder="Select Topic" :class="{ 'p-invalid': submitted && requireTopic && !form.topic_id }" />
                <small class="p-error" v-if="submitted && requireTopic && !form.topic_id"> Topic is required for this chapter. </small>
            </div>
        </div>

        <div class="mt-8 flex justify-end space-x-4">
            <Button label="Cancel" icon="pi pi-times" class="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-lg px-4 py-2" @click="$emit('cancel')" />
            <Button :label="isEdit ? 'Update' : 'Create'" icon="pi pi-check" class="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2" @click="submitForm" />
        </div>
    </div>
</template>

<style scoped>
.p-error {
    color: #e24c4c;
    font-size: 0.875rem;
}

.p-invalid {
    border-color: #e24c4c !important;
}

.p-invalid:focus {
    outline: none;
    border-color: #e24c4c !important;
    box-shadow: 0 0 0 0.2rem rgba(226, 76, 76, 0.25) !important;
}

/* PrimeVue Message component override for better error display */
:deep(.p-message-error) {
    background: #fef2f2;
    border: solid #fecaca;
    border-width: 0 0 0 6px;
    color: #b91c1c;
}

:deep(.p-message-error .p-message-icon) {
    color: #dc2626;
}
</style>
