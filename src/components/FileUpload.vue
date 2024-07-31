<template>
    <div class="file-upload-container border-2 border-dashed border-gray-300 p-4 rounded cursor-pointer" @dragover.prevent @drop.prevent="handleDrop" @click="fileInput.click()">
        <input type="file" ref="fileInput" :multiple="multiple" @change="handleFiles" style="display: none;" />
        <p class="text-center text-gray-500">{{ label }}</p>
        <p class="text-center text-gray-400">Drag & drop files here or click to upload</p>
    </div>
    <ul class="mt-2">
        <li v-for="(file, index) in uploadedFiles" :key="index">{{ file.name }}</li>
    </ul>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
    multiple: {
        type: Boolean,
        default: false,
    },
    label: {
        type: String,
        default: 'Upload Files',
    },
});

const uploadedFiles = ref([]);

const fileInput = ref(null);

const handleFiles = (event) => {
    const files = event.target.files;
    addFiles(files);
};

const handleDrop = (event) => {
    const files = event.dataTransfer.files;
    addFiles(files);
};

const addFiles = (files) => {
    for (let i = 0; i < files.length; i++) {
        uploadedFiles.value.push(files[i]);
    }
    // Emit the uploaded files for the parent component
    emit('upload', uploadedFiles.value);
};

</script>

<style scoped>
.file-upload-container {
    text-align: center;
    padding: 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}
.file-upload-container:hover {
    background-color: rgba(37, 99, 235, 0.1);
}
</style>