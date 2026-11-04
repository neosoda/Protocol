import { T, type Scenario } from '../model.ts';
import { ascii } from '../packets/bytes.ts';
import { clientHello, line, lines, serverHello, tlsEncrypted } from '../packets/app.ts';
import { TcpFlow } from '../packets/net.ts';
import { events, IP, toServer } from './kit.ts';

const site = toServer('server', T('Serveur web', 'Web server'), IP.web);
const HOST = 'www.example.com';

const page = '<!doctype html>\n<title>Bonjour</title>\n<h1>Bonjour !</h1>\n';
const request = lines('http', 'HTTP/1.1 · Request', [
  line('Request Line', 'GET / HTTP/1.1', T(
    'Méthode GET, chemin « / », version du protocole. GET demande une ressource sans rien modifier.',
    'GET method, path “/”, protocol version. GET asks for a resource without changing anything.')),
  line('Host', `Host: ${HOST}`, T(
    'Obligatoire en HTTP/1.1 : un même serveur héberge souvent plusieurs sites, il doit savoir lequel est visé.',
    'Required in HTTP/1.1: one server often hosts several sites and must know which is wanted.')),
  line('User-Agent', 'User-Agent: Mozilla/5.0', T('Le logiciel qui fait la demande.', 'The software making the request.')),
  line('Accept', 'Accept: text/html', T('Les formats que le navigateur sait afficher.', 'The formats the browser can display.')),
  line('Accept-Language', 'Accept-Language: fr, en;q=0.8', T(
    'Langues préférées, avec un poids q pour l’ordre de préférence.', 'Preferred languages, with a q weight for their order.')),
  line('End of headers', '', T('Une ligne vide termine les en-têtes.', 'An empty line ends the headers.'))
]);
const response = lines('http', 'HTTP/1.1 · Response', [
  line('Status Line', 'HTTP/1.1 200 OK', T(
    'Le code 200 signifie succès. 3xx redirige, 4xx signale une erreur du client (404 : introuvable), 5xx une erreur du serveur.',
    'Code 200 means success. 3xx redirects, 4xx is a client error (404: not found), 5xx a server error.')),
  line('Content-Type', 'Content-Type: text/html; charset=utf-8', T(
    'Le type du corps : du HTML encodé en UTF-8.', 'The body’s type: HTML encoded as UTF-8.')),
  line('Content-Length', `Content-Length: ${ascii(page).length}`, T(
    'La taille exacte du corps en octets, pour savoir où il s’arrête.', 'The exact body size in bytes, so the end is known.')),
  line('Cache-Control', 'Cache-Control: max-age=600', T(
    'Le navigateur peut réutiliser cette page pendant 10 minutes sans la redemander.', 'The browser may reuse this page for 10 minutes without asking again.')),
  line('End of headers', '', T('Ligne vide : le corps commence juste après.', 'Empty line: the body starts right after.')),
  line('Body', page, T(
    'Le document HTML lui-même, que le navigateur va afficher.', 'The HTML document itself, which the browser will render.'), false)
]);

