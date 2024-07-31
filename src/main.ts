import { createApp } from 'vue'
import { plugin, defaultConfig } from '@formkit/vue'
import App from './App.vue'
import router from './router'
import formKitConfig from '../formkit.config'
import Swal from 'sweetalert2'

const app = createApp(App)
app.use(plugin, defaultConfig(formKitConfig))
app.use(router)
app.config.globalProperties.$swal = Swal
app.mount('#app')
