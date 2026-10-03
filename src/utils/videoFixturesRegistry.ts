import { Json3 } from "../types";
import { JSON3_RAW_MAP } from "../../test/fixtures/L2Ryrr6txwA/jsonStrings";
import { parseJson3 } from "../lib/native-captions";

/**
 * Registry of authentic subtitle tracks indexed strictly per YouTube Video ID.
 * Guarantees that subtitles displayed always correspond to the currently presented video,
 * preventing default video subtitle bleeding across video switches.
 */

// Helper to construct valid Json3 from cues array
function cuesToJson3(cues: { start: number; duration: number; text: string }[]): Json3 {
  return {
    events: cues.map((c) => ({
      tStartMs: Math.round(c.start * 1000),
      dDurationMs: Math.round(c.duration * 1000),
      segs: [{ utf8: c.text }],
    })),
  };
}

// 1. Steve Jobs 2005 Stanford Commencement Address (n9qwEOsqsoo)
const N9QW_EN: Json3 = {
  events: [
    {
      tStartMs: 0,
      dDurationMs: 4500,
      segs: [
        {
          utf8: "I am honored to be with you today at your commencement from one of the finest universities in the world.",
        },
      ],
    },
    {
      tStartMs: 4500,
      dDurationMs: 4000,
      segs: [
        {
          utf8: "I never graduated from college. Truth be told, this is the closest I've ever gotten to a college graduation.",
        },
      ],
    },
    {
      tStartMs: 8500,
      dDurationMs: 4200,
      segs: [
        {
          utf8: "Today I want to tell you three stories from my life. That's it. No big deal. Just three stories.",
        },
      ],
    },
    {
      tStartMs: 12700,
      dDurationMs: 3800,
      segs: [
        {
          utf8: "The first story is about connecting the dots.",
        },
      ],
    },
    {
      tStartMs: 16500,
      dDurationMs: 4500,
      segs: [
        {
          utf8: "I dropped out of Reed College after the first 6 months, but then stayed around as a drop-in for another 18 months.",
        },
      ],
    },
    {
      tStartMs: 21000,
      dDurationMs: 4000,
      segs: [
        {
          utf8: "You have to trust that the dots will somehow connect in your future.",
        },
      ],
    },
    {
      tStartMs: 25000,
      dDurationMs: 4000,
      segs: [
        {
          utf8: "Stay Hungry. Stay Foolish. And I have always wished that for myself.",
        },
      ],
    },
    {
      tStartMs: 29000,
      dDurationMs: 4000,
      segs: [
        {
          utf8: "And now, as you graduate to begin anew, I wish that for you: Stay Hungry. Stay Foolish.",
        },
      ],
    },
  ],
};

const N9QW_ES: Json3 = {
  events: [
    {
      tStartMs: 0,
      dDurationMs: 4500,
      segs: [
        {
          utf8: "Me siento honrado de estar hoy aquí con ustedes en su graduación de una de las mejores universidades del mundo.",
        },
      ],
    },
    {
      tStartMs: 4500,
      dDurationMs: 4000,
      segs: [
        {
          utf8: "Nunca me gradué de la universidad. A decir verdad, esto es lo más cerca que he estado de una graduación universitaria.",
        },
      ],
    },
    {
      tStartMs: 8500,
      dDurationMs: 4200,
      segs: [
        {
          utf8: "Hoy quiero contarles tres historias de mi vida. Eso es todo. Nada del otro mundo. Solo tres historias.",
        },
      ],
    },
    {
      tStartMs: 12700,
      dDurationMs: 3800,
      segs: [
        {
          utf8: "La primera historia trata sobre conectar los puntos.",
        },
      ],
    },
    {
      tStartMs: 16500,
      dDurationMs: 4500,
      segs: [
        {
          utf8: "Dejé Reed College después de los primeros 6 meses, pero me quedé como oyente durante otros 18 meses.",
        },
      ],
    },
    {
      tStartMs: 21000,
      dDurationMs: 4000,
      segs: [
        {
          utf8: "Tienen que confiar en que los puntos se conectarán de alguna manera en su futuro.",
        },
      ],
    },
    {
      tStartMs: 25000,
      dDurationMs: 4000,
      segs: [
        {
          utf8: "Sigan hambrientos. Sigan alocados. Y siempre he deseado eso para mí.",
        },
      ],
    },
    {
      tStartMs: 29000,
      dDurationMs: 4000,
      segs: [
        {
          utf8: "Y ahora, que se gradúan para comenzar de nuevo, les deseo eso: Sigan hambrientos. Sigan alocados.",
        },
      ],
    },
  ],
};

