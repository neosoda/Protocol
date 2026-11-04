import type { Category, Lang, Text } from './model.ts';

const fr = {
  skip: 'Aller au contenu',
  brand: 'Network Observatory',
  brandTag: 'Les protocoles d’Internet, paquet par paquet',
  progress: 'Progression',
  lessons: 'Leçons',
  openLessons: 'Toutes les leçons',
  close: 'Fermer',
  theme: 'Changer de thème',
  language: 'Langue',
  level1: 'Débutant', level2: 'Intermédiaire', level3: 'Avancé',
  viewNetwork: 'Réseau', viewSequence: 'Séquence', viewBoth: 'Les deux',
  views: 'Vue',
  play: 'Lecture', pause: 'Pause', next: 'Étape suivante', previous: 'Étape précédente', restart: 'Recommencer',
  speed: 'Vitesse',
  timeline: 'Chronologie',
  step: 'Étape',
  of: 'sur',
  inspector: 'Inspecteur de paquet',
  layers: 'Couches',
  bytes: 'Octets',
  bytesHint: 'Survolez un champ ou un octet pour faire le lien entre les deux.',
  offset: 'Position',
  length: 'Taille',
  encrypted: 'Chiffré : seuls l’émetteur et le destinataire peuvent lire ces octets.',
  lost: 'Perdu en route',
  sentBy: 'De',
  sentTo: 'à',
  observed: 'Paquet tel qu’il circule sur le premier lien emprunté. Adresses de documentation, valeurs reconstituées octet par octet.',
  shortcuts: 'Espace : lecture · ← → : étapes · 1 2 3 : vues',
  done: 'Terminé',
  start: 'Commencer',
  footer: 'Network Observatory · scénarios pédagogiques modélisés, pas des captures réelles.',
  cat_foundations: 'Fondations', cat_services: 'Services réseau', cat_web: 'Web et sécurité',
  cat_mail: 'Messagerie', cat_remote: 'Accès distant et fichiers'
};
type Key = keyof typeof fr;
const en: Record<Key, string> = {
  skip: 'Skip to content',
  brand: 'Network Observatory',
  brandTag: 'Internet protocols, packet by packet',
  progress: 'Progress',
  lessons: 'Lessons',
  openLessons: 'All lessons',
  close: 'Close',
  theme: 'Switch theme',
  language: 'Language',
  level1: 'Beginner', level2: 'Intermediate', level3: 'Advanced',
  viewNetwork: 'Network', viewSequence: 'Sequence', viewBoth: 'Both',
  views: 'View',
  play: 'Play', pause: 'Pause', next: 'Next step', previous: 'Previous step', restart: 'Start over',
  speed: 'Speed',
  timeline: 'Timeline',
  step: 'Step',
  of: 'of',
  inspector: 'Packet inspector',
  layers: 'Layers',
  bytes: 'Bytes',
  bytesHint: 'Hover a field or a byte to link the two.',
  offset: 'Offset',
  length: 'Size',
  encrypted: 'Encrypted: only the sender and the recipient can read these bytes.',
  lost: 'Lost on the way',
  sentBy: 'From',
  sentTo: 'to',
  observed: 'The packet as it travels on the first link it takes. Documentation addresses, values rebuilt byte by byte.',
  shortcuts: 'Space: play · ← →: steps · 1 2 3: views',
  done: 'Done',
  start: 'Start',
  footer: 'Network Observatory · modelled teaching scenarios, not real captures.',
  cat_foundations: 'Foundations', cat_services: 'Network services', cat_web: 'Web and security',
  cat_mail: 'Email', cat_remote: 'Remote access and files'
};
const dictionaries: Record<Lang, Record<Key, string>> = { fr, en };

let current: Lang = 'fr';
export const setLang = (lang: Lang): void => { current = lang; };
export const lang = (): Lang => current;
export const t = (key: Key): string => dictionaries[current][key];
export const tx = (text: Text | string): string => typeof text === 'string' ? text : text[current];
export const category = (c: Category): string => t(`cat_${c}`);
export const keys = Object.keys(fr) as Key[];
export { dictionaries };
