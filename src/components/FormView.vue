<template>
    <div class="form-container bg-white rounded-lg shadow-lg p-6">
        <div class="relative mb-4" v-if="showEvent">
            <label>
                <span class="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {{ eventName }}
                </span>&nbsp;
                
                <span class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    {{ eventIdValue }}
                </span>
            </label>
            <div class="absolute top-0 right-0">
                <span class="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                   Form ID 
                </span>&nbsp;
                
                <span class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    {{ `${props.tabData.id}` }}
                </span>
            </div>
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
                        :value="question.value"
                        v-model="props.tabData.formData[question.name]"
                        :options="question.options"
                        :validation="required"
                    />

                    <!-- Revised file upload component -->
                    <FileUpload v-if="question.type === 'file'" @upload="handleFileUpload" :tabId="props.tabData.id" :questionName="question.name"/>
                </template>
            </template>
        </FormKit>
    </div>
</template>

<script setup>
import { ref, watch, defineProps, computed } from 'vue';
import { FormKit, reset } from '@formkit/vue';
import { createLocalStoragePlugin } from '@formkit/addons';
import Swal from 'sweetalert2';
import { error } from '@formkit/core';
import FileUpload from './FileUpload.vue';

const props = defineProps({
    tabData: Object, // Make sure the tabData prop is passed to the component
    removeTab: Function, // Make sure the removeTab method is passed to the component
});

// computed showEvent
const showEvent = computed(() => {
    const eventIdQuestion = props.tabData.questions.find(question => question.show_event);
    return props.tabData.questions.some(question => question.show_event);
});

// computed eventName
const eventName = computed(() => {
    const eventNameQuestion = props.tabData.questions.find(question => question.label);
    return eventNameQuestion ? eventNameQuestion.label : null; // Get event name
});

// computed eventIdValue
const eventIdValue = computed(() => {
    const eventIdQuestion = props.tabData.questions.find(question => question.event_id);
    return eventIdQuestion ? eventIdQuestion.event_id_value : null; // Get event_id_value
});

// Monitor changes in the form data and save them to localStorage
watch(() => props.tabData.formData, (newValue) => {
    localStorage.setItem(`formkit-${props.tabData.id}`, JSON.stringify(newValue));
}, { deep: true });

// const handleInputChange = () => {
//     localStorage.setItem(`formkit-${props.tabData.id}`, JSON.stringify(props.tabData.formData));
// };

// Handle file uploads
const handleFileUpload = (uploadedFiles) => {
    console.log('Uploaded files:', uploadedFiles);

    // Handle uploaded files, e.g., save to form data
    props.tabData.formData.files = uploadedFiles; // Save the uploaded files to the form data
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

    const fullData = {
        event_id: eventIdValue.value,
        ...props.tabData.formData,
    };

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