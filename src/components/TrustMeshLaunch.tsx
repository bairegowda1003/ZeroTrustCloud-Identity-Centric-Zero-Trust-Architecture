import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { TrustMeshMark } from './TrustMeshMark';
import '../styles/launch.css';

const poster = '/launch/trustmesh-launch-poster.webp';
const movie = '/launch/trustmesh-launch.mp4';
const motionQuery = '(prefers-reduced-motion: reduce)';

export function TrustMeshLaunch({ leaving, onEnter }: { leaving: boolean; onEnter: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(() => matchMedia(motionQuery).matches);
  const [visible, setVisible] = useState(() => !document.hidden);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const play = !paused && visible && !leaving;

  useEffect(() => {
    const media = matchMedia(motionQuery);
    const motion = () => { setReduced(media.matches); setHasFrame(false); };
    const visibility = () => setVisible(!document.hidden);
    media.addEventListener('change', motion);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      media.removeEventListener('change', motion);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    element.src = movie;
    return () => {
      element.pause();
      element.removeAttribute('src');
      element.load();
    };
  }, [reduced, failed]);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let active = true;
    if (play) element.play().catch(() => { if (active) setPaused(true); });
    else element.pause();
    return () => { active = false; };
  }, [play, reduced, failed]);

  return <main className="tm-launch" data-leaving={leaving} aria-hidden={leaving || undefined}
    aria-labelledby="launch-title">
    <div className="launch-film" aria-hidden="true">
      <img src={poster} alt=""/>
      {!reduced && !failed && <video ref={video} poster={poster} autoPlay={play} muted loop playsInline
        preload="metadata" disablePictureInPicture tabIndex={-1} data-ready={hasFrame}
        onPlaying={() => setHasFrame(true)} onError={() => setFailed(true)}/>}
    </div>
    <div className="launch-stage">
      <div className="launch-brand"><TrustMeshMark size={54}/><div><strong>TrustMesh</strong><small>ZeroTrustCloud</small></div></div>
      <div className="launch-hero">
        <h1 id="launch-title">
          <span className="launch-line-lead">Trust is not</span>{' '}
          <span className="launch-line-break"><span className="launch-assumption">assumed
            <svg className="launch-brush" viewBox="0 0 440 58" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id="launch-brush-pigment" x1="0%" y1="68%" x2="100%" y2="28%">
                  <stop offset="0%" stopColor="#f9e06b" />
                  <stop offset="45%" stopColor="#f4d03f" />
                  <stop offset="100%" stopColor="#e7be2c" />
                </linearGradient>
                <linearGradient id="launch-brush-satin" x1="10%" y1="50%" x2="90%" y2="50%">
                  <stop offset="0%" stopColor="#fff3b0" stopOpacity="0" />
                  <stop offset="35%" stopColor="#fff3b0" stopOpacity="0.45" />
                  <stop offset="72%" stopColor="#fae588" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#fae588" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Solid expressive handcrafted brushstroke with tapered entry, organic swell & feathered dry-brush exit */}
              <path
                className="launch-brush-core"
                opacity="0.94"
                d="M4 42 C14 39 26 35 42 33 C98 26 160 21 226 17 C286 13 344 10 396 11 C414 11 426 13 436 15 C422 16 411 16 401 17 C412 18 422 19 428 21 C410 22 388 22 368 23 C312 25 250 29 186 34 C128 38 78 43 38 46 C26 47 15 47 5 44 C14 43 22 42 30 41 C19 42 11 42 4 42 Z"
              />
              {/* Fine wet-pigment light crest across the upper brush ridge */}
              <path
                className="launch-brush-satin"
                d="M46 35 C108 28 178 23 246 19 C300 15 348 13 388 14 C344 17 288 20 228 24 C164 29 102 33 46 35 Z"
              />
              {/* Organic stray dry-bristle wisps along outer entry, lower shoulder & velocity exit */}
              <path
                className="launch-brush-dry"
                opacity="0.65"
                d="M2 39 C18 35 36 31 58 29 C38 33 18 37 2 39 Z M18 48 C46 45 78 42 110 39 C80 44 48 47 18 48 Z M354 9 C378 8 402 8 423 10 C400 11 376 11 354 9 Z M384 24 C404 23 422 23 435 25 C418 26 400 26 384 24 Z"
              />
            </svg></span>.</span>{' '}
          <span className="launch-verified">It's verified.</span>
        </h1>
        <p className="launch-description">Identity-centric Zero Trust architecture for cloud-native environments.</p>
      </div>
      <div className="launch-invitation">
        <button type="button" className="launch-enter" onClick={onEnter} disabled={leaving}>
          <span className="portal-lens" aria-hidden="true">
            <span className="portal-lens-glint" />
            <svg className="portal-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4.5 12h14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M13.5 6.75 18.75 12l-5.25 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="launch-enter-label">Enter TrustMesh</span>
        </button>
      </div>
      <footer className="launch-footer">
        <small>Kubernetes · Identity · Policy · Verification</small>
        {!reduced && !failed && <button type="button" className="launch-motion" disabled={leaving}
          onClick={() => setPaused(value => !value)} aria-label={paused ? 'Resume background motion' : 'Pause background motion'}>
          <span className="launch-motion-glass" aria-hidden="true">
            {paused ? <Play size={13} strokeWidth={1.75} className="launch-motion-play"/> : <Pause size={13} strokeWidth={1.75}/>}
          </span>
        </button>}
      </footer>
    </div>
  </main>;
}
