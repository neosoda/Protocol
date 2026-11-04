# Références des leçons

Chaque paquet est encodé champ par champ par `app/src/packets/`. Les invariants listés sont vérifiés par `app/tests/packets.test.ts`.

| Leçon | Références | Ce que montre la leçon | Invariants testés |
|---|---|---|---|
| IP | [RFC 791](https://www.rfc-editor.org/rfc/rfc791), [RFC 3022](https://www.rfc-editor.org/rfc/rfc3022) | Routage saut par saut, TTL décrémenté, NAT à la sortie et au retour | Somme de contrôle d’en-tête, longueur totale |
| ICMP | [RFC 792](https://www.rfc-editor.org/rfc/rfc792) | Echo Request/Reply, traceroute par TTL 1 puis 2, Time Exceeded citant le paquet expiré | TTL des sondes, type 11, sommes ICMP |
| UDP | [RFC 768](https://www.rfc-editor.org/rfc/rfc768), [RFC 5905](https://www.rfc-editor.org/rfc/rfc5905) | Requête NTP sans connexion, perte silencieuse, nouvelle tentative de l’application | Longueur et somme UDP (pseudo-en-tête) |
| TCP | [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293) | Poignée de main, données, acquittement cumulatif, perte et retransmission, fermeture FIN | SEQ/ACK de bout en bout, SYN et FIN comptent pour un |
| DHCP | [RFC 2131](https://www.rfc-editor.org/rfc/rfc2131), [RFC 2132](https://www.rfc-editor.org/rfc/rfc2132) | DORA en diffusion, options (bail, masque, routeur, DNS) | xid constant, option 53 = 1, 2, 3, 5 |
| DNS | [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034), [RFC 1035](https://www.rfc-editor.org/rfc/rfc1035) | Résolution itérative racine → .com → serveur faisant autorité, renvois, réponse AA, cache | Identifiant repris, QR, adresse de la réponse |
| HTTP | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), [RFC 9112](https://www.rfc-editor.org/rfc/rfc9112) | Connexion TCP, requête GET, réponse 200 avec en-têtes et corps | Content-Length = taille du corps |
| TLS 1.3 | [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446) | ClientHello (SNI, key_share), ServerHello, messages chiffrés du serveur, Finished, données | Longueur annoncée de chaque enregistrement |
| HTTPS | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446) | Parcours complet TCP + TLS + HTTP chiffré | Idem TLS et TCP |
| SMTP | [RFC 5321](https://www.rfc-editor.org/rfc/rfc5321), [RFC 6409](https://www.rfc-editor.org/rfc/rfc6409) | Bannière, EHLO, enveloppe, DATA, mise en file | Sommes TCP |
| POP3 | [RFC 1939](https://www.rfc-editor.org/rfc/rfc1939) | Authentification en clair, RETR, DELE, QUIT | Sommes TCP |
| IMAP | [RFC 9051](https://www.rfc-editor.org/rfc/rfc9051) | Commandes étiquetées, SELECT, FETCH partiel avec littéral, drapeau \Seen | Sommes TCP |
| SSH | [RFC 4253](https://www.rfc-editor.org/rfc/rfc4253), [RFC 4252](https://www.rfc-editor.org/rfc/rfc4252), [RFC 4254](https://www.rfc-editor.org/rfc/rfc4254), [RFC 8731](https://www.rfc-editor.org/rfc/rfc8731) | Identification, KEXINIT, ECDH Curve25519, NEWKEYS, authentification par clé, canal | Longueur de paquet, alignement sur 8, bourrage ≥ 4 |
| FTP | [RFC 959](https://www.rfc-editor.org/rfc/rfc959), [RFC 2428](https://www.rfc-editor.org/rfc/rfc2428) | Canal de contrôle, EPSV, connexion de données séparée | Sommes TCP |

## Simplifications assumées

- Les paquets sont montrés tels qu’ils circulent sur le premier lien emprunté ; la couche Ethernet n’est pas représentée.
- Les contenus chiffrés (TLS, SSH après NEWKEYS) sont remplacés par des octets pseudo-aléatoires déterministes, aux longueurs plausibles.
- SMTP sur le port 587 est montré sans STARTTLS ni AUTH, pour garder les commandes lisibles ; la leçon le signale.
- FTP condense la poignée de main de la connexion de données en un message.
