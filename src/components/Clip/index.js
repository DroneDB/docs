import React, {useState} from 'react';
import media from '@site/src/data/media.json';
import MediaPending from '@site/src/components/MediaPending';
import {useMediaSrc} from '@site/src/components/Screenshot';
import styles from './styles.module.css';

// A silent screen recording hosted on YouTube. The page shows the committed poster and
// loads nothing from YouTube until the reader clicks play (speed and privacy).
export default function Clip({id, caption}) {
  const poster = useMediaSrc(id);
  const [playing, setPlaying] = useState(false);
  const m = media[id];
  if (!m) return <MediaPending kind="Clip" id={id} caption={caption} />;
  const label = caption || m.alt || 'Video';
  const youtubeId = m.youtubeId;
  if (!youtubeId && typeof window === 'undefined') {
    // eslint-disable-next-line no-console
    console.warn(`[media] Clip "${id}" has a poster but no youtubeId yet`);
  }
  const src = youtubeId &&
    `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&rel=0&playsinline=1`;

  return (
    <figure className={styles.figure}>
      <div className={styles.frame} style={{aspectRatio: `${m.width} / ${m.height}`}}>
        {playing && src ? (
          <iframe
            className={styles.iframe}
            src={src}
            title={label}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <img className={styles.poster} src={poster} alt={label} loading="lazy" decoding="async" />
            {src && (
              <button type="button" className={styles.play} onClick={() => setPlaying(true)} aria-label={`Play video: ${label}`}>
                <svg viewBox="0 0 68 48" width="68" height="48" aria-hidden="true">
                  <path d="M66.5 7.7a8.5 8.5 0 0 0-6-6C55.2.3 34 .3 34 .3s-21.2 0-26.5 1.4a8.5 8.5 0 0 0-6 6C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.5 8.5 0 0 0 6 6c5.3 1.4 26.5 1.4 26.5 1.4s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3z" fill="#212121" fillOpacity="0.8" />
                  <path d="M45 24 27 14v20" fill="#fff" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
