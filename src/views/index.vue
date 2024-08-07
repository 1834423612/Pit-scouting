<template>
    <div class="container mx-auto">
        <h1 class="text-2xl font-bold text-center mb-4">Survey</h1>
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

        <form-view v-if="activeTab" :tab-data="getTabData(activeTab)" :remove-tab="removeTab" />
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

    // If there are no tabs, create a default tab
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

    // if (tabs.value.length > 0) {
    //     activeTab.value = tabs.value[tabs.value.length - 1].id;
    // }
    const lastActiveTabId = localStorage.getItem('activeTab');
    // activeTab.value = lastActiveTab || tabs.value[tabs.value.length - 1]?.id || '';
    activeTab.value = lastActiveTabId && tabs.value.some(tab => tab.id === lastActiveTabId)
     ? lastActiveTabId 
     : tabs.value[0]?.id || '';

    //  Make sure the active tab is saved in localStorage correctly
     localStorage.setItem('activeTab', activeTab.value);

    // activeTab.value = localStorage.getItem('activeTab') || tabs.value[tabs.value.length - 1]?.id || '';
};

const setActiveTab = (id) => {
    activeTab.value = id;
    localStorage.setItem('activeTab', id);
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
    localStorage.setItem('activeTab', activeTab.value); // Immediately save the active tab
    saveTabs(); // Save the state
};

const removeTab = (tabId) => {
    const tabToRemove = tabs.value.find(tab => tab.id === tabId);
    if (tabToRemove) {
        localStorage.removeItem(`formkit-${tabToRemove.id}`); // Remove the form data from localStorage
    }

    tabs.value = tabs.value.filter(tab => tab.id !== tabId);
    if (tabs.value.length > 0) {
        // If the active tab is removed, set the active tab to the first tab
        if (activeTab.value === tabId) {
            activeTab.value = tabs.value[0].id;
        }
    } else {
        activeTab.value = ''; // If there are no tabs, set activeTab to empty
    }
    saveTabs(); // Save the state
};

// Be sure to clear the form data from localStorage when the tab is removed
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