import { T, type Part, type PartKind, type Scenario, type Text } from '../model.ts';
import { ascii } from '../packets/bytes.ts';
import { line, lines } from '../packets/app.ts';
import { TcpFlow } from '../packets/net.ts';
import { events, IP, toServer, type EventSpec } from './kit.ts';

const mailbox = toServer('mail', T('Serveur de messagerie', 'Mail server'), IP.mail);

/** One protocol line (or several) carried on the flow, from client (0) or server (1). */
type Say = (side: 0 | 1, rows: [string, string, Text][], spec: Omit<EventSpec, 'parts' | 'from' | 'to'>) => EventSpec;
function talk(kind: PartKind, title: string, flow: TcpFlow): Say {
  return (side, rows, spec) => {
    const part: Part = lines(kind, title, rows.map(([name, text, note]) => line(name, text, note)));
    return { ...spec, from: side === 0 ? 'client' : 'server', to: side === 0 ? 'server' : 'client', parts: flow.send(side, ['PSH', 'ACK'], [part]) };
  };
}
const reply = (name: string, text: string, fr: string, en: string): [string, string, Text] => [name, text, T(fr, en)];

const message = [
  'From: Alice <alice@example.org>',
  'To: Bob <bob@example.com>',
  'Subject: Bonjour',
  '',
  'On se voit demain ?',
  '.'
];

