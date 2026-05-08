"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, Send, X, Loader2, SwitchCamera } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraModalProps {
  onClose: () => void;
  onSend: (blob: Blob) => Promise<void>;
}

export function CameraModal({ onClose, onSend }: CameraModalProps) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode]     = useState<"user" | "environment">("environment");
  const [captured,   setCaptured]       = useState<string | null>(null); // data URL
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [sending,    setSending]        = useState(false);
  const [error,      setError]          = useState<string>("");
  const [starting,   setStarting]       = useState(true);

  const startCamera = async (mode: "user" | "environment") => {
    setStarting(true);
    setError("");
    // Stop any existing stream first
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError("Could not access camera. Please allow camera permission and try again.");
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flipCamera = async () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    setCaptured(null);
    setCapturedBlob(null);
    await startCamera(next);
  };

  const takePhoto = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCaptured(dataUrl);
    canvas.toBlob(blob => { if (blob) setCapturedBlob(blob); }, "image/jpeg", 0.92);
    // Pause the stream so video freezes (cleaner UX)
    streamRef.current?.getTracks().forEach(t => { t.enabled = false; });
  };

  const retake = () => {
    setCaptured(null);
    setCapturedBlob(null);
    streamRef.current?.getTracks().forEach(t => { t.enabled = true; });
  };

  const handleSend = async () => {
    if (!capturedBlob || sending) return;
    setSending(true);
    try {
      await onSend(capturedBlob);
      onClose();
    } catch {
      setError("Failed to send photo. Please try again.");
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm bg-black rounded-t-3xl sm:rounded-3xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Flip camera */}
        {!captured && (
          <button
            onClick={flipCamera}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <SwitchCamera className="w-4 h-4" />
          </button>
        )}

        {/* Viewfinder */}
        <div className="relative aspect-[3/4] bg-neutral-900 w-full">
          {starting && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
              <p className="text-white text-sm">{error}</p>
            </div>
          )}
          <video
            ref={videoRef}
            playsInline
            muted
            className={cn(
              "w-full h-full object-cover",
              (captured || error) && "hidden"
            )}
          />
          {captured && (
            <img src={captured} alt="captured" className="w-full h-full object-cover" />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-8 py-6 bg-black">
          {!captured ? (
            <button
              onClick={takePhoto}
              disabled={starting || !!error}
              className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-40 transition-opacity hover:opacity-80 active:scale-95"
            >
              <div className="w-11 h-11 rounded-full bg-white" />
            </button>
          ) : (
            <>
              <button
                onClick={retake}
                className="flex flex-col items-center gap-1 text-white"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <span className="text-[10px]">Retake</span>
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex flex-col items-center gap-1 text-white"
              >
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  {sending
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <Send className="w-5 h-5" />
                  }
                </div>
                <span className="text-[10px]">Send</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
