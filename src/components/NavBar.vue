<script setup lang="ts">
import { Sun, Moon, Car } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'

defineProps<{
  title: string
  showBack?: boolean
  backRoute?: string
}>()

defineEmits<{
  back: []
}>()

const { theme, toggleTheme } = useTheme()
</script>

<template>
  <nav class="relative z-10 flex items-center justify-between px-8 py-6">
    <div class="flex items-center gap-3">
      <button 
        v-if="showBack"
        @click="$emit('back')"
        class="p-2 hover:bg-white/10 rounded-lg transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-secondary"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <Car class="w-6 h-6 text-white" />
      </div>
      <span class="text-xl font-bold text-primary-theme">{{ title }}</span>
    </div>
    
    <div class="flex items-center gap-4">
      <button 
        @click="toggleTheme"
        class="p-3 rounded-xl hover:bg-white/10 transition-all duration-300"
        :title="theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      >
        <Sun v-if="theme === 'dark'" class="w-5 h-5 text-text-secondary" />
        <Moon v-else class="w-5 h-5 text-text-secondary" />
      </button>
    </div>
  </nav>
</template>
