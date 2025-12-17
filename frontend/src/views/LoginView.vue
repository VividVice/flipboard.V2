<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = 'Please enter username and password'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await authStore.login(username.value, password.value)
    router.push('/')
  } catch (err: any) {
    error.value = err.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-display font-bold text-white uppercase tracking-tight">
        Sign in to your account
      </h2>
      <p class="mt-2 text-center text-sm text-gray-400">
        Or
        <RouterLink to="/signup" class="font-medium text-flipboard-red hover:text-red-500 transition-colors">
          start your 14-day free trial
        </RouterLink>
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-gray-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-800">
        <form class="space-y-6" @submit.prevent="handleLogin">
          <div v-if="error" class="rounded-md bg-red-900/20 border border-red-800 p-4">
            <p class="text-sm text-red-400">{{ error }}</p>
          </div>

          <div>
            <label for="username" class="block text-sm font-medium text-gray-300"> Username </label>
            <div class="mt-1">
              <input id="username" name="username" type="text" autocomplete="username" required v-model="username" class="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 bg-gray-800 text-white focus:outline-none focus:ring-flipboard-red focus:border-flipboard-red sm:text-sm" placeholder="marie_paris" />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-300"> Password </label>
            <div class="mt-1">
              <input id="password" name="password" type="password" autocomplete="current-password" required v-model="password" class="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 bg-gray-800 text-white focus:outline-none focus:ring-flipboard-red focus:border-flipboard-red sm:text-sm" />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" class="h-4 w-4 text-flipboard-red focus:ring-flipboard-red border-gray-700 rounded bg-gray-800" />
              <label for="remember-me" class="ml-2 block text-sm text-gray-300"> Remember me </label>
            </div>

            <div class="text-sm">
              <a href="#" class="font-medium text-flipboard-red hover:text-red-500"> Forgot your password? </a>
            </div>
          </div>

          <div>
            <button type="submit" :disabled="loading" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-flipboard-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-flipboard-red uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {{ loading ? 'Signing in...' : 'Sign in' }}
            </button>
          </div>
        </form>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-700"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-900 text-gray-400"> Or continue with </span>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-3">
            <div>
              <a href="#" class="w-full inline-flex justify-center py-2 px-4 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors">
                <span class="sr-only">Sign in with Facebook</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fill-rule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clip-rule="evenodd" />
                </svg>
              </a>
            </div>

            <div>
              <a href="#" class="w-full inline-flex justify-center py-2 px-4 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors">
                <span class="sr-only">Sign in with Twitter</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.118 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
