import { ref, reactive } from 'vue';
import { analyzeRoute, generateMusic, predict, type RouteAnalysis, type MusicGeneration, type Prediction, type AnalyzeRouteRequest } from '@/api';
import { audioManager, type AudioSource } from '@/audio/AudioManager';
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
export function useRoadSimulator() {
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
 const reroutingProgress = ref(0);
 const reroutingSteps = ref<string[]>([]);
 const triggerEvent = async (event: RoadAction) => {
 if (simulationState.isRerouting)
 return;
 simulationState.isRerouting = true;
 reroutingProgress.value = 0;
 reroutingSteps.value = ['Initializing AI analysis...'];
 await updateRoadState(event);
 await reroute();
 simulationState.isRerouting = false;
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
 const reroute = async () => {
 try {
 reroutingSteps.value.push('Analyzing current conditions...');
 reroutingProgress.value = 20;
 const weather = getWeather();
 const roadType = getRoadType();
 const request: AnalyzeRouteRequest = {
 start: 'Current Location',
 end: 'Destination',
 weather,
 estimatedTime: 25,
 driverStyle: getDriverStyle()
 };
 const analysis = await analyzeRoute(request);
 simulationState.currentAnalysis = analysis;
 reroutingSteps.value.push('Generating journey blueprint...');
 reroutingProgress.value = 40;
 const music = await generateMusic({ routeAnalysis: analysis });
 simulationState.currentMusic = music;
 reroutingSteps.value.push('Preparing music segments...');
 reroutingProgress.value = 60;
 await preloadMusicSegments(music);
 reroutingSteps.value.push('Making prediction...');
 reroutingProgress.value = 80;
 const prediction = await predict({
 currentState: 'highway',
 time: 10,
 currentSpeed: 80,
 currentRoad: roadType,
 nextRoad: roadType
 });
 simulationState.currentPrediction = prediction;
 reroutingSteps.value.push('Updating audio parameters...');
 reroutingProgress.value = 90;
 if (prediction.nextEnergy !== undefined) {
 audioManager.setEnergy(prediction.nextEnergy);
 }
 if (prediction.nextTempo !== undefined) {
 audioManager.setTempo(prediction.nextTempo);
 }
 if (music.segments.length > 0) {
 const firstSegment = music.segments[0];
 const audioSource: AudioSource = {
 id: firstSegment.id,
 type: 'synthesized',
 segment: firstSegment
 };
 await audioManager.crossfadeTo(audioSource, 1500);
 }
 reroutingSteps.value.push('Rerouting complete!');
 reroutingProgress.value = 100;
 }
 catch (error) {
 console.error('Rerouting failed:', error);
 reroutingSteps.value.push('Error occurred, using fallback...');
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
 const preloadMusicSegments = async (music: MusicGeneration) => {
 const sources: AudioSource[] = music.segments.map(segment => ({
 id: segment.id,
 type: 'synthesized',
 segment
 }));
 await audioManager.preload(sources);
 };
 const clearAllEvents = () => {
 triggerEvent('clear');
 };
 return {
 simulationState,
 reroutingProgress,
 reroutingSteps,
 triggerEvent,
 clearAllEvents
 };
}

