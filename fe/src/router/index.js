import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import LoginSuccessView from '../views/LoginSuccessView.vue'

// Layout
import DashboardLayout from '../components/DashboardLayout.vue'

// Views inside the layout
import DashboardView from '../views/DashboardView.vue'
import ProfileView from '../views/ProfileView.vue'
import JobView from '../views/employer/JobView.vue'
import ApplicantView from '../views/employer/ApplicantView.vue'


const routes = [

  { path: '/', redirect: '/login' },

  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { guestOnly: true }
  },

  {
    path: '/loginsuccess',
    name: 'loginSuccess',
    component: LoginSuccessView,
    meta: { guestOnly: true }
  },

  // All authenticated pages use the layout
  {
    path: '/',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardView
      }
    ]
  },
  {
    path: '/',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'profile',
        name: 'Profile',
        component: ProfileView
      }
    ]
  },
  {
    path: '/',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'jobs',
        name: 'Jobs',
        component: JobView
      }
    ]
  },
  {
    path: '/',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'applicants',
        name: 'Applicants',
        component: ApplicantView
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token')

  if (to.meta.requiresAuth && !token) {
    return next('/login')
  }

  if (to.meta.guestOnly && token) {
    return next('/dashboard')
  }

  next()
})

export default router
