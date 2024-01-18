import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'  // Import Element Plus library
import VForm3 from 'vform3-builds'  // Import VForm3 library

import 'element-plus/dist/index.css'  // Import Element Plus style
import 'vform3-builds/dist/designer.style.css'  // Import VForm3 designer style


const app = createApp(App)
app.use(router)
app.mount('#app')
app.use(ElementPlus)
app.use(VForm3)  // Register VForm3 globally (also register v-form-designe, v-form-render and other components at the same time)
