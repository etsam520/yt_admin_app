<script>
import { ref } from 'vue';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default {
    props: {
        questions: {
            type: Array,
            required: true
        }
    },
    emits: ['edit', 'delete', 'view'],
    setup() {
        const expandedQuestions = ref([]);

        const toggleExpand = (id) => {
            const index = expandedQuestions.value.indexOf(id);
            if (index > -1) {
                expandedQuestions.value.splice(index, 1);
            } else {
                expandedQuestions.value.push(id);
            }
        };

        const renderLatex = (text) => {
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
        };

        const getImagePath = (path) => {
            if (!path) return '';
            if (path.startsWith('http') || path.startsWith('/')) {
                return path;
            }
            return `/storage/${path.replace('./media/', '')}`;
        };

        return {
            expandedQuestions,
            toggleExpand,
            renderLatex,
            getImagePath
        };
    }
};
</script>

<template>
    <div class="space-y-4">
        <div v-for="(q, idx) in questions" :key="q.id" class="p-4 border rounded-md">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h4 class="font-bold">{{ idx + 1 }}. <span v-html="renderLatex(q.question.text)"></span></h4>
                    <div v-if="q.question.images.length" class="flex flex-wrap gap-2 mt-2">
                        <img v-for="(img, imgIdx) in q.question.images" :key="'saved-q-img-' + imgIdx" :src="getImagePath(img.path)" class="max-h-20" />
                    </div>
                </div>

                <div class="flex gap-2">
                    <Button icon="pi pi-eye" @click="$emit('view', q)" class="p-button-sm p-button-info" v-tooltip="'View Question'" />
                    <Button icon="pi pi-pencil" @click="$emit('edit', q)" class="p-button-sm p-button-warning" v-tooltip="'Edit Question'" />
                    <Button icon="pi pi-trash" @click="$emit('delete', q.id)" class="p-button-sm p-button-danger" v-tooltip="'Delete Question'" />
                    <Button
                        :icon="expandedQuestions.includes(q.id) ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                        @click="toggleExpand(q.id)"
                        class="p-button-sm p-button-text"
                        v-tooltip="expandedQuestions.includes(q.id) ? 'Hide Details' : 'Show Details'"
                    />
                </div>
            </div>

            <div v-if="expandedQuestions.includes(q.id)" class="mt-3 pt-3 border-t">
                <div class="mb-3">
                    <h5 class="font-semibold">Options:</h5>
                    <div v-for="(opt, optIdx) in q.options" :key="'saved-opt-' + optIdx" class="ml-4 mb-2">
                        <div class="flex items-start">
                            <span class="font-semibold mr-2">{{ String.fromCharCode(65 + optIdx) }}.</span>
                            <div>
                                <div class="whitespace-pre-wrap" v-html="renderLatex(opt.text)"></div>
                                <div v-if="opt.images.length" class="flex flex-wrap gap-2 mt-1">
                                    <img v-for="(img, imgIdx) in opt.images" :key="'saved-o-img-' + optIdx + '-' + imgIdx" :src="getImagePath(img.path)" class="max-h-32" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mb-3">
                    <h5 class="font-semibold">Correct Answer:</h5>
                    <div class="whitespace-pre-wrap" v-html="renderLatex(q.answer.text)"></div>
                    <div v-if="q.answer.images.length" class="flex flex-wrap gap-2 mt-2">
                        <img v-for="(img, imgIdx) in q.answer.images" :key="'saved-a-img-' + imgIdx" :src="getImagePath(img.path)" class="max-h-40" />
                    </div>
                </div>

                <div v-if="q.solution.text || q.solution.images.length" class="mb-3">
                    <h5 class="font-semibold">Solution:</h5>
                    <div class="whitespace-pre-wrap" v-html="renderLatex(q.solution.text)"></div>
                    <div v-if="q.solution.images.length" class="flex flex-wrap gap-2 mt-2">
                        <img v-for="(img, imgIdx) in q.solution.images" :key="'saved-s-img-' + imgIdx" :src="getImagePath(img.path)" class="max-h-40" />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h5 class="font-semibold">Positive Marks:</h5>
                        <p>{{ q.positive_marks }}</p>
                    </div>
                    <div>
                        <h5 class="font-semibold">Negative Marks:</h5>
                        <p>{{ q.negative_marks }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
.katex-display {
    margin: 0.5em 0;
    overflow-x: auto;
    overflow-y: hidden;
}

.katex {
    font-size: 1.1em;
}
</style>