function smtpEvents() {
  const flow = new TcpFlow({ ip: IP.laptop, port: 52401, isn: 900_100 }, { ip: IP.mail, port: 587, isn: 4_100_200 }, true);
  const say = talk('smtp', 'SMTP', flow);
  return events('smtp', [
    say(1, [reply('Greeting', '220 mail.example.com ESMTP ready', 'Code 220 : le serveur est prêt. En SMTP, c’est le serveur qui parle en premier.', 'Code 220: the server is ready. In SMTP the server speaks first.')], {
      label: '220', title: T('Le serveur se présente', 'The server introduces itself'),
      text: T(
        'Dès la connexion TCP ouverte sur le port 587 (soumission de courrier), le serveur envoie sa bannière. Chaque réponse SMTP commence par un code à trois chiffres.',
        'As soon as the TCP connection opens on port 587 (mail submission), the server sends its banner. Every SMTP reply starts with a three-digit code.')
    }),
    say(0, [reply('Command', 'EHLO laptop.home', 'EHLO présente le client et demande la liste des extensions prises en charge.', 'EHLO introduces the client and asks for the supported extensions.')], {
      label: 'EHLO', title: T('EHLO : bonjour, que sais-tu faire ?', 'EHLO: hello, what can you do?'),
      text: T('Le client donne son nom et demande les capacités du serveur.', 'The client gives its name and asks for the server’s capabilities.')
    }),
    say(1, [
      reply('Reply', '250-mail.example.com', 'Un tiret après le code annonce que d’autres lignes suivent.', 'A dash after the code means more lines follow.'),
      reply('Extension', '250-SIZE 35882577', 'Taille maximale d’un message, en octets.', 'Largest accepted message, in bytes.'),
      reply('Extension', '250-STARTTLS', 'Le serveur sait passer la session en TLS.', 'The server can switch the session to TLS.'),
      reply('Extension', '250-AUTH PLAIN LOGIN', 'Méthodes d’authentification proposées.', 'Authentication methods offered.'),
      reply('Extension', '250 8BITMIME', 'Un espace après le code : c’est la dernière ligne.', 'A space after the code: this is the last line.')
    ], {
      label: '250', title: T('La liste des extensions', 'The list of extensions'),
      text: T(
        'Une réponse sur plusieurs lignes. En situation réelle, le client enverrait maintenant STARTTLS puis s’authentifierait : cette leçon omet ces étapes chiffrées pour laisser lire les commandes.',
        'A multi-line reply. In real life the client would now send STARTTLS and then log in: this lesson leaves out those encrypted steps so the commands stay readable.')
    }),
    say(0, [reply('Command', 'MAIL FROM:<alice@example.org>', 'L’adresse d’enveloppe de l’expéditeur, où reviendraient les avis de non-distribution.', 'The sender’s envelope address, where bounce notices would go.')], {
      label: 'MAIL FROM', title: T('L’expéditeur de l’enveloppe', 'The envelope sender'),
      text: T(
        'SMTP distingue l’enveloppe, qui sert au transport, des en-têtes du message que lira le destinataire. Comme pour une lettre postale.',
        'SMTP separates the envelope, used for delivery, from the message headers the recipient will read. Just like a paper letter.')
    }),
    say(1, [reply('Reply', '250 2.1.0 Ok', 'Expéditeur accepté.', 'Sender accepted.')], {
      label: '250', title: T('Expéditeur accepté', 'Sender accepted'),
      text: T('Le code étendu 2.1.0 précise que l’adresse d’origine est valide.', 'The enhanced code 2.1.0 says the origin address is valid.')
    }),
    say(0, [reply('Command', 'RCPT TO:<bob@example.com>', 'Un destinataire de l’enveloppe ; on peut répéter la commande pour en ajouter.', 'One envelope recipient; repeat the command to add more.')], {
      label: 'RCPT TO', title: T('Le destinataire', 'The recipient'),
      text: T('Le client nomme le destinataire. Le serveur peut le refuser s’il n’accepte pas de relayer vers ce domaine.', 'The client names the recipient. The server may refuse if it will not relay to that domain.')
    }),
    say(1, [reply('Reply', '250 2.1.5 Ok', 'Destinataire accepté.', 'Recipient accepted.')], {
      label: '250', title: T('Destinataire accepté', 'Recipient accepted'),
      text: T('Le serveur prendra en charge l’acheminement vers example.com.', 'The server will take care of delivering to example.com.')
    }),
    say(0, [reply('Command', 'DATA', 'Annonce que le contenu du message va suivre.', 'Says the message content is coming.')], {
      label: 'DATA', title: T('DATA : place au contenu', 'DATA: on to the content'),
      text: T('L’enveloppe est complète, le client annonce le message lui-même.', 'The envelope is complete; the client announces the message itself.')
    }),
    say(1, [reply('Reply', '354 End data with <CR><LF>.<CR><LF>', 'Code 354 : envoyez, et terminez par une ligne ne contenant qu’un point.', 'Code 354: go ahead, and finish with a line holding a single dot.')], {
      label: '354', title: T('« Allez-y »', '“Go ahead”'),
      text: T('Le serveur indique comment signaler la fin du message.', 'The server explains how to mark the end of the message.')
    }),
    say(0, message.map((text, i): [string, string, Text] => text === '.'
      ? reply('End of data', '.', 'Une ligne réduite à un point : fin du message.', 'A line with a single dot: end of message.')
      : text === '' ? reply('Blank line', '', 'Ligne vide : fin des en-têtes, début du corps.', 'Blank line: end of headers, start of body.')
        : i < 3 ? reply('Header', text, 'En-tête du message, affiché par le logiciel du destinataire.', 'Message header, shown by the recipient’s mail app.')
          : reply('Body', text, 'Le corps du message.', 'The message body.')), {
      label: 'Message', tone: 'data', title: T('Le message lui-même', 'The message itself'),
      text: T(
        'En-têtes From, To, Subject, une ligne vide, puis le texte. Les champs From et To affichés au lecteur peuvent différer de l’enveloppe.',
        'From, To and Subject headers, a blank line, then the text. The From and To shown to the reader may differ from the envelope.')
    }),
    say(1, [reply('Reply', '250 2.0.0 Ok: queued as 4F2A1C', 'Le serveur a pris le message en charge et lui a donné un identifiant.', 'The server has taken the message and given it an identifier.')], {
      label: '250', title: T('Message mis en file', 'Message queued'),
      text: T(
        'Le serveur assume désormais la livraison : il cherchera le serveur MX de example.com dans le DNS et lui transmettra le message, à nouveau par SMTP.',
        'The server now owns delivery: it will look up example.com’s MX server in DNS and pass the message on, again over SMTP.')
    })
  ]);
}

