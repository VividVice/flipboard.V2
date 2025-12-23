<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { GoogleLogin, type CallbackTypes } from 'vue3-google-login'

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

const handleGoogleLogin = async (response: CallbackTypes.CredentialCallback) => {
  try {
    loading.value = true
    if(response.credential) {
        await authStore.loginWithGoogle(response.credential)
        router.push('/')
    }
  } catch (err: any) {
     error.value = err.message || 'Google Login failed'
  } finally {
     loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-black flex items-center justify-center p-4">
    <div class="w-full max-w-[400px]">
      <div class="mb-12 text-center">
        <h1 class="text-white text-6xl font-display font-bold tracking-tighter uppercase mb-2">
          Flipboard
        </h1>
        <p class="text-gray-400 text-lg font-medium">Log in to your account</p>
      </div>

      <div class="space-y-6">
        <form class="space-y-4" @submit.prevent="handleLogin">
          <div v-if="error" class="bg-red-500/10 border border-red-500/50 text-red-500 p-3 text-sm rounded-sm text-center">
            {{ error }}
          </div>

          <div>
            <input 
              id="username" 
              name="username" 
              type="text" 
              required 
              v-model="username" 
              class="w-full bg-transparent border-b border-gray-700 py-3 px-1 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors" 
              placeholder="Username" 
            />
          </div>

          <div>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              v-model="password" 
              class="w-full bg-transparent border-b border-gray-700 py-3 px-1 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors" 
              placeholder="Password"
            />
          </div>

          <div class="pt-4">
            <button 
              type="submit" 
              :disabled="loading" 
              class="w-full bg-flipboard-red text-white py-3 px-4 font-bold uppercase tracking-widest text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {{ loading ? 'Logging in...' : 'Log in' }}
            </button>
          </div>
        </form>

        <div class="relative py-4">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-800"></div>
          </div>
          <div class="relative flex justify-center text-xs uppercase tracking-widest">
            <span class="px-4 bg-black text-gray-500">Or</span>
          </div>
        </div>

        <div class="flex flex-col space-y-3">
          <GoogleLogin :callback="handleGoogleLogin" class="google-login-button" />
          
          <p class="text-center text-sm text-gray-500 mt-8">
            New to Flipboard? 
            <RouterLink to="/signup" class="text-white font-bold hover:underline">
              Create an account
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Adjust Google Login button to fit Flipboard style */
:deep(.S67o3) {
  width: 100% !important;
  display: flex !important;
  justify-content: center !important;
  border-radius: 0 !important;
}
</style>


