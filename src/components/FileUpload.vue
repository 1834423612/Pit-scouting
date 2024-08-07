<template>
    <div class="relative flex flex-col p-4 text-gray-400 border border-gray-200 rounded my-4">
        <div @dragover.prevent @drop.prevent="handleDrop" class="relative flex flex-col text-gray-400 border border-gray-200 border-dashed rounded cursor-pointer p-4">
            <input accept="*" type="file" multiple
                   class="absolute inset-0 z-50 w-full h-full p-0 m-0 outline-none opacity-0 cursor-pointer"
                   @change="addFiles($event)" />

            <div class="flex flex-col items-center justify-center py-10 text-center">
                <svg class="w-6 h-6 mr-1 text-current-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="m-0">Drag your files here or click in this area.</p>
                <p class="text-xs text-gray-500">Max size: {{ `${humanFileSize(MAX_FILE_SIZE)}` }}</p>
                <p class="text-lg text-gray-500">{{ `${props.questionName}` }}</p>
            </div>
        </div>

        <template v-if="files.length > 0">
            <div class="grid grid-cols-2 gap-4 mt-4 md:grid-cols-6 min-h-32">
                <template v-for="(file, index) in files" :key="index">
                    <div class="relative flex flex-col items-center overflow-hidden text-center bg-gray-100 border rounded cursor-move select-none">
                        <button class="absolute top-0 right-0 z-50 p-1 bg-white rounded-bl focus:outline-none" type="button" @click="removeFile(index)">
                            <svg class="w-4 h-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                        <img class="absolute inset-0 object-cover w-full h-full border-4 border-white" :src="file.thumbnailUrl" />
                        <p class="absolute bottom-0 left-0 right-0 flex flex-col p-2 text-xs bg-white bg-opacity-50">
                            <span class="w-full font-bold text-gray-900 truncate">{{ file.name }}</span>
                            <span class="text-xs text-gray-900">{{ humanFileSize(file.size) }}</span>
                        </p>
                    </div>
                </template>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps({
    tabId: { type: String, required: true },
    questionName: { type: String, required: true }
});

const files = ref([]);
const MAX_FILE_SIZE = 1024 * 1024 * 50; // 50 MB
const apiToken = import.meta.env.VITE_IMAGE_KJCH_IMGBASE_API_TOKEN; // Get the API token from .env file

// Load file data from localStorage
const loadFilesFromLocalStorage = () => {
    const storedData = JSON.parse(localStorage.getItem(`formUpload-${props.tabId}-${props.questionName}`)) || {};
    const storedFiles = storedData[props.questionName] || [];
    files.value = storedFiles;
};

onMounted(() => {
    loadFilesFromLocalStorage();
});

// Add files
const addFiles = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    for (const file of selectedFiles) {
        if (file.size > MAX_FILE_SIZE) {
            alert(`File ${file.name} exceeds the maximum size of 50 MB`);
            continue;
        }
        await uploadFile(file);
    }
};

// Upload file using Axios
const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    // Include other necessary fields here as needed
    // formData.append('token', 'your_token_here');
    formData.append('permission', 0);
    // formData.append('strategy_id', your_strategy_id);
    // formData.append('album_id', your_album_id);
    // formData.append('expired_at', 'your_expired_at');

    try {
        const response = await axios.post('https://imgbase.kjchmc.cn/api/v1/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${apiToken}`, // Get the token from .env file
                'Accept': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': '*',
                'Access-Control-Allow-Headers': '*',
            }
        });

        if (response.data.status) {
            const uploadedFile = {
                name: file.name,
                size: file.size,
                thumbnailUrl: response.data.data.links.thumbnail_url, // Use thumbnail URL for images
                deleteUrl: response.data.data.links.delete_url, // Delete URL
                key: response.data.data.key, // Image Key
            };
            files.value.push(uploadedFile);
            saveToLocalStorage(); // Save to localStorage
            console.log(response.data.data.links.thumbnail_url);
            console.log(response.data);
        } else {
            console.error(response.data.message);
            alert('Upload failed: ' + response.data.message);
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Upload failed: ' + error.message);
    }
};

// Remove file
const removeFile = async (index) => {
    const fileToRemove = files.value[index];
    if (confirm(`Are you sure you want to remove ${fileToRemove.name}?`)) {
        try {
            // fileToRemove.deleteUrl
            await axios.delete(`https://imgbase.kjchmc.cn/api/v1/images/${fileToRemove.key}`, {
                headers: {
                    'Authorization': `Bearer ${apiToken}`, // Get the token from .env file
                }
            });
            files.value.splice(index, 1);
            saveToLocalStorage(); // Update localStorage
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Delete failed: ' + error.message);
        }
    }
};

// Save file information to localStorage
const saveToLocalStorage = () => {
    const storedData = JSON.parse(localStorage.getItem(`formUpload-${props.tabId}-${props.questionName}`)) || {};
    storedData[props.questionName] = files.value;
    localStorage.setItem(`formUpload-${props.tabId}-${props.questionName}`, JSON.stringify(storedData));
};

// Check if the file type is an image
// const isImage = (file) => {
//     return file?.type?.startWith('image/') || false; // Make sure file.type is a valid value
// };

// Convert bytes to human-readable format
const humanFileSize = (size) => {
    return size ? (size / (1024 ** Math.floor(Math.log(size) / Math.log(1024)))).toFixed(2) + " " + ['B', 'kB', 'MB', 'GB', 'TB'][Math.floor(Math.log(size) / Math.log(1024))] : '0 B'; // Make sure size is a valid value
};
</script>

<style scoped>
/* Some style */
</style>