function httpEvents() {
  const flow = new TcpFlow({ ip: IP.laptop, port: 52344, isn: 1_904_552_310 }, { ip: IP.web, port: 80, isn: 802_771_946 });
  return events('http', [
    {
      from: 'client', to: 'server', label: 'SYN',
      title: T('Ouvrir une connexion TCP', 'Opening a TCP connection'),
      text: T(
        'Le navigateur connaît déjà l’adresse du serveur grâce au DNS. Il ouvre une connexion TCP vers le port 80, celui de HTTP.',
        'The browser already has the server’s address from DNS. It opens a TCP connection to port 80, HTTP’s port.'),
      parts: flow.send(0, ['SYN'])
    },
    {
      from: 'server', to: 'client', label: 'SYN, ACK',
      title: T('Le serveur accepte', 'The server accepts'),
      text: T('Deuxième temps de la poignée de main TCP.', 'Second step of the TCP handshake.'),
      parts: flow.send(1, ['SYN', 'ACK'])
    },
    {
      from: 'client', to: 'server', label: 'ACK',
      title: T('Connexion prête', 'Connection ready'),
      text: T(
        'La connexion est établie : un aller-retour complet s’est écoulé avant le moindre octet HTTP.',
        'The connection is up: a full round trip has passed before a single HTTP byte.'),
      parts: flow.send(0, ['ACK'])
    },
    {
      from: 'client', to: 'server', label: 'GET /', tone: 'data',
      title: T('La requête GET', 'The GET request'),
      text: T(
        'HTTP/1.1 est un protocole texte : chaque ligne se termine par CR LF (0d 0a). Survolez les lignes pour retrouver leurs octets.',
        'HTTP/1.1 is a text protocol: every line ends with CR LF (0d 0a). Hover the lines to find their bytes.'),
      parts: flow.send(0, ['PSH', 'ACK'], [request])
    },
    {
      from: 'server', to: 'client', label: '200 OK', tone: 'data',
      title: T('La réponse 200 OK', 'The 200 OK response'),
      text: T(
        'Une ligne de statut, des en-têtes, une ligne vide puis le corps. Tout circule en clair : n’importe quel équipement du chemin peut lire et modifier cette page.',
        'A status line, headers, an empty line, then the body. Everything travels in clear: any device on the path can read and change this page.'),
      parts: flow.send(1, ['PSH', 'ACK'], [response])
    },
    {
      from: 'client', to: 'server', label: 'ACK',
      title: T('Réception confirmée', 'Receipt confirmed'),
      text: T(
        'TCP acquitte la réponse. La connexion reste ouverte (keep-alive) pour les images ou feuilles de style de la page.',
        'TCP acknowledges the response. The connection stays open (keep-alive) for the page’s images or style sheets.'),
      parts: flow.send(0, ['ACK'])
    }
  ]);
}

export const http: Scenario = {
  id: 'http', name: 'HTTP', category: 'web', level: 1,
  tagline: T('Demander une page web', 'Asking for a web page'),
  intro: T(
    'HTTP est la langue du Web : le navigateur demande une ressource, le serveur répond par un code de statut, des en-têtes et un contenu. Voici une version HTTP/1.1 en clair, au-dessus d’une connexion TCP.',
    'HTTP is the language of the Web: the browser asks for a resource, the server answers with a status code, headers and content. Here is plain HTTP/1.1, on top of a TCP connection.'),
  topology: site,
  actors: ['client', 'server'],
  events: httpEvents()
};

const sealed = (inner: string, note: [string, string], length: number, seed: string) => tlsEncrypted(inner, T(...note), length, seed);

