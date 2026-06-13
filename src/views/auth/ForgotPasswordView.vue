<template>
  <div class="flex min-h-screen w-full">
    <!-- Left Panel -->
    <div
      class="hidden lg:flex w-[45%] bg-[#1A0A0A] relative flex-col justify-center items-center margin-desktop overflow-hidden border-r border-shell-border"
    >
      <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,32,32,0.15)_0%,rgba(26,10,10,0)_60%)] z-0"
      />
      <div
        class="relative z-10 max-w-md w-full flex flex-col items-center text-center space-y-8"
      >
        <img
          alt="ITI Monogram Logo"
          class="w-24 h-24 rounded-lg shadow-xl shadow-black/50"
          src="data:image/png;base64,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"
        />
        <div class="space-y-4">
          <h1 class="font-h1 text-h1 text-white">
            Information Technology Institute
          </h1>
          <p class="font-body-lg text-body-lg text-white/70 max-w-sm mx-auto">
            Powering Egypt's tech talent — one cohort at a time.
          </p>
        </div>
      </div>
      <div
        class="absolute right-0 inset-y-0 w-[1px] bg-primary-container z-20"
      />
    </div>

    <!-- Right Panel -->
    <div
      class="w-full lg:w-[55%] bg-white flex flex-col justify-center p-margin-mobile md:p-margin-desktop relative"
    >
      <div
        class="lg:hidden absolute top-8 left-margin-mobile flex items-center space-x-3"
      >
        <span class="font-h3 text-h3 text-on-surface">ITI Portal</span>
      </div>

      <div class="w-full max-w-[420px] mx-auto space-y-10 mt-16 lg:mt-0">
        <div class="space-y-2">
          <h2 class="font-h1 text-h1 text-on-surface">Forgot password?</h2>
          <p class="font-body-md text-body-md text-secondary">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <!-- Success State: hide the form, show a confirmation message -->
        <div
          v-if="success"
          class="p-4 bg-success-mist text-success font-body-md rounded-lg border border-success/20 space-y-1"
        >
          <p class="font-label text-label">Check your inbox</p>
          <p>
            If an account exists for that email, a password reset link has been
            sent. The link expires in 60 minutes.
          </p>
        </div>

        <!-- Error Banner -->
        <div
          v-if="error"
          class="p-3 bg-danger-mist text-danger font-label rounded-lg border border-danger/20"
        >
          {{ error }}
        </div>

        <!-- Form is hidden after a successful submission to prevent duplicate requests -->
        <form v-if="!success" class="space-y-6" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <label
              class="block font-label text-label text-on-surface"
              for="forgot-email"
            >
              Email Address
            </label>
            <input
              id="forgot-email"
              v-model="email"
              type="email"
              placeholder="name@iti.gov.eg"
              required
              class="w-full h-[44px] px-3 bg-surface border border-outline/30 rounded-lg text-on-surface focus:outline-none focus:border-primary-deep focus:ring-1 focus:ring-primary-deep/50 transition-all placeholder:text-secondary-fixed-dim"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full h-[48px] mt-2 bg-primary-container text-white font-label text-label rounded-lg hover:bg-primary-deep shadow-[0_2px_10px_rgba(139,26,26,0.15)] hover:shadow-[0_4px_12px_rgba(139,26,26,0.30)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {{ loading ? "Sending..." : "Send Reset Link" }}
          </button>
        </form>

        <div class="pt-6 border-t border-surface-variant text-center">
          <p class="font-body-sm text-body-sm text-secondary">
            Remembered your password?
            <router-link
              to="/login"
              class="font-label text-label text-primary hover:text-primary-deep transition-colors"
            >
              Back to Sign In
            </router-link>
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
import { ref } from "vue";
import { usePasswordFlow } from "@/composables/usePasswordFlow.js";

const { loading, error, success, submitForgotPassword } = usePasswordFlow();
const email = ref("");

async function handleSubmit() {
  try {
    await submitForgotPassword(email.value);
  } catch (err) {
    console.error("Forgot password error:", err);
  }
}
</script>
