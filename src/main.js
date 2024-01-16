import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'  //引入element-plus库
import VForm3 from 'vform3-builds'  //引入VForm3库

import 'element-plus/dist/index.css'  //引入element-plus样式
import 'vform3-builds/dist/designer.style.css'  //引入VForm3样式


const app = createApp(App)
app.use(router)
app.mount('#app')
app.use(ElementPlus)
app.use(VForm3)  //全局注册VForm3(同时注册了v-form-designe、v-form-render等组件)