function tlsEvents() {
  const flow = new TcpFlow({ ip: IP.laptop, port: 52360, isn: 3_100_200_300 }, { ip: IP.web, port: 443, isn: 1_200_300_400 }, true);
  return events('tls', [
    {
      from: 'client', to: 'server', label: 'ClientHello',
      title: T('ClientHello : les propositions du client', 'ClientHello: the client’s offer'),
      text: T(
        'Sur une connexion TCP déjà ouverte vers le port 443, le client annonce le site visé (SNI), ses suites de chiffrement, TLS 1.3 et, d’emblée, sa part publique de l’échange de clés.',
        'On a TCP connection already open to port 443, the client names the site (SNI), its cipher suites, TLS 1.3 and, right away, its public share of the key exchange.'),
      parts: flow.send(0, ['PSH', 'ACK'], [clientHello(HOST, 'tls')])
    },
    {
      from: 'server', to: 'client', label: 'ServerHello',
      title: T('ServerHello : les choix du serveur', 'ServerHello: the server’s choices'),
      text: T(
        'Le serveur retient AES-128-GCM et renvoie sa part de clé. Dès cet instant, les deux côtés calculent le même secret : tout le reste de la poignée de main sera chiffré.',
        'The server picks AES-128-GCM and returns its key share. From now on both sides compute the same secret: the rest of the handshake will be encrypted.'),
      parts: flow.send(1, ['ACK'], [serverHello('tls-s', 'tls')])
    },
    {
      from: 'server', to: 'client', label: 'EncryptedExtensions', tone: 'secure',
      title: T('Premier message chiffré', 'First encrypted message'),
      text: T(
        'Les extensions restantes, comme le protocole applicatif retenu (h2), voyagent déjà chiffrées. Sur le réseau, on ne voit qu’un enregistrement de type 23.',
        'The remaining extensions, such as the chosen application protocol (h2), are already encrypted. On the wire you only see a type 23 record.'),
      parts: flow.send(1, ['ACK'], [sealed('EncryptedExtensions', [
        'Contient l’extension ALPN (h2) et le type réel du contenu, invisibles pour un observateur.',
        'Holds the ALPN extension (h2) and the real content type, invisible to an observer.'], 24, 'tls-ee')])
    },
    {
      from: 'server', to: 'client', label: 'Certificate', tone: 'secure',
      title: T('Le certificat du serveur', 'The server’s certificate'),
      text: T(
        'Le serveur envoie sa chaîne de certificats : sa clé publique, signée par une autorité de certification à laquelle le navigateur fait confiance. En TLS 1.3, même le certificat est chiffré.',
        'The server sends its certificate chain: its public key, signed by a certificate authority the browser trusts. In TLS 1.3 even the certificate is encrypted.'),
      parts: flow.send(1, ['ACK'], [sealed('Certificate', [
        'La chaîne de certificats X.509 de www.example.com.', 'The X.509 certificate chain for www.example.com.'], 960, 'tls-cert')])
    },
    {
      from: 'server', to: 'client', label: 'CertificateVerify', tone: 'secure',
      title: T('La preuve de possession', 'Proof of possession'),
      text: T(
        'Un certificat est public : n’importe qui peut le recopier. Le serveur signe donc l’historique de la poignée de main avec sa clé privée, prouvant qu’il est bien le titulaire.',
        'A certificate is public; anyone can copy it. So the server signs the handshake transcript with its private key, proving it really owns it.'),
      parts: flow.send(1, ['ACK'], [sealed('CertificateVerify', [
        'Une signature Ed25519 de 64 octets sur l’empreinte des messages échangés.', 'A 64-byte Ed25519 signature over the hash of the messages so far.'], 72, 'tls-cv')])
    },
    {
      from: 'server', to: 'client', label: 'Finished', tone: 'secure',
      title: T('Finished du serveur', 'Server Finished'),
      text: T(
        'Un code d’authentification sur tout l’échange : si quelqu’un avait modifié un seul message, les deux côtés ne trouveraient pas la même valeur. En pratique, ces quatre messages partent souvent ensemble.',
        'An authentication code over the whole exchange: had anyone altered a single message, the two sides would not get the same value. In practice these four messages often leave together.'),
      parts: flow.send(1, ['PSH', 'ACK'], [sealed('Finished', [
        'Un HMAC de 32 octets sur l’historique de la poignée de main.', 'A 32-byte HMAC over the handshake transcript.'], 37, 'tls-sf')])
    },
    {
      from: 'client', to: 'server', label: 'Finished', tone: 'secure',
      title: T('Finished du client', 'Client Finished'),
      text: T(
        'Le client a vérifié le certificat, la signature et le Finished du serveur. Il envoie le sien : la session est établie après un seul aller-retour.',
        'The client has checked the certificate, the signature and the server’s Finished. It sends its own: the session is up after a single round trip.'),
      parts: flow.send(0, ['PSH', 'ACK'], [sealed('Finished', [
        'Le HMAC du client, calculé avec ses propres clés de poignée de main.', 'The client’s HMAC, computed with its own handshake keys.'], 37, 'tls-cf')])
    },
    {
      from: 'client', to: 'server', label: 'Application Data', tone: 'secure',
      title: T('Les données applicatives', 'Application data'),
      text: T(
        'Les requêtes passent désormais sous les clés de trafic. Un observateur voit la taille et le rythme des échanges, mais ni l’adresse de la page, ni les cookies, ni le contenu.',
        'Requests now travel under the traffic keys. An observer sees the size and timing of the exchange, but not the page address, the cookies or the content.'),
      parts: flow.send(0, ['PSH', 'ACK'], [sealed('Application Data', [
        'Une requête HTTP complète, chiffrée et authentifiée.', 'A complete HTTP request, encrypted and authenticated.'], 96, 'tls-ad1')])
    },
    {
      from: 'server', to: 'client', label: 'Application Data', tone: 'secure',
      title: T('La réponse, chiffrée elle aussi', 'The response, encrypted too'),
      text: T(
        'Le serveur répond avec ses propres clés de trafic. Chaque enregistrement porte une étiquette d’authentification : une altération serait détectée immédiatement.',
        'The server answers with its own traffic keys. Every record carries an authentication tag, so tampering would be caught at once.'),
      parts: flow.send(1, ['PSH', 'ACK'], [sealed('Application Data', [
        'La réponse HTTP complète, chiffrée et authentifiée.', 'The complete HTTP response, encrypted and authenticated.'], 420, 'tls-ad2')])
    }
  ]);
}

