import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
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
      path: '/magazine/:id',
      name: 'magazine',
      component: () => import('../views/MagazineView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/user/:username',
      name: 'user-profile',
      component: () => import('../views/UserView.vue'),
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

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth) {
    // Ensure the auth store has had a chance to initialize (e.g., from localStorage)
    try {
      if ('initialize' in authStore && typeof authStore.initialize === 'function') {
        await authStore.initialize()
      }
    } catch {
      // If initialization fails, fall through to the authentication check below
    }

    if (!authStore.isAuthenticated) {
      return next({ name: 'login', query: { redirect: to.fullPath } })
    }
  }

  next()
})

export default router