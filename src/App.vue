<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import PresentationPanel from '@/components/PresentationPanel.vue'
import { useTheme } from '@/composables/useTheme'
import { audioManager } from '@/audio/AudioManager'

useTheme()

const handleFirstInteraction = async () => {
  await audioManager.resume()
  document.removeEventListener('click', handleFirstInteraction)
  document.removeEventListener('touchstart', handleFirstInteraction)
  document.removeEventListener('keydown', handleFirstInteraction)
}

onMounted(() => {
  document.addEventListener('click', handleFirstInteraction)
  document.addEventListener('touchstart', handleFirstInteraction)
  document.addEventListener('keydown', handleFirstInteraction)
})

onUnmounted(() => {
  document.removeEventListener('click', handleFirstInteraction)
  document.removeEventListener('touchstart', handleFirstInteraction)
  document.removeEventListener('keydown', handleFirstInteraction)
})
</script>

<template>
  <RouterView />
  <PresentationPanel />
</template>

<style scoped>
</style>
