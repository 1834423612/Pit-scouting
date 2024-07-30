<!-- 
 This components not used yet
-->

<template>
  <div>
    <div class="tabs mb-4">
        <button
          v-for="tab in tabs"
          :key="tab.name"
          @click="setActiveTab(tab.name)"
          :class="{
            'tab-button text-white py-2 px-4 rounded mx-1': true,
            'bg-blue-700': activeTab === tab.name,
            'bg-blue-500': activeTab !== tab.name }"
          >
          {{ tab.title }}
          <span @click.stop="removeTab(tab.name)" class="ml-2 text-red-500 cursor-pointer">&times;</span>
        </button>
        <button @click="addTab" class="tab-button bg-green-500 text-white py-2 px-4 rounded mx-1">Add Tab</button>
      </div>
    <form-view v-if="activeTab" :tabData="getTabData(activeTab)" @update-form="updateFormData" />
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';
import FormView from '@/components/FormView.vue';

const props = defineProps({
  tabs: Array,
  modelValue: String,
});

const emit = defineEmits(['update:modelValue', 'add-tab', 'remove-tab']);

const activeTab = ref(props.modelValue);

const setActiveTab = (name) => {
  activeTab.value = name;
  emit('update:modelValue', name);
};

const getTabData = (tabName) => {
  const currentTab = tabs.value.find(tab => tab.name === tabName);
  return currentTab ? currentTab.formData : {}; // Return the form data of the current tab
};

const updateFormData = (data) => {
  const tab = props.tabs.find(tab => tab.name === activeTab.value);
  if (tab) {
    tab.formData = data;
    emit('update:model-value', activeTab.value);
  }
};

// Watch for changes in props.modelValue
watch(() => props.modelValue, (newValue) => {
  activeTab.value = newValue;
});
</script>

<style scoped>
.tabs {
  display: flex;
}

.tab-button {
  transition: background-color 0.3s ease;
}

.tab-button:hover {
  background-color: rgba(37, 99, 235, 0.7);
  /* Tailwind blue-600 */
}
</style>