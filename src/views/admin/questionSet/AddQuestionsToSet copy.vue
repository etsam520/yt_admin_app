<script>
import { ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { apiClient } from '@/service/apiService';
import SetForm from '../questionSet/SetForm.vue';
import CreateQuestion from '@/views/admin/question/CreateQuestion.vue';

export default {
    props: {
        setId: {
            type: Number,
            required: true
        },
        createMode: {
            type: Boolean,
            default: true // 'add' or 'edit'
        },
        viewMode: {
            type: Boolean,
            default: false // 'view' mode
        }
        // selectedQuestions: {
        //     type: Array,
        //     default: () => []
        // },
        // expandedRows: {
        //     type: Array,
        //     default: () => []
        // }
    },
    components: {
        DataTable,
        Column,
        Button,
        Dialog,
        SetForm,
        CreateQuestion
    },
    data() {
        return {
            questions: [],
            selectedQuestions: [],
            edit: null,
            expandedRows: [],
            showDeleteConfirm: false,
            deleteSingleId: null,
            createBatch: false,
            showQuestionsTable: true,
            createQuestion: false,

            createSet: false,
            removeSet: false
        };
    },
    // emits: ['edit', 'delete', 'view', 'add-to-set', 'add-to-batch', 'create-set', 'create-batch'],
    methods: {
        async fetchQuestionsAvalableForSet() {
            try {
                const response = await apiClient.get('/admin/questionsAvalableForSet/' + this.setId);
                this.questions = response.data.data.map((q) => ({
                    ...q,
                    id: q.id || this.generateUniqueId()
                }));
                console.log(this.questions);
            } catch (error) {
                console.error('Error fetching questions:', error);
            }
        },
        async fetchQuestionsOfSet() {
            try {
                const response = await apiClient.get('/admin/questionsOfSet/' + this.setId);
                this.questions = response.data.data.map((q) => ({
                    ...q,
                    id: q.id || this.generateUniqueId()
                }));
                console.log(this.questions);
            } catch (error) {
                console.error('Error fetching questions:', error);
            }
        },
        generateUniqueId() {
            return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        },
        toggleRowExpansion(question) {
            const index = this.expandedRows.findIndex((id) => id === question.id);
            if (index > -1) {
                this.expandedRows.splice(index, 1);
            } else {
                this.expandedRows = [question.id]; // Only expand one at a time
            }
        },
        confirmDeleteSingle(id) {
            this.deleteSingleId = id;
            this.showDeleteConfirm = true;
        },
        confirmDeleteSelected() {
            this.deleteSingleId = null;
            this.showDeleteConfirm = true;
        },
        handleDelete() {
            if (this.deleteSingleId) {
                this.$emit('delete', this.deleteSingleId);
            } else {
                this.$emit(
                    'delete',
                    this.selectedQuestions.map((q) => q.id)
                );
                this.selectedQuestions = [];
            }
            this.showDeleteConfirm = false;
        },
        async handleAddToSet() {
            const selectedIds = this.selectedQuestions.map((q) => q.id);
            if (selectedIds.length === 0) {
                this.$toast.add({
                    severity: 'warn',
                    summary: 'No Questions Selected',
                    detail: 'Please select at least one question to add to the set.',
                    life: 3000
                });
                return;
            }
            try {
                const response = await apiClient.post(`/admin/questionsStoreToSet/${this.setId}`, { questionIds: selectedIds, setId: this.setId });
                this.$toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: response.data.message,
                    life: 3000
                });
                this.selectedQuestions = []; // Clear selected questions after adding
                this.fetchQuestionsAvalableForSet(); // Refresh the questions list
            } catch (error) {
                console.error('Error adding questions to set:', error);
                this.$toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to add questions to the set.',
                    life: 3000
                });
            }
            this.$emit('add-to-set', this.selectedQuestions);
        },
        handleAddQuestion() {
            this.showQuestionsTable = false;
            this.createQuestion = true;
            this.createSet = false;
            this.createBatch = false;
        },

        async handleRemoveQuestionsOfSet(setId) {
            try {
                const response = await apiClient.post(`/admin/questionsStoreToSet/${setId}`, {
                    params: {
                        setId: setId,
                        _method: 'DELETE',
                        questionIds: this.selectedQuestions.map((q) => q.id)
                    }
                });
                this.$toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: response.data.message,
                    life: 3000
                });

                this.selectedQuestions = []; // Clear selected questions after removal
                this.fetchQuestionsOfSet(); // Refresh the questions list
            } catch (error) {
                console.error('Error removing questions from set:', error);
                this.$toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to remove questions from the set.',
                    life: 3000
                });
            }
        },

        handleEdit(question) {
            this.editQuestion = question;
        },
        renderLatex(text) {
            if (!text) return '';

            const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/gs);

            return parts
                .map((part) => {
                    if (part.startsWith('$$') && part.endsWith('$$')) {
                        const latexContent = part.slice(2, -2);
                        try {
                            return katex.renderToString(latexContent, {
                                throwOnError: false,
                                displayMode: true
                            });
                        } catch (e) {
                            console.error('KaTeX error:', e);
                            return `<span class="text-red-500">${part}</span>`;
                        }
                    } else if (part.startsWith('$') && part.endsWith('$')) {
                        const latexContent = part.slice(1, -1);
                        try {
                            return katex.renderToString(latexContent, {
                                throwOnError: false,
                                displayMode: false
                            });
                        } catch (e) {
                            console.error('KaTeX error:', e);
                            return `<span class="text-red-500">${part}</span>`;
                        }
                    }
                    return part.replace(/\n/g, '<br>');
                })
                .join('');
        },
        getImagePath(path) {
            if (path.startsWith('http') || path.startsWith('/')) {
                return path;
            }
            return `/storage/${path.replace('./media/', '')}`;
        }
    },
    created() {
        if (this.createMode) {
            this.fetchQuestionsAvalableForSet();
        } else {
            this.fetchQuestionsOfSet();
        }
    }
};
</script>

