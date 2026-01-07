<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import Dialog from 'primevue/dialog';
import Dropzone from '@/components/Dropzone.vue';
import QuestionPreview from './QuestionPreview.vue';
import { uploadFile, deleteFile } from '@/utils/fileUpload';
import { apiClient } from '@/service/apiService';

const toast = useToast();

// Question data structure
const questionData = ref({
    question: {
        text: '',
        images: []
    },
    type: 'multiple_choice',
    options: [
        { text: '', images: [] },
        { text: '', images: [] },
        { text: '', images: [] },
        { text: '', images: [] }
    ],
    answer: {
        text: '',
        images: []
    },
    solution: {
        text: '',
        images: []
    },
    positive_marks: 4,
    negative_marks: 1
});

const previewData = ref(null);
const editingId = ref(null);
const showPreviewSection = ref(false);
const previewMode = ref('web');
const isSaving = ref(false);
const showResetConfirm = ref(false);
const uploadedFiles = ref([]);

// Computed properties
const canPreview = computed(() => {
    return questionData.value.question.text || questionData.value.answer.text || questionData.value.solution.text;
});

const props = defineProps({
    qData: {
        type: Object,
        required: true
    },
    eId: {
        type: Number,
        required: true
    },
    directoryMeta: {
        type: Object,
        required: true
    }
});
const emit = defineEmits(['close', 'saved']);

// Dropzone configuration
const dropzoneOptions = {
    url: '/api/upload',
    maxFilesize: 5, // MB
    acceptedFiles: 'image/*',
    addRemoveLinks: true,
    autoProcessQueue: false,
    createImageThumbnails: true,
    thumbnailWidth: 150,
    thumbnailHeight: 150
};

// Handle page refresh/close
const beforeUnloadHandler = (e) => {
    if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
    }
};

// Check if there are unsaved changes
const hasUnsavedChanges = () => {
    return (
        questionData.value.question.text ||
        questionData.value.question.images.length > 0 ||
        questionData.value.options.some((opt) => opt.text || opt.images.length > 0) ||
        questionData.value.answer.text ||
        questionData.value.answer.images.length > 0 ||
        questionData.value.solution.text ||
        questionData.value.solution.images.length > 0
    );
};

// Setup event listeners
onMounted(() => {
    if (props.eId) {
        editingId.value = props.eId;
        questionData.value = props.qData;
        uploadedFiles.value = [...questionData.value.question.images, ...questionData.value.options.flatMap((opt) => opt.images), ...questionData.value.answer.images, ...questionData.value.solution.images];
    }
    window.addEventListener('beforeunload', beforeUnloadHandler);
});

// Cleanup event listeners
onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    cleanupUnsavedImages();
});

// Cleanup uploaded but unsaved images
const cleanupUnsavedImages = async () => {
    if (editingId.value) return;

    try {
        const filesToDelete = uploadedFiles.value.filter((file) => !file.saved);
        await Promise.all(filesToDelete.map((file) => deleteFile(file.serverId)));
    } catch (error) {
        console.error('Error cleaning up unsaved images:', error);
    }
};

// Handle image upload
const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const resp = await uploadFile(formData);
        return {
            preview: URL.createObjectURL(file),
            filename: resp.data.unique_name,
            file_path: resp.data.file_path,
            serverId: resp.data.id,
            saved: false
        };
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

// Image handlers for each section
const handleQuestionImageAdded = async (file) => {
    try {
        const uploadedImage = await uploadImage(file);
        questionData.value.question.images.push(uploadedImage);
        uploadedFiles.value.push(uploadedImage);
    } catch (error) {
        showErrorToast('Upload Failed', 'Failed to upload question image');
    }
};

const handleOptionImageAdded = async (index, file) => {
    try {
        const uploadedImage = await uploadImage(file);
        questionData.value.options[index].images.push(uploadedImage);
        uploadedFiles.value.push(uploadedImage);
    } catch (error) {
        showErrorToast('Upload Failed', `Failed to upload option ${String.fromCharCode(65 + index)} image`);
    }
};

const handleAnswerImageAdded = async (file) => {
    try {
        const uploadedImage = await uploadImage(file);
        questionData.value.answer.images.push(uploadedImage);
        uploadedFiles.value.push(uploadedImage);
    } catch (error) {
        showErrorToast('Upload Failed', 'Failed to upload answer image');
    }
};

