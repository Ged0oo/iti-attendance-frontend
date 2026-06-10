<template>
  <div class="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <span class="material-symbols-outlined text-primary text-[48px]" style="font-variation-settings: 'FILL' 1;">account_circle</span>
      </div>
      <h2 class="mt-6 text-center font-h2 text-h2 text-on-surface font-bold">
        Sign in to your account
      </h2>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-surface py-8 px-4 shadow-elevated rounded-xl sm:px-10 border border-outline-variant/30">
        <form class="space-y-6" @submit.prevent="handleLogin">
          
          <div v-if="authStore.error" class="bg-danger-mist border border-danger/20 text-danger px-4 py-3 rounded-lg font-body-sm flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">error</span>
            {{ authStore.error }}
          </div>

          <div>
            <label for="email" class="block font-label text-on-surface-variant">Email address</label>
            <div class="mt-1">
              <input id="email" v-model="email" name="email" type="email" required 
                class="appearance-none block w-full px-3 py-2 border border-outline-variant rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary font-body-md" 
                placeholder="manager@iti.gov.eg" />
            </div>
          </div>

          <div>
            <label for="password" class="block font-label text-on-surface-variant">Password</label>
            <div class="mt-1">
              <input id="password" v-model="password" name="password" type="password" required 
                class="appearance-none block w-full px-3 py-2 border border-outline-variant rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary font-body-md" 
                placeholder="••••••••" />
            </div>
          </div>

          <div>
            <button type="submit" :disabled="authStore.loading" 
              class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm font-label text-white bg-primary hover:bg-primary-deep focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50">
              <span v-if="authStore.loading">Signing in...</span>
              <span v-else>Sign in</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');

const handleLogin = async () => {
  try {
    await authStore.login(email.value, password.value);
    
    // Redirect based on role
    if (authStore.isInstructor) {
      router.push('/attendance/log/1'); // Or an instructor dashboard
    } else if (authStore.isStudent) {
      router.push('/attendance/scan');
    } else {
      router.push('/');
    }
  } catch (error) {
    // The store handles saving the error message
    console.error("Login failed", error);
  }
};
</script>