<script>
import { ref } from 'vue';
import katex from 'katex';
import { getHostname } from '@/utils/helpers';
import 'katex/dist/katex.min.css';

export default {
    props: {
        question: {
            type: Object,
            required: true
        },
        mode: {
            type: String,
            default: 'web',
            validator: (value) => ['web', 'json'].includes(value)
        }
    },
    setup() {
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
            return getHostname() + path;
            //   return `/storage/${path.replace('./media/', '')}`
        };

        return {
            renderLatex,
            getImagePath
        };
    }
};
</script>

<template>
    <div class="mt-6 p-4 border rounded-md bg-gray-50">
        <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-xl">Question Preview</h3>
            <div class="flex gap-2">
                <Button label="Web Format" :severity="mode === 'web' ? 'primary' : 'secondary'" @click="$emit('change-mode', 'web')" class="p-button-sm" />
                <Button label="JSON Format" :severity="mode === 'json' ? 'primary' : 'secondary'" @click="$emit('change-mode', 'json')" class="p-button-sm" />
                <Button icon="pi pi-times" @click="$emit('close')" class="p-button-sm p-button-text" v-tooltip="'Close preview'" />
            </div>
        </div>

        <!-- Web Format Preview -->
        <div v-if="mode === 'web'">
            <hr class="w-full border-t border-gray-300 my-4" />
            <hr class="w-full border-t border-gray-300 my-4" />
            <div class="mb-6">
                <h4 class="font-bold mb-2">Question:English</h4>
                <div class="whitespace-pre-wrap" v-html="renderLatex(question.question.text.en)"></div>

                <div v-if="question.question.images.length" class="flex flex-wrap gap-2 mt-2">
                    <img v-for="(img, idx) in question.question.images" :key="'preview-q-img-' + idx" :src="getImagePath(img.path)" class="max-h-60" />
                </div>
            </div>

            <div class="mb-6">
                <h4 class="font-bold mb-2">Options:</h4>
                <div v-for="(option, index) in question.options" :key="'preview-opt-' + index" class="mb-3">
                    <div class="flex items-start">
                        <span class="font-bold mr-2">{{ String.fromCharCode(65 + index) }}.</span>
                        <div :class="String.fromCharCode(65 + index) === question.answer?.charAt(0).toUpperCase() ? 'bg-green-100' : ''">
                            <div class="whitespace-pre-wrap" v-html="renderLatex(option.text.en)"></div>
                            <div v-if="option.images.length" class="flex flex-wrap gap-2 mt-1">
                                <img v-for="(img, idx) in option.images" :key="'preview-o-img-' + index + '-' + idx" :src="getImagePath(img.path)" class="max-h-40" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="question.solution.text || question.solution.images.length" class="mb-6">
                <h4 class="font-bold mb-2">Solution:</h4>
                <div class="whitespace-pre-wrap" v-html="renderLatex(question.solution.text.en)"></div>
                <div v-if="question.solution.images.length" class="flex flex-wrap gap-2 mt-2">
                    <img v-for="(img, idx) in question.solution.images" :key="'preview-s-img-' + idx" :src="getImagePath(img.path)" class="max-h-60" />
                </div>
            </div>

            <div class="p-4 shadow rounded-md w-fit">
                <h5 class="font-bold mb-2">Tags:</h5>
                <div class="flex gap-2 flex-wrap">
                    <div v-for="tag in question.tags" :key="tag" class="flex items-center gap-2 px-3 py-1 rounded-full border border-gray-300 bg-gray-100 hover:bg-gray-200 cursor-pointer transition">
                        <span for="ingredient2" class="text-sm">{{ tag }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="mode === 'web'">
            <hr class="w-full border-t border-gray-300 my-4" />
            <hr class="w-full border-t border-gray-300 my-4" />
            <div class="mb-6">
                <h4 class="font-bold mb-2">Question:Hindi</h4>
                <div class="whitespace-pre-wrap" v-html="renderLatex(question.question.text.hi)"></div>
                <div v-if="question.question.images.length" class="flex flex-wrap gap-2 mt-2">
                    <img v-for="(img, idx) in question.question.images" :key="'preview-q-img-' + idx" :src="getImagePath(img.path)" class="max-h-60" />
                </div>
            </div>

            <div class="mb-6">
                <h4 class="font-bold mb-2">Options:</h4>
                <div v-for="(option, index) in question.options" :key="'preview-opt-' + index" class="mb-3">
                    <div class="flex items-start">
                        <span class="font-bold mr-2">{{ String.fromCharCode(65 + index) }}.</span>
                        <div :class="String.fromCharCode(65 + index) === question.answer?.charAt(0).toUpperCase() ? 'bg-green-100' : ''">
                            <div class="whitespace-pre-wrap" v-html="renderLatex(option.text.hi)"></div>
                            <div v-if="option.images.length" class="flex flex-wrap gap-2 mt-1">
                                <img v-for="(img, idx) in option.images" :key="'preview-o-img-' + index + '-' + idx" :src="getImagePath(img.path)" class="max-h-40" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="question.solution.text || question.solution.images.length" class="mb-6">
                <h4 class="font-bold mb-2">Solution:</h4>
                <div class="whitespace-pre-wrap" v-html="renderLatex(question.solution.text.en)"></div>
                <div v-if="question.solution.images.length" class="flex flex-wrap gap-2 mt-2">
                    <img v-for="(img, idx) in question.solution.images" :key="'preview-s-img-' + idx" :src="getImagePath(img.path)" class="max-h-60" />
                </div>
            </div>

            <div class="p-4 shadow rounded-md w-fit">
                <h5 class="font-bold mb-2">Tags:</h5>
                <div class="flex gap-2 flex-wrap">
                    <div v-for="tag in question.tags" :key="tag" class="flex items-center gap-2 px-3 py-1 rounded-full border border-gray-300 bg-gray-100 hover:bg-gray-200 cursor-pointer transition">
                        <span for="ingredient2" class="text-sm">{{ tag }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- JSON Format Preview -->
        <div v-else class="bg-white p-4 rounded overflow-auto max-h-96">
            <pre>{{ JSON.stringify(question, null, 2) }}</pre>
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

pre {
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.9rem;
    line-height: 1.4;
    white-space: pre-wrap;
    word-wrap: break-word;
}
</style>
