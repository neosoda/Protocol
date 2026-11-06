# Contrat embarqué Campus × Network Observatory (v1)

L'application autonome reste inchangée à `/#/http`. Le mode intégré s'active **uniquement dans un iframe** avec `/?embed=1&scenario=http&theme=light&lang=fr&parentOrigin=<origin encodée>`.

- `scenario` : ID réel parmi les 14 scénarios ; sans ID valide, le scénario de repli est TCP.
- `theme` : `light` ou `dark` ; `lang` : `fr` ou `en`.
- `parentOrigin` : origine exacte du parent. Si le navigateur fournit un `Referer`, son origine doit être identique. Aucune communication en `*`.
- Les routes `#/` restent exclusivement celles de l'application autonome. Le mode embarqué ne modifie pas le hash.
- Le moteur Player, les trames, inspecteurs, dessins SVG et données des 14 scénarios ne sont pas modifiés.

## Messages

Du laboratoire vers son parent (`source: 'network-observatory', version: 1, scenarioId`) :
- `{type:'ready', totalSteps}`
- `{type:'progress', step, currentStep, totalSteps, complete}`. `step` = nombre **d'étapes distinctes réellement consultées** ; sauter à la dernière étape ne termine pas la simulation.

Du parent vers le laboratoire (`source: 'sentinel-campus', version: 1, scenarioId`) :
- `{type:'hello'}` demande à nouveau `ready` après le chargement de l'iframe ; `{type:'restore', visited:[1, 2, ...]}` restaure les étapes consultées sans attribuer de nouvelle progression.
- `{type:'pause'}`, `{type:'play'}`, `{type:'restart'}`
- `{type:'theme', value:'light'|'dark'}`
- `{type:'lang', value:'fr'|'en'}`

Les messages entrants ne sont acceptés que depuis `window.parent` avec l'origine exacte attendue, l'identifiant du scénario et la version 1. La progression pédagogique évaluée reste la responsabilité de Campus. Le laboratoire conserve sa propre progression autonome.

## Déploiement Coolify

Le service Protocol reste déployé indépendamment sur son domaine HTTPS. Dans Campus, définir `VITE_PROTOCOL_EMBED_BASE_URL` **avant le build Docker** vers ce domaine (par exemple une URL interne de démonstration : `https://protocol.exemple.fr/`, à remplacer). La politique CSP de Campus doit autoriser ce domaine dans `frame-src`, et tout proxy en amont de Protocol doit permettre l'intégration (pas de `X-Frame-Options: DENY` ni de `frame-ancestors` incompatible). Aucun CDN ou service tiers n'est requis.

## Vérifications

Dans `app/` : `npm ci && npm run typecheck && npm test && npm run build && npm run test:e2e`. Les tests E2E requièrent les navigateurs Playwright. Les changements ci-dessus ne valent pas preuve de validation de ces commandes.
