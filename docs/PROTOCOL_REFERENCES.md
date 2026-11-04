# Références techniques du catalogue — 2026-11-04

Les scénarios sont **des modèles pédagogiques originaux**, non des captures ni des paquets conformes octet par octet. Une référence RFC n'implique pas une validation exhaustive de tous les comportements permis par ce protocole.

| Scénario | Références principales | Statut de revue |
|---|---|---|
| IP (IPv4) | [RFC 791](https://www.rfc-editor.org/rfc/rfc791) | À approfondir : routage, erreurs, fragmentation |
| TCP | [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293) | Invariants SYN/ACK et longueur utiles ajoutés en tests, exécution à faire |
| UDP | [RFC 768](https://www.rfc-editor.org/rfc/rfc768) | À approfondir : longueur/checksum |
| ICMPv4 | [RFC 792](https://www.rfc-editor.org/rfc/rfc792) | À approfondir : champs type/code |
| DNS | [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034), [RFC 1035](https://www.rfc-editor.org/rfc/rfc1035), [RFC 7766](https://www.rfc-editor.org/rfc/rfc7766) | Résolution récursive condensée ; cas cache et TCP non modélisés |
| DHCPv4 | [RFC 2131](https://www.rfc-editor.org/rfc/rfc2131) | DORA et ports 68/67 posés en invariants ; retransmissions et relay omis |
| HTTP/1.1 | [RFC 9112](https://www.rfc-editor.org/rfc/rfc9112), [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) | Exemple GET textuel construit ; correspondance « GET » = 3 octets vérifiable |
| HTTPS | [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446), [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) | Ordre handshake TLS 1.3 corrigé ; vol serveur regroupé |
| SMTP | [RFC 5321](https://www.rfc-editor.org/rfc/rfc5321) | À approfondir : réponses à chaque commande |
| POP3 | [RFC 1939](https://www.rfc-editor.org/rfc/rfc1939) | À approfondir : états et réponse serveur |
| IMAP | [RFC 9051](https://www.rfc-editor.org/rfc/rfc9051) | À approfondir : tags et réponses non modélisées |
| FTP | [RFC 959](https://www.rfc-editor.org/rfc/rfc959), [RFC 2428](https://www.rfc-editor.org/rfc/rfc2428) | À approfondir : réponses et connexion de données |
| SSH | [RFC 4253](https://www.rfc-editor.org/rfc/rfc4253), [RFC 4252](https://www.rfc-editor.org/rfc/rfc4252) | À approfondir : échange NEWKEYS, authentification et canaux |
| TLS 1.3 | [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446) | ServerHello → EncryptedExtensions → certificat/signature → Finished serveur → Finished client ; absence de 0-RTT, PSK et HelloRetryRequest documentée |

## Conventions de l'interface

- Les liens entre participants reflètent l'**échange logique** décrit par un événement et ne sont pas une découverte de chemin réel.
- Les nombres TCP (1000, 5000) et les adresses d'exemple sont inventés intentionnellement pour l'exercice.
- La topologie ne représente pas automatiquement les routeurs intermédiaires lorsque l'événement relie directement deux machines.
- Les exemples HEX/ASCII sont uniquement l'encodage UTF-8 de textes déclarés dans `sample`. Le champ optionnel `sampleRange` désigne des positions validées **dans ce texte d'exemple**, jamais dans une capture.
- Le scénario TLS décrit une poignée de main complète authentifiée par certificat. Le CertificateRequest du serveur, l'authentification du client, PSK, 0-RTT, ECH et le HelloRetryRequest ne sont pas couverts.

**Ne pas transformer « un test d'invariant a été écrit » en « le scénario est validé » : aucun test d'exécution n'a été obtenu dans cet environnement.**
