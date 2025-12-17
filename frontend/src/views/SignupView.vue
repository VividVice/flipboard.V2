<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')

const handleSignup = () => {
  // Simulate API call delay
  setTimeout(() => {
    authStore.signup(name.value, email.value)
    router.push('/welcome/topics')
  }, 500)
}
</script>

<template>
  <div class="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-display font-bold text-white uppercase tracking-tight">
        Create your account
      </h2>
      <p class="mt-2 text-center text-sm text-gray-400">
        Or
        <RouterLink to="/login" class="font-medium text-flipboard-red hover:text-red-500 transition-colors">
          sign in to your existing account
        </RouterLink>
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-gray-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-800">
        <form class="space-y-6" @submit.prevent="handleSignup">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-300"> Full Name </label>
            <div class="mt-1">
              <input id="name" name="name" type="text" autocomplete="name" required v-model="name" class="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 bg-gray-800 text-white focus:outline-none focus:ring-flipboard-red focus:border-flipboard-red sm:text-sm" />
            </div>
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-300"> Email address </label>
            <div class="mt-1">
              <input id="email" name="email" type="email" autocomplete="email" required v-model="email" class="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 bg-gray-800 text-white focus:outline-none focus:ring-flipboard-red focus:border-flipboard-red sm:text-sm" />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-300"> Password </label>
            <div class="mt-1">
              <input id="password" name="password" type="password" autocomplete="new-password" required v-model="password" class="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 bg-gray-800 text-white focus:outline-none focus:ring-flipboard-red focus:border-flipboard-red sm:text-sm" />
            </div>
          </div>

          <div class="flex items-center">
            <input id="terms" name="terms" type="checkbox" required class="h-4 w-4 text-flipboard-red focus:ring-flipboard-red border-gray-700 rounded bg-gray-800" />
            <label for="terms" class="ml-2 block text-sm text-gray-300">
              I agree to the <a href="#" class="text-flipboard-red hover:text-red-500">Terms</a> and <a href="#" class="text-flipboard-red hover:text-red-500">Privacy Policy</a>
            </label>
          </div>

          <div>
            <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-flipboard-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-flipboard-red uppercase tracking-wide transition-colors">
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
