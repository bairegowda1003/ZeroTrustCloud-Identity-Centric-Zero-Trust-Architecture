import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Pause, Play } from 'lucide-react';
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
      <h1 id="launch-title">
        <span>Trust is not</span>{' '}
        <span><span className="launch-assumption">assumed
          <svg className="launch-brush" viewBox="0 0 420 46" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path fillRule="evenodd" d="M1 36Q21 31 64 27L50 27Q105 18 149 17L141 16Q177 12 208 13Q267 8 312 8L302 7Q345 5 388 6L378 7L418 7L398 9L415 9Q383 12 349 12L361 13Q280 14 215 22L224 20Q149 25 95 30L107 28Q60 34 20 36L36 33Z M45 31Q82 24 118 22Q78 27 45 31Z M251 14Q291 10 329 10Q291 12 251 14Z"/>
            <path opacity=".82" d="M12 39Q107 27 181 22L162 25Q95 32 12 39ZM236 11Q306 5 377 3L351 5Z"/>
            <path opacity=".65" d="M85 33Q167 24 248 19L234 21Q142 29 85 33ZM328 12L413 7L389 10Z"/>
          </svg></span>.</span>{' '}
        <span className="launch-verified">It's verified.</span>
      </h1>
      <div className="launch-invitation">
        <p className="launch-description">Identity-centric Zero Trust architecture for cloud-native environments.</p>
        <button type="button" className="launch-enter" onClick={onEnter} disabled={leaving}>
          <span className="portal-lens" aria-hidden="true"><ArrowRight size={27} strokeWidth={1.5}/></span>
          <span>Enter TrustMesh</span>
        </button>
      </div>
      <footer className="launch-footer">
        <small>Kubernetes · Identity · Policy · Verification</small>
        {!reduced && !failed && <button type="button" className="launch-motion" disabled={leaving}
          onClick={() => setPaused(value => !value)} aria-label={paused ? 'Resume background motion' : 'Pause background motion'}>
          {paused ? <Play size={14}/> : <Pause size={14}/>}
        </button>}
      </footer>
    </div>
  </main>;
}
