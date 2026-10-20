// Every user-facing string in the app, in English and Spanish.
//
// The two dictionaries are kept exactly parallel: tools/check.mjs fails the build if a key
// exists in one and not the other. Spanish is written for a beginner, not for a glossary —
// where a term has no plain Spanish equivalent, the sentence explains it in plain words.

export const STR = {
  en: {
    docTitle: 'Prāṇa — a quiet yoga practice',
    docDesc:
      'Build a short, gentle yoga sequence for the body you have today. Works offline, no account, no tracking.',
    tagline: 'a quiet practice, one breath at a time',
    skip: 'Skip to the practice',
    library: 'Browse the poses',
    libraryShort: 'Poses',
    install: 'Install',
    about: 'About',
    themeToDark: 'Switch to dark mode',
    themeToLight: 'Switch to light mode',
    savedOffline: 'Saved for offline',
    notSaved: 'Saving for offline',
    langLabel: 'Language',

    homeTitle: 'Come back to your body.',
    homeLede:
      'Tell us how today feels and we will build a short practice to match: a warm-up, the shapes your body is asking for, and a quiet finish.',
    groupSession: 'Kind of session',
    groupFocus: 'Where are you tight',
    groupFocusHint: 'pick up to three',
    focusLimit: 'Three at a time is enough.',
    groupLength: 'Length',
    groupEffort: 'Effort',
    build: 'Build my session',
    safety:
      'Yoga is not medical care. Move without sharp pain, and check with a clinician first if you are pregnant, injured or managing a condition.',

    sessionTitle: 'Your session',
    begin: 'Begin practice',
    shuffle: 'Shuffle',
    print: 'Print sheet',
    change: 'Change the settings',
    whyFor: 'Chosen for',
    whyBalanced: 'Fits the',
    nextUp: 'Next',
    care: 'Go easy with',
    stepsHow: 'How to get there',
    emptyTitle: 'Nothing to build from',
    emptyBody:
      'Every pose in the library was ruled out by the areas you picked. Try choosing fewer areas, or a gentler effort.',

    libraryTitle: 'Browse the poses',
    librarySearch: 'Search a pose by name or area',
    libraryAll: 'All',
    libraryCount: 'poses',
    libraryNoResult: 'No pose matches that. Try a different word, or clear the filters.',
    level: 'Effort',
    close: 'Close',

    playerOf: 'of',
    breathe: 'breathe',
    breathIn: 'in',
    breathOut: 'out',
    pause: 'Pause',
    resume: 'Resume',
    next: 'Next pose',
    previous: 'Previous pose',
    exit: 'Leave the practice',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    upNext: 'Up next',
    holdFor: 'Hold',
    playerSteps: 'Steps',
    playerHint: 'Leave at any time with the cross, or press escape.',
    playerLeft: 'left',
    playerLeftEs: 'restantes',

    aboutTitle: 'About Prāṇa',
    aboutP1:
      'Prāṇa is the Sanskrit word for breath. A practice is not a workout: it is a few minutes of paying attention to what your body is doing.',
    aboutP2:
      'Everything runs on your device. No account, no tracking, nothing sent anywhere. Once the page has loaded it works with the network off.',
    aboutP3:
      'Sequences are assembled from a small library by rules, not by a person. If something does not feel right, leave it out.',
    credit: 'Drawings by YogaPhilippines.com, CC BY 4.0',
    creditLink: 'How to credit these drawings',

    errorTitle: 'Something went wrong',
    errorBody: 'The page could not be built. Reload and try again.',
  },

  es: {
    docTitle: 'Prāṇa — una práctica tranquila de yoga',
    docDesc:
      'Crea una secuencia de yoga corta y suave para el cuerpo que tienes hoy. Funciona sin conexión, sin cuenta y sin rastreo.',
    tagline: 'una práctica tranquila, respiración a respiración',
    skip: 'Ir a la práctica',
    library: 'Ver las posturas',
    libraryShort: 'Posturas',
    install: 'Instalar',
    about: 'Acerca de',
    themeToDark: 'Cambiar a modo oscuro',
    themeToLight: 'Cambiar a modo claro',
    savedOffline: 'Guardado sin conexión',
    notSaved: 'Preparando sin conexión',
    langLabel: 'Idioma',

    homeTitle: 'Vuelve a tu cuerpo.',
    homeLede:
      'Cuéntanos cómo está hoy tu cuerpo y armaremos una práctica corta a medida: un calentamiento, las posturas que te piden, y un final tranquilo.',
    groupSession: 'Tipo de sesión',
    groupFocus: 'Dónde tienes tensión',
    groupFocusHint: 'elige hasta tres',
    focusLimit: 'Tres a la vez es suficiente.',
    groupLength: 'Duración',
    groupEffort: 'Intensidad',
    build: 'Crear mi secuencia',
    safety:
      'El yoga no es atención médica. Muévete sin dolor agudo y consulta con un profesional si estás embarazada, lesionada o en tratamiento.',

    sessionTitle: 'Tu secuencia',
    begin: 'Empezar la práctica',
    shuffle: 'Reordenar',
    print: 'Imprimir la hoja',
    change: 'Cambiar los ajustes',
    whyFor: 'Elegida para',
    whyBalanced: 'Encaja con la sesión de',
    nextUp: 'Sigue',
    care: 'Ten en cuenta',
    stepsHow: 'Cómo llegar',
    emptyTitle: 'No queda nada',
    emptyBody:
      'Todas las posturas de la biblioteca quedaron descartadas por las zonas que elegiste. Prueba con menos zonas o con menos intensidad.',

    libraryTitle: 'Ver las posturas',
    librarySearch: 'Busca una postura por nombre o por zona',
    libraryAll: 'Todas',
    libraryCount: 'posturas',
    libraryNoResult: 'Ninguna postura coincide. Prueba otra palabra o quita los filtros.',
    level: 'Intensidad',
    close: 'Cerrar',

    playerOf: 'de',
    breathe: 'respira',
    breathIn: 'inhala',
    breathOut: 'exhala',
    pause: 'Pausa',
    resume: 'Continuar',
    next: 'Siguiente postura',
    previous: 'Postura anterior',
    exit: 'Salir de la práctica',
    soundOn: 'Sonido activado',
    soundOff: 'Sonido desactivado',
    upNext: 'Sigue',
    holdFor: 'Mantén',
    playerSteps: 'Pasos',
    playerHint: 'Sal cuando quieras con la cruz, o pulsa escape.',
    playerLeft: 'restantes',
    playerLeftEs: 'restantes',

    aboutTitle: 'Acerca de Prāṇa',
    aboutP1:
      'Prāṇa es la palabra sánscrita para respiración. Una práctica no es un entrenamiento: son unos minutos prestando atención a lo que hace tu cuerpo.',
    aboutP2:
      'Todo funciona en tu dispositivo. Sin cuenta, sin rastreo y sin enviar nada a ningún sitio. Una vez cargada la página, funciona sin conexión.',
    aboutP3:
      'Las secuencias las arma un conjunto de reglas, no una persona. Si algo no te sienta bien, sáltatelo.',
    credit: 'Dibujos de YogaPhilippines.com, CC BY 4.0',
    creditLink: 'Cómo dar crédito a estos dibujos',

    errorTitle: 'Algo ha salido mal',
    errorBody: 'No se pudo construir la página. Recarga e inténtalo de nuevo.',
  },
};

