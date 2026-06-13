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
        <!-- Heading text comes from route.meta — set per route in auth.routes.js -->
        <div class="space-y-2">
          <h2 class="font-h1 text-h1 text-on-surface">
            {{ route.meta.heading }}
          </h2>
          <p class="font-body-md text-body-md text-secondary">
            {{ route.meta.subtitle }}
          </p>
        </div>

        <!-- Guard: token or email missing from the query string means the link is broken -->
        <div
          v-if="linkInvalid"
          class="p-4 bg-danger-mist text-danger font-body-md rounded-lg border border-danger/20 space-y-2"
        >
          <p class="font-label text-label">
            This link is invalid or has expired.
          </p>
          <p>
            Use
            <router-link
              to="/forgot-password"
              class="underline hover:text-primary-deep"
            >
              Forgot Password
            </router-link>
            to request a new one.
          </p>
        </div>

        <!-- Success State -->
        <div
          v-if="success"
          class="p-4 bg-success-mist text-success font-body-md rounded-lg border border-success/20 space-y-1"
        >
          <p class="font-label text-label">Password saved successfully!</p>
          <p>You can now sign in with your new password.</p>
          <router-link
            to="/login"
            class="inline-block mt-2 font-label text-label text-primary hover:text-primary-deep transition-colors"
          >
            Go to Sign In →
          </router-link>
        </div>

        <!-- Error Banner -->
        <div
          v-if="error && !success"
          class="p-3 bg-danger-mist text-danger font-label rounded-lg border border-danger/20"
        >
          {{ error }}
        </div>

        <!-- Form -->
        <form
          v-if="!success && !linkInvalid"
          class="space-y-6"
          @submit.prevent="handleSubmit"
        >
          <div class="space-y-2">
            <label
              class="block font-label text-label text-on-surface"
              for="new-password"
            >
              New Password
            </label>
            <div class="relative">
              <input
                id="new-password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="At least 8 characters"
                required
                minlength="8"
                class="w-full h-[44px] pl-3 pr-16 bg-surface border border-outline/30 rounded-lg text-on-surface focus:outline-none focus:border-primary-deep focus:ring-1 focus:ring-primary-deep/50 transition-all placeholder:text-secondary-fixed-dim"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center font-label text-label text-secondary hover:text-on-surface transition-colors focus:outline-none"
              >
                {{ showPassword ? "Hide" : "Show" }}
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <label
              class="block font-label text-label text-on-surface"
              for="confirm-password"
            >
              Confirm Password
            </label>
            <input
              id="confirm-password"
              v-model="form.password_confirmation"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Repeat your password"
              required
              class="w-full h-[44px] px-3 bg-surface border border-outline/30 rounded-lg text-on-surface focus:outline-none focus:border-primary-deep focus:ring-1 focus:ring-primary-deep/50 transition-all placeholder:text-secondary-fixed-dim"
            />
            <!-- Client-side mismatch hint — no need to wait for the server -->
            <p
              v-if="
                form.password_confirmation &&
                form.password !== form.password_confirmation
              "
              class="font-body-sm text-body-sm text-danger"
            >
              Passwords do not match.
            </p>
          </div>

          <!-- Button label also comes from route.meta -->
          <button
            type="submit"
            :disabled="
              loading ||
              (!!form.password_confirmation &&
                form.password !== form.password_confirmation)
            "
            class="w-full h-[48px] mt-2 bg-primary-container text-white font-label text-label rounded-lg hover:bg-primary-deep shadow-[0_2px_10px_rgba(139,26,26,0.15)] hover:shadow-[0_4px_12px_rgba(139,26,26,0.30)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {{ loading ? "Saving..." : route.meta.buttonLabel }}
          </button>
        </form>

        <div class="pt-6 border-t border-surface-variant text-center">
          <p class="font-body-sm text-body-sm text-secondary">
            Already have a password?
            <router-link
              to="/login"
              class="font-label text-label text-primary hover:text-primary-deep transition-colors"
            >
              Sign In
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
import { ref, reactive, computed } from "vue";
import { useRoute } from "vue-router";
import { usePasswordFlow } from "@/composables/usePasswordFlow.js";

const route = useRoute();
const { loading, error, success, submitResetPassword } = usePasswordFlow();

const showPassword = ref(false);

const token = computed(() => route.query.token || "");
const email = computed(() => route.query.email || "");

const linkInvalid = computed(() => !token.value || !email.value);

const form = reactive({
  password: "",
  password_confirmation: "",
});

async function handleSubmit() {
  if (form.password !== form.password_confirmation) return;

  try {
    await submitResetPassword({
      token: token.value,
      email: email.value,
      password: form.password,
      password_confirmation: form.password_confirmation,
    });
  } catch (err) {
    console.error("Reset password error:", err);
  }
}
</script>
