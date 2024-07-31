<template>
    <div class="container mx-auto pt-6">
        <div class="form-container bg-white rounded-lg shadow-lg p-6">
            <FormKit type="form" name="multiTabDemo" use-local-storage
                :plugins="[createLocalStoragePlugin({ debounce: 0 })]" :actions="false">
                <p>Switch between mock tabs of our app:</p>
                <FormKit type="select" v-model="tab" name="tab" :options="[
                    { label: 'test1', value: 1 },
                    { label: 'test2', value: 2 },
                    { label: 'test3', value: 3 },
                ]" @change="handleChange" />
            </FormKit>
            <hr />
            <div :key="tab">
                <p>
                    <em><small>Data in localStorage is keyed to each tab ID</small></em>
                </p>
                <FormKit type="form" name="contactWithKey" :plugins="[
                    createLocalStoragePlugin({
                        key: tab,
                    }),
                ]" use-local-storage @submit="submitHandler">
                    <FormKit type="text" name="name" label="Your name" />
                    <FormKit type="text" name="email" label="Your email" />
                    <FormKit type="textarea" name="message" label="Your message" />
                </FormKit>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { createLocalStoragePlugin } from '@formkit/addons'

const submitHandler = async function (payload, node) {
    await new Promise((r) => setTimeout(r, 2000))
    node.reset()
}

async function handleChange() {
    window.location.reload()
}

const tab = ref(1)
</script>