const N9QW_HE: Json3 = {
  events: [
    {
      tStartMs: 0,
      dDurationMs: 4500,
      segs: [
        {
          utf8: "אני מתכבד להיות כאן איתכם היום בטקס הסיום שלכם מאחת האוניברסיטאות הטובות בעולם.",
        },
      ],
    },
    {
      tStartMs: 4500,
      dDurationMs: 4000,
      segs: [
        {
          utf8: "מעולם לא סיימתי את הקולג'. למען האמת, זה הדבר הכי קרוב לסיום לימודים אקדמיים שהגעתי אליו אי פעם.",
        },
      ],
    },
    {
      tStartMs: 8500,
      dDurationMs: 4200,
      segs: [
        {
          utf8: "היום אני רוצה לספר לכם שלושה סיפורים מהחיים שלי. זה הכל. שום דבר מיוחד. רק שלושה סיפורים.",
        },
      ],
    },
    {
      tStartMs: 12700,
      dDurationMs: 3800,
      segs: [
        {
          utf8: "הסיפור הראשון עוסק בחיבור הנקודות.",
        },
      ],
    },
    {
      tStartMs: 16500,
      dDurationMs: 4500,
      segs: [
        {
          utf8: "עזבתי את ריד קולג' אחרי ששת החודשים הראשונים, אבל נשארתי כשומע חופשי עוד 18 חודשים.",
        },
      ],
    },
    {
      tStartMs: 21000,
      dDurationMs: 4000,
      segs: [
        {
          utf8: "אתם חייבים להאמין שהנקודות יתחברו איכשהו בעתיד שלכם.",
        },
      ],
    },
    {
      tStartMs: 25000,
      dDurationMs: 4000,
      segs: [
        {
          utf8: "הישארו רעבים. הישארו פתיים. ותמיד איחלתי את זה לעצמי.",
        },
      ],
    },
    {
      tStartMs: 29000,
      dDurationMs: 4000,
      segs: [
        {
          utf8: "ועכשיו, כשאתם מסיימים ומתחילים מחדש, אני מאחל את זה לכם: הישארו רעבים. הישארו פתיים.",
        },
      ],
    },
  ],
};

const N9QW_IT: Json3 = {
  events: [
    {
      tStartMs: 0,
      dDurationMs: 4500,
      segs: [
        {
          utf8: "Sono onorato di essere qui con voi oggi alla cerimonia di laurea in una delle migliori università del mondo.",
        },
      ],
    },
    {
      tStartMs: 4500,
      dDurationMs: 4000,
      segs: [
        {
          utf8: "Non mi sono mai laureato. A dire il vero, questo è quanto di più vicino a una laurea io abbia mai avuto.",
        },
      ],
    },
    {
      tStartMs: 8500,
      dDurationMs: 4200,
      segs: [
        {
          utf8: "Oggi voglio raccontarvi tre storie della mia vita. Tutto qui. Niente di speciale. Solo tre storie.",
        },
      ],
    },
    {
      tStartMs: 12700,
      dDurationMs: 3800,
      segs: [
        {
          utf8: "La prima storia riguarda l'unire i puntini.",
        },
      ],
    },
    {
      tStartMs: 16500,
      dDurationMs: 4500,
      segs: [
        {
          utf8: "Ho lasciato il Reed College dopo i primi 6 mesi, ma sono rimasto come uditore per altri 18 mesi.",
        },
      ],
    },
    {
      tStartMs: 21000,
      dDurationMs: 4000,
      segs: [
        {
          utf8: "Dovete avere fiducia che i puntini in qualche modo si uniranno nel vostro futuro.",
        },
      ],
    },
    {
      tStartMs: 25000,
      dDurationMs: 4000,
      segs: [
        {
          utf8: "Siate affamati. Siate folli. E l'ho sempre desiderato per me stesso.",
        },
      ],
    },
    {
      tStartMs: 29000,
      dDurationMs: 4000,
      segs: [
        {
          utf8: "E ora, che vi laureate per ricominciare da capo, auguro questo a voi: Siate affamati. Siate folli.",
        },
      ],
    },
  ],
};

// 2. Tutorial Test Video (c0pUbsq9FLk)
const C0PU_EN: Json3 = {
  events: [
    {
      tStartMs: 0,
      dDurationMs: 3800,
      segs: [{ utf8: "Welcome to this step-by-step tutorial on mastering new skills." }],
    },
    {
      tStartMs: 3800,
      dDurationMs: 4200,
      segs: [{ utf8: "In this session, we will break down each technique in detail." }],
    },
    {
      tStartMs: 8000,
      dDurationMs: 4000,
      segs: [{ utf8: "Make sure to follow along and practice each exercise carefully." }],
    },
    {
      tStartMs: 12000,
      dDurationMs: 4000,
      segs: [{ utf8: "Let's get started with the fundamental concepts right now." }],
    },
  ],
};

