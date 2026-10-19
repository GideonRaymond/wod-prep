import type { ReferenceVideo } from "@/schemas/videos";

/** The body areas a cool-down stretches, from the hips down, then the trunk and arms. */
export const STRETCH_AREAS = [
  "hip flexors",
  "quads",
  "glutes",
  "hamstrings",
  "adductors",
  "calves",
  "lower back",
  "upper back",
  "lats",
  "shoulders",
  "chest",
  "triceps",
  "forearms",
] as const;
export type StretchArea = (typeof STRETCH_AREAS)[number];

export type Stretch = {
  name: string;
  /** What it stretches, most of all first. */
  areas: StretchArea[];
  /** How long to hold it, or how many slow reps. */
  dose: string;
  /** Anything besides the floor, a wall or the rig. */
  equipment?: string;
  video: ReferenceVideo;
};

const youtube = (id: string, title: string, duration: string): ReferenceVideo => ({
  title,
  url: `https://www.youtube.com/watch?v=${id}`,
  duration,
});

const HOLD = "45-60 s each side";

/**
 * Cool-down stretches, each with a short demo. Every area has a few to choose from, so the same
 * movements don't always get the same stretch. Swap a video by editing its entry.
 */
export const STRETCHES: Stretch[] = [
  // Hip flexors and quads
  {
    name: "Couch stretch",
    areas: ["hip flexors", "quads"],
    dose: HOLD,
    video: youtube("d9pOjXCKGN8", "The Couch Stretch Done Correctly", "3:48"),
  },
  {
    name: "Half-kneeling hip flexor stretch",
    areas: ["hip flexors"],
    dose: HOLD,
    video: youtube(
      "gqoPYLUgP48",
      "Bulletproof Step-by-step Guide to the Half Kneeling Hip Flexor Stretch",
      "1:00",
    ),
  },
  {
    name: "Low lunge",
    areas: ["hip flexors", "quads"],
    dose: HOLD,
    video: youtube("sOiI4kPgGA4", "Low Lunge Hip Flexor Stretch", "1:16"),
  },
  {
    name: "Lizard pose",
    areas: ["hip flexors", "adductors", "glutes"],
    dose: HOLD,
    video: youtube("jXk5dquBT6w", "Lizard Pose for hips", "0:35"),
  },
  {
    name: "Standing quad stretch",
    areas: ["quads"],
    dose: "30-45 s each side",
    video: youtube(
      "aNXGOpP37CY",
      "The CORRECT Way to do a Standing Quad Stretch // Great for Balance!",
      "0:41",
    ),
  },
  {
    name: "Side-lying quad stretch",
    areas: ["quads", "hip flexors"],
    dose: HOLD,
    video: youtube("SapC8SML6mc", "Sidelying Quad Stretch", "0:35"),
  },

  // Glutes
  {
    name: "Pigeon pose",
    areas: ["glutes"],
    dose: "60 s each side",
    video: youtube(
      "lqCqETr7Q0g",
      "How to Do a Pigeon Pose: A Guide from Physical Therapists",
      "1:16",
    ),
  },
  {
    name: "Figure-four stretch on your back",
    areas: ["glutes"],
    dose: HOLD,
    video: youtube("xVq2-g_leTI", "Supine Piriformis Stretch (Figure 4)", "0:32"),
  },
  {
    name: "90/90 hip stretch",
    areas: ["glutes", "adductors"],
    dose: HOLD,
    video: youtube("t4Zz6-aG8Iw", "90 90 Hip Stretch (Best Hip Mobility Exercise!)", "1:01"),
  },
  {
    name: "Seated glute stretch",
    areas: ["glutes", "lower back"],
    dose: HOLD,
    video: youtube(
      "e3DZzHcwk3o",
      "Seated Glute Stretch to Relieve Deep Butt and Hip Tightness",
      "1:29",
    ),
  },

  // Hamstrings
  {
    name: "Standing forward fold",
    areas: ["hamstrings", "lower back", "calves"],
    dose: "60 s",
    video: youtube(
      "goN4rWbQUn4",
      "Standing Forward Fold - Stretch Hamstrings and Lower Back",
      "0:57",
    ),
  },
  {
    name: "Seated hamstring stretch",
    areas: ["hamstrings"],
    dose: HOLD,
    video: youtube("u55F2jOzBVI", "How to do a seated hamstring stretch", "0:39"),
  },
  {
    name: "Banded hamstring stretch on your back",
    areas: ["hamstrings"],
    dose: HOLD,
    equipment: "Resistance band",
    video: youtube("Il1L75v6gq0", "Hamstring Stretch with a Strap, Supine - Ask Doctor Jo", "0:39"),
  },
  {
    name: "Pyramid pose",
    areas: ["hamstrings", "calves"],
    dose: HOLD,
    video: youtube("T-4YI52xe_I", "Pyramid Pose for Stretching Hamstrings", "0:59"),
  },

  // Adductors
  {
    name: "Frog stretch",
    areas: ["adductors"],
    dose: "60 s",
    video: youtube("20ZWXZPQbpI", "How To Stretch A TIGHT GROIN (Frog Stretch)", "1:00"),
  },
  {
    name: "Butterfly stretch",
    areas: ["adductors"],
    dose: "60 s",
    video: youtube(
      "MdE_Cj6ChLo",
      "Butterfly Stretch for Better Hip Mobility - CORE Chiropractic",
      "1:01",
    ),
  },
  {
    name: "Side lunge stretch",
    areas: ["adductors", "hamstrings"],
    dose: HOLD,
    video: youtube("nV3RsHokRqw", "How to do a side lunge adductor stretch", "0:53"),
  },
  {
    name: "Seated straddle",
    areas: ["adductors", "hamstrings"],
    dose: "60 s",
    video: youtube(
      "Zi3hKf_M_Ds",
      "Seated Straddle - Fix Tight Inner Thigh and Groin Muscles NOW!",
      "1:36",
    ),
  },

  // Calves and ankles
  {
    name: "Wall calf stretch",
    areas: ["calves"],
    dose: HOLD,
    video: youtube("tUA4MO1kXV8", "Wall calf stretch for calf pain", "0:33"),
  },
  {
    name: "Downward dog with calf pedal",
    areas: ["calves", "hamstrings", "shoulders"],
    dose: "60 s",
    video: youtube("pA7xyM3S7LI", "Calf Stretch in Downward Dog Mobility Exercise", "0:37"),
  },
  {
    name: "Knee-to-wall ankle stretch",
    areas: ["calves"],
    dose: "10 slow reps each side",
    video: youtube("hJtARZbOTDU", "Ankle Exercise Knee to Wall Stretch", "0:34"),
  },
  {
    name: "Soleus stretch",
    areas: ["calves"],
    dose: HOLD,
    video: youtube("RCjNN6JfSmE", "Soleus Stretch - Ask Doctor Jo", "0:38"),
  },

  // Lower back
  {
    name: "Child's pose",
    areas: ["lower back", "lats"],
    dose: "60 s",
    video: youtube(
      "LZgABs0IggM",
      "How to Do a Child's Pose: A Guide from Physical Therapists",
      "1:08",
    ),
  },
  {
    name: "Knees to chest",
    areas: ["lower back", "glutes"],
    dose: "60 s",
    video: youtube("LugNxxfIdvo", "Double Knee to Chest", "0:42"),
  },
  {
    name: "Supine spinal twist",
    areas: ["lower back", "upper back", "glutes"],
    dose: HOLD,
    video: youtube("mNdJti7ZwKI", "Supine Spinal Twist for Spine Mobility", "1:16"),
  },
  {
    name: "Cat-cow",
    areas: ["lower back", "upper back"],
    dose: "10 slow reps",
    video: youtube(
      "1Y0YjXS9sKI",
      "How to Do a Cat Cow Stretch: A Guide from Physical Therapists",
      "1:03",
    ),
  },

  // Upper back and lats
  {
    name: "Thread the needle",
    areas: ["upper back", "shoulders"],
    dose: "8 slow reps each side",
    video: youtube(
      "SkQhKf74nZk",
      "How to Do a Thread the Needle Stretch: A Guide from Physical Therapists",
      "1:14",
    ),
  },
  {
    name: "Open book",
    areas: ["upper back", "chest"],
    dose: "8 slow reps each side",
    video: youtube("YMswmjk7Qj4", "Thoracic Rotation Open Book", "0:57"),
  },
  {
    name: "Puppy pose",
    areas: ["lats", "upper back", "shoulders"],
    dose: "60 s",
    video: youtube("i1-bFRjloeI", "Yoga: How To Do Puppy Pose", "0:39"),
  },
  {
    name: "Banded lat stretch",
    areas: ["lats", "shoulders"],
    dose: HOLD,
    equipment: "Resistance band",
    video: youtube("8I4yXpbCeU8", "Banded Lat Stretch", "0:51"),
  },
  {
    name: "Elbows-on-box lat stretch",
    areas: ["lats", "triceps", "upper back"],
    dose: "60 s",
    equipment: "Box",
    video: youtube("o5Xoaodk8AA", "Bench Stretch for Tight Lats and Thoracic Mobility", "0:38"),
  },

  // Shoulders, chest and arms
  {
    name: "Cross-body shoulder stretch",
    areas: ["shoulders", "upper back"],
    dose: "30-45 s each side",
    video: youtube("aIq0fLi8iak", "Shoulder Crossbody Stretch", "0:20"),
  },
  {
    name: "Sleeper stretch",
    areas: ["shoulders"],
    dose: HOLD,
    video: youtube("N5iLptL5nfA", "The Correct Way to Perform the Sleeper Stretch", "0:36"),
  },
  {
    name: "Banded shoulder distraction",
    areas: ["shoulders", "lats"],
    dose: HOLD,
    equipment: "Resistance band",
    video: youtube("deLK82XIsew", "Banded Shoulder Distraction", "0:31"),
  },
  {
    name: "Overhead triceps stretch",
    areas: ["triceps", "lats"],
    dose: "30-45 s each side",
    video: youtube("_IOHtPSYGbk", "Tricep Stretch", "0:21"),
  },
  {
    name: "Pec stretch on the rig",
    areas: ["chest", "shoulders"],
    dose: HOLD,
    video: youtube("CEQMx4zFwYs", "Doorway Pec Stretch", "0:45"),
  },
  {
    name: "Lying chest stretch",
    areas: ["chest", "shoulders"],
    dose: HOLD,
    video: youtube("tatrv67rou8", "Prone Chest Stretch", "0:38"),
  },
  {
    name: "Wrist flexor stretch",
    areas: ["forearms"],
    dose: "30 s each side",
    video: youtube(
      "i-JV2PsFzWA",
      "Wrist Flexor Stretches with Elbow Extension - Ask Doctor Jo",
      "0:29",
    ),
  },
  {
    name: "Wrist extensor stretch",
    areas: ["forearms"],
    dose: "30 s each side",
    video: youtube(
      "80Y3HHMgo6w",
      "Wrist Extensor Stretch with Elbow Extension - Ask Doctor Jo",
      "0:27",
    ),
  },
];

