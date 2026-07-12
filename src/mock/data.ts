import type { DrivingState, JourneyStep, MusicChapter } from '@/types'

export const stateTransitions: DrivingState[] = [
  'parking', 'city', 'accelerating', 'highway', 'overtaking', 'cruise', 
  'highway', 'decelerating', 'city', 'arrived'
]

export const stateConfigs: Record<DrivingState, {
  energy: number
  tempo: number
  style: string
  color: string
}> = {
  parking: { energy: 10, tempo: 0, style: 'Silent', color: '#6b7280' },
  city: { energy: 35, tempo: 85, style: 'Urban Chill', color: '#3b82f6' },
  accelerating: { energy: 70, tempo: 120, style: 'Building Energy', color: '#f59e0b' },
  highway: { energy: 85, tempo: 130, style: 'Cruise Electronic', color: '#8b5cf6' },
  overtaking: { energy: 95, tempo: 150, style: 'Intense Beat', color: '#ef4444' },
  cruise: { energy: 75, tempo: 125, style: 'Smooth Groove', color: '#06b6d4' },
  decelerating: { energy: 40, tempo: 90, style: 'Cooling Down', color: '#10b981' },
  arrived: { energy: 20, tempo: 60, style: 'Arrival Theme', color: '#8b5cf6' }
}

export const roadTypes: JourneyStep['type'][] = ['city', 'elevated', 'highway', 'urban', 'end']
export const roadNames: Record<JourneyStep['type'], string> = {
  city: 'Urban Road',
  elevated: 'Elevated Road',
  highway: 'Highway',
  urban: 'City Center',
  end: 'Destination'
}

export const musicStyles: MusicChapter['style'][] = ['calm', 'build', 'cruise', 'peak', 'ending']
export const musicNames: Record<MusicChapter['style'], string> = {
  calm: 'Calm',
  build: 'Build',
  cruise: 'Cruise',
  peak: 'Peak',
  ending: 'Ending'
}

export const aiExplanations: Record<DrivingState, string[]> = {
  parking: [
    'Vehicle is parked.',
    'System initializing...',
    'Waiting for driver input.'
  ],
  city: [
    'Urban environment detected.',
    'Activating city navigation mode.',
    'Traffic lights ahead.',
    'Reducing energy for urban driving.'
  ],
  accelerating: [
    'Vehicle is accelerating.',
    'Increasing tempo to match speed.',
    'Building energy for upcoming highway.',
    'Preparing transition to cruise mode.'
  ],
  highway: [
    'Highway detected.',
    'Activating cruise control mode.',
    'Maximum energy level achieved.',
    'Optimizing music for highway driving.'
  ],
  overtaking: [
    'Overtaking maneuver detected.',
    'Increasing energy for intense moment.',
    'Peak performance mode activated.',
    'Driving style: aggressive.'
  ],
  cruise: [
    'Stable cruising detected.',
    'Maintaining optimal energy level.',
    'Smooth transition between segments.',
    'Balanced driving style.'
  ],
  decelerating: [
    'Decelerating approaching destination.',
    'Reducing tempo gradually.',
    'Cooling down music energy.',
    'Preparing arrival sequence.'
  ],
  arrived: [
    'Destination reached.',
    'Activating arrival theme.',
    'Journey completed successfully.',
    'Thank you for using DriveScore AI.'
  ]
}

export const aiDecisions: Record<DrivingState, { action: string; reason: string }> = {
  parking: { action: 'System Standby', reason: 'Vehicle is not moving.' },
  city: { action: 'Playing Calm Section', reason: 'Urban road requires relaxed atmosphere.' },
  accelerating: { action: 'Preparing Build Section', reason: 'Entering elevated road soon.' },
  highway: { action: 'Switching to Cruise Section', reason: 'Highway driving requires high energy.' },
  overtaking: { action: 'Activating Peak Section', reason: 'Overtaking requires intense music.' },
  cruise: { action: 'Maintaining Cruise Section', reason: 'Stable highway driving.' },
  decelerating: { action: 'Transitioning to Ending', reason: 'Approaching destination.' },
  arrived: { action: 'Playing Arrival Theme', reason: 'Journey completed.' }
}

