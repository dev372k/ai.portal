import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import Toast, { POSITION } from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './assets/tailwind.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Toastification options
app.use(Toast, {
  position: POSITION.TOP_CENTER,
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  hideProgressBar: false
})

app.mount('#app')
