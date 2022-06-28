import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Validate',
    Svg: require('@site/static/img/validate-data.svg').default,
    description: (
      <>
        Use <a href="#">DroneDB Desktop</a> to validate, sort and manage aerial data after a flight.
      </>
    ),
  },
  {
    title: 'Share',
    Svg: require('@site/static/img/share-data.svg').default,
    description: (
      <>
        Put your flight images, processed results and any other supporting file on <a href="https://hub.dronedb.app">DroneDB Hub</a>, where others can access it.
      </>
    ),
  }
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--6')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
