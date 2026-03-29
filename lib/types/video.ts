export type VideoTemplate =
  | "daily-wrap"
  | "top-movers"
  | "sector-rotation"
  | "fii-dii-flow"
  | "radar-alerts";

export interface VideoScene {
  id: string;
  headline: string;
  bullet: string;
  visualAccent: string;
  dataPoints: string[];
  voiceover: string;
  sourceLabel: string;
  durationSeconds: number;
  visualCue: string;
}

export interface VideoSource {
  label: string;
  url?: string;
}

export interface VideoBriefResponse {
  title: string;
  template: VideoTemplate;
  duration: number;
  hook: string;
  summary: string;
  scenes: VideoScene[];
  cta: string;
  sources: VideoSource[];
  generatedAt: string;
  fallbackUsed: boolean;
}