export const musicLibrary = [
  { id: 'Calm_01', style: 'calm' as const, bpm: 65, energy: 25, key: 'C Major', duration: 180 },
  { id: 'Calm_02', style: 'calm' as const, bpm: 70, energy: 30, key: 'D Major', duration: 200 },
  { id: 'Build_01', style: 'build' as const, bpm: 95, energy: 50, key: 'A Minor', duration: 150 },
  { id: 'Build_02', style: 'build' as const, bpm: 100, energy: 55, key: 'E Minor', duration: 160 },
  { id: 'Cruise_01', style: 'cruise' as const, bpm: 120, energy: 70, key: 'B Minor', duration: 240 },
  { id: 'Cruise_02', style: 'cruise' as const, bpm: 125, energy: 75, key: 'F Major', duration: 220 },
  { id: 'Cruise_03', style: 'cruise' as const, bpm: 130, energy: 80, key: 'G Major', duration: 260 },
  { id: 'Peak_01', style: 'peak' as const, bpm: 145, energy: 95, key: 'D Minor', duration: 120 },
  { id: 'Peak_02', style: 'peak' as const, bpm: 150, energy: 98, key: 'A Major', duration: 100 },
  { id: 'Ending_01', style: 'ending' as const, bpm: 75, energy: 35, key: 'C Major', duration: 180 },
  { id: 'Ending_02', style: 'ending' as const, bpm: 70, energy: 28, key: 'F Major', duration: 200 }
]

export const journeyTimeline = [
  { id: 1, name: 'Calm', style: 'calm', duration: 5000, color: '#10b981' },
  { id: 2, name: 'Build', style: 'build', duration: 5000, color: '#f59e0b' },
  { id: 3, name: 'Cruise', style: 'cruise', duration: 6000, color: '#8b5cf6' },
  { id: 4, name: 'Peak', style: 'peak', duration: 4000, color: '#ef4444' },
  { id: 5, name: 'Ending', style: 'ending', duration: 5000, color: '#3b82f6' }
]

export const predictionData = {
  upcomingRoad: 'Highway',
  distance: 650,
  eta: 21,
  expectedMusic: 'Cruise',
  cacheStatus: 'Ready'
}

export const summaryData = {
  drivingTime: 1845,
  musicSegments: 18,
  averageEnergy: 62,
  drivingStyle: 'balanced' as 'smooth' | 'dynamic' | 'aggressive' | 'balanced',
  journeyScore: 92,
  musicContinuity: 98,
  predictionAccuracy: 96,
  journeyEmotion: 'Energetic'
}

export const architectureNodes = [
  { id: 1, name: 'Navigation', description: 'Route planning and GPS data' },
  { id: 2, name: 'Journey Planner', description: 'Analyze route characteristics' },
  { id: 3, name: 'AI Composer', description: 'Generate music segments' },
  { id: 4, name: 'Journey Blueprint', description: 'Music roadmap for journey' },
  { id: 5, name: 'Music Cache', description: 'Pre-load music segments' },
  { id: 6, name: 'Driving AI', description: 'Real-time driving analysis' },
  { id: 7, name: 'Audio Engine', description: 'Dynamic music playback' },
  { id: 8, name: 'Driver Experience', description: 'Immersive sound experience' }
]

export const generateEnergyData = () => {
  const data: number[] = []
  for (let i = 0; i < 20; i++) {
    data.push(Math.floor(Math.random() * 40) + 50)
  }
  return data
}

export const generateTempoData = () => {
  const data: number[] = []
  for (let i = 0; i < 20; i++) {
    data.push(Math.floor(Math.random() * 50) + 80)
  }
  return data
}

export const generateSpeedData = () => {
  const data: number[] = []
  for (let i = 0; i < 20; i++) {
    data.push(Math.floor(Math.random() * 60) + 40)
  }
  return data
}

export const reasoningSteps = [
  { text: 'Analyzing route...', duration: 1500 },
  { text: 'Highway ratio detected.', duration: 800 },
  { text: 'Estimated travel time: 23 min.', duration: 1000 },
  { text: 'Generating soundtrack blueprint...', duration: 2000 },
  { text: 'Selecting music emotion...', duration: 1200 },
  { text: 'Caching Peak section...', duration: 1500 },
  { text: 'Journey Blueprint complete.', duration: 800 }
]

export const journeyBrainSteps = [
  { id: 1, name: 'Urban', icon: 'Building2', color: '#3b82f6', description: 'City navigation' },
  { id: 2, name: 'Build', icon: 'TrendingUp', color: '#f59e0b', description: 'Elevated road' },
  { id: 3, name: 'Highway', icon: 'Road', color: '#8b5cf6', description: 'Main highway' },
  { id: 4, name: 'Peak', icon: 'Zap', color: '#ef4444', description: 'High speed' },
  { id: 5, name: 'Ending', icon: 'Flag', color: '#10b981', description: 'Destination' }
]

