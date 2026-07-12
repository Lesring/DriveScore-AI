import { reactive } from 'vue';
import { analyzeRoute, generateMusic, predict, type RouteAnalysis, type MusicGeneration, type Prediction, type AnalyzeRouteRequest } from '@/api';
import { audioManager, type AudioSource } from '@/audio/AudioManager';
import { useJourneySession, type RerouteEvent } from '@/composables/useJourneySession';
import type { DrivingState } from '@/types';

export type RoadEvent = 'rain' | 'night' | 'traffic' | 'construction' | 'accident' | 'mountain' | 'highway';
export type RoadAction = RoadEvent | 'clear';

export interface RoadState {
  rain: boolean;
  night: boolean;
  traffic: boolean;
  construction: boolean;
  accident: boolean;
  mountain: boolean;
  highway: boolean;
}

export interface SimulationState {
  isRerouting: boolean;
  currentAnalysis: RouteAnalysis | null;
  currentMusic: MusicGeneration | null;
  currentPrediction: Prediction | null;
  roadState: RoadState;
  reroutingMessage: string;
}

export interface RoadEventMapping {
  speed: number;
  energy: number;
  tempo: number;
  state: DrivingState;
  musicStyle: string;
  explanation: string;
}

export const ROAD_EVENT_MAPPING: Record<RoadAction, RoadEventMapping> = {
  rain: {
    speed: 60,
    energy: 40,
    tempo: 85,
    state: 'city',
    musicStyle: 'Calm',
    explanation: 'AI is rethinking rhythm for rain - switching to calm, steady music'
  },
  night: {
    speed: 70,
    energy: 35,
    tempo: 80,
    state: 'cruise',
    musicStyle: 'Calm',
    explanation: 'AI adapting to night driving - playing soothing ambient music'
  },
  traffic: {
    speed: 30,
    energy: 30,
    tempo: 70,
    state: 'city',
    musicStyle: 'Build',
    explanation: 'AI responding to traffic - slowing tempo to help maintain patience'
  },
  construction: {
    speed: 40,
    energy: 35,
    tempo: 75,
    state: 'city',
    musicStyle: 'Build',
    explanation: 'AI detecting construction - switching to cautious driving mode'
  },
  accident: {
    speed: 20,
    energy: 25,
    tempo: 65,
    state: 'decelerating',
    musicStyle: 'Ending',
    explanation: 'Emergency detected - reducing all parameters for safety'
  },
  mountain: {
    speed: 50,
    energy: 65,
    tempo: 105,
    state: 'city',
    musicStyle: 'Peak',
    explanation: 'AI entering mountain terrain - increasing energy for the challenge'
  },
  highway: {
    speed: 120,
    energy: 80,
    tempo: 130,
    state: 'highway',
    musicStyle: 'Cruise',
    explanation: 'AI entering highway - boosting energy and tempo for cruising'
  },
  clear: {
    speed: 80,
    energy: 60,
    tempo: 100,
    state: 'cruise',
    musicStyle: 'Cruise',
    explanation: 'All conditions cleared - returning to standard driving mode'
  }
};

