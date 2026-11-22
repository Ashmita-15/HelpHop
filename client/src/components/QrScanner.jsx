import { useCallback, useEffect, useRef, useState } from 'react';

import { Alert, Icon, Spinner } from './ui.jsx';

// ~140KB of QR decoder that most volunteers never open — fetched on demand so
// it stays out of the main bundle.
const loadJsQR = () => import('jsqr').then((m) => m.default);

/**
 * Camera QR scanner for in-app check-in. Calls onResult with the decoded text
 * the first time it reads a code, then stops the camera.
 *
 * The camera is a privilege, not a given: permission can be denied, the device
 * may have no camera, and insecure origins block it outright. Every one of
 * those paths has to leave the volunteer with the typed-code option instead.
 */
export default function QrScanner({ onResult, onError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const doneRef = useRef(false);

  const [status, setStatus] = useState('starting'); // starting | scanning | failed
  const [message, setMessage] = useState('');

  const stop = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fail = (text) => {
      if (cancelled) return;
      setStatus('failed');
      setMessage(text);
      onError?.(text);
    };

    let decode = null;

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || doneRef.current) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (w && h) {
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(video, 0, 0, w, h);
          const { data } = ctx.getImageData(0, 0, w, h);
          const found = decode?.(data, w, h, { inversionAttempts: 'dontInvert' });
          if (found?.data) {
            doneRef.current = true;
            stop();
            onResult(found.data);
            return;
          }
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        // Also what you get on an insecure origin — the API simply isn't there.
        fail('This browser can’t open the camera here. Type the number instead.');
        return;
      }

      try {
        decode = await loadJsQR();
      } catch {
        fail('The scanner didn’t load. Type the number instead.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true'); // iOS won't go fullscreen
        await video.play();

        setStatus('scanning');
        frameRef.current = requestAnimationFrame(tick);
      } catch (err) {
        fail(
          err?.name === 'NotAllowedError'
            ? 'Camera access was blocked. Allow it in your browser, or type the number instead.'
            : 'No camera available here. Type the number instead.'
        );
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [onResult, onError, stop]);

  if (status === 'failed') {
    return <Alert type="warning">{message}</Alert>;
  }

  return (
    <div className="relative overflow-hidden rounded-field border border-bark-200 bg-bark-900">
      <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />

      {/* Framing guide */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-3/5 w-3/5 rounded-field border-2 border-paper/75 shadow-[0_0_0_9999px_rgba(41,34,29,0.4)]" />
      </div>

      <p className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-bark-900/75 py-2.5 text-xs text-paper">
        {status === 'starting' ? (
          <>
            <Spinner className="h-3.5 w-3.5" />
            Starting camera…
          </>
        ) : (
          <>
            <Icon name="qr" className="h-3.5 w-3.5" />
            Point it at the organiser&apos;s QR code
          </>
        )}
      </p>
    </div>
  );
}
