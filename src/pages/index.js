import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Translate, {translate} from '@docusaurus/Translate';
import Clip from '@site/src/components/Clip';
import {HUB_URL} from '@site/src/lib/hub.mjs';
import styles from './index.module.css';

const CARDS = [
  {
    to: '/docs/hub-guide',
    title: translate({id: 'home.card.hub.title', message: 'Hub guide'}),
    text: translate({id: 'home.card.hub.text', message: 'Upload, view, measure, analyse and share your drone data in the browser. One page for each task.'}),
  },
  {
    to: '/docs/self-hosting',
    title: translate({id: 'home.card.selfhost.title', message: 'Self-hosting'}),
    text: translate({id: 'home.card.selfhost.text', message: 'Run your own Registry and Hub: install, configure, secure and upgrade it.'}),
  },
  {
    to: '/docs/developers',
    title: translate({id: 'home.card.dev.title', message: 'Developers'}),
    text: translate({id: 'home.card.dev.text', message: 'The ddb command-line tool, the DroneDB library, and the REST, STAC and OGC APIs.'}),
  },
];

export default function Home() {
  return (
    <Layout
      title={translate({id: 'home.title', message: 'DroneDB documentation'})}
      description={translate({id: 'home.description', message: 'Store, view, measure and share drone data in your browser with DroneDB Hub.'})}>
      <header className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroText}>
            <h1>
              <Translate id="home.hero.title">Your drone data, in the browser</Translate>
            </h1>
            <p className={styles.lead}>
              <Translate id="home.hero.lead">
                DroneDB Hub stores orthophotos, point clouds, 3D models, Gaussian splats and images, shows them on a map or in 3D, and shares them with a link.
              </Translate>
            </p>
            <div className={styles.buttons}>
              <Link className="button button--primary button--lg" to="/docs/get-started/tour">
                <Translate id="home.hero.tour">Take the 5-minute tour</Translate>
              </Link>
              <a className="button button--secondary button--lg" href={HUB_URL} target="_blank" rel="noopener noreferrer">
                <Translate id="home.hero.open">Open Hub</Translate> ↗
              </a>
            </div>
          </div>
          <div className={styles.heroMedia}>
            <Clip id="get-started/tour--overview" />
          </div>
        </div>
      </header>
      <main className="container margin-vert--xl">
        <div className="row">
          {CARDS.map(c => (
            <div key={c.to} className="col col--4 margin-bottom--lg">
              <Link to={c.to} className={styles.card}>
                <h2>{c.title}</h2>
                <p>{c.text}</p>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}
