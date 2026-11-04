import { T, type Scenario, type Text } from '../model.ts';
import { ascii, noise, size, type Writer } from '../packets/bytes.ts';
import { data, line, lines, sshEncrypted, sshIdent, sshPacket, sshString } from '../packets/app.ts';
import { TcpFlow } from '../packets/net.ts';
import { events, IP, toServer } from './kit.ts';

const shellHost = toServer('server', T('Serveur SSH', 'SSH server'), IP.shell);
const list = (w: Writer, name: string, value: string, note: Text) =>
  w.put(name, value === '' ? '—' : value, sshString(ascii(value)), note);

function kexinit(seed: string) {
  return sshPacket(20, w => {
    w.put('Cookie', size(16), noise(seed + ':cookie', 16), T('16 octets aléatoires.', '16 random bytes.'));
    list(w, 'kex_algorithms', 'curve25519-sha256', T('Méthode d’échange de clés.', 'Key exchange method.'));
    list(w, 'host_key_algorithms', 'ssh-ed25519', T('Type de clé d’hôte, qui identifie le serveur.', 'Host key type, which identifies the server.'));
    list(w, 'encryption c→s', 'chacha20-poly1305@openssh.com', T('Chiffrement du client vers le serveur.', 'Encryption from client to server.'));
    list(w, 'encryption s→c', 'chacha20-poly1305@openssh.com', T('Chiffrement du serveur vers le client.', 'Encryption from server to client.'));
    list(w, 'mac c→s', 'hmac-sha2-256-etm@openssh.com', T('Intégrité, si le chiffrement ne la fournit pas déjà.', 'Integrity, if the cipher does not already provide it.'));
    list(w, 'mac s→c', 'hmac-sha2-256-etm@openssh.com', T('Idem dans l’autre sens.', 'Same, the other way.'));
    list(w, 'compression c→s', 'none', T('Pas de compression.', 'No compression.'));
    list(w, 'compression s→c', 'none', T('Pas de compression.', 'No compression.'));
    list(w, 'languages c→s', '', T('Liste de langues, vide en pratique.', 'Language list, empty in practice.'));
    w.put('languages s→c', '—', sshString([]), T('Liste vide.', 'Empty list.'));
    w.u8('first_kex_follows', 0, T('Pas d’envoi anticipé de l’échange de clés.', 'No guessed key exchange packet follows.'), 'false');
    w.u32('reserved', 0, T('Réservé.', 'Reserved.'));
  }, seed);
}