<template>
    <div class="question-table-container">
        <!-- Action Toolbar  -->
        <div class="action-toolbar mb-4 p-3 bg-gray-50 rounded-md flex flex-wrap gap-2">
            <Button v-if="!!createMode" label="Add to Set" icon="pi pi-folder-plus" class="p-button-sm" :disabled="selectedQuestions.length === 0" @click="handleAddToSet" />
            <Button v-if="!!viewMode" label="Remove from Set" icon="pi pi-folder-minus" class="p-button-sm" :disabled="selectedQuestions.length === 0" @click="handleAddToSet" />

            <span class="ml-auto text-sm text-gray-600"> {{ selectedQuestions.length }} selected </span>
        </div>

        <!-- DataTable -->
        <DataTable
            v-if="showQuestionsTable"
            :value="questions"
            v-model:selection="selectedQuestions"
            v-model:expandedRows="expandedRows"
            selectionMode="multiple"
            dataKey="id"
            :paginator="true"
            :rows="10"
            responsiveLayout="scroll"
            class="p-datatable-sm"
        >
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column field="serialNo" header="S.No" headerStyle="width: 5rem">
                <template #body="{ index }">
                    {{ index + 1 }}
                </template>
            </Column>
            <Column field="title" header="Question Title" headerStyle="min-width: 200px">
                <template #body="{ data }">
                    <div class="whitespace-pre-wrap" v-html="renderLatex(data.question_text_en || data.question_text_hi || '')"></div>
                </template>
            </Column>
            <Column field="subject" header="Subject" headerStyle="min-width: 120px">
                <template #body="{ data }">
                    {{ data.subject_name || '-' }}
                </template>
            </Column>
            <Column field="chapter" header="Chapter" headerStyle="min-width: 120px">
                <template #body="{ data }">
                    {{ data.chapter_name || '-' }}
                </template>
            </Column>
            <Column field="topic" header="Topic" headerStyle="min-width: 120px">
                <template #body="{ data }">
                    {{ data.topic_name || '-' }}
                </template>
            </Column>
            <Column field="createdBy" header="Created By" headerStyle="min-width: 120px">
                <template #body> - Admin </template>
            </Column>
            <Column :expander="true" headerStyle="width: 4rem" />

            <!-- Expanded Row Content -->
            <template #expansion="slotProps">
                <div class="p-4 bg-gray-50">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h5 class="font-semibold mb-2">Options:</h5>
                            <template v-if="slotProps.data.options && slotProps.data.options.length">
                                <div v-for="(opt, optIdx) in slotProps.data.options" :key="optIdx" class="mb-3">
                                    <div class="flex">
                                        <span class="font-medium mr-2">{{ String.fromCharCode(65 + optIdx) }}.</span>
                                        <div class="whitespace-pre-wrap" v-html="renderLatex((opt.text && opt.text.en) || '')"></div>
                                    </div>
                                    <div v-if="opt.images && opt.images.length" class="flex flex-wrap gap-2 mt-1 ml-6">
                                        <img v-for="(img, imgIdx) in opt.images" :key="imgIdx" :src="getImagePath(img.path)" class="max-h-24" @error="handleImageError" />
                                    </div>
                                </div>
                            </template>
                            <div v-else class="text-gray-500">No options available</div>
                        </div>

                        <div>
                            <div class="mb-3">
                                <h5 class="font-semibold">Correct Answer:</h5>
                                <div class="whitespace-pre-wrap" v-html="renderLatex((slotProps.data.answer && slotProps.data.answer.text && slotProps.data.answer.text.en) || '')"></div>
                                <div v-if="slotProps.data.answer && slotProps.data.answer.images && slotProps.data.answer.images.length" class="flex flex-wrap gap-2 mt-2">
                                    <img v-for="(img, imgIdx) in slotProps.data.answer.images" :key="imgIdx" :src="getImagePath(img.path)" class="max-h-24" @error="handleImageError" />
                                </div>
                            </div>

                            <div v-if="slotProps.data.formattedQuestion?.solution?.text?.en || slotProps.data.formattedQuestion?.solution?.images?.length" class="mb-3">
                                <h5 class="font-semibold">Solution:</h5>
                                <div class="whitespace-pre-wrap" v-html="renderLatex(slotProps.data.formattedQuestion?.solution?.text?.en || '')"></div>
                                <div v-if="slotProps.data.formattedQuestion?.solution?.images?.length" class="flex flex-wrap gap-2 mt-2">
                                    <img v-for="(img, imgIdx) in slotProps.data.formattedQuestion.solution.images" :key="imgIdx" :src="getImagePath(img.path)" class="max-h-24" @error="handleImageError" />
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <h5 class="font-semibold">Positive Marks:</h5>
                                    <p>{{ slotProps.data.formattedQuestion.positive_marks || '0' }}</p>
                                </div>
                                <div>
                                    <h5 class="font-semibold">Negative Marks:</h5>
                                    <p>{{ slotProps.data.formattedQuestion.negative_marks || 25 }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-2 mt-4">
                        <Button label="View" icon="pi pi-eye" class="p-button-sm" @click="$emit('view', slotProps.data)" />
                        <Button label="Edit" icon="pi pi-pencil" class="p-button-sm p-button-warning" @click="$emit('edit', slotProps.data)" />
                        <Button label="Delete" icon="pi pi-trash" class="p-button-sm p-button-danger" @click="$emit('delete', slotProps.data.id)" />
                    </div>
                </div>
            </template>
        </DataTable>

        <SetForm v-if="!!createSet" />

        <CreateQuestion v-if="!!createQuestion" />

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:visible="showDeleteConfirm" header="Confirm Delete" :style="{ width: '450px' }" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="deleteSingleId"> Are you sure you want to delete this question? </span>
                <span v-else> Are you sure you want to delete {{ selectedQuestions.length }} selected questions? </span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" @click="showDeleteConfirm = false" class="p-button-text" />
                <Button label="Yes" icon="pi pi-check" @click="handleDelete" severity="danger" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.question-table-container {
    width: 100%;
}

.action-toolbar {
    border: 1px solid #e5e7eb;
}

.p-datatable {
    font-size: 0.875rem;
}

.p-datatable-sm .p-datatable-tbody > tr > td {
    padding: 0.5rem 1rem;
}

.katex-display {
    margin: 0.5em 0;
    overflow-x: auto;
    overflow-y: hidden;
}

.katex {
    font-size: 1.1em;
}
</style>
