<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Car, Music, Sparkles, ChevronRight, ArrowRight, Headphones, Brain, Play, Presentation } from 'lucide-vue-next'
import NavBar from '@/components/NavBar.vue'
import { useDemoMode } from '@/composables/useDemoMode'
import { usePresentationMode } from '@/composables/usePresentationMode'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const { theme } = useTheme()
const isLoaded = ref(false)
const particles = ref<{ id: number; x: number; y: number; size: number; duration: number }[]>([])
const currentStep = ref(0)

const { startDemo: startAutoDemo } = useDemoMode()
const { startPresentation } = usePresentationMode()

const steps = [
  { 
    icon: Headphones, 
    title: 'Traditional Music Player', 
    description: 'Static playlists, no context awareness',
    color: '#9a8668',
    gradient: 'from-secondary-dark to-secondary'
  },
  { 
    icon: Music, 
    title: 'DriveScore AI', 
    description: 'AI-powered, driving-aware music',
    color: '#c9a962',
    gradient: 'from-primary to-primary-light'
  },
  { 
    icon: Brain, 
    title: 'Journey Music Engine', 
    description: 'Predictive, adaptive, immersive',
    color: '#dcc88a',
    gradient: 'from-primary-light to-accent'
  }
]

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
  
  for (let i = 0; i < 20; i++) {
    particles.value.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 3 + 2
    })
  }
  
  setTimeout(() => {
    const interval = setInterval(() => {
      currentStep.value = (currentStep.value + 1) % steps.length
      if (currentStep.value === 0 && particles.value.length > 0) {
        clearInterval(interval)
        setTimeout(() => {
          setInterval(() => {
            currentStep.value = (currentStep.value + 1) % steps.length
          }, 4000)
        }, 2000)
      }
    }, 3000)
  }, 2000)
})

const startDemo = () => {
  router.push('/planner')
}
</script>