function sshEvents() {
  const flow = new TcpFlow({ ip: IP.laptop, port: 52200, isn: 41_000 }, { ip: IP.shell, port: 22, isn: 8_800_000 }, true);
  const c = (parts: Parameters<TcpFlow['send']>[2]) => flow.send(0, ['PSH', 'ACK'], parts);
  const s = (parts: Parameters<TcpFlow['send']>[2]) => flow.send(1, ['PSH', 'ACK'], parts);
  const sealed = (name: string, length: number, seed: string, fr: string, en: string) => sshEncrypted(name, length, seed, T(fr, en));
  return events('ssh', [
    {
      from: 'client', to: 'server', label: 'SSH-2.0', title: T('Le client annonce sa version', 'The client states its version'),
      text: T('Sur le port 22, la toute première ligne est du texte lisible : version du protocole et logiciel.', 'On port 22 the very first line is readable text: protocol version and software.'),
      parts: c([sshIdent('SSH-2.0-OpenSSH_9.8', T('Version 2.0 du protocole, suivie du nom du logiciel client.', 'Protocol version 2.0, then the client software name.'))])
    },
    {
      from: 'server', to: 'client', label: 'SSH-2.0', title: T('Le serveur aussi', 'So does the server'),
      text: T('Chaque côté sait maintenant à qui il parle. Ces deux lignes entrent dans le calcul des clés : les falsifier ferait échouer la suite.', 'Each side now knows who it is talking to. Both lines feed into the key derivation, so forging them would make what follows fail.'),
      parts: s([sshIdent('SSH-2.0-OpenSSH_9.6', T('La version du serveur.', 'The server’s version.'))])
    },
    {
      from: 'client', to: 'server', label: 'KEXINIT', title: T('Les algorithmes du client', 'The client’s algorithms'),
      text: T('Le protocole devient binaire. Le client liste, par préférence, ses méthodes d’échange de clés, de chiffrement et d’intégrité.', 'The protocol turns binary. The client lists, in order of preference, its key exchange, encryption and integrity methods.'),
      parts: c([kexinit('ssh-kex-c')])
    },
    {
      from: 'server', to: 'client', label: 'KEXINIT', title: T('Les algorithmes du serveur', 'The server’s algorithms'),
      text: T('Le serveur envoie sa propre liste. Pour chaque catégorie, on retient le premier algorithme du client que le serveur accepte.', 'The server sends its own list. For each category, the first client algorithm the server accepts wins.'),
      parts: s([kexinit('ssh-kex-s')])
    },
    {
      from: 'client', to: 'server', label: 'ECDH_INIT', title: T('La part de clé du client', 'The client’s key share'),
      text: T('Le client envoie une clé publique Curve25519 éphémère, créée pour cette seule connexion.', 'The client sends an ephemeral Curve25519 public key, made for this connection only.'),
      parts: c([sshPacket(30, w => w.put('Q_C', T('clé publique, 32 octets', 'public key, 32 bytes'), sshString(noise('ssh-qc', 32)), T(
        'La moitié publique éphémère du client.', 'The client’s ephemeral public half.')), 'ssh-30')])
    },
    {
      from: 'server', to: 'client', label: 'ECDH_REPLY', title: T('Le serveur prouve son identité', 'The server proves its identity'),
      text: T(
        'Le serveur renvoie sa part de clé, sa clé d’hôte permanente et une signature. À la première connexion, SSH affiche l’empreinte de cette clé et vous demande de la confirmer ; ensuite il la retient dans known_hosts.',
        'The server returns its key share, its permanent host key and a signature. On first connection SSH shows this key’s fingerprint and asks you to confirm it; after that it remembers it in known_hosts.'),
      parts: s([sshPacket(31, w => {
        w.put('K_S', T('clé d’hôte ssh-ed25519', 'ssh-ed25519 host key'), sshString([...sshString(ascii('ssh-ed25519')), ...sshString(noise('ssh-hostkey', 32))]), T(
          'La clé publique permanente du serveur : c’est elle qui l’identifie d’une connexion à l’autre.', 'The server’s permanent public key: it identifies the server from one connection to the next.'));
        w.put('Q_S', T('clé publique, 32 octets', 'public key, 32 bytes'), sshString(noise('ssh-qs', 32)), T('La moitié publique éphémère du serveur.', 'The server’s ephemeral public half.'));
        w.put('Signature', 'ssh-ed25519', sshString([...sshString(ascii('ssh-ed25519')), ...sshString(noise('ssh-sig', 64))]), T(
          'La signature de l’empreinte de l’échange par la clé d’hôte : seul le vrai serveur peut la produire.', 'The host key’s signature over the exchange hash: only the real server can produce it.'));
      }, 'ssh-31')])
    },
    {
      from: 'client', to: 'server', label: 'NEWKEYS', title: T('Le client bascule sur les nouvelles clés', 'The client switches to the new keys'),
      text: T('Un message d’un seul octet utile : à partir d’ici, le client chiffre tout ce qu’il envoie.', 'A message with a single useful byte: from here on the client encrypts everything it sends.'),
      parts: c([sshPacket(21, () => {}, 'ssh-21c')])
    },
    {
      from: 'server', to: 'client', label: 'NEWKEYS', title: T('Le serveur aussi', 'The server too'),
      text: T('Le canal est chiffré dans les deux sens, mais personne n’est encore authentifié côté utilisateur.', 'The channel is encrypted both ways, but no user has logged in yet.'),
      parts: s([sshPacket(21, () => {}, 'ssh-21s')])
    },
    {
      from: 'client', to: 'server', label: 'SERVICE_REQUEST', tone: 'secure', title: T('Demande d’authentification', 'Asking to authenticate'),
      text: T('Premier message chiffré : le client demande le service ssh-userauth. Même la longueur du paquet est illisible.', 'First encrypted message: the client asks for the ssh-userauth service. Even the packet length is unreadable.'),
      parts: c([sealed('SERVICE_REQUEST', 28, 'ssh-5', 'Le message SERVICE_REQUEST « ssh-userauth ».', 'The SERVICE_REQUEST message for “ssh-userauth”.')])
    },
    {
      from: 'server', to: 'client', label: 'SERVICE_ACCEPT', tone: 'secure', title: T('Service accepté', 'Service accepted'),
      text: T('Le serveur accepte d’entendre les preuves d’identité.', 'The server agrees to hear the identity proofs.'),
      parts: s([sealed('SERVICE_ACCEPT', 28, 'ssh-6', 'Le message SERVICE_ACCEPT.', 'The SERVICE_ACCEPT message.')])
    },
    {
      from: 'client', to: 'server', label: 'USERAUTH', tone: 'secure', title: T('Connexion par clé publique', 'Public-key login'),
      text: T(
        'Le client signe une donnée propre à cette session avec la clé privée de l’utilisateur. Le serveur la vérifie avec la clé publique enregistrée dans authorized_keys : aucun mot de passe ne circule.',
        'The client signs data unique to this session with the user’s private key. The server checks it against the public key in authorized_keys: no password travels.'),
      parts: c([sealed('USERAUTH_REQUEST', 196, 'ssh-50', 'Utilisateur « bob », méthode publickey, clé publique et signature.', 'User “bob”, publickey method, public key and signature.')])
    },
    {
      from: 'server', to: 'client', label: 'USERAUTH_SUCCESS', tone: 'secure', title: T('Utilisateur authentifié', 'User authenticated'),
      text: T('La signature est valide : bob est connecté.', 'The signature checks out: bob is logged in.'),
      parts: s([sealed('USERAUTH_SUCCESS', 12, 'ssh-52', 'Le message USERAUTH_SUCCESS.', 'The USERAUTH_SUCCESS message.')])
    },
    {
      from: 'client', to: 'server', label: 'CHANNEL_OPEN', tone: 'secure', title: T('Ouvrir un canal', 'Opening a channel'),
      text: T(
        'Une connexion SSH peut porter plusieurs canaux en parallèle : un terminal, une copie de fichiers, un tunnel. Le client ouvre ici un canal « session ».',
        'One SSH connection can carry several channels at once: a terminal, a file copy, a tunnel. The client opens a “session” channel here.'),
      parts: c([sealed('CHANNEL_OPEN', 36, 'ssh-90', 'CHANNEL_OPEN de type « session », avec numéro de canal et taille de fenêtre.', 'CHANNEL_OPEN of type “session”, with channel number and window size.')])
    },
    {
      from: 'server', to: 'client', label: 'CONFIRMATION', tone: 'secure', title: T('Le terminal est prêt', 'The terminal is ready'),
      text: T('Le serveur confirme le canal. Le client demandera ensuite un terminal et un shell ; chaque frappe de clavier voyagera dans un paquet chiffré.', 'The server confirms the channel. The client will then ask for a terminal and a shell; every keystroke will travel in an encrypted packet.'),
      parts: s([sealed('CHANNEL_OPEN_CONFIRMATION', 28, 'ssh-91', 'La confirmation, avec les numéros de canal des deux côtés.', 'The confirmation, with both sides’ channel numbers.')])
    }
  ]);
}

