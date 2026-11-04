export const languages = [
  { code: 'fr', name: 'Français' }, { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' }, { code: 'pt', name: 'Português' },
  { code: 'de', name: 'Deutsch' }, { code: 'tr', name: 'Türkçe' },
  { code: 'uk', name: 'Українська' }, { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'ja', name: '日本語' }, { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' }, { code: 'ko', name: '한국어' },
  { code: 'hi', name: 'हिन्दी' }, { code: 'ar', name: 'العربية' }, { code: 'he', name: 'עברית' }
] as const;
export type Language = typeof languages[number]['code'];
export const isRtl = (language: Language): boolean => language === 'ar' || language === 'he';
export type Label = 'catalog' | 'experiment' | 'discovery' | 'expert' | 'topology' | 'sequence' |
  'inspector' | 'play' | 'pause' | 'previous' | 'next' | 'reset' | 'speed' | 'theme' |
  'language' | 'objective' | 'minutes' | 'modelled' | 'start' | 'back' | 'step' |
  'network' | 'web' | 'security' | 'noBytes' | 'layers' | 'resume' | 'learn' | 'status';
type Messages = Partial<Record<Label, string>>;
const en: Record<Label, string> = {
  catalog: 'Protocol catalogue', experiment: 'Laboratory', discovery: 'Discovery', expert: 'Expert',
  topology: 'Network topology', sequence: 'Event sequence', inspector: 'Packet inspector',
  play: 'Play', pause: 'Pause', previous: 'Previous', next: 'Next', reset: 'Reset',
  speed: 'Speed', theme: 'Theme', language: 'Language', objective: 'Learning objective',
  minutes: 'min', modelled: 'Educational model · not a real capture',
  start: 'Explore', back: 'All protocols', step: 'Step', network: 'Network & transport',
  web: 'Web & services', security: 'Security', noBytes: 'No verified raw bytes for this modelled event.',
  layers: 'Modelled fields', resume: 'Resume', learn: 'Follow a packet, understand the exchange', status: 'Progress'
};
const fr: Record<Label, string> = {
  catalog: 'Catalogue des protocoles', experiment: 'Laboratoire', discovery: 'Découverte', expert: 'Expert',
  topology: 'Topologie réseau', sequence: 'Séquence des échanges', inspector: 'Inspecteur de paquets',
  play: 'Lecture', pause: 'Pause', previous: 'Précédent', next: 'Suivant', reset: 'Réinitialiser',
  speed: 'Vitesse', theme: 'Thème', language: 'Langue', objective: 'Objectif pédagogique',
  minutes: 'min', modelled: 'Modèle pédagogique · pas une capture réelle',
  start: 'Explorer', back: 'Tous les protocoles', step: 'Étape', network: 'Réseau & transport',
  web: 'Web & services', security: 'Sécurité', noBytes: 'Aucun octet brut vérifié pour cet événement modélisé.',
  layers: 'Champs modélisés', resume: 'Reprendre', learn: 'Suivre un paquet, comprendre les échanges', status: 'Progression'
};
/** UI localization only. Narrative content remains French pending professional translations. */
const extras: Record<Exclude<Language, 'fr' | 'en'>, Messages> = {
  es: { catalog: 'Catálogo de protocolos', experiment: 'Laboratorio', discovery: 'Descubrimiento', expert: 'Experto', topology: 'Topología de red', sequence: 'Secuencia', inspector: 'Inspector de paquetes', play: 'Reproducir', pause: 'Pausar', previous: 'Anterior', next: 'Siguiente', reset: 'Reiniciar', language: 'Idioma', theme: 'Tema', start: 'Explorar', back: 'Protocolos' },
  pt: { catalog: 'Catálogo de protocolos', experiment: 'Laboratório', discovery: 'Descoberta', expert: 'Especialista', topology: 'Topologia da rede', sequence: 'Sequência', inspector: 'Inspetor de pacotes', play: 'Reproduzir', pause: 'Pausar', previous: 'Anterior', next: 'Próximo', reset: 'Reiniciar', language: 'Idioma', theme: 'Tema', start: 'Explorar', back: 'Protocolos' },
  de: { catalog: 'Protokollkatalog', experiment: 'Labor', discovery: 'Entdecken', expert: 'Experte', topology: 'Netzwerktopologie', sequence: 'Ablauf', inspector: 'Paketinspektor', play: 'Abspielen', pause: 'Pause', previous: 'Zurück', next: 'Weiter', reset: 'Zurücksetzen', language: 'Sprache', theme: 'Design', start: 'Erkunden', back: 'Protokolle' },
  tr: { catalog: 'Protokol kataloğu', experiment: 'Laboratuvar', discovery: 'Keşif', expert: 'Uzman', topology: 'Ağ topolojisi', sequence: 'Olay dizisi', inspector: 'Paket inceleyici', play: 'Oynat', pause: 'Duraklat', previous: 'Önceki', next: 'Sonraki', reset: 'Sıfırla', language: 'Dil', theme: 'Tema', start: 'Keşfet', back: 'Protokoller' },
  uk: { catalog: 'Каталог протоколів', experiment: 'Лабораторія', discovery: 'Огляд', expert: 'Експерт', topology: 'Топологія мережі', sequence: 'Послідовність', inspector: 'Інспектор пакетів', play: 'Відтворити', pause: 'Пауза', previous: 'Назад', next: 'Далі', reset: 'Скинути', language: 'Мова', theme: 'Тема', start: 'Дослідити', back: 'Протоколи' },
  id: { catalog: 'Katalog protokol', experiment: 'Laboratorium', discovery: 'Penjelajahan', expert: 'Ahli', topology: 'Topologi jaringan', sequence: 'Urutan', inspector: 'Pemeriksa paket', play: 'Putar', pause: 'Jeda', previous: 'Sebelumnya', next: 'Berikutnya', reset: 'Atur ulang', language: 'Bahasa', theme: 'Tema', start: 'Jelajahi', back: 'Protokol' },
  ja: { catalog: 'プロトコル一覧', experiment: 'ラボ', discovery: '入門', expert: '専門', topology: 'ネットワーク構成', sequence: '通信シーケンス', inspector: 'パケット解析', play: '再生', pause: '一時停止', previous: '前へ', next: '次へ', reset: 'リセット', language: '言語', theme: 'テーマ', start: '探索', back: '一覧' },
  'zh-CN': { catalog: '协议目录', experiment: '实验室', discovery: '入门', expert: '专家', topology: '网络拓扑', sequence: '事件序列', inspector: '数据包检查器', play: '播放', pause: '暂停', previous: '上一步', next: '下一步', reset: '重置', language: '语言', theme: '主题', start: '探索', back: '所有协议' },
  'zh-TW': { catalog: '協定目錄', experiment: '實驗室', discovery: '入門', expert: '專家', topology: '網路拓樸', sequence: '事件序列', inspector: '封包檢視器', play: '播放', pause: '暫停', previous: '上一步', next: '下一步', reset: '重設', language: '語言', theme: '主題', start: '探索', back: '所有協定' },
  ko: { catalog: '프로토콜 목록', experiment: '실험실', discovery: '기초', expert: '전문가', topology: '네트워크 토폴로지', sequence: '이벤트 순서', inspector: '패킷 검사기', play: '재생', pause: '일시 정지', previous: '이전', next: '다음', reset: '초기화', language: '언어', theme: '테마', start: '탐색', back: '모든 프로토콜' },
  hi: { catalog: 'प्रोटोकॉल सूची', experiment: 'प्रयोगशाला', discovery: 'परिचय', expert: 'विशेषज्ञ', topology: 'नेटवर्क टोपोलॉजी', sequence: 'घटना क्रम', inspector: 'पैकेट निरीक्षक', play: 'चलाएँ', pause: 'रोकें', previous: 'पिछला', next: 'अगला', reset: 'रीसेट', language: 'भाषा', theme: 'थीम', start: 'खोजें', back: 'सभी प्रोटोकॉल' },
  ar: { catalog: 'دليل البروتوكولات', experiment: 'المختبر', discovery: 'اكتشاف', expert: 'خبير', topology: 'طوبولوجيا الشبكة', sequence: 'تسلسل الأحداث', inspector: 'فاحص الحزم', play: 'تشغيل', pause: 'إيقاف مؤقت', previous: 'السابق', next: 'التالي', reset: 'إعادة ضبط', language: 'اللغة', theme: 'المظهر', start: 'استكشف', back: 'كل البروتوكولات' },
  he: { catalog: 'קטלוג פרוטוקולים', experiment: 'מעבדה', discovery: 'היכרות', expert: 'מומחה', topology: 'טופולוגיית רשת', sequence: 'רצף אירועים', inspector: 'בדיקת מנות', play: 'הפעל', pause: 'השהה', previous: 'הקודם', next: 'הבא', reset: 'איפוס', language: 'שפה', theme: 'ערכת נושא', start: 'חקור', back: 'כל הפרוטוקולים' }
};
export const label = (lang: Language, key: Label): string =>
  (lang === 'fr' ? fr : lang === 'en' ? en : extras[lang])[key] ?? en[key];
export const languageSupported = (candidate: string): candidate is Language =>
  languages.some(l => l.code === candidate);