export const tls: Scenario = {
  id: 'tls', name: 'TLS 1.3', category: 'web', level: 3,
  tagline: T('La poignée de main qui protège le Web', 'The handshake that protects the Web'),
  intro: T(
    'TLS chiffre et authentifie une connexion. En un seul aller-retour, client et serveur conviennent d’algorithmes, échangent des clés Diffie-Hellman et le serveur prouve son identité par un certificat. Après le ServerHello, plus rien n’est lisible sur le réseau.',
    'TLS encrypts and authenticates a connection. In a single round trip, client and server agree on algorithms, exchange Diffie-Hellman keys and the server proves its identity with a certificate. After ServerHello, nothing on the wire is readable any more.'),
  topology: site,
  actors: ['client', 'server'],
  events: tlsEvents()
};

function httpsEvents() {
  const flow = new TcpFlow({ ip: IP.laptop, port: 52388, isn: 640_118_702 }, { ip: IP.web, port: 443, isn: 2_771_090_115 });
  return events('https', [
    {
      from: 'client', to: 'server', label: 'SYN',
      title: T('TCP vers le port 443', 'TCP to port 443'),
      text: T(
        'HTTPS, c’est HTTP dans un tunnel TLS. Tout commence par une connexion TCP vers le port 443.',
        'HTTPS is HTTP inside a TLS tunnel. It all starts with a TCP connection to port 443.'),
      parts: flow.send(0, ['SYN'])
    },
    {
      from: 'server', to: 'client', label: 'SYN, ACK',
      title: T('Le serveur accepte', 'The server accepts'),
      text: T('Deuxième temps de la poignée de main TCP.', 'Second step of the TCP handshake.'),
      parts: flow.send(1, ['SYN', 'ACK'])
    },
    {
      from: 'client', to: 'server', label: 'ACK',
      title: T('TCP est prêt', 'TCP is ready'),
      text: T('Premier aller-retour : la connexion TCP est ouverte.', 'First round trip: the TCP connection is open.'),
      parts: flow.send(0, ['ACK'])
    },
    {
      from: 'client', to: 'server', label: 'ClientHello',
      title: T('Le navigateur démarre TLS', 'The browser starts TLS'),
      text: T(
        'Le ClientHello part aussitôt. Seul le nom du site (SNI) y apparaît en clair ; c’est le dernier indice lisible sur la destination.',
        'The ClientHello leaves at once. Only the site name (SNI) appears in clear: the last readable hint about the destination.'),
      parts: flow.send(0, ['PSH', 'ACK'], [clientHello(HOST, 'https')])
    },
    {
      from: 'server', to: 'client', label: 'ServerHello…', tone: 'secure',
      title: T('Le serveur répond et s’authentifie', 'The server answers and authenticates'),
      text: T(
        'Un seul envoi contient le ServerHello en clair puis un enregistrement chiffré regroupant extensions, certificat, signature et Finished. La leçon TLS 1.3 les détaille un par un.',
        'One send carries the ServerHello in clear, then an encrypted record bundling extensions, certificate, signature and Finished. The TLS 1.3 lesson goes through them one by one.'),
      parts: flow.send(1, ['PSH', 'ACK'], [serverHello('https-s', 'https'), sealed('Handshake', [
        'EncryptedExtensions, Certificate, CertificateVerify et Finished, chiffrés ensemble.',
        'EncryptedExtensions, Certificate, CertificateVerify and Finished, encrypted together.'], 1120, 'https-flight')])
    },
    {
      from: 'client', to: 'server', label: 'Finished', tone: 'secure',
      title: T('Le tunnel est établi', 'The tunnel is up'),
      text: T(
        'Le client a validé le certificat de www.example.com et envoie son Finished. Deux allers-retours se sont écoulés depuis le premier SYN.',
        'The client has validated www.example.com’s certificate and sends its Finished. Two round trips have passed since the first SYN.'),
      parts: flow.send(0, ['PSH', 'ACK'], [sealed('Finished', [
        'Le HMAC du client sur l’historique de la poignée de main.', 'The client’s HMAC over the handshake transcript.'], 37, 'https-cf')])
    },
    {
      from: 'client', to: 'server', label: 'GET /', tone: 'secure',
      title: T('La requête HTTP, chiffrée', 'The HTTP request, encrypted'),
      text: T(
        'Le navigateur envoie exactement le même GET qu’en HTTP, mais à l’intérieur d’un enregistrement TLS. Le chemin, les cookies et les en-têtes sont invisibles sur le réseau.',
        'The browser sends exactly the same GET as with HTTP, but inside a TLS record. The path, cookies and headers are invisible on the network.'),
      parts: flow.send(0, ['PSH', 'ACK'], [sealed('GET /', [
        'La requête GET / HTTP/1.1 et ses en-têtes, chiffrés.', 'The GET / HTTP/1.1 request and its headers, encrypted.'], 128, 'https-get')])
    },
    {
      from: 'server', to: 'client', label: '200 OK', tone: 'secure',
      title: T('La page, chiffrée', 'The page, encrypted'),
      text: T(
        'La réponse 200 OK et le HTML arrivent chiffrés et authentifiés. Le cadenas du navigateur résume tout cela : le serveur est bien www.example.com, et personne n’a pu lire ni modifier la page en route.',
        'The 200 OK response and the HTML arrive encrypted and authenticated. The browser padlock sums it up: the server really is www.example.com, and nobody could read or change the page on the way.'),
      parts: flow.send(1, ['PSH', 'ACK'], [sealed('200 OK', [
        'La réponse HTTP et le document HTML, chiffrés.', 'The HTTP response and the HTML document, encrypted.'], 236, 'https-ok')])
    }
  ]);
}

export const https: Scenario = {
  id: 'https', name: 'HTTPS', category: 'web', level: 2,
  tagline: T('Une page web, de bout en bout chiffrée', 'A web page, encrypted end to end'),
  intro: T(
    'Le parcours complet d’une page sécurisée : connexion TCP, poignée de main TLS 1.3, puis la requête HTTP et sa réponse dans le tunnel chiffré. Comparez avec la leçon HTTP : mêmes messages, mais illisibles pour qui observe le réseau.',
    'The full journey of a secure page: TCP connection, TLS 1.3 handshake, then the HTTP request and its response inside the encrypted tunnel. Compare with the HTTP lesson: the same messages, unreadable to anyone watching the network.'),
  topology: site,
  actors: ['client', 'server'],
  events: httpsEvents()
};
