# Cours — Le routage dynamique : RIP, OSPF et BGP

> Module Network Observatory · 3 simulations bilingues FR/EN · pédagogie fondée sur les paquets (et non sur de simples flèches décoratives).

## Objectifs

À la fin de ces laboratoires, l’apprenant doit pouvoir distinguer **routage statique / dynamique**, **IGP / EGP**, **vecteur de distance / état de liens / vecteur de chemin**, lire les annonces et expliquer une convergence. Les animations sont des **modèles**, pas des captures réseau en production.

### Topologie commune

```text
    R1 ─────── R2 ─────── R3
  10.0.12.1  10.0.12.2    10.0.23.1
             10.0.23.2

  Lien R1–R2 : 10.0.12.0/30
  Lien R2–R3 : 10.0.23.0/30
  Réseau derrière R3 : 10.10.30.0/24 (OSPF/RIP)
```

R1, R2 et R3 sont **des routeurs réels dans le modèle**, pas un « cœur de réseau » ajouté artificiellement. Le dessin ne représente pas les postes terminaux de 10.10.30.0/24 : la leçon porte sur l’échange entre routeurs et l’acheminement vers R3. Les adresses 10.0.0.1/2/3 servent d’identifiants OSPF ; les interfaces de R2 ont volontairement deux IP distinctes. La topologie représente les *adjacences pédagogiques* et non une carte opérateur exhaustive.

## 1. RIP version 2 — comprendre le vecteur de distance

**Niveau : débutant.** RIP est un IGP à vecteur de distance. Chaque routeur annonce à ses voisins « je connais ce préfixe, il est à N sauts ». RIPv2 fonctionne sur **UDP 520**, diffuse ses mises à jour périodiques vers **224.0.0.9** (multicast local) et transporte les masques IPv4. Sa seule métrique native est le **nombre de sauts** : **16 = infini / inaccessible**.

Dans l’animation, R3 annonce le réseau `10.10.30.0/24` à la métrique **1**. R2 le reçoit, augmente la distance et transmet la métrique **2** à R1. R1 peut alors faire transiter des paquets par R2 vers R3. Une panne du réseau local de R3 déclenche ensuite une annonce **métrique 16** ; R2 propage le retrait à R1.

Ce qu’il faut inspecter dans les octets : `Command` (Request = 1, Response = 2), `Version` (2), `Address Family` (2 pour IPv4), `IP Address`, `Subnet Mask`, `Next Hop`, `Metric`.

**À retenir :** RIP est simple mais peu adapté aux grandes topologies. *Split horizon*, *poison reverse* et *triggered updates* réduisent certaines boucles et accélèrent des changements, sans supprimer le problème de convergence. Une annonce à 16 ne veut **pas** dire qu’un routeur ou toute l’infrastructure est tombé : c’est le préfixe concerné qui est déclaré inaccessible.

**Exercice :** si R4 apprend de R1 cette route à la métrique 3, peut-il atteindre le préfixe ? Oui. Et si la métrique annoncée devient 16 ? Non, elle est considérée inaccessible.

## 2. OSPFv2 — voir et calculer la topologie

**Niveau : intermédiaire.** OSPF est un IGP à **état de liens**. Il s’exécute directement sur **IPv4, numéro de protocole 89** (aucun port UDP/TCP). Sur nos liens point-à-point, les Hello à **224.0.0.5 / TTL 1** détectent les voisins. Les routeurs synchronisent leur **LSDB** (Link State Database), diffusent des **LSA** et appliquent l’algorithme **SPF / Dijkstra**.

Les étapes animées suivent la réalité conceptuelle :

1. **Hello** : R2 découvre R3 ; R3 cite R2, puis R2 cite R3. La découverte devient bidirectionnelle (**2-Way**).
2. **Database Description** : R3 annonce l’en-tête de sa Router-LSA. R2 détecte l’information qui lui manque.
3. **Link State Request** : R2 demande cette LSA.
4. **Link State Update** : R3 fournit sa Router-LSA, qui décrit le réseau terminal `10.10.30.0/24` avec un **coût 10**.
5. **Link State Acknowledgment** : R2 confirme la bonne réception.
6. **Flooding** : R2 relaie cette LSA à R1, supposé déjà adjacent. L’auteur reste R3.
7. **SPF** : R1 peut acheminer le trafic via R2 vers R3. En présence de chemins alternatifs, les coûts cumulés déterminent le plus court chemin au sens OSPF.

Ce qu’il faut inspecter : `Router ID`, `Area ID`, `Packet Type`, `Hello Interval`, `Neighbor Router ID`, `LS Sequence`, `LS Checksum`, `Link Type`, `Cost`. Le **checksum OSPF** est distinct du checksum **Fletcher** de la LSA.

**À retenir :** la *zone 0* est l’aire backbone d’OSPF, **pas** une obligation d’ajouter dans chaque dessin un équipement nommé « cœur de réseau ». OSPF ne mesure pas sa route au nombre de sauts ; il choisit le coût cumulé minimal parmi les chemins connus.

