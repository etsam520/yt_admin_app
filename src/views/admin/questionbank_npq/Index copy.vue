<script>
import { ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { apiClient } from '@/service/apiService';

export default {
    components: {
        DataTable,
        Column,
        Button,
        Dialog
    },
    data() {
        return {
            questions: [],
            selectedQuestions: [],
            expandedRows: [],
            showDeleteConfirm: false,
            deleteSingleId: null
        };
    },
    emits: ['edit', 'delete', 'view', 'add-to-set', 'add-to-batch', 'create-set', 'create-batch'],
    methods: {
        async fetchQuestions() {
            try {
                const response = await apiClient.get('/admin/questions');
                this.questions = response.data.map((q) => ({
                    ...q,
                    id: q.id || this.generateUniqueId()
                }));
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
        handleAddToSet() {
            this.$emit('add-to-set', this.selectedQuestions);
        },
        handleAddToBatch() {
            this.$emit('add-to-batch', this.selectedQuestions);
        },
        handleCreateNewSet() {
            this.$emit('create-set', this.selectedQuestions);
        },
        handleCreateNewBatch() {
            this.$emit('create-batch', this.selectedQuestions);
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
        this.fetchQuestions();
    }
};
</script>

<template>
    <div class="question-table-container">
        <!-- Action Toolbar -->
        <div class="action-toolbar mb-4 p-3 bg-gray-50 rounded-md flex flex-wrap gap-2">
            <Button label="Add to Set" icon="pi pi-folder-plus" class="p-button-sm" :disabled="selectedQuestions.length === 0" @click="handleAddToSet" />
            <Button label="Add to Batch" icon="pi pi-layer-group" class="p-button-sm" :disabled="selectedQuestions.length === 0" @click="handleAddToBatch" />
            <Button label="Create New Set" icon="pi pi-plus-circle" class="p-button-sm" @click="handleCreateNewSet" />
            <Button label="Create New Batch" icon="pi pi-plus-circle" class="p-button-sm" @click="handleCreateNewBatch" />
            <Button label="Delete Selected" icon="pi pi-trash" class="p-button-sm p-button-danger" :disabled="selectedQuestions.length === 0" @click="confirmDeleteSelected" />
            <span class="ml-auto text-sm text-gray-600"> {{ selectedQuestions.length }} selected </span>
        </div>

        <!-- DataTable -->
        <DataTable :value="questions" v-model:selection="selectedQuestions" v-model:expandedRows="expandedRows" selectionMode="multiple" dataKey="id" :paginator="true" :rows="10" responsiveLayout="scroll" class="p-datatable-sm">
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column field="serialNo" header="S.No" headerStyle="width: 5rem">
                <template #body="{ index }">
                    {{ index + 1 }}
                </template>
            </Column>
            <Column field="title" header="Question Title" headerStyle="min-width: 200px">
                <template #body="{ data }">
                    <div class="whitespace-pre-wrap" v-html="renderLatex(data.question.text)"></div>
                </template>
            </Column>
            <Column field="directory" header="Directory" headerStyle="min-width: 120px">
                <template #body="{ data }">
                    {{ data.directory || '-' }}
                </template>
            </Column>
            <Column field="course" header="Course" headerStyle="min-width: 120px">
                <template #body="{ data }">
                    {{ data.course || '-' }}
                </template>
            </Column>
            <Column field="trade" header="Trade" headerStyle="min-width: 120px">
                <template #body="{ data }">
                    {{ data.trade || '-' }}
                </template>
            </Column>
            <Column field="createdBy" header="Created By" headerStyle="min-width: 120px">
                <template #body> - </template>
            </Column>
            <Column :expander="true" headerStyle="width: 4rem" />

            <!-- Expanded Row Content -->
            <template #expansion="slotProps">
                <div class="p-4 bg-gray-50">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h5 class="font-semibold mb-2">Options:</h5>
                            <div v-for="(opt, optIdx) in slotProps.data.options" :key="optIdx" class="mb-3">
                                <div class="flex">
                                    <span class="font-medium mr-2">{{ String.fromCharCode(65 + optIdx) }}.</span>
                                    <div class="whitespace-pre-wrap" v-html="renderLatex(opt.text)"></div>
                                </div>
                                <div v-if="opt.images.length" class="flex flex-wrap gap-2 mt-1 ml-6">
                                    <img v-for="(img, imgIdx) in opt.images" :key="imgIdx" :src="getImagePath(img.path)" class="max-h-24" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <div class="mb-3">
                                <h5 class="font-semibold">Correct Answer:</h5>
                                <div class="whitespace-pre-wrap" v-html="renderLatex(slotProps.data.answer.text)"></div>
                                <div v-if="slotProps.data.answer.images.length" class="flex flex-wrap gap-2 mt-2">
                                    <img v-for="(img, imgIdx) in slotProps.data.answer.images" :key="imgIdx" :src="getImagePath(img.path)" class="max-h-24" />
                                </div>
                            </div>

                            <div v-if="slotProps.data.solution.text || slotProps.data.solution.images.length" class="mb-3">
                                <h5 class="font-semibold">Solution:</h5>
                                <div class="whitespace-pre-wrap" v-html="renderLatex(slotProps.data.solution.text)"></div>
                                <div v-if="slotProps.data.solution.images.length" class="flex flex-wrap gap-2 mt-2">
                                    <img v-for="(img, imgIdx) in slotProps.data.solution.images" :key="imgIdx" :src="getImagePath(img.path)" class="max-h-24" />
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <h5 class="font-semibold">Positive Marks:</h5>
                                    <p>{{ slotProps.data.positive_marks }}</p>
                                </div>
                                <div>
                                    <h5 class="font-semibold">Negative Marks:</h5>
                                    <p>{{ slotProps.data.negative_marks }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-2 mt-4">
                        <Button label="View" icon="pi pi-eye" class="p-button-sm" @click="$emit('view', slotProps.data)" />
                        <Button label="Edit" icon="pi pi-pencil" class="p-button-sm p-button-warning" @click="$emit('edit', slotProps.data)" />
                        <Button label="Delete" icon="pi pi-trash" class="p-button-sm p-button-danger" @click="confirmDeleteSingle(slotProps.data.id)" />
                    </div>
                </div>
            </template>
        </DataTable>

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