const handleSolutionImageAdded = async (file) => {
    try {
        const uploadedImage = await uploadImage(file);
        questionData.value.solution.images.push(uploadedImage);
        uploadedFiles.value.push(uploadedImage);
    } catch (error) {
        showErrorToast('Upload Failed', 'Failed to upload solution image');
    }
};

// Image removal handlers
const handleQuestionImageRemoved = async (file) => {
    const index = questionData.value.question.images.findIndex((img) => img.filename === file.name);
    if (index !== -1) await removeImage('question', index);
};

const handleOptionImageRemoved = async (index, file) => {
    const imgIndex = questionData.value.options[index].images.findIndex((img) => img.filename === file.name);
    if (imgIndex !== -1) await removeImage('option' + index, imgIndex);
};

const handleAnswerImageRemoved = async (file) => {
    const index = questionData.value.answer.images.findIndex((img) => img.filename === file.name);
    if (index !== -1) await removeImage('answer', index);
};

const handleSolutionImageRemoved = async (file) => {
    const index = questionData.value.solution.images.findIndex((img) => img.filename === file.name);
    if (index !== -1) await removeImage('solution', index);
};

const removeImage = async (field, index) => {
    let imageToRemove;

    if (field === 'question') {
        imageToRemove = questionData.value.question.images[index];
        questionData.value.question.images.splice(index, 1);
    } else if (field.startsWith('option')) {
        const optionIndex = parseInt(field.replace('option', ''));
        imageToRemove = questionData.value.options[optionIndex].images[index];
        questionData.value.options[optionIndex].images.splice(index, 1);
    } else if (field === 'answer') {
        imageToRemove = questionData.value.answer.images[index];
        questionData.value.answer.images.splice(index, 1);
    } else if (field === 'solution') {
        imageToRemove = questionData.value.solution.images[index];
        questionData.value.solution.images.splice(index, 1);
    }

    // Remove from uploaded files tracking
    uploadedFiles.value = uploadedFiles.value.filter((file) => file.serverId !== imageToRemove?.serverId);

    // Delete from server if not saved with a question
    if (imageToRemove && !imageToRemove.saved) {
        try {
            await deleteFile(imageToRemove.serverId);
        } catch (error) {
            console.error('Error deleting image:', error);
            showErrorToast('Delete Failed', 'Failed to delete image from server');
        }
    }
};

// Option management
const addOption = () => {
    if (questionData.value.options.length < 6) {
        questionData.value.options.push({ text: '', images: [] });
    }
};

const removeOption = (index) => {
    if (questionData.value.options.length > 2) {
        // Clean up any images in this option
        questionData.value.options[index].images.forEach(async (img) => {
            if (!img.saved) {
                try {
                    await deleteFile(img.serverId);
                } catch (error) {
                    console.error('Error deleting option image:', error);
                }
            }
        });
        questionData.value.options.splice(index, 1);
    }
};

// Form actions
const confirmReset = () => {
    if (hasUnsavedChanges()) {
        showResetConfirm.value = true;
    } else {
        resetForm();
    }
};

const resetForm = () => {
    cleanupUnsavedImages().finally(() => {
        questionData.value = {
            question: {
                text: '',
                images: []
            },
            type: 'multiple_choice',
            options: [
                { text: '', images: [] },
                { text: '', images: [] },
                { text: '', images: [] },
                { text: '', images: [] }
            ],
            answer: {
                text: '',
                images: []
            },
            solution: {
                text: '',
                images: []
            },
            positive_marks: 4,
            negative_marks: 1
        };
        previewData.value = null;
        editingId.value = null;
        showPreviewSection.value = false;
        showResetConfirm.value = false;
        uploadedFiles.value = [];
    });
};

const preparePayload = () => {
    const payload = JSON.parse(JSON.stringify(questionData.value));

    // Convert images to server paths
    payload.question.images = payload.question.images.map((img) => ({
        path: img.file_path,
        serverId: img.serverId
    }));

    payload.options.forEach((opt) => {
        opt.images = opt.images.map((img) => ({
            path: img.file_path,
            serverId: img.serverId
        }));
    });

    payload.answer.images = payload.answer.images.map((img) => ({
        path: img.file_path,
        serverId: img.serverId
    }));

    payload.solution.images = payload.solution.images.map((img) => ({
        path: img.file_path,
        serverId: img.serverId
    }));

    payload.meta = {
        directoryId: props.directoryMeta.directoryId,
        courseId: props.directoryMeta.courseId
    };

    return payload;
};

