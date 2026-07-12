export interface JourneyStep {
  id: number
  name: string
  type: 'city' | 'elevated' | 'highway' | 'urban' | 'end'
  duration: number
  speed: number
}

export interface MusicChapter {
  id: number
  name: string
  style: 'calm' | 'build' | 'cruise' | 'peak' | 'ending'
  energy: number
  tempo: number
  duration: number
}

export interface JourneyBlueprint {
  start: string
  end: string
  steps: JourneyStep[]
  musicChapters: MusicChapter[]
  totalDuration: number
}

export type DrivingState = 'parking' | 'city' | 'accelerating' | 'highway' | 'overtaking' | 'cruise' | 'decelerating' | 'arrived'

export interface DrivingData {
  speed: number
  state: DrivingState
  energy: number
  tempo: number
  musicStyle: string
  currentChapter: number
  distance: number
  time: number
}

export interface JourneySummaryData {
  drivingTime: number
  musicSegments: number
  averageEnergy: number
  drivingStyle: 'smooth' | 'dynamic' | 'aggressive'
}
