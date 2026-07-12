import { reactive } from 'vue';
import { analyzeRoute, generateMusic, predict, type RouteAnalysis, type MusicGeneration, type Prediction, type AnalyzeRouteRequest } from '@/api';
import { audioManager, type AudioSource } from '@/audio/AudioManager';
import { useJourneySession, type RerouteEvent } from '@/composables/useJourneySession';

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
}

const EVENT_EXPLANATIONS: Record<RoadAction, string> = {
  rain: '检测到降雨，正在降低能量并切换到更稳定的节奏以保持专注',
  night: '进入夜间驾驶模式，切换到舒缓的氛围音乐以减少疲劳',
  traffic: '检测到交通拥堵，正在降低节奏以帮助保持耐心',
  construction: '前方施工区域，切换到谨慎驾驶模式和稳定的背景音乐',
  accident: '检测到事故，立即降低所有参数，切换到最安全的驾驶状态',
  mountain: '进入山区道路，增加能量以应对复杂路况挑战',
  highway: '进入高速公路，提升能量和节奏以匹配巡航状态',
  clear: '所有路况已恢复正常，正在恢复到标准驾驶模式'
};

const EVENT_PARAMETERS: Record<RoadAction, { speed: number; energy: number; tempo: number; state: string }> = {
  rain: { speed: 60, energy: 40, tempo: 85, state: 'city' },
  night: { speed: 70, energy: 35, tempo: 80, state: 'cruise' },
  traffic: { speed: 30, energy: 30, tempo: 70, state: 'city' },
  construction: { speed: 40, energy: 35, tempo: 75, state: 'city' },
  accident: { speed: 20, energy: 25, tempo: 65, state: 'decelerating' },
  mountain: { speed: 50, energy: 65, tempo: 105, state: 'city' },
  highway: { speed: 120, energy: 80, tempo: 130, state: 'highway' },
  clear: { speed: 80, energy: 60, tempo: 100, state: 'cruise' }
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
    }
  });

  const triggerEvent = async (event: RoadAction) => {
    if (simulationState.isRerouting)
      return;

    simulationState.isRerouting = true;
    startRerouting(['Initializing AI analysis...'], 0);
    
    const eventName = event === 'clear' ? 'Cleared all events' : `${event.charAt(0).toUpperCase() + event.slice(1)}`;
    setLastRerouteEvent(eventName);

    await updateRoadState(event);
    await reroute(event);

    simulationState.isRerouting = false;
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
      updateReroutingStep('Analyzing road event...', 10);

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

      const isAIAnalysis = analysis.steps.length > 0 && analysis.steps[0].reason !== undefined;
      
      if (isAIAnalysis) {
        completeReroute(analysis, music);
      }

      updateReroutingStep('Updating prediction...', 70);
      const predictionResult = await predict({
        currentState: roadType.toLowerCase(),
        time: 10,
        currentSpeed: EVENT_PARAMETERS[event].speed,
        currentRoad: roadType,
        nextRoad: roadType
      });
      const prediction = predictionResult.data!;
      simulationState.currentPrediction = prediction;
      addPrediction(prediction);

      updateReroutingStep('Applying audio changes...', 85);

      const params = EVENT_PARAMETERS[event];
      audioManager.setEnergy(params.energy);
      audioManager.setTempo(params.tempo);

      if (music.segments.length > 0) {
        const targetStyle = getStyleForEvent(event);
        const targetSegment = music.segments.find(s => s.style.toLowerCase() === targetStyle.toLowerCase()) || music.segments[0];
        
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
        explanation: EVENT_EXPLANATIONS[event],
        targetSpeed: params.speed,
        targetEnergy: params.energy,
        targetTempo: params.tempo,
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

  const getStyleForEvent = (event: RoadAction): string => {
    switch (event) {
      case 'rain':
      case 'night':
        return 'Calm';
      case 'traffic':
      case 'construction':
        return 'Build';
      case 'accident':
        return 'Ending';
      case 'mountain':
        return 'Peak';
      case 'highway':
        return 'Cruise';
      case 'clear':
      default:
        return 'Cruise';
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