<script setup lang="ts">
import { RouterView } from 'vue-router'
import PresentationPanel from '@/components/PresentationPanel.vue'
import { useTheme } from '@/composables/useTheme'

useTheme()
</script>

<template>
  <RouterView />
  <PresentationPanel />
</template>

<style scoped>
</style>
