<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Headphones, Music, Brain, ArrowDown, Sparkles, Home } from 'lucide-vue-next'
import NavBar from '@/components/NavBar.vue'
import { finalVisionData } from '@/mock/data'

const router = useRouter()
const isLoaded = ref(false)
const activePhase = ref(0)

const iconMap: Record<string, any> = {
  Headphones,
  Music,
  Brain
}

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 300)
  
  let phase = 0
  const interval = setInterval(() => {
    phase++
    if (phase >= finalVisionData.length) {
      clearInterval(interval)
      setTimeout(() => {
        phase = 0
        setInterval(() => {
          phase = (phase + 1) % finalVisionData.length
          activePhase.value = phase
        }, 4000)
      }, 2000)
    } else {
      activePhase.value = phase
    }
  }, 2500)
})

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen relative overflow-hidden page-bg" data-highlight="vision">
    <div class="absolute inset-0 bg-gradient-theme"></div>
    
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/15 rounded-full blur-3xl"></div>
    
    <NavBar title="Final Vision" :showBack="true" @back="router.push('/summary')" />
    
    <main class="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <div 
        class="text-center max-w-4xl mx-auto"
        :class="{ 'animate-fade-in-up': isLoaded, 'opacity-0': !isLoaded }"
      >
        <div class="inline-flex items-center gap-2 px-4 py-2 glass-card mb-8 rounded-full">
          <Sparkles class="w-4 h-4 text-primary" />
          <span class="text-sm text-text-secondary">The Future of Driving Sound</span>
        </div>
        
        <h1 class="text-4xl md:text-6xl font-bold text-text-primary mb-8">
          The Future of<br/>
          <span class="gradient-text">Driving Sound</span>
        </h1>
        
        <div class="glass-card p-12 max-w-4xl w-full mb-12">
          <div class="flex flex-col md:flex-row items-center justify-center gap-8">
            <div 
              v-for="(phase, index) in finalVisionData" 
              :key="index"
              class="flex flex-col items-center"
            >
              <div 
                class="w-24 h-24 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500"
                :class="{
                  'scale-110 shadow-glow': activePhase === index,
                  'opacity-40': activePhase !== index && index < activePhase,
                  'opacity-60': activePhase !== index && index > activePhase
                }"
                :style="{ 
                  background: activePhase === index 
                    ? `linear-gradient(135deg, ${phase.color}, ${phase.color}80)` 
                    : `${phase.color}10`
                }"
              >
                <component 
                  :is="iconMap[phase.icon]" 
                  class="w-12 h-12 transition-colors duration-500"
                  :style="{ color: activePhase === index ? '#fff' : phase.color }"
                />
              </div>
              
              <div 
                class="text-lg font-semibold mb-2 transition-colors duration-500"
                :style="{ color: activePhase === index ? phase.color : '#fff' }"
              >
                {{ phase.title }}
              </div>
              <p class="text-text-muted text-sm text-center max-w-[180px]">{{ phase.description }}</p>
              <div class="text-xs text-secondary-dark mt-2">{{ phase.phase }}</div>
              
              <ArrowDown 
                v-if="index < finalVisionData.length - 1"
                class="w-6 h-6 text-text-muted mt-4"
              />
            </div>
          </div>
        </div>
        
        <div class="text-2xl md:text-3xl text-text-secondary font-light italic mb-12">
          "Every Journey Deserves Its Own Soundtrack"
        </div>
        
        <div class="flex items-center justify-center gap-4">
          <button 
            @click="goHome"
            class="glass-button flex items-center gap-3"
          >
            <Home class="w-5 h-5" />
            <span>Return Home</span>
          </button>
          
          <button 
            @click="router.push('/roadmap')"
            class="glass-button flex items-center gap-3"
          >
            <Sparkles class="w-5 h-5" />
            <span>View Roadmap</span>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