const showPreview = () => {
    previewData.value = preparePayload();
    showPreviewSection.value = true;
};

// Question CRUD operations
const saveQuestion = async () => {
    if (!validateQuestion()) return;

    isSaving.value = true;
    const payload = preparePayload();

    try {
        const response = await apiClient.post('/admin/questions', payload);

        // Mark all images as saved
        uploadedFiles.value.forEach((file) => {
            if (
                payload.question.images.some((img) => img.serverId === file.serverId) ||
                payload.options.some((opt) => opt.images.some((img) => img.serverId === file.serverId)) ||
                payload.answer.images.some((img) => img.serverId === file.serverId) ||
                payload.solution.images.some((img) => img.serverId === file.serverId)
            ) {
                file.saved = true;
            }
        });

        showSuccessToast('Question saved successfully');
        resetForm();
        setTimeout(() => {
            emit('saved', response.data);
        }, 2000); // Emit saved event after a short delay to ensure UI updates
    } catch (error) {
        console.error('Error saving question:', error);
        showErrorToast('Save Failed', 'Failed to save question');
    } finally {
        isSaving.value = false;
    }
};

const updateQuestion = async () => {
    if (!editingId.value || !validateQuestion()) return;

    isSaving.value = true;
    const payload = preparePayload();
    payload.id = editingId.value;
    console.log('Updating question with payload:', payload);

    try {
        const _q = { ...toRaw(payload) };
        _q._method = 'PUT';
        const response = await apiClient.post(`/admin/questions/${editingId.value}`, _q);

        // Mark all images as saved
        uploadedFiles.value.forEach((file) => {
            if (
                payload.question.images.some((img) => img.serverId === file.serverId) ||
                payload.options.some((opt) => opt.images.some((img) => img.serverId === file.serverId)) ||
                payload.answer.images.some((img) => img.serverId === file.serverId) ||
                payload.solution.images.some((img) => img.serverId === file.serverId)
            ) {
                file.saved = true;
            }
        });

        showSuccessToast('Question updated successfully');
        resetForm();
        setTimeout(() => {
            emit('saved', response.data);
        }, 2000); // Emit saved event after a short delay to ensure UI updates
    } catch (error) {
        console.error('Error updating question:', error);
        showErrorToast('Update Failed', 'Failed to update question');
    } finally {
        isSaving.value = false;
    }
};

const validateQuestion = () => {
    if (!questionData.value.question.text) {
        showWarningToast('Validation Error', 'Question text is required');
        return false;
    }

    if (questionData.value.options.some((opt) => !opt.text)) {
        showWarningToast('Validation Error', 'All options must have text');
        return false;
    }

    if (!questionData.value.answer.text) {
        showWarningToast('Validation Error', 'Answer text is required');
        return false;
    }

    return true;
};

const loadQuestionForEdit = (question) => {
    resetForm();
    editingId.value = question.id;

    // Deep clone the question data to avoid reference issues
    questionData.value = JSON.parse(JSON.stringify(question));

    // Update preview URLs for images
    const updateImagePreviews = (images) => {
        return images.map((img) => ({
            ...img,
            preview: img.file_path ? `${import.meta.env.VITE_API_BASE_URL || ''}${img.file_path}` : '',
            saved: true
        }));
    };

    questionData.value.question.images = updateImagePreviews(questionData.value.question.images);
    questionData.value.options.forEach((opt) => {
        opt.images = updateImagePreviews(opt.images);
    });
    questionData.value.answer.images = updateImagePreviews(questionData.value.answer.images);
    questionData.value.solution.images = updateImagePreviews(questionData.value.solution.images);

    // Track all images as saved
    uploadedFiles.value = [...questionData.value.question.images, ...questionData.value.options.flatMap((opt) => opt.images), ...questionData.value.answer.images, ...questionData.value.solution.images];
};

// Toast helpers
const showSuccessToast = (detail) => {
    toast.add({
        severity: 'success',
        summary: 'Success',
        detail,
        life: 3000
    });
};

const showErrorToast = (summary, detail) => {
    toast.add({
        severity: 'error',
        summary,
        detail,
        life: 3000
    });
};

