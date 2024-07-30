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

//   Generate a unique ID function (Localstorage key for each tab)
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

    // Get & recovery the data of each tab from localStorage
    tabs.value = storedTabs.map(tab => ({
        ...tab,
        formData: JSON.parse(localStorage.getItem(`formkit-${tab.id}`)) || {},
    }));

    // Activate the last opened tab
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
    saveTabs(); // Save the state
};

const removeTab = (tabId) => {
    tabs.value = tabs.value.filter(tab => tab.id !== tabId);
    if (tabs.value.length > 0) {
        activeTab.value = tabs.value[0].id; // Set the first tab as active
    } else {
        activeTab.value = ''; // If there are no tabs, set activeTab to empty
    }
    saveTabs(); // Save the state
};

const clearCurrentTab = () => {
    const currentTab = tabs.value.find(tab => tab.id === activeTab.value);
    if (currentTab) {
        currentTab.formData = {}; // Clear the current Tab form data
        localStorage.removeItem(`formkit-${currentTab.id}`); // Remove the form data from localStorage
        saveTabs(); // Save the state
    }
};

const saveTabs = () => {
    localStorage.setItem('editableTabs', JSON.stringify(tabs.value));
    tabs.value.forEach(tab => {
        localStorage.setItem(`formkit-${tab.id}`, JSON.stringify(tab.formData)); // Save the form data of each tab
    });
};

onMounted(initTabs); // Initialize the tabs on component mount
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
    background-color: rgba(37, 99, 235, 0.7);
    /* Tailwind blue-600 */
}
</style>