<template>
    <div class="form-container bg-white rounded-lg shadow-lg p-6">
        <FormKit
            type="form"
            name="contactForm"
            :use-local-storage="`formkit-${props.tabData.id}`"
            @submit="submitHandler"
        >
            <FormKit
                v-for="question in props.tabData.questions"
                :key="question.name"
                :type="question.type"
                :name="question.name"
                :label="question.label"
                :required="question.required"
                v-model="props.tabData.formData[question.name]"
            />
            <!-- <button type="submit" class="submit-button bg-blue-500 text-white px-4 py-2 rounded mt-4">Submit</button> -->
        </FormKit>
    </div>
</template>

<script setup>
import { ref, watch, defineProps } from 'vue';
import { FormKit, reset } from '@formkit/vue';
import { createLocalStoragePlugin } from '@formkit/addons';

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

const submitHandler = async (payload, node) => {
    console.log('Submitted data:', payload);
    try {
        await new Promise((resolve, reject) => {
            const isSuccess = true; // Simulate a successful submission
            setTimeout(() => {
                if (isSuccess) {
                    resolve();
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
        alert('Submitted! 🎉');
        node.reset();

        // Call the removeTab method from the parent component to remove the tab
        props.removeTab(props.tabData.id);

    } catch (error) {
        console.error('Submission error:', error);
        alert('Submission failed! 😢');
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