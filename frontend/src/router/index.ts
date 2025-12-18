import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    // Always scroll to top for all route navigations
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/article/:id',
      name: 'article',
      component: () => import('../views/ArticleView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/topics',
      name: 'topics',
      component: () => import('../views/TopicView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/welcome/topics',
      name: 'topic-selection',
      component: () => import('../views/TopicSelectionView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/SignupView.vue')
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Check if there's a token in localStorage to potentially re-authenticate
    const token = localStorage.getItem('token')
    if (token) {
      // If we have a token but aren't "authenticated" in the store yet,
      // it might be an initial page load. 
      // For simplicity here, we assume if isAuthenticated is false, we need login.
      // A more robust app might try to fetch /me here.
      next({ name: 'login', query: { redirect: to.fullPath } })
    } else {
      next({ name: 'login', query: { redirect: to.fullPath } })
    }
  } else {
    next()
  }
})

export default router