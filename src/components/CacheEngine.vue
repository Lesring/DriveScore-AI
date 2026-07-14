<script setup lang="ts">import { ref, computed, watch } from 'vue';
import { HardDrive, Download, Loader2, Check, Music2 } from 'lucide-vue-next';
import { audioManager, type AudioSource } from '@/audio/AudioManager';
import { useJourneySession } from '@/composables/useJourneySession';
import { useStableAudio } from '@/composables/useStableAudio';
import { DEFAULT_MUSIC_STYLE_CONFIGS } from '@/api/stableAudio';
const props = defineProps<{
 isVisible: boolean;
}>();
const emit = defineEmits<{
 (e: 'ready'): void;
}>();
const { session } = useJourneySession();
const { hasApiKey, preGenerateAllStyles, generateSeedFromRoute, generationProgress, generationStatus, journeySeed } = useStableAudio();
const isLoading = ref(true);
const cachedSegments = ref<string[]>([]);
const memoryUsed = ref(0);
const failedSegments = ref<string[]>([]);
const isGenerating = ref(false);
const generationError = ref('');
const totalSegments = computed(() => session.musicSegments.length);
const preloadProgress = computed(() => {
 if (totalSegments.value === 0)
 return 0;
 return (cachedSegments.value.length / totalSegments.value) * 100;
});
const effectiveSegments = computed(() => {
 return session.musicSegments.length > 0
 ? session.musicSegments
 : Object.values(DEFAULT_MUSIC_STYLE_CONFIGS).map(config => ({
 id: `${config.style}_01`,
 style: config.style,
 energy: config.energy,
 tempo: config.tempo,
 key: 'C Major',
 duration: 180,
 progress: 100,
 emotion: config.mood,
 reason: 'Fallback data',
 audioUrl: `/music/${config.style}.wav`
 }));
});
watch(() => props.isVisible, (visible) => {
 if (visible) {
 startCaching();
 }
}, { immediate: true });
const startCaching = async () => {
 isLoading.value = true;
 cachedSegments.value = [];
 failedSegments.value = [];
 memoryUsed.value = 0;
 generationError.value = '';
 if (hasApiKey.value) {
 await generateAIMusic();
 }
 const segments = effectiveSegments.value;
 if (segments.length === 0) {
 isLoading.value = false;
 emit('ready');
 return;
 }
 const sources: AudioSource[] = segments.map(segment => ({
 id: segment.id,
 type: segment.audioUrl ? 'url' : 'synthesized',
 url: segment.audioUrl,
 segment
 }));
 try {
 const result = await audioManager.preload(sources);
 cachedSegments.value = result.success;
 failedSegments.value = result.failed;
 memoryUsed.value = result.success.length * 6.4;
 }
 catch (error) {
 console.error('Caching failed:', error);
 }
 isLoading.value = false;
 emit('ready');
};
const generateAIMusic = async () => {
 isGenerating.value = true;
 generationStatus.value = 'generating';
 try {
 const routeString = typeof session.routeInput === 'string'
 ? session.routeInput
 : JSON.stringify(session.routeInput || {});
 const seed = routeString ? generateSeedFromRoute(routeString) : Math.floor(Math.random() * 1000000);
 const success = await preGenerateAllStyles(seed);
 if (!success) {
 generationError.value = 'AI Music unavailable, using local suite';
 }
 }
 catch (error) {
 console.error('AI music generation failed:', error);
 generationError.value = 'AI Music unavailable, using local suite';
 }
 finally {
 isGenerating.value = false;
 }
};
const getSegmentStatus = (segmentId: string) => {
 if (cachedSegments.value.includes(segmentId))
 return 'cached';
 if (failedSegments.value.includes(segmentId))
 return 'failed';
 if (isLoading.value)
 return 'loading';
 return 'available';
};
</script>

