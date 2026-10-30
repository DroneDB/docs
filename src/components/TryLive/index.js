import React from 'react';
import {hubUrl} from '@site/src/lib/hub.mjs';
import styles from './styles.module.css';

// "Try it live" button: opens a public showcase dataset on DroneDB Hub.
export default function TryLive({org, ds, path, view, hint, label = 'Try it live on Hub'}) {
  const href = hubUrl({org, ds, path, view});
  return (
    <div className={styles.box}>
      <a className={`button button--primary ${styles.button}`} href={href} target="_blank" rel="noopener noreferrer">
        {label} <span aria-hidden="true">↗</span>
      </a>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
