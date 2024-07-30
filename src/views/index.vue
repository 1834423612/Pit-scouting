<template>
    <div class="container mx-auto">
      <div class="tabs mb-4">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="setActiveTab(tab.id)"
          :class="{
            'tab-button text-white py-2 px-4 rounded mx-1': true,
            'bg-blue-700': activeTab === tab.id,
            'bg-blue-500': activeTab !== tab.id
          }"
        >
          {{ tab.title }}
          <span @click.stop="removeTab(tab.id)" class="ml-2 text-red-500 cursor-pointer">&times;</span>
        </button>
        <button @click="addTab" class="tab-button bg-green-500 text-white py-2 px-4 rounded mx-1">Add Tab</button>
      </div>
  
      <button @click="clearCurrentTab" class="mt-4 bg-red-500 text-white px-4 py-2 rounded">Clear Current Tab</button>
  
      <form-view v-if="activeTab" :tab-data="getTabData(activeTab)" />
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import FormView from '@/components/FormView.vue';
  import questionsData from '@/data/questions.json';
  
  // 生成唯一 ID 的函数
  const generateId = () => '_' + Math.random().toString(36).substr(2, 9);
  
  const tabs = ref([]);
  const activeTab = ref('');
  
  const initTabs = () => {
    const storedTabs = JSON.parse(localStorage.getItem('editableTabs')) || [];
  
    if (storedTabs.length === 0) {
      const defaultTab = {
        id: generateId(),
        title: 'User 1',
        formData: {},
        questions: questionsData.questions
      };
      storedTabs.push(defaultTab);
      localStorage.setItem('editableTabs', JSON.stringify(storedTabs));
    }
  
    // 恢复每个 Tab 的 formData
    tabs.value = storedTabs.map(tab => ({
      ...tab,
      formData: JSON.parse(localStorage.getItem(`formkit-${tab.id}`)) || {},
    }));
  
    // 激活最后一个打开的标签
    activeTab.value = tabs.value[tabs.value.length - 1].id;
  };
  
  const setActiveTab = (id) => {
    activeTab.value = id;
  };
  
  const getTabData = (tabId) => {
    return tabs.value.find(tab => tab.id === tabId) || {};
  };
  
  const addTab = () => {
    const newTab = {
      id: generateId(),
      title: `User ${tabs.value.length + 1}`,
      formData: {},
      questions: questionsData.questions
    };
    tabs.value.push(newTab);
    activeTab.value = newTab.id;
    saveTabs(); // 保存新 Tab 的数据
  };
  
  const removeTab = (tabId) => {
    tabs.value = tabs.value.filter(tab => tab.id !== tabId);
    if (tabs.value.length > 0) {
      activeTab.value = tabs.value[0].id; // 切换到第一个标签
    } else {
      activeTab.value = ''; // 如果没有任何标签，清空 activeTab
    }
    saveTabs(); // 保存状态
  };
  
  const clearCurrentTab = () => {
    const currentTab = tabs.value.find(tab => tab.id === activeTab.value);
    if (currentTab) {
      currentTab.formData = {}; // 清空当前标签的输入内容
      localStorage.removeItem(`formkit-${currentTab.id}`); // 清空对应 tab 的 localStorage
      saveTabs(); // 保存状态
    }
  };
  
  const saveTabs = () => {
    localStorage.setItem('editableTabs', JSON.stringify(tabs.value));
    tabs.value.forEach(tab => {
      localStorage.setItem(`formkit-${tab.id}`, JSON.stringify(tab.formData)); // 保存每个 Tab 的 formData
    });
  };
  
  onMounted(initTabs); // 初始化 Tabs
  </script>
  
  <style scoped>
  .container {
    padding: 20px;
  }
  .tabs {
    display: flex;
  }
  .tab-button {
    transition: background-color 0.3s ease;
  }
  .tab-button:hover {
    background-color: rgba(37, 99, 235, 0.7); /* Tailwind blue-600 */
  }
  </style>