**Exercice :** R1 peut joindre un préfixe par un chemin coût 30 et un autre coût 20, les deux autorisés. Lequel est favorisé ? Le coût **20**, indépendamment du nombre brut de routeurs intermédiaires.

## 3. BGP-4 — choisir des chemins entre AS

**Niveau : avancé.** BGP est un protocole de routage **inter-AS** (*path vector*), fondamental pour Internet. Il transporte ses messages sur **TCP 179**, pas en multicast. Contrairement à RIP ou OSPF, le choix ne repose pas uniquement sur un coût de topologie : les **politiques locales**, les attributs et les préférences influencent le résultat.

La simulation distingue trois systèmes autonomes de laboratoire : **AS 65001 (R1), AS 65002 (R2), AS 65003 (R3)**. La session R1–R2 est montrée depuis le début. La session R2–R3 est supposée déjà établie.

1. **TCP SYN → SYN-ACK → ACK** : connexion au port 179.
2. **OPEN (deux sens)** : version 4, numéro d’AS, `Hold Time`, `BGP Identifier`. Pas de capacité optionnelle dans cette simplification.
3. **KEEPALIVE (deux sens)** : confirmation de session, état **Established**.
4. **UPDATE** de R1 à R2 : `203.0.113.0/24`, `ORIGIN IGP`, `AS_PATH [65001]`, `NEXT_HOP 10.0.12.1`.
5. **UPDATE** de R2 à R3 (si sa politique l’autorise) : `AS_PATH [65002, 65001]`, `NEXT_HOP 10.0.23.2`.
6. **WITHDRAW** : R1 retire le préfixe, R2 propage le retrait à R3, sauf s’il dispose d’un chemin alternatif admissible.

Les AS 65001–65003 sont des numéros privés ; `203.0.113.0/24` est une plage de documentation. La version pédagogique utilise les numéros d’AS **sur deux octets**, sans négociation de capacités 4-octets, pour conserver une structure de message lisible.

Ce qu’il faut inspecter : les **16 octets de Marker**, `Length`, `Type` (OPEN = 1, UPDATE = 2, KEEPALIVE = 4), `My AS`, `AS_PATH`, `NEXT_HOP`, `NLRI`, `Withdrawn Routes Length`.

**À retenir :** BGP n’équivaut ni à « la route la plus courte » ni à une carte animée de tous les routeurs d’Internet. Un AS peut refuser, filtrer ou modifier une annonce selon sa politique. Un AS retrouvé dans son propre `AS_PATH` signale une boucle à éviter.

**Exercice :** R3 (AS 65003) reçoit `AS_PATH [65002, 65001]`. Si R3 le réannonce à un quatrième AS, quelle tête d’AS_PATH est ajoutée ? **65003** (sous réserve de politique et du type de session).

## Comparaison

| | RIPv2 | OSPFv2 | BGP-4 |
|---|---|---|---|
| Usage | IGP, petits réseaux | IGP, réseaux d’entreprise/opérateur | Inter-AS, Internet |
| Principe | Vecteur de distance | État de liens + SPF | Vecteur de chemin + politiques |
| Transport | UDP 520 | Protocole IPv4 89 | TCP 179 |
| Décision illustrative | Sauts (max. 15) | Somme des coûts | Attributs et politiques |
| Diffusion | 224.0.0.9 | 224.0.0.5 sur ces liens | Sessions unicast |
| Événement à tester | Métrique 16 | Nouvelle LSA | Withdrawal |

## Périmètre du simulateur

Chaque événement représente **un paquet réel reconstitué octet par octet**, mais la chronologie peut être volontairement condensée (tous les rafraîchissements périodiques, tous les acquittements TCP et certaines étapes de négociation ne sont pas affichés). Les captures ne constituent pas des preuves de déploiement, de sécurité ni de convergence instantanée.

Les simulations ne calculent pas encore les tables RIB/FIB à partir de paramètres interactifs et ne recalculent pas automatiquement SPF ou le processus de sélection BGP : le scénario **illustre un état déterministe** et ses conséquences. Pour une vraie émulation de plan de contrôle, il faudrait un moteur supplémentaire, distinct du moteur de rendu.

## Références normatives

- [RFC 2453 — RIP Version 2](https://www.rfc-editor.org/rfc/rfc2453)
- [RFC 2328 — OSPF Version 2](https://www.rfc-editor.org/rfc/rfc2328)
- [RFC 4271 — BGP-4](https://www.rfc-editor.org/rfc/rfc4271)
- [RFC 5737 — IPv4 Address Blocks Reserved for Documentation](https://www.rfc-editor.org/rfc/rfc5737)
- [RFC 6996 — Autonomous System (AS) Reservation for Private Use](https://www.rfc-editor.org/rfc/rfc6996)
