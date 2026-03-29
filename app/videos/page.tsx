"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import { ChevronLeft, ChevronRight, Clapperboard, Copy, Download, FileJson, FileText, Loader2, Pause, Play, RefreshCcw, Volume2 } from "lucide-react";
import LiveDataStatus from "@/components/LiveDataStatus";
import MethodologyCard from "@/components/MethodologyCard";
import PageHeader from "@/components/PageHeader";
import RiskNotice from "@/components/RiskNotice";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { VideoBriefResponse, VideoTemplate } from "@/lib/types/video";

const TEMPLATE_OPTIONS: Array<{ key: VideoTemplate; title: string; description: string }> = [
  { key: "daily-wrap", title: "Daily Market Wrap", description: "Fast opening-bell style market summary." },
  { key: "top-movers", title: "Top Movers", description: "Highlight the biggest names and the move behind them." },
  { key: "sector-rotation", title: "Sector Rotation", description: "Show where money appears to be rotating today." },
  { key: "fii-dii-flow", title: "FII / DII Flow", description: "Focus on institutional tone and what it means." },
  { key: "radar-alerts", title: "Radar Alerts", description: "Turn top Opportunity Radar signals into a short video brief." },
];

const DURATION_OPTIONS = [45, 60, 90] as const;
const ASPECT_OPTIONS = [
  { key: "16:9", label: "16:9", className: "aspect-video max-w-4xl", width: 1280, height: 720 },
  { key: "9:16", label: "9:16", className: "aspect-[9/16] max-w-[420px]", width: 720, height: 1280 },
  { key: "1:1", label: "1:1", className: "aspect-square max-w-[720px]", width: 1080, height: 1080 },
] as const;

type AspectKey = (typeof ASPECT_OPTIONS)[number]["key"];

function accentClasses(accent: string) {
  if (accent === "amber") return "from-amber-500/20 to-orange-500/10 border-amber-400/20";
  if (accent === "blue") return "from-sky-500/20 to-cyan-500/10 border-sky-400/20";
  if (accent === "red") return "from-red-500/20 to-rose-500/10 border-red-400/20";
  return "from-emerald-500/20 to-teal-500/10 border-emerald-400/20";
}