export const smtp: Scenario = {
  id: 'smtp', name: 'SMTP', category: 'mail', level: 2,
  tagline: T('Envoyer un courriel', 'Sending an email'),
  intro: T(
    'SMTP transporte le courrier vers les serveurs. C’est un dialogue texte de commandes et de codes de réponse : on décrit d’abord l’enveloppe (expéditeur, destinataires), puis on transmet le message.',
    'SMTP carries mail to servers. It is a text dialogue of commands and reply codes: first describe the envelope (sender, recipients), then send the message.'),
  topology: mailbox, actors: ['client', 'server'], events: smtpEvents()
};

const stored = ['From: Alice <alice@example.org>', 'Subject: Bonjour', '', 'On se voit demain ?'];

function pop3Events() {
  const flow = new TcpFlow({ ip: IP.laptop, port: 52412, isn: 51_000 }, { ip: IP.mail, port: 110, isn: 7_700_000 }, true);
  const say = talk('pop3', 'POP3', flow);
  const size = ascii(stored.join('\r\n') + '\r\n').length;
  return events('pop3', [
    say(1, [reply('Greeting', '+OK POP3 server ready', 'Les réponses POP3 commencent par +OK ou -ERR.', 'POP3 replies start with +OK or -ERR.')], {
      label: '+OK', title: T('Le serveur est prêt', 'The server is ready'),
      text: T('Connexion TCP sur le port 110 : le serveur salue le client.', 'TCP connection on port 110: the server greets the client.')
    }),
    say(0, [reply('Command', 'USER bob', 'Le nom de la boîte aux lettres.', 'The mailbox name.')], {
      label: 'USER', title: T('Le nom d’utilisateur', 'The user name'),
      text: T('Le client s’identifie.', 'The client identifies itself.')
    }),
    say(1, [reply('Reply', '+OK', 'Utilisateur connu, mot de passe attendu.', 'User known, password expected.')], {
      label: '+OK', title: T('Mot de passe attendu', 'Password expected'), text: T('Le serveur attend la suite.', 'The server waits for the next step.')
    }),
    say(0, [reply('Command', 'PASS s3cret', 'Le mot de passe, lisible tel quel par quiconque observe le réseau.', 'The password, readable as is by anyone watching the network.')], {
      label: 'PASS', tone: 'alert', title: T('Le mot de passe… en clair', 'The password… in clear'),
      text: T(
        'Regardez les octets : le mot de passe circule en texte brut. C’est pourquoi on utilise POP3S (port 995), où toute la session passe dans TLS.',
        'Look at the bytes: the password travels as plain text. That is why POP3S (port 995) is used, with the whole session inside TLS.')
    }),
    say(1, [reply('Reply', `+OK 1 message (${size} octets)`, 'Authentification réussie ; la boîte est verrouillée pour cette session.', 'Login succeeded; the mailbox is locked for this session.')], {
      label: '+OK', title: T('Boîte ouverte', 'Mailbox open'), text: T('Le serveur annonce le nombre de messages et leur taille.', 'The server states how many messages there are and their size.')
    }),
    say(0, [reply('Command', 'RETR 1', 'Demande le message numéro 1.', 'Asks for message number 1.')], {
      label: 'RETR 1', title: T('Télécharger le message', 'Downloading the message'), text: T('Le client récupère le premier message.', 'The client fetches the first message.')
    }),
    say(1, [
      reply('Reply', `+OK ${size} octets`, 'Le message suit.', 'The message follows.'),
      ...stored.map(text => reply(text === '' ? 'Blank line' : 'Message', text, 'Une ligne du message stocké.', 'A line of the stored message.')),
      reply('End', '.', 'Un point seul termine la réponse.', 'A lone dot ends the reply.')
    ], {
      label: 'Message', tone: 'data', title: T('Le message arrive', 'The message arrives'),
      text: T(
        'Le message entier est transféré vers l’ordinateur. POP3 est pensé pour télécharger puis lire hors ligne.',
        'The whole message is copied to the computer. POP3 is designed to download, then read offline.')
    }),
    say(0, [reply('Command', 'DELE 1', 'Marque le message 1 pour suppression.', 'Marks message 1 for deletion.')], {
      label: 'DELE 1', title: T('Supprimer du serveur', 'Deleting from the server'),
      text: T(
        'Le client marque le message pour suppression : c’est le fonctionnement classique de POP3, qui vide la boîte du serveur.',
        'The client marks the message for deletion: classic POP3 behaviour, emptying the server mailbox.')
    }),
    say(1, [reply('Reply', '+OK message 1 deleted', 'Marqué, mais effacé seulement à la fin de la session.', 'Marked, but only erased when the session ends.')], {
      label: '+OK', title: T('Marqué pour suppression', 'Marked for deletion'), text: T('La suppression effective aura lieu au QUIT.', 'The actual deletion happens at QUIT.')
    }),
    say(0, [reply('Command', 'QUIT', 'Termine la session et applique les suppressions.', 'Ends the session and applies deletions.')], {
      label: 'QUIT', title: T('Fin de session', 'End of session'),
      text: T('Le serveur efface les messages marqués et ferme la connexion. Le courrier n’existe plus que sur cet ordinateur.', 'The server erases the marked messages and closes the connection. The mail now lives only on this computer.')
    })
  ]);
}

