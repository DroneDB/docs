import React from 'react';
import styles from './styles.module.css';

// Placeholder for a screenshot or clip that the capture pipeline has not produced yet.
// The build prints a warning for each one, so a missing shot cannot go unnoticed.
export default function MediaPending({kind, id, caption}) {
  if (typeof window === 'undefined') {
    // eslint-disable-next-line no-console
    console.warn(`[media] ${kind} "${id}" is not captured yet`);
  }
  return (
    <figure className={styles.pending}>
      <div className={styles.box}>
        <span>{kind} pending</span>
        <code>{id}</code>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