export const eventStreamTemplates = {
  parking: [
    { text: 'System initialized.', type: 'system' },
    { text: 'Waiting for driver input.', type: 'info' },
    { text: 'Music engine ready.', type: 'system' }
  ],
  city: [
    { text: 'Entering urban area.', type: 'route' },
    { text: 'Speed adjusted to 40 km/h.', type: 'speed' },
    { text: 'Music: Calm section.', type: 'music' },
    { text: 'Traffic light ahead.', type: 'info' }
  ],
  accelerating: [
    { text: 'Acceleration detected.', type: 'speed' },
    { text: 'Energy increasing by 15%.', type: 'music' },
    { text: 'Approaching elevated road.', type: 'route' },
    { text: 'Tempo: 104 BPM.', type: 'music' }
  ],
  highway: [
    { text: 'Entering highway.', type: 'route' },
    { text: 'Music switched to Cruise_02.', type: 'music' },
    { text: 'Speed: 120 km/h.', type: 'speed' },
    { text: 'Peak section preloaded.', type: 'cache' }
  ],
  overtaking: [
    { text: 'Overtaking maneuver.', type: 'speed' },
    { text: 'Activating Peak section.', type: 'music' },
    { text: 'Energy: 95%.', type: 'music' },
    { text: 'Tempo: 150 BPM.', type: 'music' }
  ],
  cruise: [
    { text: 'Stable cruising detected.', type: 'speed' },
    { text: 'Maintaining energy level.', type: 'music' },
    { text: 'Prediction updated.', type: 'system' }
  ],
  decelerating: [
    { text: 'Deceleration detected.', type: 'speed' },
    { text: 'Reducing tempo.', type: 'music' },
    { text: 'Preparing Ending section.', type: 'music' },
    { text: 'Approaching destination.', type: 'route' }
  ],
  arrived: [
    { text: 'Destination reached.', type: 'route' },
    { text: 'Playing arrival theme.', type: 'music' },
    { text: 'Journey completed.', type: 'system' }
  ]
}

export const aiExplainabilityRules: Record<DrivingState, { reason: string; action: string }[]> = {
  parking: [
    { reason: 'Vehicle is stationary.', action: 'System on standby.' },
    { reason: 'No motion detected.', action: 'Music paused.' }
  ],
  city: [
    { reason: 'Urban environment detected.', action: 'Lower energy for relaxed driving.' },
    { reason: 'Traffic density normal.', action: 'Maintain steady tempo.' }
  ],
  accelerating: [
    { reason: 'Acceleration exceeded threshold.', action: 'Increase energy by 15%.' },
    { reason: 'Approaching elevated road.', action: 'Prepare Build section.' }
  ],
  highway: [
    { reason: 'Highway entrance detected.', action: 'Switch to Cruise mode.' },
    { reason: 'Speed above 100 km/h.', action: 'Increase tempo to 130 BPM.' }
  ],
  overtaking: [
    { reason: 'Overtaking maneuver detected.', action: 'Activate Peak section.' },
    { reason: 'High acceleration detected.', action: 'Maximum energy level.' }
  ],
  cruise: [
    { reason: 'Stable speed maintained.', action: 'Sustain Cruise mode.' },
    { reason: 'No upcoming events.', action: 'Continue current segment.' }
  ],
  decelerating: [
    { reason: 'Deceleration detected.', action: 'Reduce energy gradually.' },
    { reason: 'ETA < 20 seconds.', action: 'Prepare Ending section.' }
  ],
  arrived: [
    { reason: 'Destination reached.', action: 'Play arrival theme.' },
    { reason: 'Journey complete.', action: 'Generate summary.' }
  ]
}

export const finalVisionData = [
  {
    phase: 'Today',
    title: 'Music Player',
    description: 'Static playlists, manual control',
    color: '#6b7280',
    icon: 'Headphones'
  },
  {
    phase: 'Tomorrow',
    title: 'Journey Music Engine',
    description: 'AI-generated, route-aware',
    color: '#8b5cf6',
    icon: 'Music'
  },
  {
    phase: 'Future',
    title: 'AI Sound Companion',
    description: 'Emotional, adaptive, predictive',
    color: '#06b6d4',
    icon: 'Brain'
  }
]

export const composerProgressData = [
  { id: 'Calm_01', name: 'Calm_01', style: 'Calm', targetProgress: 100, color: '#10b981' },
  { id: 'Build_01', name: 'Build_01', style: 'Build', targetProgress: 100, color: '#f59e0b' },
  { id: 'Cruise_02', name: 'Cruise_02', style: 'Cruise', targetProgress: 100, color: '#8b5cf6' },
  { id: 'Peak_01', name: 'Peak_01', style: 'Peak', targetProgress: 100, color: '#ef4444' },
  { id: 'Ending_01', name: 'Ending_01', style: 'Ending', targetProgress: 100, color: '#3b82f6' }
]

export const cacheMemoryData = {
  capacity: 32,
  cachedSegments: ['Calm_01', 'Build_01', 'Cruise_02', 'Peak_01', 'Ending_01'],
  cacheHitRate: 98,
  loadingSpeed: 5.6
}
