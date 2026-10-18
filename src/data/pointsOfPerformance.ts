import type { PointsOfPerformance } from "@/schemas/pointsOfPerformance";

type CuratedEntry = PointsOfPerformance & {
  /** Names this movement is written as. Matched case-, punctuation- and plural-insensitively. */
  names: string[];
};

/**
 * Hand-written points of performance for common CrossFit movements. Movements not listed here
 * are looked up with Claude.
 */
export const CURATED_POINTS_OF_PERFORMANCE: CuratedEntry[] = [
  {
    names: ["Air Squat", "Squat", "Bodyweight Squat"],
    cues: [
      "Feet about shoulder-width, toes slightly out",
      "Hips back and down first",
      "Keep the lumbar curve the whole time",
      "Heels stay down, weight over the middle of the foot",
      "Knees track in line with the toes",
      "Hip crease below the top of the knee at the bottom",
      "Stand to full hip and knee extension",
    ],
    faults: [
      { fault: "Heels come off the floor", fix: "Sit back, weight in the heels" },
      { fault: "Knees cave in", fix: "Push the knees out over the toes" },
      { fault: "Lower back rounds at the bottom", fix: "Chest up, keep the back arched" },
      { fault: "Not reaching depth", fix: "Hip crease below the knee every rep" },
    ],
  },
  {
    names: ["Front Squat"],
    cues: [
      "Bar rests on the shoulders in the front rack, elbows high",
      "Loose fingertip grip just outside the shoulders",
      "Hips back and down, chest stays up",
      "Elbows stay high throughout",
      "Hip crease below the top of the knee",
      "Drive through the heels to full extension",
    ],
    faults: [
      { fault: "Elbows drop and the bar rolls forward", fix: "Elbows up, chest proud" },
      { fault: "Weight shifts onto the toes", fix: "Drive through the heels" },
      { fault: "Knees cave in", fix: "Knees out over the toes" },
    ],
  },
  {
    names: ["Back Squat"],
    cues: [
      "Bar on the upper back, hands just outside the shoulders",
      "Brace the midline before you descend",
      "Hips back and down, chest up",
      "Knees track over the toes",
      "Hip crease below the top of the knee",
      "Chest and hips rise together to full extension",
    ],
    faults: [
      { fault: "Hips shoot up first (good-morning squat)", fix: "Chest and hips rise together" },
      { fault: "Heels come up", fix: "Weight in the heels" },
      { fault: "Knees cave in", fix: "Push the knees out" },
    ],
  },
  {
    names: ["Overhead Squat", "OHS"],
    cues: [
      "Wide grip, arms locked out overhead",
      "Actively push up into the bar, armpits forward",
      "Bar stays over the middle of the foot",
      "Hips back and down, chest up",
      "Hip crease below the top of the knee",
      "Stand to full extension with the bar still locked out",
    ],
    faults: [
      { fault: "Bar drifts forward", fix: "Push up and back into the bar" },
      { fault: "Elbows bend", fix: "Lock the arms" },
      { fault: "Chest drops at the bottom", fix: "Chest up, active shoulders" },
    ],
  },
  {
    names: ["Thruster"],
    cues: [
      "Front rack with elbows high",
      "Front squat to full depth",
      "Drive out with the hips and legs",
      "Hips fully open before the arms press",
      "Finish with the bar overhead, arms locked, head through",
      "Bring the bar back to the rack as you descend",
    ],
    faults: [
      { fault: "Pressing before the hips open", fix: "Hips open, then press" },
      { fault: "Elbows drop in the bottom", fix: "Elbows up" },
      { fault: "Bar finishes in front of the body", fix: "Head through the window" },
    ],
  },
  {
    names: ["Wall Ball", "Wall Ball Shot"],
    cues: [
      "Hold the ball at chin height, elbows under it",
      "Squat below parallel",
      "Drive up explosively through the hips",
      "Use the leg drive to push the ball to the target",
      "Catch high and ride it straight into the next squat",
    ],
    faults: [
      { fault: "Shallow squat", fix: "Hip crease below the knee" },
      { fault: "Throwing with the arms only", fix: "Hips first, then arms" },
      { fault: "Ball goes out instead of up", fix: "Stand closer, throw up, not out" },
    ],
  },
  {
    names: ["Deadlift"],
    cues: [
      "Feet hip-width, bar over the middle of the foot",
      "Hands just outside the legs, arms straight",
      "Shoulders slightly in front of the bar, back flat",
      "Bar stays in contact with the legs",
      "Hips and shoulders rise together",
      "Finish at full hip and knee extension, lower on the same path",
    ],
    faults: [
      { fault: "Back rounds", fix: "Chest up, brace before you pull" },
      { fault: "Hips rise first", fix: "Push the floor away, shoulders and hips together" },
      { fault: "Bar drifts away from the legs", fix: "Keep the bar close" },
    ],
  },
  {
    names: ["Sumo Deadlift High Pull", "SDHP"],
    cues: [
      "Wide stance, narrow grip inside the legs",
      "Deadlift the bar with the hips and legs",
      "Explode through the hips and shrug",
      "Pull the elbows high and outside",
      "Bar to just below the chin",
      "Arms down first, then the hips",
    ],
    faults: [
      { fault: "Pulling with the arms early", fix: "Hips first, then arms" },
      { fault: "Elbows stay low", fix: "Elbows high and outside" },
    ],
  },
  {
    names: ["Push-up"],
    cues: [
      "Hands about shoulder-width",
      "Body in one straight line, midline braced",
      "Elbows back, not flared",
      "Chest touches the floor",
      "Lock out the arms at the top",
    ],
    faults: [
      { fault: "Hips sag", fix: "Squeeze the glutes, ribs down" },
      { fault: "Partial range of motion", fix: "Chest to the floor, arms locked out" },
      { fault: "Elbows flare out", fix: "Elbows back at about 45°" },
    ],
  },
  {
    names: ["Pull-up", "Kipping Pull-up", "Chin-up"],
    cues: [
      "Grip slightly wider than the shoulders",
      "Start from a full hang, arms straight",
      "Kip from the shoulders: hollow, then arch",
      "Chin clears the bar",
      "Return to straight arms every rep",
    ],
    faults: [
      { fault: "Chin doesn't clear the bar", fix: "Pull until the chin is over" },
      { fault: "Arms stay bent at the bottom", fix: "Full extension every rep" },
      { fault: "Kipping from the legs", fix: "Hollow and arch from the shoulders" },
    ],
  },
  {
    names: ["Toes-to-Bar", "T2B", "TTB"],
    cues: [
      "Start in an active hang",
      "Kip with a hollow and arch",
      "Push down on the bar to lift the legs",
      "Both feet touch the bar together, inside the hands",
      "Control the swing back into the next rep",
    ],
    faults: [
      { fault: "Feet don't touch or touch one at a time", fix: "Both feet together" },
      { fault: "Swing gets out of control", fix: "Push down on the bar, stay tight" },
    ],
  },
  {
    names: ["Burpee"],
    cues: [
      "Chest and thighs touch the ground at the bottom",
      "Hands next to the shoulders",
      "Jump or step the feet back under you",
      "Stand to full hip extension",
      "Small jump with a clap overhead",
    ],
    faults: [
      { fault: "Not opening the hips at the top", fix: "Stand tall before you jump" },
      { fault: "Lower back strains on the way up", fix: "Brace the midline" },
    ],
  },
  {
    names: ["Box Jump"],
    cues: [
      "Feet hip-width, jump off both feet",
      "Swing the arms and drive the hips",
      "Land softly with both full feet on the box",
      "Stand to full hip and knee extension on top",
      "Step down when tired to protect the Achilles",
    ],
    faults: [
      { fault: "Not standing tall on the box", fix: "Open the hips on top" },
      { fault: "Landing on the toes at the edge", fix: "Whole foot on the box" },
    ],
  },
  {
    names: ["Kettlebell Swing", "American Kettlebell Swing", "KB Swing"],
    cues: [
      "Hinge at the hips, weight in the heels",
      "Back flat, arms straight",
      "Snap the hips to drive the bell",
      "Arms guide the bell, they don't lift it",
      "Finish overhead, arms locked, bell bottom up",
    ],
    faults: [
      { fault: "Squatting instead of hinging", fix: "Hips back" },
      { fault: "Lifting with the arms", fix: "Snap the hips" },
      { fault: "Leaning back at the top", fix: "Ribs down, glutes tight" },
    ],
  },
  {
    names: ["Double-under", "DU"],
    cues: [
      "Tall posture, small knee bend",
      "Stay on the balls of the feet",
      "Elbows close to the body",
      "Spin the rope from the wrists",
      "One jump, two rope passes",
    ],
    faults: [
      { fault: "Piking or kicking the feet back", fix: "Jump straight up, feet under you" },
      { fault: "Arms swing wide", fix: "Elbows in, turn the wrists" },
    ],
  },
  {
    names: ["Row", "Rowing", "Row (calories)"],
    cues: [
      "Catch: shins vertical, arms straight, slight forward lean",
      "Drive with the legs, then swing the hips, then pull the arms",
      "Handle travels in a straight line",
      "Recovery in reverse: arms, hips, then legs",
    ],
    faults: [
      { fault: "Pulling with the arms early", fix: "Legs, body, arms" },
      { fault: "Knees rise before the hands pass them", fix: "Arms, body, legs on the way back" },
      { fault: "Hunched back", fix: "Sit tall" },
    ],
  },
  {
    names: ["Run", "Running"],
    cues: [
      "Run tall with a slight lean from the ankles",
      "Land on the middle of the foot, under the hips",
      "Quick, light steps",
      "Relaxed shoulders, arms swing front to back",
    ],
    faults: [
      { fault: "Overstriding onto the heel", fix: "Shorter, quicker steps" },
      { fault: "Bending at the waist", fix: "Run tall" },
    ],
  },
  {
    names: ["Shoulder Press", "Strict Press", "Press"],
    cues: [
      "Front rack, hands just outside the shoulders",
      "Elbows slightly in front of the bar",
      "Midline tight, glutes squeezed",
      "Press straight up, move the head out of the way",
      "Finish with the arms locked and the head through",
    ],
    faults: [
      { fault: "Leaning back", fix: "Ribs down, squeeze the glutes" },
      { fault: "Bar finishes in front", fix: "Head through the window" },
    ],
  },
  {
    names: ["Push Press"],
    cues: [
      "Front rack, hands just outside the shoulders",
      "Dip: knees and hips bend, torso upright, heels down",
      "Drive explosively with the legs",
      "Press as the leg drive finishes",
      "Finish with the arms locked overhead",
    ],
    faults: [
      { fault: "Dipping forward onto the toes", fix: "Straight down, heels down" },
      { fault: "Pressing before the drive", fix: "Drive, then press" },
    ],
  },
  {
    names: ["Push Jerk"],
    cues: [
      "Dip and drive like a push press",
      "Push yourself under the bar",
      "Land in a partial squat with the arms locked",
      "Stand to full extension with the bar overhead",
    ],
    faults: [
      { fault: "Pressing the bar out instead of getting under", fix: "Punch under" },
      { fault: "Elbows soft in the catch", fix: "Lock the arms" },
    ],
  },
  {
    names: ["Power Clean"],
    cues: [
      "Start like a deadlift, bar over the middle of the foot",
      "Keep the bar close to the body",
      "Extend the hips and knees explosively, then shrug",
      "Pull yourself under the bar",
      "Fast elbows into the front rack",
      "Receive above parallel, then stand",
    ],
    faults: [
      { fault: "Pulling with the arms early", fix: "Long arms until the hips open" },
      { fault: "Bar swings away from the body", fix: "Keep the bar close" },
      { fault: "Slow elbows", fix: "Fast elbows" },
    ],
  },
  {
    names: ["Power Snatch"],
    cues: [
      "Wide grip, bar over the middle of the foot",
      "Keep the bar close to the body",
      "Extend the hips and knees explosively, then shrug",
      "Pull under and punch the bar overhead",
      "Receive above parallel with the arms locked",
      "Bar finishes over the middle of the foot",
    ],
    faults: [
      { fault: "Pulling with the arms early", fix: "Long arms until the hips open" },
      { fault: "Bar loops away from the body", fix: "Keep the bar close" },
      { fault: "Soft elbows overhead", fix: "Punch and lock out" },
    ],
  },
  {
    names: ["Handstand Push-up", "HSPU"],
    cues: [
      "Hands slightly wider than the shoulders",
      "Lower with control until the head touches the floor",
      "Head and hands form a tripod",
      "Midline tight, ribs down",
      "Press to full lockout",
    ],
    faults: [
      { fault: "Arching the back", fix: "Ribs down, squeeze the glutes" },
      { fault: "Not locking out", fix: "Arms straight at the top" },
    ],
  },
  {
    names: ["Sit-up", "AbMat Sit-up"],
    cues: [
      "Soles of the feet together, knees out",
      "Shoulders touch the floor behind you",
      "Sit all the way up and touch your feet",
    ],
    faults: [{ fault: "Not touching the feet", fix: "Reach all the way to the feet" }],
  },
];