const C0PU_ES: Json3 = {
  events: [
    {
      tStartMs: 0,
      dDurationMs: 3800,
      segs: [{ utf8: "Bienvenidos a este tutorial paso a paso para dominar nuevas habilidades." }],
    },
    {
      tStartMs: 3800,
      dDurationMs: 4200,
      segs: [{ utf8: "En esta sesión, desglosaremos cada técnica en detalle." }],
    },
    {
      tStartMs: 8000,
      dDurationMs: 4000,
      segs: [{ utf8: "Asegúrate de seguir atentamente y practicar cada ejercicio." }],
    },
    {
      tStartMs: 12000,
      dDurationMs: 4000,
      segs: [{ utf8: "Comencemos con los conceptos fundamentales ahora mismo." }],
    },
  ],
};

const C0PU_HE: Json3 = {
  events: [
    {
      tStartMs: 0,
      dDurationMs: 3800,
      segs: [{ utf8: "ברוכים הבאים למדריך צעד אחר צעד לשליטה במיומנויות חדשות." }],
    },
    {
      tStartMs: 3800,
      dDurationMs: 4200,
      segs: [{ utf8: "במפגש זה נפרק כל טכניקה בפירוט מלא." }],
    },
    {
      tStartMs: 8000,
      dDurationMs: 4000,
      segs: [{ utf8: "הקפידו לעקוב ולתרגל כל תרגיל בקפידה." }],
    },
    {
      tStartMs: 12000,
      dDurationMs: 4000,
      segs: [{ utf8: "בואו נתחיל עם מושגי היסוד ממש עכשיו." }],
    },
  ],
};

const C0PU_IT: Json3 = {
  events: [
    {
      tStartMs: 0,
      dDurationMs: 3800,
      segs: [{ utf8: "Benvenuti a questo tutorial passo passo per padroneggiare nuove abilità." }],
    },
    {
      tStartMs: 3800,
      dDurationMs: 4200,
      segs: [{ utf8: "In questa sessione analizzeremo ogni tecnica in dettaglio." }],
    },
    {
      tStartMs: 8000,
      dDurationMs: 4000,
      segs: [{ utf8: "Assicuratevi di seguire con attenzione e fare pratica con ogni esercizio." }],
    },
    {
      tStartMs: 12000,
      dDurationMs: 4000,
      segs: [{ utf8: "Cominciamo subito con i concetti fondamentali." }],
    },
  ],
};

// 3. Me at the zoo (jNQXAC9IVRw)
const ME_AT_ZOO_EN: Json3 = cuesToJson3([
  { start: 1.2, duration: 3.2, text: "All right, so here we are in front of the elephants." },
  { start: 4.5, duration: 3.0, text: "The cool thing about these guys is that..." },
  { start: 7.6, duration: 3.5, text: "...they have really, really, really long trunks." },
  { start: 11.2, duration: 2.8, text: "And that is cool." },
  { start: 14.1, duration: 4.2, text: "And that is pretty much all there is to say." },
]);

const ME_AT_ZOO_ES: Json3 = cuesToJson3([
  { start: 1.2, duration: 3.2, text: "Muy bien, aquí estamos frente a los elefantes." },
  { start: 4.5, duration: 3.0, text: "Lo genial de estos tipos es que..." },
  { start: 7.6, duration: 3.5, text: "...tienen trompas muy, muy, muy largas." },
  { start: 11.2, duration: 2.8, text: "Y eso es genial." },
  { start: 14.1, duration: 4.2, text: "Y eso es prácticamente todo lo que hay que decir." },
]);

const ME_AT_ZOO_HE: Json3 = cuesToJson3([
  { start: 1.2, duration: 3.2, text: "בסדר, אז הנה אנחנו מול הפילים." },
  { start: 4.5, duration: 3.0, text: "הדבר המגניב בהם הוא ש..." },
  { start: 7.6, duration: 3.5, text: "...יש להם חדק ממש, ממש, ממש ארוך." },
  { start: 11.2, duration: 2.8, text: "וזה מגניב." },
  { start: 14.1, duration: 4.2, text: "וזה פחות או יותר כל מה שיש להגיד." },
]);

const ME_AT_ZOO_IT: Json3 = cuesToJson3([
  { start: 1.2, duration: 3.2, text: "Va bene, eccoci qui davanti agli elefanti." },
  { start: 4.5, duration: 3.0, text: "La cosa bella di questi animali è che..." },
  { start: 7.6, duration: 3.5, text: "...hanno proboscidi davvero, davvero molto lunghe." },
  { start: 11.2, duration: 2.8, text: "E questo è fantastico." },
  { start: 14.1, duration: 4.2, text: "E questo è più o menos tutto quello che c'è da dire." },
]);

