<template>
  <!-- Layout Wrapper -->
  <div class="flex min-h-screen w-full">
    <!-- Left Panel (Brand/Identity) -->
    <div
      class="hidden lg:flex w-[45%] bg-[#1A0A0A] relative flex-col justify-center items-center p- margin-desktop overflow-hidden border-r border-shell-border"
    >
      <!-- Subtle Radial Glow -->
      <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,32,32,0.15)_0%, rgba(26,10,10,0)_60%)] z-0"
      ></div>
      <div
        class="relative z-10 max-w-md w-full flex flex-col items-center text-center space-y-8"
      >
        <!-- Logo Monogram -->
        <img
          alt="ITI Monogram Logo"
          class="w-24 h-24 rounded-lg shadow-xl shadow-black/50"
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAGSklEQVR4AezTa3IiNxSGYU+     
  WMfucVWSf3kZS+UGFsXuAFmrpXB5XuYBGOpf34/3rwx8CCPyRAEH+                                                  

iMYXCHx8EMSvAIEHBAjyAI6vECCI3wACDwhcKMiDrr5CIAkBgiQJyph7CBBkD3ddkxAgSJKgjLmHAEH2cNc1CYGcgiSBa8z8BAiSP0MbXEi
AIBfCVTo/AYLkz9AGFxIgyIVwlc5PgCBfMvQRgXsCBLmn4T0CXwgQ5AsQHxG4J0CQexreI/CFAEG+

APERgXsCBLmnce171RMSIEjC0Iy8jgBB1rHWKSEBgiQMzcjrCBBkHWudEhIgSMLQvo/syVUECHIVWXVLECBIiRgtcRUBglxFVt0SBAhSIkZ
LXEWAIFeRrVK3+
  R4Eaf4DsP5jAgR5zMe3zQkQpPkPwPqPCRDkMR/fNidAkOY/gJ3rZ+                                                  
  hNkAwpmXEbAYJsQ69xBgIEyZCSGbcRIMg29BpnIBBekL9//vzHf10GF0kyrWx4QaZtqhACAwQIMgDNlT4ECNIna5sOECDIADRX+    
  hAgSJ+                                                                                                 

sbTpA4LsgA0VcQaAqAYJUTdZeUwgQZApGRaoSIEjVZO01hQBBpmBUpCqBpYJUhWivugQIUjdbm00gQJAJEJWoS4AgdbO12QQCBJkAUYm6BK
oIUjchm20lQJCt+
  DWPToAg0RMy31YCBNmKX/PoBAjyZkK/Pj9/vPL/Zptv11/p+d+Zbxc9OEWAIE9xOdCZAEE6p2/3pwQI8hSRA50JEKRz+           

nZ/SoAgTxE50JkAQXamr3d4AgQJH5EBdxIgyE76eocnQJDwERlwJwGC7KSvd3gCBAkf0diAbs0hQJA5HFUpSoAgRYO11hwCBJnDUZWiBAhS
NFhrzSFAkDkcO1VptStBWsVt2bMECHKWmPOtCBCkVdyWPUuAIGeJOd+

KAEFaxR192XjzESReJiYKRIAggcIwSjwCBImXiYkCESBIoDCMEo8AQeJlYqIrCAzWJMggONd6ECBIj5xtOUiAIIPgXOtBgCA9crblIAGCDI
JzrQeBVwTpQcKWCBwQIMgBFI8QuBEgyI2EVwQOCBDkAIpHCNwIEORGwisCBwQ2C3IwkUcIBCJAkEBhGCUeAYLEy8REgQgQJFAYRolHgCDxM
jFRIAJ1BQkE2Sh5CRAkb3YmX0CAIAsga5GXAEHyZmfyBQQIsgCyFnkJEGQgO1f6ECBIn6xtOkCAIAPQXOlDgCB9srbpAAGCDEBzpQ8BgsTK
2jTBCBAkWCDGiUWAILHyME0wAgQJFohxYhEgSKw8TBOMAEGCBXLdOCqPECDICDV32hAgSJuoLTpCgCAj1NxpQ4AgbaK26AgBgoxQc+
  d3AoU/EaRwuFZ7nwBB3meoQmECBCkcrtXeJ0CQ9xmqUJgAQQqHW2G13TsQZHcC+                                        

ocmQJDQ8RhuNwGC7E5A/9AECBI6HsPtJkCQ3Qnov4vAS30J8hImh7oSIEjX5O39EgGCvITJoa4ECNI1eXu/RIAgL2FyqCuBMUG60rJ3OwIE
aRe5hc8QIMgZWs62I0CQdpFb+
  AwBgpyh5Ww7AuEEaZeAhUMTIEjoeAy3mwBBdiegf2gCBAkdj+                                                      