// Session types, focus areas and effort levels. Their ids are shared between languages.
export const SESSION_TYPES = [
  { id: 'wake-up', label: { en: 'Wake up', es: 'Despertar' }, hint: { en: 'stiff, slow, want to move', es: 'rígido, despacio, quieres moverte' } },
  { id: 'desk-reset', label: { en: 'Desk reset', es: 'Pausa de escritorio' }, hint: { en: 'shoulders, wrists, a stiff neck', es: 'hombros, muñecas, cuello rígido' } },
  { id: 'unwind', label: { en: 'Unwind', es: 'Soltar' }, hint: { en: 'tense, wound up, cannot switch off', es: 'tenso, acelerado, no puedes parar' } },
  { id: 'sleep', label: { en: 'Sleep', es: 'Dormir' }, hint: { en: 'slow, long exhale', es: 'lento, exhalación larga' } },
  { id: 'strong', label: { en: 'Strong practice', es: 'Práctica fuerte' }, hint: { en: 'warm, strong, more load', es: 'caliente, fuerte, más carga' } },
];

export const FOCUS_AREAS = [
  { id: 'neck', label: { en: 'Neck', es: 'Cuello' } },
  { id: 'shoulders', label: { en: 'Shoulders', es: 'Hombros' } },
  { id: 'upper-back', label: { en: 'Upper back', es: 'Espalda alta' } },
  { id: 'lower-back', label: { en: 'Lower back', es: 'Zona lumbar' } },
  { id: 'hips', label: { en: 'Hips', es: 'Caderas' } },
  { id: 'hamstrings', label: { en: 'Hamstrings', es: 'Isquiotibiales' } },
  { id: 'thighs', label: { en: 'Thighs', es: 'Muslos' } },
  { id: 'knees', label: { en: 'Knees', es: 'Rodillas' } },
  { id: 'ankles', label: { en: 'Ankles', es: 'Tobillos' } },
  { id: 'wrists', label: { en: 'Wrists', es: 'Muñecas' } },
  { id: 'breath', label: { en: 'Tension and breathing', es: 'Tensión y respiración' } },
];

export const EFFORTS = [
  { id: 'gentle', label: { en: 'Gentle', es: 'Suave' } },
  { id: 'steady', label: { en: 'Steady', es: 'Constante' } },
  { id: 'strong', label: { en: 'Strong', es: 'Intensa' } },
];

export const LENGTHS = [10, 20, 30];
