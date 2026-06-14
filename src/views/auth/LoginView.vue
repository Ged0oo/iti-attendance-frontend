<template>
  <!-- Layout Wrapper -->
  <div class="flex min-h-screen w-full">
    <!-- Left Panel (Brand/Identity) -->
    <div
      class="hidden lg:flex w-[45%] bg-[#1A0A0A] relative flex-col justify-center items-center overflow-hidden border-r border-shell-border"
    >
      <!-- Background Image with Red Overlay -->
      <img
        src="@/assets/iti-building.png"
        alt="ITI Building Background"
        class="absolute inset-0 w-full h-full object-cover z-0"
      />
      <div
        class="absolute inset-0 bg-[#8B1A1A]/80 z-0 mix-blend-multiply"
      ></div>

      <!-- Subtle Radial Glow -->
      <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,32,32,0.4)_0%,_rgba(26,10,10,0)_70%)] z-0"
      ></div>
      <div
        class="relative z-10 max-w-md w-full flex flex-col items-center text-center space-y-8"
      >
        <!-- Typography Group -->
        <div class="space-y-4">
          <h1
            class="font-h1 text-h1 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          >
            Information Technology Institute
          </h1>
          <p
            class="font-body-lg text-body-lg text-white/80 max-w-sm mx-auto drop-shadow-md"
          >
            Powering Egypt's tech talent — one cohort at a time.
          </p>
        </div>
        <!-- Role Pills Grid -->
        <div class="pt-8 w-full border-t border-white/10">
          <p
            class="font-label-caps text-label-caps text-white/50 mb-4 tracking-widest uppercase"
          >
            Portal Access Level
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <span
              class="inline-flex items-center px-4 py-1.5 rounded-full font-label text-label bg-white/10 text-white/90 border border-white/5 backdrop-blur-sm shadow-sm"
              >Branch Manager</span
            >
            <span
              class="inline-flex items-center px-4 py-1.5 rounded-full font-label text-label bg-white/10 text-white/90 border border-white/5 backdrop-blur-sm shadow-sm"
              >Track Admin</span
            >
            <span
              class="inline-flex items-center px-4 py-1.5 rounded-full font-label text-label bg-white/10 text-white/90 border border-white/5 backdrop-blur-sm shadow-sm"
              >Instructor</span
            >
            <span
              class="inline-flex items-center px-4 py-1.5 rounded-full font-label text-label bg-white/10 text-white/90 border border-white/5 backdrop-blur-sm shadow-sm"
              >Student</span
            >
          </div>
        </div>
      </div>
      <div
        class="absolute right-0 inset-y-0 w-[1px] bg-primary-container z-20"
      ></div>
    </div>

    <!-- Right Panel (Login Form) -->
    <div
      class="w-full lg:w-[55%] bg-white flex flex-col justify-center p-margin-mobile md:p-margin-desktop relative"
    >
      <!-- Mobile Header (Visible only on small screens) -->
      <div
        class="lg:hidden absolute top-8 left-margin-mobile flex items-center space-x-3"
      >
        <span class="font-h3 text-h3 text-on-surface">ITI Portal</span>
      </div>

      <!-- Form Container -->
      <div class="w-full max-w-[420px] mx-auto space-y-10 mt-16 lg:mt-0">
        <!-- Header -->
        <div class="space-y-2">
          <h2 class="font-h1 text-h1 text-on-surface">Welcome back</h2>
          <p class="font-body-md text-body-md text-secondary">
            Sign in to your ITI workspace
          </p>
        </div>
        <div
          v-if="error"
          class="p-3 bg-danger-mist text-danger font-label rounded-lg border border-danger/20"
        >
          {{ error }}
        </div>
        <!-- Form -->
        <form class="space-y-6" @submit.prevent="handleLogin">
          <!-- Email Input -->
          <div class="space-y-2">
            <label
              class="block font-label text-label text-on-surface"
              for="email"
              >Email Address</label
            >
            <input
              v-model="form.email"
              class="w-full h-[44px] px-3 bg-surface border border-outline/30 rounded-lg text-on-surface focus:outline-none focus:border-primary-deep focus:ring-1 focus:ring-primary-deep/50 transition-all placeholder:text-secondary-fixed-dim"
              id="email"
              type="email"
              placeholder="name@iti.gov.eg"
              required
            />
          </div>

          <!-- Password Input -->
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <label
                class="block font-label text-label text-on-surface"
                for="password"
                >Password</label
              >
              <router-link
                to="/forgot-password"
                class="font-label text-label text-primary hover:text-primary-deep transition-colors"
                >Forgot?</router-link
              >
            </div>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="w-full h-[44px] pl-3 pr-16 bg-surface border border-outline/30 rounded-lg text-on-surface focus:outline-none focus:border-primary-deep focus:ring-1 focus:ring-primary-deep/50 transition-all placeholder:text-secondary-fixed-dim"
                id="password"
                placeholder="Enter your password"
                required
              />
              <button
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center font-label text-label text-secondary hover:text-on-surface transition-colors focus:outline-none"
                type="button"
              >
                {{ showPassword ? "Hide" : "Show" }}
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            :disabled="loading"
            class="w-full h-[48px] mt-2 bg-primary-container text-white font-label text-label rounded-lg hover:bg-primary-deep shadow-[0_2px_10px_rgba(139,26,26,0.15)] hover:shadow-[0_4px_12px_rgba(139,26,26,0.30)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            type="submit"
          >
            {{ loading ? "Signing In..." : "Sign In" }}
          </button>
        </form>

        <!-- Footer Note -->
        <div class="pt-6 border-t border-surface-variant text-center">
          <p class="font-body-sm text-body-sm text-secondary">
            Don't have an account?
            <span
              class="font-label text-label text-on-surface cursor-help"
              title="Accounts are provisioned internally."
              >Contact your Branch Manager.</span
            >
          </p>
        </div>
      </div>

      <div
        class="absolute bottom-8 left-0 right-0 text-center px-margin-mobile"
      >
        <p class="font-body-sm text-body-sm text-secondary">
          © 2025 Information Technology Institute — Ministry of Communications
          and Information Technology
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth.js";

const router = useRouter();
const { login } = useAuth();

const showPassword = ref(false);
const error = ref("");
const loading = ref(false);

const form = reactive({
  email: "",
  password: "",
});

const handleLogin = async () => {
  error.value = "";
  loading.value = true;

  try {
    await login(form.email, form.password);
    router.push("/dashboard");
  } catch (err) {
    console.error("Login failed", err);
    error.value =
      err.response?.data?.message ||
      "Login failed. Please check your credentials.";
  } finally {
    loading.value = false;
  }
};
</script>
