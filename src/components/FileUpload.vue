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
            </div>
        </div>

        <template v-if="files.length > 0">
            <div class="grid grid-cols-2 gap-4 mt-4 md:grid-cols-6">
                <template v-for="(file, index) in files" :key="index">
                    <div class="relative flex flex-col items-center overflow-hidden text-center bg-gray-100 border rounded cursor-move select-none">
                        <button class="absolute top-0 right-0 z-50 p-1 bg-white rounded-bl focus:outline-none" type="button" @click="removeFile(index)">
                            <svg class="w-4 h-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                        <img v-if="isImage(file)" class="absolute inset-0 object-cover w-full h-full border-4 border-white" :src="loadFile(file)" />
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
import { ref, defineEmits } from 'vue';

const emit = defineEmits(['upload']); // 定义 emit 事件

const files = ref([]);

const addFiles = (event) => {
    const selectedFiles = Array.from(event.target.files);
    files.value.push(...selectedFiles);
    emit('upload', files.value); // Emit the upload event with the files
};

const removeFile = (index) => {
    files.value.splice(index, 1);
    emit('upload', files.value); // Emit the upload event with the updated files
};

const loadFile = (file) => {
    return URL.createObjectURL(file);
};

const isImage = (file) => {
    return file.type.includes('image/');
};

const humanFileSize = (size) => {
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return (size / Math.pow(1024, i)).toFixed(2) + " " + ['B', 'kB', 'MB', 'GB', 'TB'][i];
};

const handleDrop = (event) => {
    const droppedFiles = Array.from(event.dataTransfer.files);
    files.value.push(...droppedFiles);
    emit('upload', files.value); // Emit the upload event with the dropped files
};
</script>

<style scoped>
/* 样式可以根据需要进行调整 */
</style>