function formatTimestamp(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.max(0, Math.floor(totalSeconds % 60));
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function VideosPage() {
  const [template, setTemplate] = useState<VideoTemplate>("daily-wrap");
  const [duration, setDuration] = useState<number>(45);
  const [aspectRatio, setAspectRatio] = useState<AspectKey>("16:9");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [brief, setBrief] = useState<VideoBriefResponse | null>(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [copied, setCopied] = useState(false);
  const [exportError, setExportError] = useState("");
  const previewRef = useRef<HTMLDivElement | null>(null);
  const aspectMeta = useMemo(
    () => ASPECT_OPTIONS.find((option) => option.key === aspectRatio) ?? ASPECT_OPTIONS[0],
    [aspectRatio]
  );

  const generate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, duration }),
      });
      const payload = (await response.json().catch(() => null)) as VideoBriefResponse | null;
      setBrief(payload);
      setSceneIndex(0);
      setIsPlaying(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void generate();
  }, []);

  const sceneDurations = useMemo(() => {
    if (!brief?.scenes.length) return [];
    return brief.scenes.map((scene, index) => {
      if (Number.isFinite(scene.durationSeconds) && scene.durationSeconds > 0) {
        return scene.durationSeconds;
      }
      const equalShare = Math.max(3, Math.floor(duration / brief.scenes.length));
      if (index === brief.scenes.length - 1) {
        const assigned = equalShare * (brief.scenes.length - 1);
        return Math.max(3, duration - assigned);
      }
      return equalShare;
    });
  }, [brief, duration]);

  const timelineMoments = useMemo(() => {
    if (!brief?.scenes.length) return [];
    let elapsed = 0;
    return brief.scenes.map((scene, index) => {
      const start = elapsed;
      const sceneDuration = sceneDurations[index] ?? 0;
      elapsed += sceneDuration;
      return {
        id: scene.id,
        start,
        end: elapsed,
      };
    });
  }, [brief, sceneDurations]);

  useEffect(() => {
    if (!brief || !isPlaying || brief.scenes.length <= 1 || exporting) return;
    const timer = window.setTimeout(() => {
      setSceneIndex((current) => (current + 1) % brief.scenes.length);
    }, Math.max(2400, (sceneDurations[sceneIndex] ?? 3) * 1000));

    return () => window.clearTimeout(timer);
  }, [brief, isPlaying, exporting, sceneDurations, sceneIndex]);

  const activeScene = brief?.scenes[sceneIndex] ?? null;
  const subtitleText = useMemo(() => activeScene?.voiceover ?? "", [activeScene]);
  const scriptText = useMemo(() => {
    if (!brief) return "";
    return [brief.hook, ...brief.scenes.map((scene) => scene.voiceover), brief.cta].join("\n\n");
  }, [brief]);

  const copyScript = async () => {
    if (!scriptText) return;
    await navigator.clipboard.writeText(scriptText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const downloadStoryboard = () => {
    if (!brief) return;
    const storyboard = {
      ...brief,
      aspectRatio,
      scenes: brief.scenes.map((scene, index) => ({
        ...scene,
        durationSeconds: sceneDurations[index] ?? scene.durationSeconds,
        timelineStart: formatTimestamp(timelineMoments[index]?.start ?? 0),
        timelineEnd: formatTimestamp(timelineMoments[index]?.end ?? 0),
      })),
    };

    const blob = new Blob([JSON.stringify(storyboard, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${template}-${duration}s-storyboard.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadCaptions = () => {
    if (!brief) return;
    const toTime = (seconds: number) => {
      const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
      const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
      const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
      return `${hrs}:${mins}:${secs},000`;
    };

    const srt = brief.scenes
      .map((scene, index) => {
        const start = timelineMoments[index]?.start ?? 0;
        const end = timelineMoments[index]?.end ?? duration;
        return `${index + 1}\n${toTime(start)} --> ${toTime(end)}\n${scene.voiceover}\n`;
      })
      .join("\n");

    const blob = new Blob([srt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${template}-${duration}s-captions.srt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const speakScene = () => {
    if (!activeScene || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeScene.voiceover);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const exportVideo = async () => {
    if (!brief || !previewRef.current) return;
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      setExportError("This browser does not support in-browser video export.");
      return;
    }

    setExportError("");
    setExporting(true);
    setIsPlaying(false);

    const previousScene = sceneIndex;
    const previewNode = previewRef.current;
    const width = aspectMeta.width;
    const height = aspectMeta.height;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      setExportError("Could not initialize video export canvas.");
      setExporting(false);
      return;
    }

    const stream = canvas.captureStream(30);
    const mimeType =
      MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
          ? "video/webm;codecs=vp8"
          : "video/webm";

    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

    try {
      recorder.start();

      for (let index = 0; index < brief.scenes.length; index += 1) {
        setSceneIndex(index);
        await wait(250);
        const screenshot = await html2canvas(previewNode, {
          backgroundColor: "#020617",
          scale: 2,
        });
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(screenshot, 0, 0, canvas.width, canvas.height);
        await wait(Math.max(2400, (sceneDurations[index] ?? 3) * 1000));
      }

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });

      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${template}-${duration}s-${aspectRatio.replace(":", "x")}.webm`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Video export failed:", error);
      setExportError("Video export failed. Try a shorter duration or regenerate the brief.");
    } finally {
      setSceneIndex(previousScene);
      setExporting(false);
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Market Video Engine"
        description="Auto-generate short, visually rich market update videos from live context, ranked signals, and AI-generated narration."
        action={<Clapperboard className="w-8 h-8 text-emerald-300" />}
      />

      <LiveDataStatus
        label="Video brief context"
        timestamp={brief?.generatedAt ?? null}
        fallbackUsed={Boolean(brief?.fallbackUsed)}
        staleMessage="This video brief is using fallback or delayed market context. Review the attached sources before sharing or acting on it."
        onRetry={() => void generate()}
      />

      <RiskNotice
        title="Video summaries are informational content, not trade calls"
        body="These clips are generated from available market context and ranked signals. They are meant to explain what changed, not to replace source verification or investment judgment."
      />

      <MethodologyCard
        title="How the video engine builds a market brief"
        summary="Templates combine current market context with top ranked signals and then turn them into a scene-by-scene short video plan."
        bullets={[
          "Live context is preferred when available, but a deterministic fallback brief is always returned if feeds or AI are delayed.",
          "The generated output includes scenes, narration, source links, captions, and storyboard metadata.",
          "A polished export does not imply the underlying claim is verified; always inspect the attached sources.",
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
        <div className="liquid-glass rounded-2xl border border-white/10 p-5 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">Video Template</p>
            <div className="mt-3 space-y-2">
              {TEMPLATE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setTemplate(option.key)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${template === option.key ? "border-emerald-400/30 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                >
                  <p className="text-sm font-medium text-white">{option.title}</p>
                  <p className="mt-1 text-xs text-white/50 leading-relaxed">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">Duration</p>
            <div className="mt-3 flex gap-2">
              {DURATION_OPTIONS.map((value) => (
                <button
                  key={value}
                  onClick={() => setDuration(value)}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm ${duration === value ? "bg-emerald-500 text-black" : "border border-white/10 text-white/65 hover:text-white"}`}
                >
                  {value}s
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">Aspect Ratio</p>
            <div className="mt-3 flex gap-2">
              {ASPECT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setAspectRatio(option.key)}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm ${
                    aspectRatio === option.key
                      ? "bg-emerald-500 text-black"
                      : "border border-white/10 text-white/65 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => void generate()}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-medium text-black disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            {loading ? "Generating video brief..." : "Generate Video Brief"}
          </button>

          <button
            onClick={() => void exportVideo()}
            disabled={exporting || !brief}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? "Rendering .webm..." : "Download Video (.webm)"}
          </button>

          <button
            onClick={downloadCaptions}
            disabled={!brief}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            <FileText className="w-4 h-4" />
            Download Captions (.srt)
          </button>

          <button
            onClick={downloadStoryboard}
            disabled={!brief}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            <FileJson className="w-4 h-4" />
            Download Storyboard (.json)
          </button>

          {exportError && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">
              {exportError}
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
            Output is browser-native today: animated scene preview, script, captions, source list, aspect-ratio presets, and downloadable `.webm` export. Full MP4 rendering can be layered in next without changing the brief schema.
          </div>
        </div>

        <div className="space-y-6">
          {loading && (
            <div className="space-y-4">
              <div className="shimmer h-[360px] rounded-3xl" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map((item) => <div key={item} className="shimmer h-28 rounded-2xl" />)}
              </div>
            </div>
          )}

          {!loading && brief && activeScene && (
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
              <motion.div variants={staggerItem} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/40">Scene Timeline</p>
                    <p className="mt-1 text-sm text-white/60">
                      Scene {sceneIndex + 1} of {brief.scenes.length}
                    </p>
                  </div>
                  <p className="text-xs text-white/45">
                    {aspectMeta.label} · {duration}s total
                  </p>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${((sceneIndex + 1) / brief.scenes.length) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {brief.scenes.map((scene, index) => (
                    <button
                      key={`timeline-${scene.id}`}
                      onClick={() => setSceneIndex(index)}
                    className={`rounded-xl border px-3 py-2 text-left text-xs ${
                        sceneIndex === index
                          ? "border-emerald-400/25 bg-emerald-500/10 text-white"
                          : "border-white/10 bg-white/5 text-white/55 hover:text-white"
                      }`}
                    >
                      <span className="block">{scene.headline}</span>
                      <span className="mt-1 block text-[10px] text-white/45">
                        {formatTimestamp(timelineMoments[index]?.start ?? 0)} - {formatTimestamp(timelineMoments[index]?.end ?? 0)}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div
                ref={previewRef}
                variants={staggerItem}
                className={`relative overflow-hidden rounded-[28px] border bg-gradient-to-br ${accentClasses(activeScene.visualAccent)} p-6 md:p-8 ${aspectMeta.className} w-full min-h-[360px]`}
              >
                <div className="absolute right-5 top-5 flex items-center gap-2">
                  {brief.fallbackUsed && <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-200">Fallback</span>}
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] text-white/70">{duration}s</span>
                </div>

                <div className="max-w-3xl">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">{brief.title}</p>
                  <h2 className="mt-3 text-3xl md:text-5xl font-heading italic text-white leading-[0.95]">{activeScene.headline}</h2>
                  <p className="mt-4 max-w-2xl text-base md:text-lg text-white/75">{activeScene.bullet}</p>
                  <p className="mt-3 max-w-2xl text-sm text-white/55">{activeScene.visualCue}</p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {activeScene.dataPoints.map((point) => (
                      <span key={point} className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/75">
                        {point}
                      </span>
                    ))}
                  </div>
                </div>

                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Voiceover</p>
                    <p className="mt-2 max-w-2xl text-sm text-white/80">{activeScene.voiceover}</p>
                    <p className="mt-2 text-[11px] text-white/45">
                      Runtime {sceneDurations[sceneIndex] ?? activeScene.durationSeconds}s · Source {activeScene.sourceLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 no-print">
                    <button
                      onClick={() => setSceneIndex((current) => (current === 0 ? brief.scenes.length - 1 : current - 1))}
                      className="rounded-full border border-white/10 bg-black/30 p-3 text-white/75 hover:text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsPlaying((current) => !current)} className="rounded-full border border-white/10 bg-black/30 px-4 py-3 text-white/75 hover:text-white inline-flex items-center gap-2">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      <span className="text-xs">{isPlaying ? "Pause" : "Resume"}</span>
                    </button>
                    <button onClick={speakScene} className="rounded-full border border-white/10 bg-black/30 p-3 text-white/75 hover:text-white">
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSceneIndex((current) => (current + 1) % brief.scenes.length)}
                      className="rounded-full border border-white/10 bg-black/30 p-3 text-white/75 hover:text-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="absolute left-6 right-6 bottom-24 md:bottom-20">
                  <div className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-center text-sm text-white/90 shadow-2xl">
                    {subtitleText}
                  </div>
                </div>
              </motion.div>

              <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {brief.scenes.map((scene, index) => (
                  <button
                    key={scene.id}
                    onClick={() => setSceneIndex(index)}
                    className={`rounded-2xl border p-4 text-left ${sceneIndex === index ? "border-emerald-400/25 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                  >
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">Scene {index + 1}</p>
                    <p className="mt-2 text-sm text-white">{scene.headline}</p>
                    <p className="mt-2 text-xs text-white/50">
                      {formatTimestamp(timelineMoments[index]?.start ?? 0)} - {formatTimestamp(timelineMoments[index]?.end ?? 0)}
                    </p>
                    <p className="mt-1 text-xs text-white/40">{scene.sourceLabel}</p>
                  </button>
                ))}
              </motion.div>

              <motion.div variants={staggerItem} className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                <div className="liquid-glass rounded-2xl border border-white/10 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">Script</p>
                      <p className="mt-1 text-sm text-white/60">Auto-generated narration for the short video</p>
                    </div>
                    <button onClick={() => void copyScript()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:text-white">
                      <Copy className="w-4 h-4" />
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75 leading-relaxed">
                    {scriptText}
                  </div>
                </div>

                <div className="liquid-glass rounded-2xl border border-white/10 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">Sources</p>
                  <div className="mt-4 space-y-2">
                    {brief.sources.map((source) => (
                      <div key={`${source.label}-${source.url ?? "local"}`} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
                        {source.url ? (
                          <a href={source.url} target="_blank" rel="noreferrer" className="hover:text-emerald-300">
                            {source.label}
                          </a>
                        ) : (
                          source.label
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4 text-sm text-white/65">
                    {brief.cta}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