F2EyDI7gT0D02gkyChgzBcTAIEiZmLqYIQIEiQIIwRkwBBYuZiqiAECBIkCGPEJECQKbkoUpUAQaoma68pBAgyBaMiVQkQpGqy9ppCgCBTM
CpSlQBBoidrvq0ECLIVv+
  bRCYQX5Nfn54/I/68GPHuHXX137fHqvrPPhRdk9sLqIXCGAEHO0HK2HQGCtIv8/4W9e06AIM8ZOdGYAEEah2/15wQI8pyRE40JEKRx+

FZ/ToAgzxk5cZ5AmRsEKROlRa4gQJArqKpZhgBBykRpkSsIEOQKqmqWIUCQMlF2WWTtngRZy1u3ZAQIkiww464lQJC1vHVLRoAgyQIz7loC
BFnLW7fIBA5mI8gBFI8QuBEgyI2EVwQOCBDkAIpHCNwIEORGwisCBwQIcgDFIwRuBGYJcqvnFYFSBAhSKk7LzCZAkNlE1StFgCCl4rTMbAI
EmU1UvVIEEghSirdlkhEgSLLAjLuWAEHW8tYtGQGCJAvMuGsJEGQtb92SEegtSLKwjLueAEHWM9cxEQGCJArLqOsJEGQ9cx0TESBIorCMup
4AQS5irmwNAv8CAAD//w8BwbIAAAAGSURBVAMAJTLhoJfSZNkAAAAASUVORK5CYII="
        />
        <!-- Typography Group -->
        <div class="space-y-4">
          <h1 class="font-h1 text-h1 text-white">
            Information Technology Institute
          </h1>
          <p class="font-body-lg text-body-lg text-white/70 max-w-sm mx-auto">
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
              class="inline-flex items-center px-4 py-1.5 rounded-full font-label text-label bg- white/10 text-white/90 border border-white/5 backdrop-blur-sm shadow-sm"
              >Branch Manager</span
            >
            <span
              class="inline-flex items-center px-4 py-1.5 rounded-full font-label text-label bg- white/10 text-white/90 border border-white/5 backdrop-blur-sm shadow-sm"
              >Track Admin</span
            >
            <span
              class="inline-flex items-center px-4 py-1.5 rounded-full font-label text-label bg- white/10 text-white/90 border border-white/5 backdrop-blur-sm shadow-sm"
              >Instructor</span
            >
            <span
              class="inline-flex items-center px-4 py-1.5 rounded-full font-label text-label bg- white/10 text-white/90 border border-white/5 backdrop-blur-sm shadow-sm"
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
      class="w-full lg:w-[55%] bg-white flex flex-col justify-center p-margin-mobile md:p-margin- desktop relative"
    >
      <!-- Mobile Header (Visible only on small screens) -->
      <div
        class="lg:hidden absolute top-8 left-margin-mobile flex items-center space-x-3"
      >
        <img
          alt="ITI Monogram Logo"
          class="w-10 h-10 rounded shadow-sm"
          src="data:image/png;base64, 
  iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAGSklEQVR4AezTa3IiNxSGYU+WMfucVWSf3kZS+                  
  UGFsXuAFmrpXB5XuYBGOpf34/3rwx8CCPyRAEH+                                                                

iMYXCHx8EMSvAIEHBAjyAI6vECCI3wACDwhcKMiDrr5CIAkBgiQJyph7CBBkD3ddkxAgSJKgjLmHAEH2cNc1CYGcgiSBa8z8BAiSP0MbXEi
AIBfCVTo/AYLkz9AGFxIgyIVwlc5PgCBfMvQRgXsCBLmn4T0CXwgQ5AsQHxG4J0CQexreI/CFAEG+

APERgXsCBLmnce171RMSIEjC0Iy8jgBB1rHWKSEBgiQMzcjrCBBkHWudEhIgSMLQvo/syVUECHIVWXVLECBIiRgtcRUBglxFVt0SBAhSIkZ
LXEWAIFeRrVK3+
  R4Eaf4DsP5jAgR5zMe3zQkQpPkPwPqPCRDkMR/fNidAkOY/gJ3rZ+                                                  
  hNkAwpmXEbAYJsQ69xBgIEyZCSGbcRIMg29BpnIBBekL9//vzHf10GF0kyrWx4QaZtqhACAwQIMgDNlT4ECNIna5sOECDIADRX+    
  hAgSJ+                                                                                                 

sbTpA4LsgA0VcQaAqAYJUTdZeUwgQZApGRaoSIEjVZO01hQBBpmBUpCqBpYJUhWivugQIUjdbm00gQJAJEJWoS4AgdbO12QQCBJkAUYm6BK
oIUjchm20lQJCt+
  DWPToAg0RMy31YCBNmKX/PoBAjyZkK/Pj9/vPL/Zptv11/p+d+Zbxc9OEWAIE9xOdCZAEE6p2/3pwQI8hSRA50JEKRz+           

nZ/SoAgTxE50JkAQXamr3d4AgQJH5EBdxIgyE76eocnQJDwERlwJwGC7KSvd3gCBAkf0diAbs0hQJA5HFUpSoAgRYO11hwCBJnDUZWiBAhS
NFhrzSFAkDkcO1VptStBWsVt2bMECHKWmPOtCBCkVdyWPUuAIGeJOd+

