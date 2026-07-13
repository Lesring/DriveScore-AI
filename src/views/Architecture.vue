<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowDown, Navigation, Calendar, Brain, FileText, Download, Bot, Headphones, Smile } from 'lucide-vue-next'
import { architectureNodes } from '@/mock/data'
import NavBar from '@/components/NavBar.vue'

const router = useRouter()
const activeNode = ref<number | null>(null)
const isLoaded = ref(false)

const nodeIcons = [
  Navigation, Calendar, Brain, FileText, Download, Bot, Headphones, Smile
]

const nodeColors = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#ec4899'
]

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
    let currentNode = 0
    const interval = setInterval(() => {
      activeNode.value = currentNode
      currentNode++
      if (currentNode >= architectureNodes.length) {
        clearInterval(interval)
        setTimeout(() => {
          activeNode.value = null
        }, 2000)
      }
    }, 600)
  }, 300)
})

</script>

<template>
  <div class="min-h-screen relative overflow-hidden page-bg" data-highlight="system">
    <div class="absolute inset-0 bg-gradient-theme"></div>
    
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/15 rounded-full blur-3xl"></div>
    
    <NavBar title="Architecture" :showBack="true" @back="router.push('/')" />
    
    <main class="relative z-10 px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <div 
          class="text-center mb-12"
          :class="{ 'animate-fade-in-up': isLoaded, 'opacity-0': !isLoaded }"
        >
          <h1 class="text-3xl font-bold text-primary-theme mb-4">System Architecture</h1>
          <p class="text-secondary-theme">The intelligent music engine that powers DriveScore AI</p>
        </div>
        
        <div class="relative">
          <div class="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-secondary to-accent transform -translate-x-1/2"></div>
          
          <div class="absolute left-1/2 top-0 bottom-0 w-1 overflow-hidden transform -translate-x-1/2">
            <div class="w-full h-full bg-gradient-to-b from-transparent via-white/30 to-transparent animate-scan"></div>
          </div>
          
          <div class="space-y-8">
            <div 
              v-for="(node, index) in architectureNodes" 
              :key="node.id"
              class="relative"
              :class="{ 'animate-slide-in-right': isLoaded, 'opacity-0': !isLoaded }"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <div 
                class="glass-card p-6 cursor-pointer transition-all duration-300"
                :class="{
                  'ring-2 ring-offset-2 ring-offset-dark shadow-lg': activeNode === index,
                  'hover:scale-[1.02]': activeNode !== index
                }"
                :style="activeNode === index ? { borderColor: nodeColors[index] + '40' } : {}"
                @mouseenter="activeNode = index"
                @mouseleave="activeNode = null"
              >
                <div class="flex items-center gap-4">
                  <div 
                    class="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300"
                    :class="{
                      'shadow-glow': activeNode === index
                    }"
                    :style="{ 
                      background: activeNode === index 
                        ? `linear-gradient(135deg, ${nodeColors[index]}, ${nodeColors[index]}80)` 
                        : `${nodeColors[index]}20`
                    }"
                  >
                    <component 
                      :is="nodeIcons[index]" 
                      class="w-8 h-8 transition-colors duration-300"
                      :style="{ color: activeNode === index ? '#fff' : nodeColors[index] }"
                    />
                  </div>
                  
                  <div class="flex-1">
                    <h3 
                      class="text-xl font-bold mb-1 transition-colors duration-300"
                      :style="{ color: activeNode === index ? nodeColors[index] : '#1a1a1a' }"
                    >
                      {{ node.name }}
                    </h3>
                    <p class="text-secondary-theme">{{ node.description }}</p>
                  </div>
                  
                  <div 
                    v-if="index < architectureNodes.length - 1"
                    class="w-12 h-12 rounded-full flex items-center justify-center"
                    :style="{ background: `${nodeColors[index]}10` }"
                  >
                    <ArrowDown 
                      class="w-6 h-6" 
                      :style="{ color: nodeColors[index] }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div 
          class="mt-12 glass-card p-8 text-center"
          :class="{ 'animate-fade-in-up': isLoaded, 'opacity-0': !isLoaded }"
          style="animation-delay: 0.8s"
        >
          <h3 class="text-xl font-bold text-primary-theme mb-4">End-to-End Intelligence</h3>
          <p class="text-secondary-theme mb-6">
            From navigation input to immersive audio output, every step is powered by AI. 
            The system predicts your journey, composes personalized music, and adapts in real-time 
            to create the ultimate driving soundtrack.
          </p>
          
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-glass-bg rounded-xl p-4">
              <div class="text-3xl font-bold text-primary mb-1">8</div>
              <div class="text-muted-theme text-sm">Core Modules</div>
            </div>
            <div class="bg-glass-bg rounded-xl p-4">
              <div class="text-3xl font-bold text-secondary mb-1">96%</div>
              <div class="text-muted-theme text-sm">Prediction Accuracy</div>
            </div>
            <div class="bg-glass-bg rounded-xl p-4">
              <div class="text-3xl font-bold text-accent mb-1">20ms</div>
              <div class="text-muted-theme text-sm">Response Time</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
