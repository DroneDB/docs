import React from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import Link from '@docusaurus/Link';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import styles from './styles.module.css';

const ACCESS = {
  none: () => translate({id: 'component.requires.none', message: 'No account'}),
  read: () => translate({id: 'component.requires.read', message: 'Read access to the dataset (anyone, for a public dataset)'}),
  write: () => translate({id: 'component.requires.write', message: 'Write access to the dataset'}),
  owner: () => translate({id: 'component.requires.owner', message: 'Owner of the organization'}),
  admin: () => translate({id: 'component.requires.admin', message: 'Registry administrator'}),
};

function useFrontMatterRequires() {
  try {
    return useDoc().frontMatter.requires || {};
  } catch {
    return {};
  }
}

// "Requires:" line of a Hub guide page. Reads the `requires` front matter; props override it.
export default function Requires(props) {
  const {access, node, plan, data} = {...useFrontMatterRequires(), ...props};
  const items = [];
  if (access) {
    if (!ACCESS[access]) throw new Error(`<Requires>: unknown access "${access}"`);
    items.push(ACCESS[access]());
  }
  if (data) items.push(data);
  if (node) items.push(translate({id: 'component.requires.node', message: 'A processing node (on DroneDB Hub: a plan with processing)'}));
  if (plan) {
    items.push(
      <Translate
        id="component.requires.plan"
        values={{plan: <Link to="/docs/hub-guide/account/plans">{translate({id: 'component.requires.planLink', message: 'plan'})}</Link>, what: plan}}>
        {'A {plan} with {what}'}
      </Translate>,
    );
  }
  if (!items.length) return null;
  return (
    <p className={styles.requires}>
      <strong>{translate({id: 'component.requires.label', message: 'Requires:'})}</strong>{' '}
      {items.map((item, i) => <span key={i}>{i > 0 && ' · '}{item}</span>)}
    </p>
  );
}
