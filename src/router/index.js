import { createRouter, createWebHistory } from 'vue-router';

import Index from '../views/index.vue';
import FormKitTest from '../views/formkit.vue';

const routes = [
    {
        path: '/',
        component: Index,
    },
    {
        path: '/formkit',
        component: FormKitTest,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
