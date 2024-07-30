<template>
    <div class="form-container bg-white rounded-lg shadow-lg p-6">
      <FormKit
        type="form"
        name="contactForm"
        use-local-storage
        :plugins="[createLocalStoragePlugin({ key: `formkit-${props.tabData.id}` })]"
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
        <button type="submit" class="submit-button bg-blue-500 text-white px-4 py-2 rounded mt-4">Submit</button>
      </FormKit>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { FormKit } from '@formkit/vue';
  import { createLocalStoragePlugin } from '@formkit/addons';
  
  const props = defineProps({
    tabData: Object // 确保 tabData 是一个对象
  });
  
  const submitHandler = async (payload, node) => {
    console.log('Submitted data:', payload);
    await new Promise((r) => setTimeout(r, 2000));
    alert('Submitted! 🎉');
    node.reset();
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