<template>
  <div 
    v-if="isVisible"
    class="glass-card p-6"
  >
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-primary-theme font-semibold flex items-center gap-2">
        <HardDrive class="w-5 h-5 text-secondary" />
        Music Cache Memory
      </h3>
      
      <div class="flex items-center gap-2">
        <Loader2 
          v-if="isLoading || isGenerating" 
          class="w-4 h-4 text-primary animate-spin" 
        />
        <Check v-else class="w-4 h-4 text-green-400" />
        <span :class="isLoading || isGenerating ? 'text-primary' : 'text-green-400'" class="text-sm">
          {{ isGenerating ? 'Generating AI Music...' : isLoading ? 'Preloading...' : 'Ready' }}
        </span>
      </div>
    </div>
    
    <div v-if="generationError" class="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
      <div class="flex items-center gap-2 text-red-400 text-sm">
        <Music2 class="w-4 h-4" />
        {{ generationError }}
      </div>
    </div>
    
    <div v-if="isGenerating" class="mb-6">
      <div class="flex justify-between text-sm mb-2">
        <span class="text-secondary-theme">AI Music Generation</span>
        <span class="text-primary-theme">{{ generationProgress.toFixed(0) }}%</span>
      </div>
      <div class="h-3 bg-glass-border rounded-full overflow-hidden">
        <div 
          class="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300"
          :style="{ width: `${generationProgress}%` }"
        ></div>
      </div>
    </div>
    
    <div class="mb-6">
      <div class="flex justify-between text-sm mb-2">
        <span class="text-secondary-theme">Preload Progress</span>
        <span class="text-primary-theme">Preloaded {{ cachedSegments.length }}/{{ totalSegments || 5 }}</span>
      </div>
      <div class="h-3 bg-glass-border rounded-full overflow-hidden">
        <div 
          class="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-300"
          :style="{ width: `${preloadProgress}%` }"
        ></div>
      </div>
      <div class="flex justify-between text-sm mt-1">
        <span class="text-secondary-theme">Used: {{ memoryUsed.toFixed(1) }} MB</span>
        <span class="text-primary-theme">{{ preloadProgress.toFixed(0) }}%</span>
      </div>
    </div>
    
    <div class="mb-6">
      <h4 class="text-secondary-theme text-sm mb-3">Current Cache</h4>
      <div class="space-y-2">
        <div 
          v-for="segment in effectiveSegments" 
          :key="segment.id"
          class="flex items-center justify-between p-2 rounded-lg transition-all duration-300"
          :class="{
            'bg-green-500/20': getSegmentStatus(segment.id) === 'cached',
            'bg-red-500/20': getSegmentStatus(segment.id) === 'failed',
            'bg-primary/20': getSegmentStatus(segment.id) === 'loading',
            'bg-glass-bg': getSegmentStatus(segment.id) === 'available'
          }"
        >
          <div class="flex items-center gap-2">
            <Check 
              v-if="getSegmentStatus(segment.id) === 'cached'" 
              class="w-4 h-4 text-green-400" 
            />
            <Download 
              v-else-if="getSegmentStatus(segment.id) === 'failed'" 
              class="w-4 h-4 text-red-400" 
            />
            <Loader2 
              v-else-if="getSegmentStatus(segment.id) === 'loading'" 
              class="w-4 h-4 text-primary animate-spin" 
            />
            <div v-else class="w-4 h-4 bg-glass-border rounded"></div>
            
            <span 
              :class="{
                'text-primary-theme': getSegmentStatus(segment.id) === 'cached',
                'text-red-400': getSegmentStatus(segment.id) === 'failed',
                'text-primary': getSegmentStatus(segment.id) === 'loading',
                'text-muted-theme': getSegmentStatus(segment.id) === 'available'
              }"
            >
              {{ segment.style }}
            </span>
            
            <span 
              v-if="getSegmentStatus(segment.id) === 'cached'"
              class="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400"
            >
              Cached
            </span>
            <span 
              v-else-if="getSegmentStatus(segment.id) === 'failed'"
              class="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400"
            >
              Failed
            </span>
          </div>
          
          <span 
            v-if="getSegmentStatus(segment.id) === 'cached'"
            class="text-green-400 text-xs"
          >
            ✓
          </span>
          <span 
            v-else-if="getSegmentStatus(segment.id) === 'failed'"
            class="text-red-400 text-xs"
          >
            ✗
          </span>
          <span 
            v-else-if="getSegmentStatus(segment.id) === 'loading'"
            class="text-primary text-xs"
          >
            Loading...
          </span>
        </div>
        
        <div 
          v-if="effectiveSegments.length === 0"
          class="p-4 bg-glass-bg rounded-xl text-center"
        >
          <p class="text-muted-theme text-sm">No music segments to cache</p>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-glass-bg rounded-lg p-3 text-center">
        <div class="text-green-400 font-bold text-xl">{{ cachedSegments.length }}/{{ totalSegments || 5 }}</div>
        <div class="text-muted-theme text-xs">Preloaded</div>
      </div>
      <div class="bg-glass-bg rounded-lg p-3 text-center">
        <div class="text-red-400 font-bold text-xl">{{ failedSegments.length }}</div>
        <div class="text-muted-theme text-xs">Failed</div>
      </div>
    </div>
    
    <div v-if="journeySeed" class="mt-4 p-3 bg-glass-bg rounded-lg text-center">
      <div class="text-muted-theme text-xs">Journey Seed</div>
      <div class="text-primary-theme font-mono text-sm">{{ journeySeed }}</div>
    </div>
  </div>
</template>
