export const COURSE_ID = "00000000-0000-0000-0000-000000000001";
export const COURSE_TITLE = "TitoGems Course";
export const UNLOCK_INTERVAL_DAYS = 7;
export const PASSING_SCORE = 70;

export const COURSE_PRICE_KOBO = Number(
  import.meta.env.VITE_COURSE_PRICE_KOBO || 500000
);
export const COURSE_CURRENCY = import.meta.env.VITE_COURSE_CURRENCY || "NGN";

export const formatCurrency = (amountKobo) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: COURSE_CURRENCY,
    maximumFractionDigits: 0,
  }).format(amountKobo / 100);

export const courseWeeks = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    weekNumber: 1,
    title: "Identity and Self Discovery",
    summary: "Clarify who you are, what shapes your identity, and how strengths and weaknesses affect growth.",
    unlockAfterDays: 0,
    materials: [
      {
        id: "m-week-1-pdf",
        type: "pdf",
        title: "Identity and Self Discovery Guide",
      },
      {
        id: "m-week-1-video",
        type: "video",
        title: "Identity and Self Discovery Video",
      },
    ],
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    weekNumber: 2,
    title: "Mindset Reset",
    summary: "Identify limiting beliefs, challenge old patterns, and begin reprogramming your mind with action.",
    unlockAfterDays: 7,
    materials: [
      {
        id: "m-week-2-pdf",
        type: "pdf",
        title: "Mindset Reset Guide",
      },
      {
        id: "m-week-2-video",
        type: "video",
        title: "Mindset Reset Video",
      },
    ],
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    weekNumber: 3,
    title: "Vision and SMART Goals",
    summary: "Define a clear vision, connect it to your values, and translate it into specific goals.",
    unlockAfterDays: 14,
    materials: [
      {
        id: "m-week-3-pdf",
        type: "pdf",
        title: "Vision and SMART Goals Guide",
      },
      {
        id: "m-week-3-video",
        type: "video",
        title: "Vision and SMART Goals Video",
      },
    ],
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    weekNumber: 4,
    title: "Discipline and Daily Habits",
    summary: "Build discipline through small routines, habit stacking, progress tracking, and consistency.",
    unlockAfterDays: 21,
    materials: [
      {
        id: "m-week-4-pdf",
        type: "pdf",
        title: "Discipline and Habits Guide",
      },
      {
        id: "m-week-4-video",
        type: "video",
        title: "Discipline and Habits Video",
      },
    ],
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    weekNumber: 5,
    title: "Confidence and Action",
    summary: "Overcome fear, stop waiting for perfect confidence, and turn clarity into steady action.",
    unlockAfterDays: 28,
    materials: [
      {
        id: "m-week-5-pdf",
        type: "pdf",
        title: "Confidence and Action Guide",
      },
      {
        id: "m-week-5-video",
        type: "video",
        title: "Confidence and Action Video",
      },
    ],
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    weekNumber: 6,
    title: "Personal Brand and Life System",
    summary: "Build a deliberate personal brand and organize priorities, goals, habits, and routines into a life system.",
    unlockAfterDays: 35,
    materials: [
      {
        id: "m-week-6-pdf",
        type: "pdf",
        title: "Personal Brand and Life System Guide",
      },
      {
        id: "m-week-6-video",
        type: "video",
        title: "Personal Brand and Life System Video",
      },
    ],
  },
];

export const demoQuizQuestions = {
  1: [
    {
      id: "demo-1-1",
      prompt: "According to Week 1, what can eventually become your reality?",
      options: [
        "Your identity",
        "Your phone model",
        "Your browser history",
        "Your password",
      ],
      correctOptionIndex: 0,
    },
    {
      id: "demo-1-2",
      prompt: "What is an important part of self discovery?",
      options: ["Ignoring weaknesses", "Understanding strengths and weaknesses", "Avoiding feedback", "Copying everyone else"],
      correctOptionIndex: 1,
    },
  ],
  2: [
    {
      id: "demo-2-1",
      prompt: "What are limiting beliefs?",
      options: [
        "Beliefs that constrain progress and achievement",
        "A list of weekly videos",
        "A payment receipt",
        "A type of quiz score",
      ],
      correctOptionIndex: 0,
    },
    {
      id: "demo-2-2",
      prompt: "What helps reprogram the mind?",
      options: ["Awareness, repetition, and action", "Waiting forever", "Avoiding small steps", "Only wishing"],
      correctOptionIndex: 0,
    },
  ],
  3: [
    {
      id: "demo-3-1",
      prompt: "What does a clear vision help you do?",
      options: ["Make better decisions", "Avoid all responsibility", "Remove all deadlines", "Stop learning"],
      correctOptionIndex: 0,
    },
    {
      id: "demo-3-2",
      prompt: "What does the S in SMART goals stand for?",
      options: ["Specific", "Silent", "Simple only", "Sudden"],
      correctOptionIndex: 0,
    },
  ],
  4: [
    {
      id: "demo-4-1",
      prompt: "How is discipline developed?",
      options: ["Through consistent habits, systems, actions, and mindset", "Only by motivation", "By avoiding goals", "By waiting for pressure"],
      correctOptionIndex: 0,
    },
    {
      id: "demo-4-2",
      prompt: "What does habit stacking mean?",
      options: ["Connecting a new habit to an existing routine", "Starting every goal too big", "Quitting after one missed day", "Ignoring progress"],
      correctOptionIndex: 0,
    },
  ],
  5: [
    {
      id: "demo-5-1",
      prompt: "What is courage described as?",
      options: ["Acting wisely despite fear", "Never feeling fear", "Avoiding action", "Waiting for perfect confidence"],
      correctOptionIndex: 0,
    },
    {
      id: "demo-5-2",
      prompt: "What is the bridge between ideas and results?",
      options: ["Taking action", "Overthinking", "Perfectionism", "Delay"],
      correctOptionIndex: 0,
    },
  ],
  6: [
    {
      id: "demo-6-1",
      prompt: "What is a personal brand?",
      options: [
        "The reputation, identity, and impression people associate with you",
        "Only a logo",
        "Only a slogan",
        "A private password",
      ],
      correctOptionIndex: 0,
    },
    {
      id: "demo-6-2",
      prompt: "What do systems help you do?",
      options: ["Keep moving consistently", "Avoid priorities", "Remove all routines", "Depend only on motivation"],
      correctOptionIndex: 0,
    },
  ],
};
