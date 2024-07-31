<template>
    <div class="form-container bg-white rounded-lg shadow-lg p-6">
        <div class="mb-4" v-if="props.tabData.event_id">
            <label>
                <span class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    Event ID: {{ props.tabData.event_id }}
                </span>
            </label>
        </div>

        <FormKit
            type="form"
            name="contactForm"
            :use-local-storage="`formkit-${props.tabData.id}`"
            @submit="submitHandler"
        >
            <template v-if="props.tabData.questions && props.tabData.questions.length > 0">
                <template v-for="(question, index) in props.tabData.questions" :key="question.name">
                    <FormKit
                        v-if="question"
                        :type="question.type"
                        :name="question.name"
                        :label="question.label"
                        :required="question.required"
                        :disabled="question.disabled"
                        v-model="props.tabData.formData[question.name]"
                        :options="question.options"
                    />

                    <!-- Revised file upload component -->
                    <file-upload
                        v-if="question.type === 'file'"
                        :multiple="question.multiple"
                        :label="question.label"
                        @upload="handleFileUpload(question.name, $event)"
                    />
                </template>
            </template>

            <button type="submit" class="submit-button bg-blue-500 text-white px-4 py-2 rounded mt-4">Submit</button>
        </FormKit>
    </div>
</template>

<script setup>
import { ref, watch, defineProps } from 'vue';
import { FormKit, reset } from '@formkit/vue';
import { createLocalStoragePlugin } from '@formkit/addons';
import Swal from 'sweetalert2';
import { error } from '@formkit/core';
import FileUpload from './FileUpload.vue'; // 引用新的 FileUpload 组件

const props = defineProps({
    tabData: Object, // Make sure the tabData prop is passed to the component
    removeTab: Function, // Make sure the removeTab method is passed to the component
});

// Monitor changes in the form data and save them to localStorage
watch(() => props.tabData.formData, (newValue) => {
    localStorage.setItem(`formkit-${props.tabData.id}`, JSON.stringify(newValue));
}, { deep: true });

// const handleInputChange = () => {
//     localStorage.setItem(`formkit-${props.tabData.id}`, JSON.stringify(props.tabData.formData));
// };

// Handle file uploads
const handleFileUpload = (name, event) => {
    const files = event.target.files;
    console.log(`Files uploaded for ${name}:`, files);
    // You can add logic to save these files or process them as needed
};

const submitHandler = async (payload, node) => {
    const result = await Swal.fire({
        title: 'Are you sure?',
        html: `
        <span style="font-weight: bold; color: #60a5fa;">You will <span style="text-decoration-line: spelling-error; color: #f43f5e;">not be able</span> to revert this once you submit</span>
        <br />
        <!--<span style="font-size: 12px; color: #777;">${JSON.stringify(payload)}</span>-->
        <br />
        <span style="color: #FF9B00;">Check the form Tab before you click:</span>
        <p  class="mt-1.5">
            <span class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20">${props.tabData.title}</span>
            <span style="color: #777;">(<span class="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">${props.tabData.id}</span>)</span>
        </p>
        `,
        icon: 'warning',
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonColor: '#3497ff',
        cancelButtonColor: '#f15353',
        confirmButtonText: 'Yes, submit',
        cancelButtonText: 'No, cancel'
    });

    if (result.isConfirmed) {
        try {
            await new Promise((resolve, reject) => {
                const isSuccess = false; // Simulate a successful submission
                
                setTimeout(() => {
                    if (isSuccess) {
                        resolve();
                        console.log('Submitted data:', payload);
                    } else {
                        reject(new Error('Submission failed'));
                    }
                }, 2000);
            });

            // await new Promise((r) => setTimeout(r, 2000));

            props.tabData.formData = {}; // Clear the form data after submission
            localStorage.setItem(`formkit-${props.tabData.id}`, JSON.stringify(props.tabData.formData)); // Clear the form data from localStorage
            // localStorage.removeItem(`formkit-${props.tabData.id}`); // Remove the form data from localStorage

            console.log('Form data cleared:', props.tabData.id);
            // alert('Submitted! 🎉');
            Swal.fire('Submitted🎉', 'Your form has been submitted.', 'success');
            node.reset(); // Reset the form after submission

            // Call the removeTab method from the parent component to remove the tab
            props.removeTab(props.tabData.id);

        } catch (error) {
            console.error('Submission error:', error);
            // Swal.fire('Submission failed!😢', 'There was an error submitting your form.', `error`);
            Swal.fire({
                title: 'Submission failed!😢',
                icon: 'error',
                html: `
                There was an error submitting your form.
                <div class="mt-2">
                    <span style="font-size: 12px; color: #777;">${error.message}</span>
                </div>
                `,
                confirmButtonText: 'OK',
            });
        }
    }
};
</script>

<style scoped>
.form-container {
    padding: 16px;
}

.submit-button {
    margin-top: 10px;
}
</style>