export function useRoadSimulator() {
  const { 
    setLastRerouteEvent, 
    completeReroute, 
    addPrediction, 
    setAIStatus,
    startRerouting,
    updateReroutingStep,
    setRerouteResult,
    finishRerouting
  } = useJourneySession();
  
  const simulationState = reactive<SimulationState>({
    isRerouting: false,
    currentAnalysis: null,
    currentMusic: null,
    currentPrediction: null,
    roadState: {
      rain: false,
      night: false,
      traffic: false,
      construction: false,
      accident: false,
      mountain: false,
      highway: false
    },
    reroutingMessage: ''
  });

  const triggerEvent = async (event: RoadAction) => {
    if (simulationState.isRerouting)
      return;

    simulationState.isRerouting = true;
    startRerouting(['Initializing AI analysis...'], 0);
    
    const eventName = event === 'clear' ? 'Cleared all events' : `${event.charAt(0).toUpperCase() + event.slice(1)}`;
    setLastRerouteEvent(eventName);
    simulationState.reroutingMessage = ROAD_EVENT_MAPPING[event].explanation;

    await updateRoadState(event);
    await reroute(event);

    simulationState.isRerouting = false;
    simulationState.reroutingMessage = '';
    finishRerouting();
  };

  const updateRoadState = (event: RoadAction) => {
    if (event === 'clear') {
      Object.keys(simulationState.roadState).forEach(key => {
        simulationState.roadState[key as keyof RoadState] = false;
      });
    }
    else {
      simulationState.roadState[event] = !simulationState.roadState[event];
    }
  };

  const reroute = async (event: RoadAction) => {
    try {
      const mapping = ROAD_EVENT_MAPPING[event];
      
      updateReroutingStep(mapping.explanation, 10);

      const weather = getWeather();
      const roadType = getRoadType();
      const driverStyle = getDriverStyle();

      const request: AnalyzeRouteRequest = {
        start: 'Current Location',
        end: 'Destination',
        weather,
        estimatedTime: 25,
        driverStyle
      };

      updateReroutingStep('Rebuilding journey blueprint...', 25);
      const analysisResult = await analyzeRoute(request);
      const analysis = analysisResult.data!;
      simulationState.currentAnalysis = analysis;

      updateReroutingStep('Regenerating music plan...', 50);
      const musicResult = await generateMusic({ routeAnalysis: analysis });
      const music = musicResult.data!;
      simulationState.currentMusic = music;

      completeReroute(analysis, music);

      updateReroutingStep('Preloading music segments...', 60);
      const sources: AudioSource[] = music.segments.map(segment => ({
        id: segment.id,
        type: segment.audioUrl ? 'url' : 'synthesized',
        url: segment.audioUrl,
        segment
      }));
      await audioManager.preload(sources);

      updateReroutingStep('Updating prediction...', 70);
      const predictionResult = await predict({
        currentState: mapping.state,
        time: 10,
        currentSpeed: mapping.speed,
        currentRoad: roadType,
        nextRoad: roadType
      });
      const prediction = predictionResult.data!;
      simulationState.currentPrediction = prediction;
      addPrediction(prediction);

      updateReroutingStep('Applying audio changes...', 85);

      audioManager.setEnergy(mapping.energy);
      audioManager.setTempo(mapping.tempo);

      if (music.segments.length > 0) {
        const targetSegment = music.segments.find(s => s.style.toLowerCase() === mapping.musicStyle.toLowerCase()) || music.segments[0];
        
        const audioSource: AudioSource = {
          id: targetSegment.id,
          type: targetSegment.audioUrl ? 'url' : 'synthesized',
          url: targetSegment.audioUrl,
          segment: targetSegment
        };
        await audioManager.crossfadeTo(audioSource, 1500);
      }

      const rerouteEvent: RerouteEvent = {
        eventType: event,
        analysis,
        music,
        prediction,
        explanation: mapping.explanation,
        targetSpeed: mapping.speed,
        targetEnergy: mapping.energy,
        targetTempo: mapping.tempo,
        roadType
      };
      
      setRerouteResult(rerouteEvent);

      updateReroutingStep('AI re-thinking complete!', 100);
    }
    catch (error) {
      console.error('Rerouting failed:', error);
      updateReroutingStep('Error occurred, using fallback...', 100);
      setAIStatus('fallback');
    }
  };

  const getWeather = (): string => {
    if (simulationState.roadState.rain)
      return 'Rainy';
    if (simulationState.roadState.night)
      return 'Night';
    return 'Sunny';
  };

  const getRoadType = (): string => {
    if (simulationState.roadState.mountain)
      return 'Mountain';
    if (simulationState.roadState.highway)
      return 'Highway';
    if (simulationState.roadState.construction)
      return 'Construction';
    if (simulationState.roadState.accident)
      return 'Accident';
    if (simulationState.roadState.traffic)
      return 'Traffic';
    return 'Urban';
  };

  const getDriverStyle = (): string => {
    if (simulationState.roadState.traffic || simulationState.roadState.construction || simulationState.roadState.accident) {
      return 'Cautious';
    }
    if (simulationState.roadState.highway) {
      return 'Energetic';
    }
    if (simulationState.roadState.mountain) {
      return 'Focused';
    }
    return 'Balanced';
  };

  const clearAllEvents = () => {
    triggerEvent('clear');
  };

  return {
    simulationState,
    triggerEvent,
    clearAllEvents,
    getWeather,
    getRoadType,
    getDriverStyle
  };
}