<script setup lang="ts"></script>

<template>
  <nav class="p-4 bg-surface-container flex gap-4">
    <router-link to="/attendance/scan" class="text-primary font-bold">QR Scanner</router-link>
    <router-link to="/attendance/log/1" class="text-primary font-bold">View Log (Session 1)</router-link>
  </nav>
  <router-view />
</template>

<style scoped></style>
