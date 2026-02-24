<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<template>
  <div :class="$style.card">
    <h3 v-if="title" :class="$style.title">{{ title }}</h3>
    <slot />
  </div>
</template>

<style module>
.card {
  padding: 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.title {
  margin: 0 0 0.5rem;
}
</style>
