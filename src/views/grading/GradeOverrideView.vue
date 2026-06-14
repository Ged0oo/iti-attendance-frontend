<script setup>
import MainLayout from '../../components/layout/MainLayout.vue';
</script>

<template>
    <MainLayout title="Grade Override">
    <section class="mx-auto max-w-4xl space-y-6">
        <div class="rounded-xl border border-[#D97706]/20 bg-[#FFFBEB] p-6 shadow-sm">
            <p class="text-sm font-semibold uppercase tracking-wide text-[#D97706]">Skipped - no dedicated design</p>
            <h1 class="mt-2 font-serif text-4xl text-on-surface">Grade Override</h1>
            <p class="mt-3 text-sm leading-6 text-slate-700">
                The Stitch design folder does not include a standalone grade override screen. To avoid inventing a
                screen outside the design source, overrides are available as a note-required action inside Grade Entry.
            </p>
            <RouterLink
                class="mt-5 inline-flex rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
                to="/grading/entry"
            >
                Go to Grade Entry
            </RouterLink>
        </div>
    </section>
    </MainLayout>
</template>
