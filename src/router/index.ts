import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import JourneyPlanner from '@/views/JourneyPlanner.vue'
import DrivingSimulation from '@/views/DrivingSimulation.vue'
import JourneySummary from '@/views/JourneySummary.vue'
import Architecture from '@/views/Architecture.vue'
import MusicSegmentEngine from '@/views/MusicSegmentEngine.vue'
import JourneyBrain from '@/views/JourneyBrain.vue'
import FinalVision from '@/views/FinalVision.vue'
import Roadmap from '@/views/Roadmap.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/journey-brain',
      name: 'JourneyBrain',
      component: JourneyBrain
    },
    {
      path: '/planner',
      name: 'JourneyPlanner',
      component: JourneyPlanner
    },
    {
      path: '/simulation',
      name: 'DrivingSimulation',
      component: DrivingSimulation
    },
    {
      path: '/summary',
      name: 'JourneySummary',
      component: JourneySummary
    },
    {
      path: '/architecture',
      name: 'Architecture',
      component: Architecture
    },
    {
      path: '/music-engine',
      name: 'MusicSegmentEngine',
      component: MusicSegmentEngine
    },
    {
      path: '/final-vision',
      name: 'FinalVision',
      component: FinalVision
    },
    {
      path: '/roadmap',
      name: 'Roadmap',
      component: Roadmap
    }
  ]
})

export default router
