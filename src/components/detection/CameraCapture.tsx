import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Check, Loader2, RefreshCcw, SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

type Phase = 'starting' | 'live' | 'captured' | 'error';

function describeCameraError(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera access was blocked. Allow camera permission for this site in your browser settings, then try again.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No camera was found on this device. You can upload an image instead.';
    case 'NotReadableError':
    case 'AbortError':
      return 'The camera is in use by another application or could not be started. Close other apps using it and try again.';
    default:
      return 'The camera could not be started. You can upload an image instead.';
  }
}

export function CameraCapture({ open, onClose, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>('starting');
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [canSwitch, setCanSwitch] = useState(false);
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const clearShot = useCallback(() => {
    setShot((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  }, []);

  const startStream = useCallback(
    async (mode: 'environment' | 'user') => {
      stopStream();
      setPhase('starting');
      setError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          window.isSecureContext
            ? 'This browser does not support camera capture. You can upload an image instead.'
            : 'Camera capture needs a secure connection (HTTPS or localhost). You can upload an image instead.',
        );
        setPhase('error');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 960 } },
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        setPhase('live');
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          setCanSwitch(devices.filter((device) => device.kind === 'videoinput').length > 1);
        } catch {
          setCanSwitch(false);
        }
      } catch (cause) {
        stopStream();
        setError(describeCameraError(cause));
        setPhase('error');
      }
    },
    [stopStream],
  );

  useEffect(() => {
    if (!open) return;
    void startStream(facingMode);
    return () => {
      stopStream();
      clearShot();
    };
    // Restart only when the dialog opens or the user switches camera.
  }, [open, facingMode]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      setError('The camera is not ready yet. Please wait a moment and try again.');
      setPhase('error');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('The photo could not be captured. Please try again.');
          setPhase('error');
          return;
        }
        setShot({ blob, url: URL.createObjectURL(blob) });
        setPhase('captured');
        stopStream();
      },
      'image/jpeg',
      0.92,
    );
  };

  const retake = () => {
    clearShot();
    void startStream(facingMode);
  };

  const confirmPhoto = () => {
    if (!shot) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    onCapture(new File([shot.blob], `camera-capture-${stamp}.jpg`, { type: 'image/jpeg' }));
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Capture a potato leaf"
      description="Fill the frame with a single leaf in even light, then take the photo."
      size="lg"
      footer={
        phase === 'captured' ? (
          <>
            <Button variant="outline" onClick={retake} icon={<RefreshCcw className="h-4 w-4" />}>
              Retake
            </Button>
            <Button onClick={confirmPhoto} icon={<Check className="h-4 w-4" />}>
              Use Photo
            </Button>
          </>
        ) : phase === 'error' ? (
          <>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => void startStream(facingMode)} icon={<RefreshCcw className="h-4 w-4" />}>
              Try Again
            </Button>
          </>
        ) : (
          <>
            {canSwitch && (
              <Button
                variant="outline"
                onClick={() => setFacingMode((mode) => (mode === 'environment' ? 'user' : 'environment'))}
                disabled={phase !== 'live'}
                icon={<SwitchCamera className="h-4 w-4" />}
              >
                Switch Camera
              </Button>
            )}
            <Button onClick={capture} disabled={phase !== 'live'} icon={<Camera className="h-4 w-4" />}>
              Capture Photo
            </Button>
          </>
        )
      }
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-forest">
        <video
          ref={videoRef}
          playsInline
          muted
          className={phase === 'live' || phase === 'starting' ? 'h-full w-full object-cover' : 'hidden'}
        />
        {phase === 'captured' && shot && <img src={shot.url} alt="Captured photo preview" className="h-full w-full object-cover" />}
        {phase === 'live' && (
          <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-dashed border-white/50" aria-hidden />
        )}
        {phase === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80" role="status">
            <Loader2 className="h-7 w-7 animate-spin" />
            <p className="text-sm font-medium">Starting camera…</p>
          </div>
        )}
        {phase === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-white" role="alert">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <CameraOff className="h-7 w-7" aria-hidden />
            </span>
            <p className="max-w-sm text-sm leading-relaxed text-white/85">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
