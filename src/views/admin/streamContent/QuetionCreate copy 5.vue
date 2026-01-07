<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import Dialog from 'primevue/dialog';
import Dropzone from '@/components/Dropzone.vue';
import QuestionList from './QuestionList.vue';
import QuestionPreview from './QuestionPreview.vue';

import { generateUniqueId, getHostname } from '@/utils/helpers';
import { uploadFile, deleteFile } from '@/utils/fileUpload';
import { apiClient } from '@/service/apiService';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

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
const savedQuestions = ref([]);
const editingId = ref(null);
const showPreviewSection = ref(false);
const previewMode = ref('web');
const isSaving = ref(false);
const showResetConfirm = ref(false);
const uploadedFiles = ref([]); // Track all uploaded files for cleanup

// Dropzone configuration
const dropzoneOptions = {
    url: '/api/upload', // Your upload endpoint
    maxFilesize: 5, // MB
    acceptedFiles: 'image/*',
    addRemoveLinks: true,
    autoProcessQueue: false, // We'll handle uploads manually
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
    window.addEventListener('beforeunload', beforeUnloadHandler);
    fetchQuestions();
});

// Cleanup event listeners
onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    cleanupUnsavedImages();
});

// Cleanup uploaded but unsaved images
const cleanupUnsavedImages = async () => {
    if (editingId.value) return; // Don't cleanup if editing existing question

    try {
        const filesToDelete = uploadedFiles.value.filter((file) => !file.saved);
        await Promise.all(filesToDelete.map((file) => deleteFile(file.serverId)));
    } catch (error) {
        console.error('Error cleaning up unsaved images:', error);
    }
};

// Generate unique filename with original extension
const generateUniqueFilename = (file) => {
    const ext = file.name.split('.').pop();
    return `${generateUniqueId()}.${ext}`;
};

// Handle image upload
const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const resp = await uploadFile(formData);
        const data = resp.data;
        console.log('Image uploaded successfully:', data);
        return {
            preview: URL.createObjectURL(file),
            filename: data.unique_name,
            file_path: data.file_path,
            serverId: data.id,
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

        // console.log('Question image added:', uploadedImage) ;
        // console.log('Question 44 added:',  uploadedFiles.value) ;
        // console.log('Question 55 added:', questionData.value, uploadedFiles.value,uploadedImage) ;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Upload Failed',
            detail: 'Failed to upload question image',
            life: 3000
        });
    }
};

const handleOptionImageAdded = async (index, file) => {
    try {
        const uploadedImage = await uploadImage(file);
        questionData.value.options[index].images.push(uploadedImage);
        uploadedFiles.value.push(uploadedImage);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Upload Failed',
            detail: `Failed to upload option ${String.fromCharCode(65 + index)} image`,
            life: 3000
        });
    }
};

const handleAnswerImageAdded = async (file) => {
    try {
        const uploadedImage = await uploadImage(file);
        questionData.value.answer.images.push(uploadedImage);
        uploadedFiles.value.push(uploadedImage);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Upload Failed',
            detail: 'Failed to upload answer image',
            life: 3000
        });
    }
};

const handleSolutionImageAdded = async (file) => {
    try {
        const uploadedImage = await uploadImage(file);
        questionData.value.solution.images.push(uploadedImage);

        uploadedFiles.value.push(uploadedImage);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Upload Failed',
            detail: 'Failed to upload solution image',
            life: 3000
        });
    }
};

// Image removal handlers
const handleQuestionImageRemoved = async (file) => {
    const index = questionData.value.question.images.findIndex((img) => img.filename === file.name);
    if (index !== -1) {
        await removeImage('question', index);
    }
};

const handleOptionImageRemoved = async (index, file) => {
    const imgIndex = questionData.value.options[index].images.findIndex((img) => img.filename === file.name);
    if (imgIndex !== -1) {
        await removeImage('option' + index, imgIndex);
    }
};

const handleAnswerImageRemoved = async (file) => {
    const index = questionData.value.answer.images.findIndex((img) => img.filename === file.name);
    if (index !== -1) {
        await removeImage('answer', index);
    }
};

const handleSolutionImageRemoved = async (file) => {
    const index = questionData.value.solution.images.findIndex((img) => img.filename === file.name);
    if (index !== -1) {
        await removeImage('solution', index);
    }
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
    uploadedFiles.value = uploadedFiles.value.filter((file) => file.serverId !== imageToRemove.serverId);
    // Delete from server if not saved with a question
    if (imageToRemove && !imageToRemove.saved) {
        try {
            await deleteFile(imageToRemove.serverId);
        } catch (error) {
            console.error('Error deleting image:', error);
            toast.add({
                severity: 'error',
                summary: 'Delete Failed',
                detail: 'Failed to delete image from server',
                life: 3000
            });
        }
    }
};

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
    console.log('payload', payload);

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
    console.log('payloadd_en', payload);
    return payload;
};