const showWarningToast = (summary, detail) => {
    toast.add({
        severity: 'warn',
        summary,
        detail,
        life: 3000
    });
};
</script>

<template>
    <Card class="p-4">
        <template #title>{{ editingId ? 'Edit Question' : 'Add Question' }}</template>

        <template #content>
            <!-- Question Section -->
            <div class="mb-6">
                <label class="block font-bold mb-2">Question:</label>
                <Textarea v-model="questionData.question.text" rows="3" class="w-full mb-2" placeholder="Type your question here. Use $$...$$ for LaTeX." :disabled="isSaving" />

                <Dropzone :options="dropzoneOptions" @added-file="handleQuestionImageAdded" @removed-file="handleQuestionImageRemoved" class="mb-4" :disabled="isSaving">
                    <template #message>
                        <div class="text-center p-4">Drag & drop question images here or click to browse</div>
                    </template>
                </Dropzone>

                <div v-if="questionData.question.images.length" class="mb-2 grid grid-cols-3 gap-2">
                    <div v-for="(img, idx) in questionData.question.images" :key="'q-img-' + idx" class="relative">
                        <img :src="img.preview" class="w-full h-32 object-contain border rounded bg-gray-100" />
                        <Button icon="pi pi-times" severity="danger" @click="removeImage('question', idx)" class="absolute top-0 right-0 p-1 w-8 h-8" v-tooltip="'Remove image'" :disabled="isSaving" />
                    </div>
                </div>
            </div>

            <!-- Options Section -->
            <div class="mb-6">
                <label class="block font-bold mb-2">Options:</label>
                <div v-for="(option, index) in questionData.options" :key="index" class="mb-4">
                    <div class="flex items-center mb-1">
                        <label class="block mr-2">{{ String.fromCharCode(65 + index) }}:</label>
                        <Button icon="pi pi-trash" severity="danger" @click="removeOption(index)" class="p-1 w-8 h-8" v-tooltip="'Remove option'" :disabled="isSaving || questionData.options.length <= 2" />
                    </div>
                    <Textarea v-model="questionData.options[index].text" rows="2" class="w-full mb-2" :placeholder="'Option ' + String.fromCharCode(65 + index)" :disabled="isSaving" />

                    <Dropzone :options="dropzoneOptions" @added-file="(file) => handleOptionImageAdded(index, file)" @removed-file="(file) => handleOptionImageRemoved(index, file)" class="mb-2" :disabled="isSaving">
                        <template #message>
                            <div class="text-center p-2">Drag & drop option images here</div>
                        </template>
                    </Dropzone>

                    <div v-if="questionData.options[index].images.length" class="mb-2 grid grid-cols-3 gap-2">
                        <div v-for="(img, idx) in questionData.options[index].images" :key="'o-img-' + index + '-' + idx" class="relative">
                            <img :src="img.preview" class="w-full h-32 object-contain border rounded bg-gray-100" />
                            <Button icon="pi pi-times" severity="danger" @click="removeImage('option' + index, idx)" class="absolute top-0 right-0 p-1 w-8 h-8" v-tooltip="'Remove image'" :disabled="isSaving" />
                        </div>
                    </div>
                </div>
                <Button label="Add Option" icon="pi pi-plus" @click="addOption" class="mt-2" :disabled="isSaving || questionData.options.length >= 6" />
            </div>

            <!-- Correct Answer Section -->
            <div class="mb-6">
                <label class="block font-bold mb-2">Correct Answer:</label>
                <Textarea v-model="questionData.answer.text" rows="2" class="w-full mb-2" placeholder="Answer explanation with LaTeX support" :disabled="isSaving" />

                <Dropzone :options="dropzoneOptions" @added-file="handleAnswerImageAdded" @removed-file="handleAnswerImageRemoved" class="mb-2" :disabled="isSaving">
                    <template #message>
                        <div class="text-center p-2">Drag & drop answer images here</div>
                    </template>
                </Dropzone>

                <div v-if="questionData.answer.images.length" class="mb-2 grid grid-cols-3 gap-2">
                    <div v-for="(img, idx) in questionData.answer.images" :key="'a-img-' + idx" class="relative">
                        <img :src="img.preview" class="w-full h-32 object-contain border rounded bg-gray-100" />
                        <Button icon="pi pi-times" severity="danger" @click="removeImage('answer', idx)" class="absolute top-0 right-0 p-1 w-8 h-8" v-tooltip="'Remove image'" :disabled="isSaving" />
                    </div>
                </div>
            </div>

            <!-- Solution Section -->
            <div class="mb-6">
                <label class="block font-bold mb-2">Solution:</label>
                <Textarea v-model="questionData.solution.text" rows="3" class="w-full mb-2" placeholder="Detailed solution with LaTeX support" :disabled="isSaving" />

                <Dropzone :options="dropzoneOptions" @added-file="handleSolutionImageAdded" @removed-file="handleSolutionImageRemoved" class="mb-2" :disabled="isSaving">
                    <template #message>
                        <div class="text-center p-2">Drag & drop solution images here</div>
                    </template>
                </Dropzone>

                <div v-if="questionData.solution.images.length" class="mb-2 grid grid-cols-3 gap-2">
                    <div v-for="(img, idx) in questionData.solution.images" :key="'s-img-' + idx" class="relative">
                        <img :src="img.preview" class="w-full h-32 object-contain border rounded bg-gray-100" />
                        <Button icon="pi pi-times" severity="danger" @click="removeImage('solution', idx)" class="absolute top-0 right-0 p-1 w-8 h-8" v-tooltip="'Remove image'" :disabled="isSaving" />
                    </div>
                </div>
            </div>

            <!-- Marks Section -->
            <div class="mb-6 grid grid-cols-2 gap-4">
                <div>
                    <label class="block font-bold mb-2">Positive Marks:</label>
                    <InputNumber v-model="questionData.positive_marks" class="w-full" :min="0" :max="10" :disabled="isSaving" />
                </div>
                <div>
                    <label class="block font-bold mb-2">Negative Marks:</label>
                    <InputNumber v-model="questionData.negative_marks" class="w-full" :min="0" :max="questionData.positive_marks" :disabled="isSaving" />
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 flex-wrap">
                <Button label="Cancel" icon="pi pi-times" severity="secondary" @click="resetForm" :disabled="isSaving" />
                <Button label="Back" icon="pi pi-arrow-left" @click="emit('close')" class="ml-auto" :disabled="isSaving" />

                <Button v-if="!editingId" label="Save Question" icon="pi pi-save" severity="success" @click="saveQuestion" :loading="isSaving" />
                <Button v-if="editingId" label="Update Question" icon="pi pi-pencil" severity="warning" @click="updateQuestion" :loading="isSaving" />
                <Button label="Reset Form" icon="pi pi-refresh" severity="secondary" @click="confirmReset" :disabled="isSaving" />
                <Button label="Preview Question" icon="pi pi-eye" @click="showPreview" class="ml-auto" :disabled="isSaving || !canPreview" />
            </div>

            <!-- Preview Section -->
            <QuestionPreview v-if="showPreviewSection" :question="previewData" :mode="previewMode" @close="showPreviewSection = false" @change-mode="previewMode = $event" />

            <!-- Confirmation Dialogs -->
            <Dialog v-model:visible="showResetConfirm" header="Confirm Reset" :style="{ width: '450px' }" :modal="true">
                <div class="confirmation-content">
                    <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                    <span>Are you sure you want to reset the form? All unsaved changes will be lost.</span>
                </div>
                <template #footer>
                    <Button label="No" icon="pi pi-times" @click="showResetConfirm = false" class="p-button-text" />
                    <Button label="Yes" icon="pi pi-check" @click="resetForm" severity="danger" />
                </template>
            </Dialog>
        </template>
    </Card>
</template>

<style>
/* Dropzone styling */
.dropzone {
    border: 2px dashed #ccc;
    border-radius: 5px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
}

.dropzone:hover {
    border-color: #aaa;
    background-color: #f8f9fa;
}

.dropzone .dz-message {
    margin: 0;
}

/* Image preview styling */
.image-preview-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
    margin-top: 10px;
}

.image-preview {
    position: relative;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
}

.image-preview img {
    width: 100%;
    height: 150px;
    object-fit: contain;
    background: #f8f9fa;
}

.remove-image-btn {
    position: absolute;
    top: 5px;
    right: 5px;
    opacity: 0.7;
    transition: opacity 0.2s;
}

.remove-image-btn:hover {
    opacity: 1;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .image-preview-container {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }

    .image-preview img {
        height: 120px;
    }
}
</style>