export const pop3: Scenario = {
  id: 'pop3', name: 'POP3', category: 'mail', level: 2,
  tagline: T('Relever son courrier', 'Collecting your mail'),
  intro: T(
    'POP3 est le plus simple des protocoles de lecture : on se connecte, on télécharge les messages, on les supprime du serveur. Idéal pour un seul appareil, mal adapté à plusieurs.',
    'POP3 is the simplest mail-reading protocol: connect, download the messages, delete them from the server. Fine for one device, awkward for several.'),
  topology: mailbox, actors: ['client', 'server'], events: pop3Events()
};

function imapEvents() {
  const flow = new TcpFlow({ ip: IP.laptop, port: 52420, isn: 77_000 }, { ip: IP.mail, port: 143, isn: 9_100_000 }, true);
  const say = talk('imap', 'IMAP', flow);
  const headers = 'From: Alice <alice@example.org>\r\nSubject: Bonjour\r\n\r\n';
  const literal = ascii(headers).length;
  return events('imap', [
    say(1, [reply('Greeting', '* OK IMAP4rev2 server ready', 'L’étoile marque une réponse non sollicitée.', 'The asterisk marks an untagged response.')], {
      label: '* OK', title: T('Le serveur est prêt', 'The server is ready'),
      text: T('Connexion sur le port 143. Les lignes du serveur qui commencent par « * » sont des informations, pas des réponses finales.', 'Connection on port 143. Server lines starting with “*” are information, not final answers.')
    }),
    say(0, [reply('Command', 'a1 LOGIN bob s3cret', 'Chaque commande porte une étiquette (a1) que reprendra sa réponse.', 'Every command carries a tag (a1) its reply will repeat.')], {
      label: 'a1 LOGIN', tone: 'alert', title: T('Connexion étiquetée', 'A tagged login'),
      text: T(
        'L’étiquette a1 permet d’envoyer plusieurs commandes sans attendre et de rapprocher chaque réponse de sa demande. En vrai, on passe d’abord en TLS (ou on utilise IMAPS, port 993).',
        'The a1 tag lets the client send several commands without waiting and match each reply to its request. In practice TLS comes first (or IMAPS on port 993).')
    }),
    say(1, [reply('Tagged reply', 'a1 OK LOGIN completed', 'Réponse finale à la commande a1.', 'Final reply to command a1.')], {
      label: 'a1 OK', title: T('Authentifié', 'Logged in'), text: T('Le serveur répond avec la même étiquette.', 'The server answers with the same tag.')
    }),
    say(0, [reply('Command', 'a2 SELECT INBOX', 'Ouvre un dossier ; IMAP en gère autant qu’on veut.', 'Opens a folder; IMAP handles as many as you like.')], {
      label: 'a2 SELECT', title: T('Ouvrir la boîte de réception', 'Opening the inbox'),
      text: T('Contrairement à POP3, IMAP organise le courrier en dossiers sur le serveur.', 'Unlike POP3, IMAP keeps mail organised in folders on the server.')
    }),
    say(1, [
      reply('Untagged', '* 2 EXISTS', 'Deux messages dans le dossier.', 'Two messages in the folder.'),
      reply('Untagged', '* FLAGS (\\Seen \\Answered \\Flagged \\Deleted \\Draft)', 'Les drapeaux possibles d’un message.', 'The flags a message can have.'),
      reply('Untagged', '* OK [UIDVALIDITY 1730700000]', 'Garantit que les identifiants des messages restent stables.', 'Guarantees message identifiers stay stable.'),
      reply('Tagged reply', 'a2 OK [READ-WRITE] SELECT completed', 'Fin de la réponse à a2.', 'End of the reply to a2.')
    ], {
      label: 'a2 OK', title: T('L’état du dossier', 'The folder’s state'),
      text: T('Plusieurs lignes « * » décrivent le dossier, puis la ligne étiquetée a2 clôt la réponse.', 'Several “*” lines describe the folder, then the a2-tagged line closes the reply.')
    }),
    say(0, [reply('Command', 'a3 FETCH 2 (FLAGS BODY.PEEK[HEADER.FIELDS (FROM SUBJECT)])', 'Ne demande que deux en-têtes, sans marquer le message comme lu (PEEK).', 'Asks for two headers only, without marking the message read (PEEK).')], {
      label: 'a3 FETCH', title: T('Lire juste ce qu’il faut', 'Fetching only what is needed'),
      text: T('Pour afficher la liste, le client demande l’expéditeur et le sujet, pas le message entier. Pratique sur mobile.', 'To show the list, the client asks for sender and subject, not the whole message. Handy on a phone.')
    }),
    say(1, [
      reply('Untagged', `* 2 FETCH (FLAGS () BODY[HEADER.FIELDS (FROM SUBJECT)] {${literal}}`, `Un littéral de ${literal} octets suit.`, `A ${literal}-byte literal follows.`),
      reply('Literal', 'From: Alice <alice@example.org>', 'Contenu du littéral.', 'Literal content.'),
      reply('Literal', 'Subject: Bonjour', 'Contenu du littéral.', 'Literal content.'),
      reply('Literal', '', 'Fin du littéral.', 'End of the literal.'),
      reply('Untagged', ')', 'Fin de la réponse FETCH.', 'End of the FETCH response.'),
      reply('Tagged reply', 'a3 OK FETCH completed', 'Fin de la réponse à a3.', 'End of the reply to a3.')
    ], {
      label: 'a3 OK', tone: 'data', title: T('Les en-têtes demandés', 'The requested headers'),
      text: T('Le nombre entre accolades annonce la taille exacte du texte qui suit. FLAGS () : le message n’est pas encore lu.', 'The number in braces gives the exact size of the text that follows. FLAGS (): the message is not read yet.')
    }),
    say(0, [reply('Command', 'a4 STORE 2 +FLAGS (\\Seen)', 'Ajoute le drapeau \\Seen au message 2.', 'Adds the \\Seen flag to message 2.')], {
      label: 'a4 STORE', title: T('Marquer comme lu', 'Marking as read'),
      text: T('L’utilisateur ouvre le message : le client en informe le serveur.', 'The user opens the message, so the client tells the server.')
    }),
    say(1, [
      reply('Untagged', '* 2 FETCH (FLAGS (\\Seen))', 'Le nouvel état du message.', 'The message’s new state.'),
      reply('Tagged reply', 'a4 OK STORE completed', 'Fin de la réponse à a4.', 'End of the reply to a4.')
    ], {
      label: 'a4 OK', title: T('Synchronisé partout', 'Synced everywhere'),
      text: T('L’état « lu » est stocké sur le serveur : le téléphone et l’ordinateur afficheront le même. C’est tout l’intérêt d’IMAP face à POP3.', 'The “read” state lives on the server, so phone and computer show the same. That is IMAP’s whole point over POP3.')
    })
  ]);
}

export const imap: Scenario = {
  id: 'imap', name: 'IMAP', category: 'mail', level: 2,
  tagline: T('Un courrier synchronisé sur tous vos appareils', 'Mail kept in sync across your devices'),
  intro: T(
    'IMAP laisse le courrier sur le serveur et le manipule à distance : dossiers, drapeaux lu/non lu, téléchargement partiel. Chaque commande porte une étiquette, ce qui permet d’en envoyer plusieurs à la fois.',
    'IMAP leaves mail on the server and works on it remotely: folders, read/unread flags, partial downloads. Every command carries a tag, so several can be in flight at once.'),
  topology: mailbox, actors: ['client', 'server'], events: imapEvents()
};
