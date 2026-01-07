<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { apiClient } from '@/service/apiService';

const props = defineProps({
    isEdit: Boolean,
    initialData: {
        type: Object,
        default: () => ({
            name: '',
            parent_id: null
        })
    }
});

const emit = defineEmits(['save', 'cancel']);

const toast = useToast();
const submitted = ref(false);

const form = reactive({
    ...props.initialData
});

const errors = reactive({
    name: ''
});

const validationErrors = ref({});
const validationMessage = ref('');
const showValidationAlert = ref(false);

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

    if (!form.name || form.name.trim().length === 0) {
        errors.name = 'Folder name is required';
        isValid = false;
    } else if (form.name.trim().length < 2) {
        errors.name = 'Folder name must be at least 2 characters';
        isValid = false;
    } else if (form.name.trim().length > 100) {
        errors.name = 'Folder name must be less than 100 characters';
        isValid = false;
    } else if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(form.name.trim())) {
        errors.name = 'Folder name contains invalid characters';
        isValid = false;
    } else {
        errors.name = '';
    }

    return isValid;
}

async function submitForm() {
    if (!validateForm()) return;

    try {
        const formData = {
            name: form.name.trim(),
            parent_id: form.parent_id
        };
        if(form.parent_id === null || form.parent_id === undefined) {
            formData.part_of = "question_set"; // or any default value indicating root
        }

        if (props.isEdit) {
            // Update existing folder
            await apiClient.put(`/admin/folders/${form.id}`, formData);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Folder updated successfully',
                life: 3000
            });
        } else {
            // Create new folder
            await apiClient.post('/admin/folders', formData);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Folder created successfully',
                life: 3000
            });
        }
        
        emit('save');
    } catch (error) {
        console.error('Folder operation error:', error);
        
        // Handle specific error cases
        if (error.response?.status === 422) {
            // Validation error
            displayValidationErrors(error);
        } else if (error.response?.status === 409) {
            errors.name = 'A folder with this name already exists in this location';
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: props.isEdit ? 'Failed to update folder' : 'Failed to create folder',
                life: 5000
            });
        }
    }
}

function handleCancel() {
    emit('cancel');
}

// Auto-focus on name input when dialog opens
onMounted(() => {
    setTimeout(() => {
        const nameInput = document.getElementById('folderName');
        if (nameInput) {
            nameInput.focus();
            nameInput.select();
        }
    }, 100);
});
</script>

<template>
    <div class="folder-form">
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
            <label for="folderName" class="block text-sm font-medium text-gray-700 mb-2">
                Folder Name *
            </label>
            <InputText 
                id="folderName"
                v-model="form.name" 
                :class="[
                    'w-full',
                    { 'p-invalid': errors.name || validationErrors.name }
                ]"
                placeholder="Enter folder name..."
                maxlength="100"
                @keyup.enter="submitForm"
            />
            <small v-if="errors.name || validationErrors.name" class="p-error block mt-1">
                {{ errors.name || (validationErrors.name && validationErrors.name[0]) }}
            </small>
            <small class="text-gray-500 block mt-1">
                Use letters, numbers, spaces, hyphens, underscores, and periods only.
            </small>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t">
            <Button 
                label="Cancel" 
                icon="pi pi-times" 
                class="p-button-text" 
                @click="handleCancel"
            />
            <Button 
                :label="isEdit ? 'Update' : 'Create'" 
                icon="pi pi-check" 
                class="p-button-primary" 
                @click="submitForm"
                :loading="submitted"
            />
        </div>
    </div>
</template>

<style scoped>
.folder-form {
    min-width: 300px;
}

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