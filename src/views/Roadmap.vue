<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Smartphone, Car, Monitor, Cpu, Layers, ArrowRight, Sparkles, Home } from 'lucide-vue-next'

const router = useRouter()
const isLoaded = ref(false)
const activeYear = ref(0)

const roadmapItems = [
  {
    year: '2026',
    title: 'Phone App',
    description: 'Mobile application for iOS and Android. Connects to car audio systems via Bluetooth. Personalized music recommendations based on driving patterns.',
    icon: Smartphone,
    color: '#3b82f6',
    features: ['Real-time driving detection', 'Bluetooth audio sync', 'Personalized playlists']
  },
  {
    year: '2027',
    title: 'CarPlay',
    description: 'Deep integration with Apple CarPlay. Native infotainment system support. Hands-free voice control for music selection.',
    icon: Car,
    color: '#8b5cf6',
    features: ['CarPlay integration', 'Voice commands', 'Dashboard widgets']
  },
  {
    year: '2028',
    title: 'Android Auto',
    description: 'Complete support for Android Auto. Seamless integration with Google services. Waze and Google Maps integration.',
    icon: Car,
    color: '#06b6d4',
    features: ['Android Auto', 'Google Maps sync', 'Assistant integration']
  },
  {
    year: '2029',
    title: 'Smart Cockpit',
    description: 'Next-generation smart cockpit integration. Multi-screen support. Advanced AI copilot features.',
    icon: Monitor,
    color: '#10b981',
    features: ['Multi-screen', 'AI copilot', 'Gesture control']
  },
  {
    year: '2030',
    title: 'Vehicle OS',
    description: 'Deep integration with vehicle operating systems. Real-time vehicle data access. Predictive maintenance and safety alerts.',
    icon: Cpu,
    color: '#f59e0b',
    features: ['OS integration', 'Vehicle data API', 'Predictive AI']
  },
  {
    year: '2035',
    title: 'Autonomous',
    description: 'Full autonomous driving support. AI-generated soundtracks for Level 5 autonomy. Passenger experience optimization.',
    icon: Layers,
    color: '#ef4444',
    features: ['Level 5 support', 'Passenger mode', 'Adaptive experience']
  }
]

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 300)
  
  let year = 0
  setInterval(() => {
    year = (year + 1) % roadmapItems.length
    activeYear.value = year
  }, 3000)
})

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-dark via-dark-light to-purple-900/20"></div>
    
    <div class="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl"></div>
    
    <main class="relative z-10 px-4 py-8">
      <div class="max-w-6xl mx-auto">
        <div 
          class="text-center mb-16"
          :class="{ 'animate-fade-in-up': isLoaded, 'opacity-0': !isLoaded }"
        >
          <div class="inline-flex items-center gap-2 px-4 py-2 glass-card mb-6 rounded-full">
            <Sparkles class="w-4 h-4 text-purple-400" />
            <span class="text-sm text-white/80">Our Vision</span>
          </div>
          
          <h1 class="text-4xl md:text-6xl font-bold text-white mb-6">
            Roadmap to the<br/>
            <span class="gradient-text">Future</span>
          </h1>
          
          <p class="text-white/60 text-lg max-w-2xl mx-auto">
            A journey towards seamless integration of AI-driven music experiences into every driving scenario.
          </p>
        </div>
        
        <div class="relative">
          <div class="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-purple-500 via-blue-500 to-pink-500"></div>
          
          <div class="space-y-16">
            <div 
              v-for="(item, index) in roadmapItems" 
              :key="index"
              class="relative flex items-center"
              :class="{ 'animate-fade-in-up': isLoaded, 'opacity-0': !isLoaded }"
              :style="{ animationDelay: `${index * 200}ms` }"
            >
              <div 
                class="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full border-4 transition-all duration-500"
                :class="{
                  'scale-150 border-white': activeYear === index,
                  'border-white/30': activeYear !== index
                }"
                :style="{ background: activeYear === index ? item.color : 'transparent' }"
              ></div>
              
              <div 
                class="w-full glass-card p-8 transition-all duration-500"
                :class="{
                  'scale-[1.02] shadow-lg': activeYear === index,
                  'opacity-60': activeYear !== index
                }"
                :style="{
                  borderColor: activeYear === index ? `${item.color}40` : 'rgba(255,255,255,0.1)',
                  background: activeYear === index ? `${item.color}5` : undefined
                }"
              >
                <div class="flex flex-col md:flex-row items-center gap-6">
                  <div 
                    class="w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500"
                    :style="{ 
                      background: activeYear === index ? `linear-gradient(135deg, ${item.color}, ${item.color}80)` : `${item.color}10`
                    }"
                  >
                    <component 
                      :is="item.icon" 
                      class="w-10 h-10 transition-colors duration-500"
                      :style="{ color: activeYear === index ? '#fff' : item.color }"
                    />
                  </div>
                  
                  <div class="flex-1 text-center md:text-left">
                    <div class="flex items-center justify-center md:justify-start gap-4 mb-2">
                      <span 
                        class="text-2xl font-bold transition-colors duration-500"
                        :style="{ color: activeYear === index ? item.color : '#fff' }"
                      >
                        {{ item.year }}
                      </span>
                      <ArrowRight class="w-5 h-5 text-white/30" />
                      <h3 class="text-xl font-semibold text-white">{{ item.title }}</h3>
                    </div>
                    
                    <p class="text-white/60 mb-4">{{ item.description }}</p>
                    
                    <div class="flex flex-wrap justify-center md:justify-start gap-2">
                      <span 
                        v-for="feature in item.features" 
                        :key="feature"
                        class="px-3 py-1 rounded-full text-xs font-medium"
                        :style="{ 
                          background: `${item.color}20`,
                          color: item.color
                        }"
                      >
                        {{ feature }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="text-center mt-16">
          <button 
            @click="goHome"
            class="glass-button flex items-center gap-3 mx-auto"
          >
            <Home class="w-5 h-5" />
            <span>Return Home</span>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
