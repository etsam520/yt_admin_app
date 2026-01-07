<script setup>
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { computed, ref } from 'vue';

import QuestionCreate from '@/views/admin/streamContent/QuetionCreate.vue'; // Keep typo if this is file name
import QuestionList from '../streamContent/QuestionList.vue';
import QuestionListContainer from '../streamContent/QuestionListContainer.vue';

const props = defineProps({
    courseId: {
        type: String,
        required: true
    },
    directory: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['close']);

const contentToAdd = ref([
    { type: 'video', label: 'Add Video', icon: 'pi pi-video', canAdd: false },
    { type: 'pdf', label: 'Add PDF', icon: 'pi pi-file-pdf', canAdd: false },
    { type: 'ppt', label: 'Add PPT', icon: 'pi pi-file', canAdd: false },
    { type: 'question', label: 'Add Question Set', icon: 'pi pi-question-circle', canAdd: false }
]);
const contentofTable = ref([
    { type: 'video', label: 'Video Content', icon: 'pi pi-video', canOpen: false },
    { type: 'pdf', label: 'PDF Content', icon: 'pi pi-file-pdf', canOpen: false },
    { type: 'ppt', label: 'PPT Content', icon: 'pi pi-file', canOpen: false },
    { type: 'question', label: 'Question Set', icon: 'pi pi-question-circle', canOpen: false }
]);
const directoryMeta = computed(() => {
    return {
        courseId: props.courseId,
        directoryId: props.directory.data.id,
        directoryName: props.directory.data.name
    };
});

const toast = useToast();

const createContent = (type) => {
    contentToAdd.value = contentToAdd.value.map((item) => (item.type === type ? { ...item, canAdd: true } : item));
};

const setCanAdd = (type, value) => {
    contentToAdd.value = contentToAdd.value.map((item) => (item.type === type ? { ...item, canAdd: value } : item));
};

const setCanOpen = (type, value) => {
    contentofTable.value = contentofTable.value.map((item) => (item.type === type ? { ...item, canOpen: value } : item));
};
</script>

<template>
    <div v-if="directory?.data && contentToAdd.filter((item) => item.canAdd).length === 0" class="p-4">
        <h4 class="text-md font-medium mb-4">Managing Content for: {{ directory.data.name }}</h4>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Left Column: Add Content -->
            <div v-if="contentToAdd.filter((item) => item.canAdd).length === 0">
                <h5 class="text-sm font-semibold mb-2">Add New Content</h5>
                <div class="flex flex-col gap-2">
                    <Button v-for="(item, index) in contentToAdd" :key="item.type" :label="item.label" :icon="item.icon" :outlined="true" @click="() => createContent(item.type)" />
                </div>
            </div>

            <!-- Right Column: Existing Table Content -->
            <div v-if="contentofTable.filter((item) => item.canOpen).length === 0">
                <h5 class="text-sm font-semibold mb-2">📄 Existing Contents</h5>
                <div class="flex flex-col gap-2">
                    <Button v-for="(item, index) in contentofTable" :key="item.type" :label="item.label" :icon="item.icon" :outlined="true" @click="() => setCanOpen(item.type, true)" />
                </div>
            </div>
        </div>
    </div>

    <!-- Only show QuestionCreate when needed -->
    <QuestionCreate v-if="contentToAdd.find((item) => item.type === 'question')?.canAdd" :directoryMeta="directoryMeta" @close="() => setCanAdd('question', false)" />

    <!-- dtata -->
    <QuestionListContainer v-if="contentofTable.find((item) => item.type === 'question')?.canOpen" :directoryMeta="directoryMeta" @close="() => setCanOpen('question', false)" />
</template>

<style scoped></style>