<template>
  <div class="min-h-screen relative overflow-hidden page-bg" data-highlight="hero">
    <div class="absolute inset-0 bg-gradient-theme"></div>
    
    <div 
        v-for="particle in particles" 
        :key="particle.id"
        class="absolute rounded-full"
        :class="theme === 'dark' ? 'bg-white/10' : 'bg-primary/20'"
      :style="{
        left: `${particle.x}%`,
        top: `${particle.y}%`,
        width: `${particle.size}px`,
        height: `${particle.size}px`,
        animation: `float ${particle.duration}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 2}s`
      }"
    ></div>
    
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden">
      <div 
        class="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl"
        :class="theme === 'dark' ? 'bg-primary/20' : 'bg-primary/15'"
      ></div>
      <div 
        class="absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl"
        :class="theme === 'dark' ? 'bg-secondary/20' : 'bg-secondary/15'"
      ></div>
      <div 
        class="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl"
        :class="theme === 'dark' ? 'bg-accent/15' : 'bg-accent-light/20'"
      ></div>
    </div>
    
    <NavBar title="DriveScore AI" />
    
    <main class="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
      <div 
        class="text-center max-w-4xl mx-auto"
        :class="{ 'animate-fade-in-up': isLoaded, 'opacity-0': !isLoaded }"
      >
        <div class="inline-flex items-center gap-2 px-4 py-2 glass-card mb-8">
          <Sparkles class="w-4 h-4 text-primary" />
          <span class="text-sm text-secondary-theme">Future Intelligent Cockpit Experience</span>
        </div>
        
        <h1 class="text-5xl md:text-7xl font-bold mb-6">
          <span class="text-primary-theme">Drive with</span>
          <br />
          <span class="gradient-text">Intelligent Sound</span>
        </h1>
        
        <div class="text-2xl text-primary/80 font-light mb-8 italic">
          "Every Journey Has Its Own Soundtrack"
        </div>
        
        <p class="text-xl text-secondary-theme mb-8 leading-relaxed">
          Experience the next generation of automotive entertainment. 
          DriveScore AI creates personalized music journeys based on your route and driving behavior, 
          delivering an immersive soundscape that evolves with every turn.
        </p>
        
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button 
            @click="startDemo"
            class="group glass-button flex items-center gap-3 text-lg"
          >
            <span>Start Demo</span>
            <ChevronRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            @click="startAutoDemo(); router.push('/journey-brain')"
            class="group px-6 py-3 bg-primary/15 hover:bg-primary/25 border border-primary/40 rounded-xl text-primary-light flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-primary/20"
          >
            <Play class="w-5 h-5" />
            <span>Auto Demo</span>
          </button>
          
          <button 
            @click="startPresentation"
            class="group px-6 py-3 bg-gradient-to-r from-primary/15 to-secondary/15 hover:from-primary/25 hover:to-secondary/25 border border-primary/40 rounded-xl text-primary flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-primary/20"
          >
            <Presentation class="w-5 h-5" />
            <span>Presentation Mode</span>
          </button>
          
          <div class="flex items-center gap-2 text-secondary-theme">
            <Music class="w-5 h-5" />
            <span class="text-sm">AI-Powered Sound Experience</span>
          </div>
        </div>
        
        <div class="glass-card p-8 max-w-4xl w-full">
          <h3 class="text-primary-theme font-semibold mb-6 text-center">Evolution of In-Car Entertainment</h3>
          
          <div class="flex items-center justify-center gap-8">
            <div 
              v-for="(step, index) in steps" 
              :key="index"
              class="flex flex-col items-center"
            >
              <div 
                class="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500"
                :class="{
                  'scale-110 shadow-glow': currentStep === index,
                  'opacity-40': currentStep !== index && index < currentStep,
                  'opacity-60': currentStep !== index && index > currentStep
                }"
                :style="{ 
                  background: currentStep === index 
                    ? `linear-gradient(135deg, ${step.color}, ${step.color}80)` 
                    : `${step.color}10`
                }"
              >
                <component 
                  :is="step.icon" 
                  class="w-10 h-10 transition-colors duration-500"
                  :style="{ color: currentStep === index ? '#fff' : step.color }"
                />
              </div>
              
              <h4 
                class="text-primary-theme font-semibold mb-1 transition-colors duration-500"
                :style="{ color: currentStep === index ? step.color : undefined }"
              >
                {{ step.title }}
              </h4>
              <p class="text-secondary-theme text-sm text-center max-w-[180px]">{{ step.description }}</p>
              
              <ArrowRight 
                v-if="index < steps.length - 1"
                class="w-6 h-6 text-secondary-theme mt-4"
              />
            </div>
          </div>
          
          <div class="mt-6 flex justify-center gap-2">
            <div 
              v-for="(_, index) in steps" 
              :key="index"
              class="w-3 h-3 rounded-full transition-all duration-500"
              :class="{
                'scale-125': currentStep === index,
                'bg-primary': currentStep === index,
                'bg-text-muted': currentStep !== index
              }"
            ></div>
          </div>
        </div>
      </div>
      
      <div 
        class="mt-16 relative"
        :class="{ 'animate-fade-in-up': isLoaded, 'opacity-0': !isLoaded }"
        style="animation-delay: 0.3s"
      >
        <div class="glass-card p-8 max-w-4xl w-full">
          <div class="flex items-center justify-around">
            <div class="text-center">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center mx-auto mb-3">
                <Car class="w-8 h-8 text-primary" />
              </div>
              <h3 class="text-primary-theme font-semibold mb-1">Smart Navigation</h3>
              <p class="text-muted-theme text-sm">Route-based music planning</p>
            </div>
            
            <div class="w-px h-16 bg-glass-border"></div>
            
            <div class="text-center">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary/20 to-transparent flex items-center justify-center mx-auto mb-3">
                <Music class="w-8 h-8 text-secondary" />
              </div>
              <h3 class="text-primary-theme font-semibold mb-1">AI Music Generation</h3>
              <p class="text-muted-theme text-sm">Dynamic soundscapes</p>
            </div>
            
            <div class="w-px h-16 bg-glass-border"></div>
            
            <div class="text-center">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-transparent flex items-center justify-center mx-auto mb-3">
                <Sparkles class="w-8 h-8 text-accent" />
              </div>
              <h3 class="text-primary-theme font-semibold mb-1">Real-time Adaptation</h3>
              <p class="text-muted-theme text-sm">Driving behavior tracking</p>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <footer class="relative z-10 text-center py-8 text-muted-theme text-sm">
      <p>DriveScore AI - Future Mobility Experience</p>
    </footer>
  </div>
</template>