const showPreview = () => {
    previewData.value = preparePayload();
    showPreviewSection.value = true;
};

const saveQuestion = async () => {
    if (!validateQuestion()) return;

    isSaving.value = true;
    const payload = preparePayload();

    try {
        // In a real app, you would POST to Laravel endpoint
        const response = await apiClient.post('/admin/questions', payload);

        // Mock response
        // const mockResponse = {
        //   data: {
        //     ...payload,
        //     id: generateUniqueId(),
        //     created_at: new Date().toISOString(),
        //     updated_at: new Date().toISOString()
        //   }
        // }

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

        savedQuestions.value.push(response.data);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Question saved successfully',
            life: 3000
        });
        resetForm();
    } catch (error) {
        console.error('Error saving question:', error);
        toast.add({
            severity: 'error',
            summary: 'Save Failed',
            detail: 'Failed to save question',
            life: 3000
        });
    } finally {
        isSaving.value = false;
    }
};

const updateQuestion = async () => {
    if (!editingId.value || !validateQuestion()) return;

    isSaving.value = true;
    const payload = preparePayload();
    payload.id = editingId.value;

    try {
        // In a real app, you would PUT to Laravel endpoint
        const _q = { ...toRaw(payload) };
        _q._method = 'PUT';
        const response = await apiClient.post(`/admin/questions/${editingId.value}`, _q);

        // Update local state for demo
        const index = savedQuestions.value.findIndex((q) => q.id === editingId.value);
        if (index !== -1) {
            savedQuestions.value[index] = payload;
        }

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

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Question updated successfully',
            life: 3000
        });
        resetForm();
    } catch (error) {
        console.error('Error updating question:', error);
        toast.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: 'Failed to update question',
            life: 3000
        });
    } finally {
        isSaving.value = false;
    }
};

const validateQuestion = () => {
    if (!questionData.value.question.text) {
        toast.add({
            severity: 'warn',
            summary: 'Validation Error',
            detail: 'Question text is required',
            life: 3000
        });
        return false;
    }

    if (questionData.value.options.some((opt) => !opt.text)) {
        toast.add({
            severity: 'warn',
            summary: 'Validation Error',
            detail: 'All options must have text',
            life: 3000
        });
        return false;
    }

    if (!questionData.value.answer.text) {
        toast.add({
            severity: 'warn',
            summary: 'Validation Error',
            detail: 'Answer text is required',
            life: 3000
        });
        return false;
    }

    return true;
};

const loadQuestionForEdit = (question) => {
    // Cleanup any unsaved images first
    cleanupUnsavedImages().finally(() => {
        // Clone the question to edit
        questionData.value = JSON.parse(JSON.stringify(question));
        editingId.value = question.id;

        // Convert stored image paths to preview objects
        questionData.value.question.images = question.question.images.map((img) => ({
            preview: getHostname() + img.path,
            filename: img.path.split('/').pop(),
            serverId: img.serverId,
            saved: true
        }));

        questionData.value.options.forEach((opt, idx) => {
            opt.images = question.options[idx].images.map((img) => ({
                preview: getHostname() + img.path,
                filename: img.path.split('/').pop(),
                serverId: img.serverId,
                saved: true
            }));
        });

        questionData.value.answer.images = question.answer.images.map((img) => ({
            preview: getHostname() + img.path,
            filename: img.path.split('/').pop(),
            serverId: img.serverId,
            saved: true
        }));

        questionData.value.solution.images = question.solution.images.map((img) => ({
            preview: getHostname() + img.path,
            // preview: `/storage${img.path.replace('./media', '')}`,
            filename: img.path.split('/').pop(),
            serverId: img.serverId,
            saved: true
        }));

        // Track all images
        uploadedFiles.value = [...questionData.value.question.images, ...questionData.value.options.flatMap((opt) => opt.images), ...questionData.value.answer.images, ...questionData.value.solution.images];

        showPreviewSection.value = false;
    });
};

const viewQuestion = (question) => {
    previewData.value = question;
    previewMode.value = 'web';
    showPreviewSection.value = true;
};