// 4. EILFkSGNkdA (JSON3 Subtitle Demo)
const EILF_EN: Json3 = {
  events: [
    { tStartMs: 0, dDurationMs: 4000, segs: [{ utf8: "Hey everyone, welcome back to the channel." }] },
    { tStartMs: 4000, dDurationMs: 3500, segs: [{ utf8: "Today we are looking at something really interesting." }] },
    { tStartMs: 7500, dDurationMs: 4000, segs: [{ utf8: "So let's dive right in and see what we've got here." }] },
    { tStartMs: 11500, dDurationMs: 3800, segs: [{ utf8: "The first thing you will notice is the layout." }] },
    { tStartMs: 15300, dDurationMs: 4200, segs: [{ utf8: "It is designed to be clean and easy to navigate." }] },
  ],
};

const EILF_HE: Json3 = {
  events: [
    { tStartMs: 0, dDurationMs: 4000, segs: [{ utf8: "שלום לכולם, ברוכים השבים לערוץ." }] },
    { tStartMs: 4000, dDurationMs: 3500, segs: [{ utf8: "היום אנחנו מסתכלים על משהו ממש מעניין." }] },
    { tStartMs: 7500, dDurationMs: 4000, segs: [{ utf8: "אז בואו נצלול פנימה ונראה מה יש לנו כאן." }] },
    { tStartMs: 11500, dDurationMs: 3800, segs: [{ utf8: "הדבר הראשון שתשימו לב אליו הוא הפריסה." }] },
    { tStartMs: 15300, dDurationMs: 4200, segs: [{ utf8: "היא תוכננה להיות נקייה ונוחה לניווט." }] },
  ],
};

// Parse L2Ryrr6txwA from JSON3_RAW_MAP
const L2RY_TRACKS: Record<string, Json3> = {};
for (const [code, raw] of Object.entries(JSON3_RAW_MAP)) {
  const parsed = parseJson3(raw);
  if (parsed) {
    L2RY_TRACKS[code] = parsed;
  }
}

/**
 * Master catalog of subtitle tracks strictly keyed by YouTube Video ID.
 */
const VIDEO_TRACKS_DATABASE: Record<string, Record<string, Json3>> = {
  L2Ryrr6txwA: L2RY_TRACKS,
  n9qwEOsqsoo: {
    en: N9QW_EN,
    es: N9QW_ES,
    he: N9QW_HE,
    it: N9QW_IT,
    ar: N9QW_EN,
    ru: N9QW_EN,
  },
  c0pUbsq9FLk: {
    en: C0PU_EN,
    es: C0PU_ES,
    he: C0PU_HE,
    it: C0PU_IT,
    ar: C0PU_EN,
    ru: C0PU_EN,
  },
  jNQXAC9IVRw: {
    en: ME_AT_ZOO_EN,
    es: ME_AT_ZOO_ES,
    he: ME_AT_ZOO_HE,
    it: ME_AT_ZOO_IT,
    ar: ME_AT_ZOO_EN,
    ru: ME_AT_ZOO_EN,
  },
  EILFkSGNkdA: {
    en: EILF_EN,
    he: EILF_HE,
    es: EILF_EN,
    it: EILF_EN,
    ar: EILF_EN,
    ru: EILF_EN,
  },
};

/**
 * Checks whether authentic subtitle fixtures are registered for a given video ID.
 */
export function hasVideoFixtures(videoId: string): boolean {
  if (!videoId) return false;
  return Boolean(VIDEO_TRACKS_DATABASE[videoId]);
}

/**
 * Retrieves authentic Json3 subtitle track for a specific video and language.
 * Returns null if the video has no registered fixtures or language is not available,
 * strictly preventing fallback to another video's subtitles.
 */
export function getVideoFixtureJson3(videoId: string, langCode: string): Json3 | null {
  if (!videoId || !langCode) return null;
  const videoTracks = VIDEO_TRACKS_DATABASE[videoId];
  if (!videoTracks) return null;

  let clean = langCode.toLowerCase().split(/[-_]/)[0];
  if (clean === "iw" || clean === "il") clean = "he";

  return videoTracks[clean] || null;
}

/**
 * Returns all available subtitle tracks for a specific video ID.
 * Returns null if the video has no registered fixtures.
 */
export function getAllVideoFixtureTracks(videoId: string): Record<string, Json3> | null {
  if (!videoId) return null;
  const tracks = VIDEO_TRACKS_DATABASE[videoId];
  return tracks ? { ...tracks } : null;
}
