<script setup>
import { ref, computed } from 'vue';

const files = ref([]);
const fileInput = ref(null);

const totalSizeMB = computed(() => files.value.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024);

function handleDrop(e) {
    files.value.push(...Array.from(e.dataTransfer.files));
}

function handleFileSelect(e) {
    files.value.push(...Array.from(e.target.files));
    e.target.value = ''; // reset input
}

function removeFile(index) {
    files.value.splice(index, 1);
}

function clearFiles() {
    files.value = [];
}

function uploadFiles() {
    files.value.forEach((file) => {
        // demo: just log
        console.log('Uploading:', file.name);
        // 👉 Replace with actual upload logic (fetch/axios)
    });
}
</script>

<template>
    <div class="w-full max-w-2xl mx-auto bg-white rounded-xl shadow p-6 space-y-4">
        <!-- Section Bar -->
        <div class="flex items-center justify-between border-b pb-3">
            <h2 class="text-lg font-semibold">Bulk Import</h2>
            <div class="text-sm text-gray-600">{{ files.length }} files • {{ totalSizeMB.toFixed(2) }} MB</div>
        </div>

        <!-- Drop Zone -->
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400" @dragover.prevent @drop.prevent="handleDrop" @click="fileInput.click()">
            <p class="text-gray-600">Drag & drop files here or click to browse</p>
            <input type="file" class="hidden" ref="fileInput" multiple @change="handleFileSelect" />
        </div>

        <!-- File List -->
        <ul v-if="files.length" class="space-y-2">
            <li v-for="(file, index) in files" :key="index" class="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                <div>
                    <p class="text-sm font-medium">{{ file.name }}</p>
                    <p class="text-xs text-gray-500">{{ (file.size / 1024 / 1024).toFixed(2) }} MB</p>
                </div>
                <button class="text-red-500 hover:text-red-700 text-sm" @click="removeFile(index)">Remove</button>
            </li>
        </ul>

        <!-- Action Buttons -->
        <div v-if="files.length" class="flex justify-end space-x-3 pt-3 border-t">
            <button class="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 text-sm" @click="clearFiles">Clear</button>
            <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm" @click="uploadFiles">Upload</button>
        </div>
    </div>
</template>