const deleteQuestion = async (id) => {
    confirm.require({
        message: 'Are you sure you want to delete this question?',
        header: 'Confirm Deletion',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                // In a real app, you would DELETE to Laravel endpoint
                // await axios.delete(`/api/ques2tions/${id}`)

                // Get question to delete for image cleanup
                const questionToDelete = savedQuestions.value.find((q) => q.id === id);

                // Update local state for demo
                savedQuestions.value = savedQuestions.value.filter((q) => q.id !== id);

                // Cleanup images from server
                if (questionToDelete) {
                    const allImages = [...questionToDelete.question.images, ...questionToDelete.options.flatMap((opt) => opt.images), ...questionToDelete.answer.images, ...questionToDelete.solution.images];

                    await Promise.all(allImages.map((img) => deleteFile(img.id)));
                }

                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Question deleted successfully',
                    life: 3000
                });
            } catch (error) {
                console.error('Error deleting question:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Delete Failed',
                    detail: 'Failed to delete question',
                    life: 3000
                });
            }
        }
    });
};

const fetchQuestions = async () => {
    try {
        // In a real app, you would GET from Laravel endpoint
        const response = await apiClient.get('/admin/questions');

        // Mock response with sample data matching your format
        const mockResponse = {
            data: [
                {
                    id: 'q1',
                    question: {
                        text: 'The hybridization of the central carbon in CH3C≡N and\nthe bond angle CCN are',
                        images: [
                            { id: 'img1', path: './media/image1.jpeg' },
                            { id: 'img2', path: './media/image2.png' },
                            { id: 'img3', path: './media/image3.png' }
                        ]
                    },
                    type: 'multiple_choice',
                    options: [
                        {
                            text: 'sp2 , 180°',
                            images: [{ id: 'img4', path: './media/image4.png' }]
                        },
                        {
                            text: 'Sp, 180°',
                            images: [{ id: 'img5', path: './media/image5.png' }]
                        },
                        {
                            text: 'sp2 , 120°.',
                            images: []
                        },
                        {
                            text: 'sp3 , 109°.$$\\lim_{n \\rightarrow\n\\infty}\\left( 1 + \\frac{1}{n} \\right)^{n}$$',
                            images: []
                        }
                    ],
                    answer: {
                        text: '1,2 $$(x + a)^{n} = \\sum_{k =\n0}^{n}{\\binom{n}{k}x^{k}a^{n - k}}$$',
                        images: []
                    },
                    solution: {
                        text: 'Sp, 180°',
                        images: [
                            { id: 'img6', path: './media/image6.jpeg' },
                            { id: 'img7', path: './media/image7.png' }
                        ]
                    },
                    positive_marks: 4,
                    negative_marks: 1,
                    created_at: '2023-01-01T00:00:00Z',
                    updated_at: '2023-01-01T00:00:00Z'
                }
            ]
        };

        savedQuestions.value = response.data;
    } catch (error) {
        console.error('Error fetching questions:', error);
        toast.add({
            severity: 'error',
            summary: 'Fetch Failed',
            detail: 'Failed to load questions',
            life: 3000
        });
    }
};
</script>