export const ssh: Scenario = {
  id: 'ssh', name: 'SSH', category: 'remote', level: 3,
  tagline: T('Piloter une machine à distance en sécurité', 'Driving a remote machine securely'),
  intro: T(
    'SSH ouvre un terminal sur une machine distante à travers un canal chiffré. Trois étapes se suivent : négocier les algorithmes et les clés, authentifier le serveur puis l’utilisateur, ouvrir des canaux.',
    'SSH opens a terminal on a remote machine through an encrypted channel. Three stages follow one another: negotiate algorithms and keys, authenticate the server then the user, open channels.'),
  topology: shellHost, actors: ['client', 'server'], events: sshEvents()
};

const fileHost = toServer('server', T('Serveur FTP', 'FTP server'), IP.files);
const file = 'Liste de courses\r\n- pain\r\n- fromage\r\n';

function ftpEvents() {
  const control = new TcpFlow({ ip: IP.laptop, port: 52010, isn: 15_000 }, { ip: IP.files, port: 21, isn: 6_000_000 }, true);
  const channel = new TcpFlow({ ip: IP.laptop, port: 52011, isn: 33_000 }, { ip: IP.files, port: 50123, isn: 2_500_000 });
  const say = (side: 0 | 1, name: string, text: string, fr: string, en: string) =>
    control.send(side, ['PSH', 'ACK'], [lines('ftp', 'FTP · contrôle', [line(name, text, T(fr, en))])]);
  const open = channel.send(0, ['SYN']);
  channel.send(1, ['SYN', 'ACK']);
  channel.send(0, ['ACK']);
  return events('ftp', [
    {
      from: 'server', to: 'client', label: '220', title: T('Le canal de contrôle', 'The control channel'),
      text: T('FTP utilise deux connexions. La première, vers le port 21, ne transporte que des commandes et des réponses.', 'FTP uses two connections. The first, to port 21, carries only commands and replies.'),
      parts: say(1, 'Greeting', '220 files.example.com FTP ready', 'Le serveur est prêt.', 'The server is ready.')
    },
    {
      from: 'client', to: 'server', label: 'USER', title: T('Identifiant', 'User name'),
      text: T('Le client s’identifie.', 'The client identifies itself.'),
      parts: say(0, 'Command', 'USER bob', 'Le nom d’utilisateur.', 'The user name.')
    },
    {
      from: 'server', to: 'client', label: '331', title: T('Mot de passe requis', 'Password required'),
      text: T('Les codes 3xx signifient « continuez ».', '3xx codes mean “carry on”.'),
      parts: say(1, 'Reply', '331 Password required', 'Utilisateur connu, mot de passe attendu.', 'User known, password expected.')
    },
    {
      from: 'client', to: 'server', label: 'PASS', tone: 'alert', title: T('Un mot de passe exposé', 'An exposed password'),
      text: T('Comme POP3, FTP classique envoie le mot de passe en clair. On lui préfère SFTP (au-dessus de SSH) ou FTPS.', 'Like POP3, classic FTP sends the password in clear. SFTP (over SSH) or FTPS are preferred.'),
      parts: say(0, 'Command', 'PASS s3cret', 'Le mot de passe, en texte brut.', 'The password, as plain text.')
    },
    {
      from: 'server', to: 'client', label: '230', title: T('Connecté', 'Logged in'),
      text: T('Authentification réussie.', 'Login succeeded.'),
      parts: say(1, 'Reply', '230 Login successful', 'Session ouverte.', 'Session open.')
    },
    {
      from: 'client', to: 'server', label: 'EPSV', title: T('Mode passif', 'Passive mode'),
      text: T(
        'Pour transférer un fichier, il faut une seconde connexion. En mode passif, c’est le client qui l’ouvrira, ce qui passe bien les box et pare-feu.',
        'Transferring a file needs a second connection. In passive mode the client opens it, which gets through home routers and firewalls.'),
      parts: say(0, 'Command', 'EPSV', 'Extended Passive : « donne-moi un port où me connecter ».', 'Extended Passive: “give me a port to connect to”.')
    },
    {
      from: 'server', to: 'client', label: '229 |||50123|', title: T('Le port des données', 'The data port'),
      text: T('Le serveur ouvre le port 50123 et l’annonce entre barres verticales.', 'The server opens port 50123 and announces it between vertical bars.'),
      parts: say(1, 'Reply', '229 Entering Extended Passive Mode (|||50123|)', 'Le port de la future connexion de données.', 'The port for the coming data connection.')
    },
    {
      from: 'client', to: 'server', label: 'SYN :50123', title: T('Ouvrir la connexion de données', 'Opening the data connection'),
      text: T('Le client ouvre une seconde connexion TCP, vers le port 50123. La poignée de main complète est condensée ici en un message.', 'The client opens a second TCP connection, to port 50123. The full handshake is shown here as one message.'),
      parts: open
    },
    {
      from: 'client', to: 'server', label: 'RETR', title: T('Demander le fichier', 'Asking for the file'),
      text: T('La commande passe toujours par le canal de contrôle.', 'The command still goes over the control channel.'),
      parts: say(0, 'Command', 'RETR courses.txt', 'Télécharge le fichier courses.txt.', 'Downloads the file courses.txt.')
    },
    {
      from: 'server', to: 'client', label: '150', title: T('Transfert en cours', 'Transfer starting'),
      text: T('Le serveur annonce l’envoi sur la connexion de données.', 'The server announces it is sending on the data connection.'),
      parts: say(1, 'Reply', '150 Opening BINARY mode data connection', 'Le transfert commence.', 'The transfer begins.')
    },
    {
      from: 'server', to: 'client', label: 'courses.txt', tone: 'data', title: T('Le fichier circule à part', 'The file travels separately'),
      text: T('Le contenu arrive sur la connexion 50123, sans aucune commande autour : juste les octets du fichier, en clair.', 'The content arrives on connection 50123, with no commands around it: just the file’s bytes, in clear.'),
      parts: channel.send(1, ['PSH', 'ACK'], [data('FTP · données', 'File', 'courses.txt', ascii(file), T(
        'Le contenu brut du fichier. La fin de la connexion de données marquera la fin du fichier.', 'The raw file content. Closing the data connection will mark the end of the file.'), 'ftp')])
    },
    {
      from: 'server', to: 'client', label: '226', title: T('Transfert terminé', 'Transfer complete'),
      text: T('Le serveur ferme la connexion de données et confirme sur le canal de contrôle, qui reste ouvert pour d’autres commandes.', 'The server closes the data connection and confirms on the control channel, which stays open for more commands.'),
      parts: say(1, 'Reply', '226 Transfer complete', 'Fichier envoyé en entier.', 'File sent in full.')
    }
  ]);
}

export const ftp: Scenario = {
  id: 'ftp', name: 'FTP', category: 'remote', level: 2,
  tagline: T('Deux connexions pour un fichier', 'Two connections for one file'),
  intro: T(
    'FTP est l’un des plus anciens protocoles d’Internet. Sa particularité : un canal de contrôle pour les commandes et une connexion distincte pour chaque transfert de fichier.',
    'FTP is one of the Internet’s oldest protocols. Its quirk: a control channel for commands and a separate connection for every file transfer.'),
  topology: fileHost, actors: ['client', 'server'], events: ftpEvents()
};