KAEFaxR192XjzESReJiYKRIAggcIwSjwCBImXiYkCESBIoDCMEo8AQeJlYqIrCAzWJMggONd6ECBIj5xtOUiAIIPgXOtBgCA9crblIAGCDI
JzrQeBVwTpQcKWCBwQIMgBFI8QuBEgyI2EVwQOCBDkAIpHCNwIEORGwisCBwQ2C3IwkUcIBCJAkEBhGCUeAYLEy8REgQgQJFAYRolHgCDxM
jFRIAJ1BQkE2Sh5CRAkb3YmX0CAIAsga5GXAEHyZmfyBQQIsgCyFnkJEGQgO1f6ECBIn6xtOkCAIAPQXOlDgCB9srbpAAGCDEBzpQ8BgsTK
2jTBCBAkWCDGiUWAILHyME0wAgQJFohxYhEgSKw8TBOMAEGCBXLdOCqPECDICDV32hAgSJuoLTpCgCAj1NxpQ4AgbaK26AgBgoxQc+
  d3AoU/EaRwuFZ7nwBB3meoQmECBCkcrtXeJ0CQ9xmqUJgAQQqHW2G13TsQZHcC+                                        

ocmQJDQ8RhuNwGC7E5A/9AECBI6HsPtJkCQ3Qnov4vAS30J8hImh7oSIEjX5O39EgGCvITJoa4ECNI1eXu/RIAgL2FyqCuBMUG60rJ3OwIE
aRe5hc8QIMgZWs62I0CQdpFb+
  AwBgpyh5Ww7AuEEaZeAhUMTIEjoeAy3mwBBdiegf2gCBAkdj+                                                      

F2EyDI7gT0D02gkyChgzBcTAIEiZmLqYIQIEiQIIwRkwBBYuZiqiAECBIkCGPEJECQKbkoUpUAQaoma68pBAgyBaMiVQkQpGqy9ppCgCBTM
CpSlQBBoidrvq0ECLIVv+
  bRCYQX5Nfn54/I/68GPHuHXX137fHqvrPPhRdk9sLqIXCGAEHO0HK2HQGCtIv8/4W9e06AIM8ZOdGYAEEah2/15wQI8pyRE40JEKRx+

FZ/ToAgzxk5cZ5AmRsEKROlRa4gQJArqKpZhgBBykRpkSsIEOQKqmqWIUCQMlF2WWTtngRZy1u3ZAQIkiww464lQJC1vHVLRoAgyQIz7loC
BFnLW7fIBA5mI8gBFI8QuBEgyI2EVwQOCBDkAIpHCNwIEORGwisCBwQIcgDFIwRuBGYJcqvnFYFSBAhSKk7LzCZAkNlE1StFgCCl4rTMbAI
EmU1UvVIEEghSirdlkhEgSLLAjLuWAEHW8tYtGQGCJAvMuGsJEGQtb92SEegtSLKwjLueAEHWM9cxEQGCJArLqOsJEGQ9cx0TESBIorCMup
4AQS5irmwNAv8CAAD//w8BwbIAAAAGSURBVAMAJTLhoJfSZNkAAAAASUVORK5CYII="
        />
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
          class="p-3 bg-danger-mist text-danger font-label rounded-lg border border- danger/20"
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
              class="w-full h-[44px] px-3 bg-surface border border-outline/30 rounded-lg text-on- surface focus:outline-none focus:border-primary-deep focus:ring-1 focus:ring-primary-deep/50 transition- all placeholder:text-secondary-fixed-dim"
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
              <a
                class="font-label text-label text-primary hover:text-primary-deep transition-colors"
                href="#"
                >Forgot?</a
              >
            </div>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="w-full h-[44px] pl-3 pr-16 bg-surface border border-outline/30 rounded-lg text- on-surface focus:outline-none focus:border-primary-deep focus:ring-1 focus:ring-primary-deep/50 transition-all placeholder:text-secondary-fixed-dim"
                id="password"
                placeholder="Enter your password"
                required
              />
              <button
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center font-label text-label text- secondary hover:text-on-surface transition-colors focus:outline-none"
                type="button"
              >
                {{ showPassword ? "Hide" : "Show" }}
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            :disabled="loading"
            class="w-full h-[48px] mt-2 bg-primary-container text-white font-label text-label rounded- lg hover:bg-primary-deep shadow-[0_2px_10px_rgba(139,26,26,0.15)] hover:shadow-[0_4px_12px_rgba(139,26, 26,0.30)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
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
const { login, loading, error } = useAuth();

const showPassword = ref(false);

const form = reactive({
  email: "",
  password: "",
});

const handleLogin = async () => {
  try {
    await login(form.email, form.password);
    router.push("/dashboard");
  } catch {
    console.error("Login failed");
  }
};
</script>