/**
 * Which areas a movement works, matched on its name; the first rule that matches wins, so
 * specific movements come before general ones ("Thruster" before "Squat", "Ring Row" before "Row").
 */
export const MOVEMENT_AREAS: { match: RegExp; areas: StretchArea[] }[] = [
  { match: /thruster|wall ?ball/, areas: ["quads", "glutes", "shoulders", "hip flexors"] },
  {
    match: /overhead squat|\bohs\b/,
    areas: ["quads", "glutes", "adductors", "shoulders", "lats", "calves"],
  },
  { match: /handstand|hspu/, areas: ["shoulders", "triceps", "upper back", "forearms"] },
  {
    match: /snatch/,
    areas: ["hamstrings", "glutes", "quads", "shoulders", "lats", "upper back", "forearms"],
  },
  {
    match: /clean|jerk/,
    areas: ["hamstrings", "glutes", "quads", "shoulders", "upper back", "forearms"],
  },
  { match: /pistol|lunge|step[- ]?up/, areas: ["quads", "glutes", "hip flexors", "calves"] },
  { match: /squat/, areas: ["quads", "glutes", "adductors", "hip flexors", "calves"] },
  { match: /box jump|broad jump|burpee box/, areas: ["quads", "calves", "glutes"] },
  {
    match: /deadlift|rdl|good ?morning|swing|hip thrust/,
    areas: ["hamstrings", "glutes", "lower back", "forearms"],
  },
  {
    match:
      /toes[- ]?to[- ]?bar|t2b|knees[- ]?to[- ]?elbow|sit[- ]?up|ghd|v[- ]?up|hollow|l[- ]?sit/,
    areas: ["hip flexors", "lower back", "lats"],
  },
  {
    match: /pull[- ]?up|chin[- ]?up|muscle[- ]?up|rope climb|ring row|hang/,
    areas: ["lats", "shoulders", "forearms", "upper back"],
  },
  { match: /burpee/, areas: ["chest", "shoulders", "hip flexors", "quads"] },
  { match: /push[- ]?up|dip|bench press/, areas: ["chest", "triceps", "shoulders"] },
  { match: /press/, areas: ["shoulders", "triceps", "upper back"] },
  { match: /\bski/, areas: ["lats", "triceps", "lower back", "hamstrings"] },
  { match: /\brow/, areas: ["hamstrings", "lower back", "lats", "hip flexors", "forearms"] },
  { match: /run|sprint|jog/, areas: ["calves", "hip flexors", "hamstrings", "quads"] },
  { match: /bike|assault|echo|airdyne/, areas: ["quads", "hip flexors", "glutes"] },
  { match: /double[- ]?under|single[- ]?under|jump rope|skip/, areas: ["calves"] },
  {
    match: /farmer|carry|sandbag|yoke|sled/,
    areas: ["forearms", "upper back", "lower back", "glutes"],
  },
  { match: /get[- ]?up/, areas: ["shoulders", "glutes", "hip flexors"] },
];

/** For movements no rule names, by their category. */
export const CATEGORY_AREAS: Record<string, StretchArea[]> = {
  weightlifting: ["hamstrings", "glutes", "lower back"],
  gymnastics: ["lats", "shoulders"],
  monostructural: ["calves", "hip flexors"],
  other: ["hip flexors", "lower back"],
};
