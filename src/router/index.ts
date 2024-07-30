import { createRouter, createWebHistory } from 'vue-router';

import Index from '../views/index.vue';

// Define the type of route
interface Route {
    path: string;
    component: any; // Can be more strictly defined according to the actual component type
}

const routes: Route[] = [
    {
        path: '/',
        component: Index,
    },

    // {
    //     path: '/pit-scouting',
    //     component: Index,
    // },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;