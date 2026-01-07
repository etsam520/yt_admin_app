<script setup>
import { ref } from 'vue';
import Card from 'primevue/card';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import katex from 'katex';

const questionText = ref('');
const latexPreview = ref('');
const questions = ref([]);

// Improved LaTeX detection regex
// const latexRegex = /(\$\$.*?\$\$|\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\]|\\begin\{equation\}.*?\\end\{equation\}|\\[a-zA-Z]+\{.*?\}|[a-zA-Z0-9]+\^\{?[a-zA-Z0-9]+\}?|\_[a-zA-Z0-9]+|\\frac\{.*?\}\{.*?\}|\\sqrt\{.*?\})/g
const latexRegex = /(\$\$.*?\$\$|\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\]|\\begin\{([a-z]*\*?)\}.*?\\end\{\2\}|\\[a-zA-Z]+\{.*?\}|[a-zA-Z0-9]+\^\{?[a-zA-Z0-9]+\}?|\_[a-zA-Z0-9]+|\\frac\{.*?\}\{.*?\}|\\sqrt\{.*?\})/gs;
const renderLatex = (text) => {
    return text.replace(latexRegex, (match) => {
        // Remove common delimiters if present
        const latexContent = match
            .replace(/^\$\$|\$\$/g, '')
            .replace(/^\$|\$/g, '')
            .replace(/^\\\(|\\\)$/g, '')
            .replace(/^\\\[|\\\]$/g, '')
            .replace(/^\\begin\{equation\}|\\end\{equation\}$/g, '');

        try {
            return katex.renderToString(latexContent, { throwOnError: false });
        } catch (e) {
            console.error('KaTeX error:', e);
            return `<span class="text-red-500">${match}</span>`;
        }
    });
};

const renderPreview = () => {
    latexPreview.value = renderLatex(questionText.value);
};

const addQuestion = () => {
    if (questionText.value.trim()) {
        questions.value.push(questionText.value);
        questionText.value = '';
        latexPreview.value = '';
    }
};
</script>
<template>
    <Card class="p-4">
        <template #title>Add Question</template>

        <template #content>
            <Textarea v-model="questionText" rows="5" class="w-full mb-4" placeholder="Type your question here. Use $$...$$ for LaTeX." @input="renderPreview" />

            <div v-if="latexPreview" class="mb-4">
                <h3 class="font-bold mb-2">Live Preview:</h3>
                <div v-html="latexPreview" class="p-3 border rounded-md"></div>
            </div>

            <Button label="Add Question" icon="pi pi-plus" @click="addQuestion" />

            <div v-if="questions.length" class="mt-6">
                <h3 class="font-bold mb-2">Questions:</h3>
                <ul class="list-disc ml-5">
                    <li v-for="(q, idx) in questions" :key="idx" v-html="renderLatex(q)"></li>
                </ul>
            </div>
        </template>
    </Card>
</template>

<style>
/* Add KaTeX CSS if not already imported globally */
@import 'katex/dist/katex.min.css';
</style>