<template>
    <Card class="p-4">
        <template #title>Add Question</template>

        <template #content>
            <!-- Question Section -->
            <div class="mb-6">
                <label class="block font-bold mb-2">Question:</label>
                <Textarea v-model="questionData.question.text" rows="3" class="w-full mb-2" placeholder="Type your question here. Use $$...$$ for LaTeX." />

                <Dropzone :options="dropzoneOptions" @added-file="handleQuestionImageAdded" @removed-file="handleQuestionImageRemoved" class="mb-4">
                    <template #message>
                        <div class="text-center p-4">Drag & drop question images here or click to browse</div>
                    </template>
                </Dropzone>

                <div v-if="questionData.question.images.length" class="mb-2 grid grid-cols-3 gap-2">
                    <div v-for="(img, idx) in questionData.question.images" :key="'q-img-' + idx" class="relative">
                        <img :src="img.preview" class="w-full h-32 object-contain border rounded bg-gray-100" />
                        <Button icon="pi pi-times" severity="danger" @click="removeImage('question', idx)" class="absolute top-0 right-0 p-1 w-8 h-8" v-tooltip="'Remove image'" />
                    </div>
                </div>
            </div>

            <!-- Options Section -->
            <div class="mb-6">
                <label class="block font-bold mb-2">Options:</label>
                <div v-for="(option, index) in questionData.options" :key="index" class="mb-4">
                    <label class="block mb-1">{{ String.fromCharCode(65 + index) }}:</label>
                    <Textarea v-model="questionData.options[index].text" rows="2" class="w-full mb-2" :placeholder="'Option ' + String.fromCharCode(65 + index)" />

                    <Dropzone :options="dropzoneOptions" @added-file="(file) => handleOptionImageAdded(index, file)" @removed-file="(file) => handleOptionImageRemoved(index, file)" class="mb-2">
                        <template #message>
                            <div class="text-center p-2">Drag & drop option images here</div>
                        </template>
                    </Dropzone>

                    <div v-if="questionData.options[index].images.length" class="mb-2 grid grid-cols-3 gap-2">
                        <div v-for="(img, idx) in questionData.options[index].images" :key="'o-img-' + index + '-' + idx" class="relative">
                            <img :src="img.preview" class="w-full h-32 object-contain border rounded bg-gray-100" />
                            <Button icon="pi pi-times" severity="danger" @click="removeImage('option' + index, idx)" class="absolute top-0 right-0 p-1 w-8 h-8" v-tooltip="'Remove image'" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Correct Answer Section -->
            <div class="mb-6">
                <label class="block font-bold mb-2">Correct Answer:</label>
                <Textarea v-model="questionData.answer.text" rows="2" class="w-full mb-2" placeholder="Answer explanation with LaTeX support" />

                <Dropzone :options="dropzoneOptions" @added-file="handleAnswerImageAdded" @removed-file="handleAnswerImageRemoved" class="mb-2">
                    <template #message>
                        <div class="text-center p-2">Drag & drop answer images here</div>
                    </template>
                </Dropzone>

                <div v-if="questionData.answer.images.length" class="mb-2 grid grid-cols-3 gap-2">
                    <div v-for="(img, idx) in questionData.answer.images" :key="'a-img-' + idx" class="relative">
                        <img :src="img.preview" class="w-full h-32 object-contain border rounded bg-gray-100" />
                        <Button icon="pi pi-times" severity="danger" @click="removeImage('answer', idx)" class="absolute top-0 right-0 p-1 w-8 h-8" v-tooltip="'Remove image'" />
                    </div>
                </div>
            </div>

            <!-- Solution Section -->
            <div class="mb-6">
                <label class="block font-bold mb-2">Solution:</label>
                <Textarea v-model="questionData.solution.text" rows="3" class="w-full mb-2" placeholder="Detailed solution with LaTeX support" />

                <Dropzone :options="dropzoneOptions" @added-file="handleSolutionImageAdded" @removed-file="handleSolutionImageRemoved" class="mb-2">
                    <template #message>
                        <div class="text-center p-2">Drag & drop solution images here</div>
                    </template>
                </Dropzone>

                <div v-if="questionData.solution.images.length" class="mb-2 grid grid-cols-3 gap-2">
                    <div v-for="(img, idx) in questionData.solution.images" :key="'s-img-' + idx" class="relative">
                        <img :src="img.preview" class="w-full h-32 object-contain border rounded bg-gray-100" />
                        <Button icon="pi pi-times" severity="danger" @click="removeImage('solution', idx)" class="absolute top-0 right-0 p-1 w-8 h-8" v-tooltip="'Remove image'" />
                    </div>
                </div>
            </div>

            <!-- Marks Section -->
            <div class="mb-6 grid grid-cols-2 gap-4">
                <div>
                    <label class="block font-bold mb-2">Positive Marks:</label>
                    <InputNumber v-model="questionData.positive_marks" class="w-full" />
                </div>
                <div>
                    <label class="block font-bold mb-2">Negative Marks:</label>
                    <InputNumber v-model="questionData.negative_marks" class="w-full" />
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 flex-wrap">
                <Button label="Save Question" icon="pi pi-save" severity="success" @click="saveQuestion" :loading="isSaving" />
                <Button v-if="editingId" label="Update Question" icon="pi pi-pencil" severity="warning" @click="updateQuestion" :loading="isSaving" />
                <Button label="Reset Form" icon="pi pi-refresh" severity="secondary" @click="confirmReset" :disabled="isSaving" />
                <Button label="Preview Question" icon="pi pi-eye" @click="showPreview" class="ml-auto" :disabled="isSaving" />
            </div>

            <!-- Preview Section -->
            <QuestionPreview v-if="showPreviewSection" :question="previewData" :mode="previewMode" @close="showPreviewSection = false" @change-mode="previewMode = $event" />

            <!-- Saved Questions -->
            <div v-if="savedQuestions.length" class="mt-8">
                <h3 class="font-bold text-xl mb-4">Saved Questions</h3>
                <QuestionList :questions="savedQuestions" @edit="loadQuestionForEdit" @delete="deleteQuestion" @view="viewQuestion" />
            </div>

            <!-- Confirmation Dialog -->
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
