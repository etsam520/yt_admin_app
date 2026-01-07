<script setup>
import { ref, nextTick } from 'vue';
import Card from 'primevue/card';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const questionText = ref('');
const latexPreview = ref('');
const questions = ref([]);
const textareaRef = ref(null);

// Enhanced LaTeX detection with table and graph support
const latexRegex = /(\$\$.*?\$\$|\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\]|\\begin\{([a-z]*\*?)\}.*?\\end\{\2\}|\\[a-zA-Z]+\{.*?\}|[a-zA-Z0-9]+\^\{?[a-zA-Z0-9]+\}?|\_[a-zA-Z0-9]+|\\frac\{.*?\}\{.*?\}|\\sqrt\{.*?\})/gs;

const renderLatex = (text) => {
    return text.replace(latexRegex, (match) => {
        // Remove common delimiters if present
        const latexContent = match
            .replace(/^\$\$|\$\$/g, '')
            .replace(/^\$|\$/g, '')
            .replace(/^\\\(|\\\)$/g, '')
            .replace(/^\\\[|\\\]$/g, '')
            .replace(/^\\begin\{([a-z]*\*?)\}|\\end\{\1\}$/g, '');

        try {
            return katex.renderToString(latexContent, {
                throwOnError: false,
                displayMode: match.startsWith('$$') || match.startsWith('\\[') || match.includes('\\begin{equation')
            });
        } catch (e) {
            console.error('KaTeX error:', e);
            return `<span class="text-red-500">${escapeHtml(match)}</span>`;
        }
    });
};

// Helper to escape HTML
const escapeHtml = (unsafe) => {
    return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
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

// Improved insertAtCursor function with error handling
const insertAtCursor = (text) => {
    try {
        if (!textareaRef.value) {
            throw new Error('Textarea reference not found');
        }

        // For PrimeVue Textarea, we need to access the underlying HTML textarea element
        const textarea = textareaRef.value.$el?.querySelector('textarea') ?? textareaRef.value.$el;

        if (!textarea) {
            throw new Error('Textarea element not found');
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = questionText.value.substring(0, start);
        const after = questionText.value.substring(end);

        questionText.value = before + text + after;

        // Set cursor position after inserted text
        nextTick(() => {
            textarea.focus();
            textarea.selectionStart = start + text.length;
            textarea.selectionEnd = start + text.length;
        });

        // Trigger preview update
        renderPreview();
    } catch (error) {
        console.error('Error inserting text:', error);
        // Fallback to simple append if cursor positioning fails
        questionText.value += text;
    }
};

// Rest of the code remains the same
const insertLatex = () => {
    insertAtCursor('\n$$\nYour equation here\n$$\n');
};

const insertTable = () => {
    insertAtCursor(`
\\begin{tabular}{|c|c|}
\\hline
Header 1 & Header 2 \\\\
\\hline
Cell 1 & Cell 2 \\\\
\\hline
\\end{tabular}
`);
};

const insertGraph = () => {
    insertAtCursor(`
\\begin{tikzpicture}
\\begin{axis}[
    xlabel=$x$,
    ylabel=$y$,
    xmin=0, xmax=10,
    ymin=0, ymax=10,
    axis lines=center
]
\\addplot[color=red]{x^2};
\\end{axis}
\\end{tikzpicture}
`);
};
</script>

<template>
    <Card class="p-4">
        <template #title>Add Question</template>

        <template #content>
            <div class="flex gap-2 mb-4">
                <Button label="Insert LaTeX" icon="pi pi-plus" @click="insertLatex" class="p-button-sm" />
                <Button label="Insert Table" icon="pi pi-table" @click="insertTable" class="p-button-sm" />
                <Button label="Insert Graph" icon="pi pi-chart-line" @click="insertGraph" class="p-button-sm" />
            </div>

            <Textarea v-model="questionText" rows="5" class="w-full mb-4" placeholder="Type your question here. Use $$...$$ for LaTeX." @input="renderPreview" ref="textareaRef" />

            <div v-if="latexPreview" class="mb-4">
                <h3 class="font-bold mb-2">Live Preview:</h3>
                <div v-html="latexPreview" class="p-3 border rounded-md bg-gray-50"></div>
            </div>

            <Button label="Add Question" icon="pi pi-plus" @click="addQuestion" />

            <div v-if="questions.length" class="mt-6">
                <h3 class="font-bold mb-2">Questions:</h3>
                <ul class="list-disc ml-5 space-y-2">
                    <li v-for="(q, idx) in questions" :key="idx" v-html="renderLatex(q)" class="p-2 bg-gray-50 rounded"></li>
                </ul>
            </div>
        </template>
    </Card>
</template>
<style>
.katex {
    font-size: 1.1em;
}
.katex-display {
    margin: 1em 0;
}
.error {
    color: #dc2626;
}
</style>
