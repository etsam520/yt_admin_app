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
    // First handle tables
    const tableRegex = /\\begin\{tabular\}([\s\S]*?)\\end\{tabular\}/g;
    let processedText = text.replace(tableRegex, (match, content) => {
        return renderTable(content);
    });

    // Then handle regular LaTeX
    return processedText.replace(latexRegex, (match) => {
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
                fleqn: true,
                displayMode: match.startsWith('$$') || match.startsWith('\\[') || match.includes('\\begin{equation')
            });
        } catch (e) {
            console.error('KaTeX error:', e);
            return `<span class="text-red-500">${escapeHtml(match)}</span>`;
        }
    });
};

const renderTable = (tableContent) => {
    const rows = tableContent.split('\\\\').filter((row) => row.trim());
    let html = '<table class="latex-table"><tbody>';

    for (const row of rows) {
        // Skip hline commands that appear alone on a line
        if (row.trim() === '\\hline') continue;

        html += '<tr>';
        const cells = row.split('&').map((cell) => {
            // Remove hlines that might be in the cell
            let content = cell.replace(/\\hline/g, '').trim();
            // Render any LaTeX in the cell
            return renderLatex(content);
        });

        // Add hline if it's at the start of the row
        if (row.trim().startsWith('\\hline')) {
            html = html.replace('<tr>', '<tr style="border-top: 1px solid black;">');
        }

        for (const cell of cells) {
            html += `<td>${cell}</td>`;
        }

        html += '</tr>';
    }

    html += '</tbody></table>';
    return html;
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

const insertAtCursor = (text) => {
    try {
        if (!textareaRef.value) {
            throw new Error('Textarea reference not found');
        }

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
                    <li v-for="(q, idx) in questions" :key="idx" v-html="renderLatex(q)"></li>
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

.latex-table {
    border-collapse: collapse;
    margin: 1em 0;
    width: 100%;
}

.latex-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
}

.latex-table tr:first-child {
    border-top: 2px solid black;
}

.latex-table tr:last-child {
    border-bottom: 2px solid black;
}

.latex-table tr:nth-child(even) {
    background-color: #f9f9f9;
}
</style>
