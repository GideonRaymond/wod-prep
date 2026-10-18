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
      {
        fault: "Heels come off the floor",
        fix: "Sit the hips back and keep the weight in the heels",
        cue: "Heels down!",
      },
      {
        fault: "Knees cave in",
        fix: "Push the knees out in line with the toes",
        cue: "Knees out!",
      },
      {
        fault: "Lower back rounds at the bottom",
        fix: "Keep the chest up and the lower back arched",
        cue: "Chest up!",
      },
      {
        fault: "Not reaching depth",
        fix: "Sit until the hip crease is below the knee, every rep",
        cue: "Below parallel!",
      },
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
      {
        fault: "Elbows drop and the bar rolls forward",
        fix: "Drive the elbows up so the bar stays on the shoulders",
        cue: "Elbows up!",
      },
      {
        fault: "Weight shifts onto the toes",
        fix: "Keep the weight over the heels and drive through them",
        cue: "Drive the heels!",
      },
      {
        fault: "Knees cave in",
        fix: "Push the knees out in line with the toes",
        cue: "Knees out!",
      },
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
      {
        fault: "Hips shoot up first (good-morning squat)",
        fix: "Lead with the chest so hips and shoulders rise together",
        cue: "Chest up!",
      },
      {
        fault: "Heels come up",
        fix: "Keep the weight in the heels throughout",
        cue: "Heels down!",
      },
      {
        fault: "Knees cave in",
        fix: "Push the knees out in line with the toes",
        cue: "Knees out!",
      },
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
      {
        fault: "Bar drifts forward",
        fix: "Press up and slightly back into the bar, armpits forward",
        cue: "Push up!",
      },
      {
        fault: "Elbows bend",
        fix: "Lock the elbows and keep pressing into the bar",
        cue: "Lock it out!",
      },
      {
        fault: "Chest drops at the bottom",
        fix: "Keep the chest up and the shoulders active",
        cue: "Chest up!",
      },
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
      {
        fault: "Pressing before the hips open",
        fix: "Finish the hip drive before the arms start the press",
        cue: "Hips, then press!",
      },
      {
        fault: "Elbows drop in the bottom",
        fix: "Keep the elbows high in the front rack all the way down",
        cue: "Elbows up!",
      },
      {
        fault: "Bar finishes in front of the body",
        fix: "Push the head through so the bar ends over the mid-foot",
        cue: "Head through!",
      },
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
      {
        fault: "Shallow squat",
        fix: "Squat until the hip crease is below the knee",
        cue: "Get low!",
      },
      {
        fault: "Throwing with the arms only",
        fix: "Let the leg drive launch the ball, then finish with the arms",
        cue: "Use your legs!",
      },
      {
        fault: "Ball goes out instead of up",
        fix: "Stand closer to the wall and throw straight up",
        cue: "Up, not out!",
      },
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
      {
        fault: "Back rounds",
        fix: "Brace the midline and set the back flat before pulling",
        cue: "Flat back!",
      },
      {
        fault: "Hips rise first",
        fix: "Push the floor away so hips and shoulders rise together",
        cue: "Push the floor!",
      },
      {
        fault: "Bar drifts away from the legs",
        fix: "Keep the bar in contact with the legs the whole way",
        cue: "Bar close!",
      },
    ],
  },
  {
    names: ["Sumo Deadlift"],
    cues: [
      "Wide stance, toes turned out",
      "Narrow grip, hands inside the knees",
      "Knees pushed out over the toes",
      "Chest up, back flat, bar over the middle of the foot",
      "Push the floor apart and drive the hips forward",
      "Finish at full hip and knee extension",
    ],
    faults: [
      {
        fault: "Knees cave in",
        fix: "Push the knees out in line with the toes",
        cue: "Knees out!",
      },
      {
        fault: "Hips rise first",
        fix: "Push the floor away so hips and shoulders rise together",
        cue: "Chest up!",
      },
      {
        fault: "Back rounds",
        fix: "Brace the midline and set the back flat before pulling",
        cue: "Flat back!",
      },
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
      {
        fault: "Pulling with the arms early",
        fix: "Keep the arms long until the hips have fully opened",
        cue: "Hips first!",
      },
      {
        fault: "Elbows stay low",
        fix: "Lead the pull with the elbows, high and outside",
        cue: "Elbows high!",
      },
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
      {
        fault: "Hips sag",
        fix: "Squeeze the glutes and pull the ribs down to stay in one line",
        cue: "Tight body!",
      },
      {
        fault: "Partial range of motion",
        fix: "Lower until the chest touches and lock out at the top",
        cue: "Chest to floor!",
      },
      { fault: "Elbows flare out", fix: "Keep the elbows back at about 45°", cue: "Elbows in!" },
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
      {
        fault: "Chin doesn't clear the bar",
        fix: "Keep pulling until the chin is over the bar",
        cue: "Chin over!",
      },
      {
        fault: "Arms stay bent at the bottom",
        fix: "Return to fully straight arms every rep",
        cue: "Full hang!",
      },
      {
        fault: "Kipping from the legs",
        fix: "Drive the kip from the shoulders with a hollow and arch",
        cue: "Hollow, arch!",
      },
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
      {
        fault: "Feet don't touch or touch one at a time",
        fix: "Bring both feet up together to touch the bar",
        cue: "Feet together!",
      },
      {
        fault: "Swing gets out of control",
        fix: "Push down on the bar and stay tight through the midline",
        cue: "Push the bar away!",
      },
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
      {
        fault: "Not opening the hips at the top",
        fix: "Stand all the way up before the jump",
        cue: "Stand tall!",
      },
      {
        fault: "Lower back strains on the way up",
        fix: "Brace the midline as you push up from the floor",
        cue: "Brace!",
      },
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
      {
        fault: "Not standing tall on the box",
        fix: "Open the hips fully on top of the box",
        cue: "Stand tall!",
      },
      {
        fault: "Landing on the toes at the edge",
        fix: "Jump far enough to land with the whole foot on the box",
        cue: "Whole foot!",
      },
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
      {
        fault: "Squatting instead of hinging",
        fix: "Push the hips back and keep the shins nearly vertical",
        cue: "Hips back!",
      },
      {
        fault: "Lifting with the arms",
        fix: "Snap the hips so the bell floats up",
        cue: "Snap the hips!",
      },
      {
        fault: "Leaning back at the top",
        fix: "Keep the ribs down and the glutes squeezed",
        cue: "Ribs down!",
      },
    ],
  },
  {
    names: ["Kettlebell Snatch", "KB Snatch"],
    cues: [
      "Hinge and hike the bell back between the legs",
      "Snap the hips to drive the bell up",
      "Keep the bell close, elbow high",
      "Punch the hand through so the bell rolls onto the forearm",
      "Finish overhead, arm locked, biceps by the ear",
      "Tip the bell over and hinge to absorb on the way down",
    ],
    faults: [
      {
        fault: "Bell flips over and bangs the wrist",
        fix: "Loosen the grip and punch through before the bell turns over",
        cue: "Punch through!",
      },
      {
        fault: "Pressing the bell up with the arm",
        fix: "Let the hip snap float the bell up",
        cue: "Snap the hips!",
      },
      {
        fault: "Bell swings out in a wide arc",
        fix: "Pull the bell up close to the body",
        cue: "Zip it up!",
      },
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
      {
        fault: "Piking or kicking the feet back",
        fix: "Jump straight up and keep the feet under you",
        cue: "Straight up!",
      },
      {
        fault: "Arms swing wide",
        fix: "Keep the elbows in and turn the rope with the wrists",
        cue: "Wrists!",
      },
    ],
  },
  {
    names: ["Crossover", "Criss-cross", "Jump Rope Crossover"],
    cues: [
      "Start with a steady single-under bounce",
      "Cross the arms as the rope passes overhead",
      "Cross deep: hands reach toward the opposite hips",
      "Keep the hands low so the loop stays open",
      "Uncross on the next jump",
      "Small, quick jumps on the balls of the feet",
    ],
    faults: [
      {
        fault: "Loop is too small and catches the feet",
        fix: "Cross deeper, with the hands out past the hips",
        cue: "Cross deep!",
      },
      {
        fault: "Crossing too late",
        fix: "Start crossing as the rope passes overhead",
        cue: "Cross early!",
      },
      {
        fault: "Hands rise up to the chest",
        fix: "Keep the hands at hip height",
        cue: "Hands low!",
      },
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
      {
        fault: "Pulling with the arms early",
        fix: "Keep the arms long until the hips have fully opened",
        cue: "Hips first!",
      },
      {
        fault: "Knees rise before the hands pass them",
        fix: "On the way back: arms, then body, then legs",
        cue: "Hands first!",
      },
      { fault: "Hunched back", fix: "Sit tall with the chest up", cue: "Sit tall!" },
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
      {
        fault: "Overstriding onto the heel",
        fix: "Take shorter, quicker steps landing under the hips",
        cue: "Quick feet!",
      },
      {
        fault: "Bending at the waist",
        fix: "Stay tall and lean from the ankles",
        cue: "Run tall!",
      },
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
      {
        fault: "Leaning back",
        fix: "Pull the ribs down and squeeze the glutes",
        cue: "Ribs down!",
      },
      {
        fault: "Bar finishes in front",
        fix: "Push the head through so the bar ends over the mid-foot",
        cue: "Head through!",
      },
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
      {
        fault: "Dipping forward onto the toes",
        fix: "Dip straight down with the heels on the floor",
        cue: "Straight down!",
      },
      {
        fault: "Pressing before the drive",
        fix: "Let the leg drive finish before the press",
        cue: "Drive, then press!",
      },
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
      {
        fault: "Pressing the bar out instead of getting under",
        fix: "Push yourself down under the bar instead",
        cue: "Punch under!",
      },
      {
        fault: "Elbows soft in the catch",
        fix: "Lock the arms the moment you catch",
        cue: "Lock out!",
      },
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
      {
        fault: "Pulling with the arms early",
        fix: "Keep the arms long until the hips have fully opened",
        cue: "Hips first!",
      },
      {
        fault: "Bar swings away from the body",
        fix: "Keep the bar close to the body throughout the pull",
        cue: "Bar close!",
      },
      {
        fault: "Slow elbows",
        fix: "Whip the elbows around fast into the front rack",
        cue: "Fast elbows!",
      },
    ],
  },
  {
    names: ["Squat Clean", "Clean", "Full Clean"],
    cues: [
      "Start like a deadlift, bar over the middle of the foot",
      "Keep the bar close to the body",
      "Extend the hips and knees explosively, then shrug",
      "Pull yourself under into a full front squat",
      "Fast elbows into the front rack",
      "Ride the bounce out of the bottom and stand",
    ],
    faults: [
      {
        fault: "Pulling with the arms early",
        fix: "Keep the arms long until the hips have fully opened",
        cue: "Hips first!",
      },
      {
        fault: "Elbows drop in the bottom",
        fix: "Drive the elbows up as you catch and stand",
        cue: "Elbows up!",
      },
      {
        fault: "Bar crashes onto the shoulders",
        fix: "Pull under actively to meet the bar",
        cue: "Meet the bar!",
      },
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
      {
        fault: "Pulling with the arms early",
        fix: "Keep the arms long until the hips have fully opened",
        cue: "Hips first!",
      },
      {
        fault: "Bar loops away from the body",
        fix: "Keep the bar close to the body throughout the pull",
        cue: "Bar close!",
      },
      {
        fault: "Soft elbows overhead",
        fix: "Punch up and lock the arms as you receive",
        cue: "Punch!",
      },
    ],
  },
  {
    names: ["Squat Snatch", "Snatch", "Full Snatch"],
    cues: [
      "Wide grip, bar over the middle of the foot",
      "Keep the bar close to the body",
      "Extend the hips and knees explosively, then shrug",
      "Pull under aggressively into a full overhead squat",
      "Catch with the arms locked, bar over the middle of the foot",
      "Stand with the bar still locked out",
    ],
    faults: [
      {
        fault: "Pulling with the arms early",
        fix: "Keep the arms long until the hips have fully opened",
        cue: "Hips first!",
      },
      {
        fault: "Catching high and riding down",
        fix: "Pull yourself under to full depth",
        cue: "Get under!",
      },
      {
        fault: "Pressing out after the catch",
        fix: "Punch up and lock the arms as you land",
        cue: "Punch!",
      },
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
      {
        fault: "Arching the back",
        fix: "Pull the ribs down and squeeze the glutes",
        cue: "Ribs down!",
      },
      {
        fault: "Not locking out",
        fix: "Press until the arms are fully straight",
        cue: "Lock out!",
      },
    ],
  },
  {
    names: ["Sit-up", "AbMat Sit-up"],
    cues: [
      "Soles of the feet together, knees out",
      "Shoulders touch the floor behind you",
      "Sit all the way up and touch your feet",
    ],
    faults: [
      {
        fault: "Not touching the feet",
        fix: "Sit all the way up and reach to the feet",
        cue: "Touch your toes!",
      },
    ],
  },
];
