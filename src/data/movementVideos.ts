import type { ReferenceVideo } from "@/schemas/videos";

type CuratedVideo = {
  /** Names this movement is written as. Matched like the curated points of performance. */
  names: string[];
  video: ReferenceVideo;
};

/**
 * One hand-picked video per standard movement (the ones with curated points of performance),
 * mostly the official CrossFit channel's short demos. Other movements are found by searching
 * YouTube and letting Claude pick. Swap a video by changing its entry.
 */
export const CURATED_VIDEOS: CuratedVideo[] = [
  {
    names: ["Air Squat", "Squat", "Bodyweight Squat"],
    video: {
      title: "The Air Squat",
      url: "https://www.youtube.com/watch?v=rMvwVtlqjTE",
      duration: "1:01",
    },
  },
  {
    names: ["Front Squat"],
    video: {
      title: "The Front Squat",
      url: "https://www.youtube.com/watch?v=uYumuL_G_V0",
      duration: "1:06",
    },
  },
  {
    names: ["Back Squat"],
    video: {
      title: "The Back Squat",
      url: "https://www.youtube.com/watch?v=QmZAiBqPvZw",
      duration: "1:00",
    },
  },
  {
    names: ["Overhead Squat", "OHS"],
    video: {
      title: "The Overhead Squat",
      url: "https://www.youtube.com/watch?v=pn8mqlG0nkE",
      duration: "1:20",
    },
  },
  {
    names: ["Thruster"],
    video: {
      title: "The Thruster",
      url: "https://www.youtube.com/watch?v=L219ltL15zk",
      duration: "1:11",
    },
  },
  {
    names: ["Wall Ball", "Wall Ball Shot"],
    video: {
      title: "The Wall-Ball Shot",
      url: "https://www.youtube.com/watch?v=EqjGKsiIMCE",
      duration: "0:50",
    },
  },
  {
    names: ["Deadlift"],
    video: {
      title: "The Deadlift",
      url: "https://www.youtube.com/watch?v=1ZXobu7JvvE",
      duration: "1:12",
    },
  },
  {
    names: ["Sumo Deadlift"],
    video: {
      title: "The Sumo Deadlift",
      url: "https://www.youtube.com/watch?v=wQHSYDSgDn8",
      duration: "1:01",
    },
  },
  {
    names: ["Sumo Deadlift High Pull", "SDHP"],
    video: {
      title: "The Sumo Deadlift High Pull",
      url: "https://www.youtube.com/watch?v=gh55vVlwlQg",
      duration: "1:00",
    },
  },
  {
    names: ["Push-up"],
    video: {
      title: "The Push-Up",
      url: "https://www.youtube.com/watch?v=0pkjOk0EiAk",
      duration: "1:04",
    },
  },
  {
    names: ["Pull-up", "Kipping Pull-up", "Chin-up"],
    video: {
      title: "The Kipping Pull-up",
      url: "https://www.youtube.com/watch?v=lzRo-4pq_AY",
      duration: "1:22",
    },
  },
  {
    names: ["Toes-to-Bar", "T2B", "TTB"],
    video: {
      title: "The Kipping Toes-to-Bar",
      url: "https://www.youtube.com/watch?v=6dHvTlsMvNY",
      duration: "1:30",
    },
  },
  {
    names: ["Burpee"],
    video: {
      title: "The Burpee",
      url: "https://www.youtube.com/watch?v=auBLPXO8Fww",
      duration: "0:52",
    },
  },
  {
    names: ["Box Jump"],
    video: {
      title: "The Box Jump",
      url: "https://www.youtube.com/watch?v=NBY9-kTuHEk",
      duration: "0:45",
    },
  },
  {
    names: ["Kettlebell Swing", "American Kettlebell Swing", "KB Swing"],
    video: {
      title: "The Kettlebell Swing",
      url: "https://www.youtube.com/watch?v=mKDIuUbH94Q",
      duration: "1:00",
    },
  },
  {
    names: ["Kettlebell Snatch", "KB Snatch"],
    video: {
      title: "The Kettlebell Snatch",
      url: "https://www.youtube.com/watch?v=Pm-b2XFeABA",
      duration: "1:06",
    },
  },
  {
    names: ["Double-under", "DU"],
    video: {
      title: "The Double-Under",
      url: "https://www.youtube.com/watch?v=82jNjDS19lg",
      duration: "0:47",
    },
  },
  {
    names: ["Crossover", "Criss-cross", "Jump Rope Crossover"],
    video: {
      title: "Can You Do Crossovers?",
      url: "https://www.youtube.com/watch?v=NdMf8d6h2ps",
      duration: "0:41",
    },
  },
  {
    names: ["Row", "Rowing", "Row (calories)"],
    video: {
      title: "Rowing Technique Tips",
      url: "https://www.youtube.com/watch?v=fxfhQMbATCw",
      duration: "0:55",
    },
  },
  {
    names: ["Run", "Running"],
    video: {
      title: "CrossFit - Running Fundamentals (CrossFit Journal)",
      url: "https://www.youtube.com/watch?v=eAfxef1Cd0Y",
      duration: "3:03",
    },
  },
  {
    names: ["Shoulder Press", "Strict Press", "Press"],
    video: {
      title: "The Shoulder Press",
      url: "https://www.youtube.com/watch?v=5yWaNOvgFCM",
      duration: "0:55",
    },
  },
  {
    names: ["Push Press"],
    video: {
      title: "The Push Press",
      url: "https://www.youtube.com/watch?v=iaBVSJm78ko",
      duration: "1:03",
    },
  },
  {
    names: ["Push Jerk"],
    video: {
      title: "The Push Jerk",
      url: "https://www.youtube.com/watch?v=VrHNJXoSyXw",
      duration: "1:02",
    },
  },
  {
    names: ["Power Clean"],
    video: {
      title: "The Power Clean",
      url: "https://www.youtube.com/watch?v=KwYJTpQ_x5A",
      duration: "1:08",
    },
  },
  {
    names: ["Squat Clean", "Clean", "Full Clean"],
    video: {
      title: "The Clean",
      url: "https://www.youtube.com/watch?v=Ty14ogq_Vok",
      duration: "1:01",
    },
  },
  {
    names: ["Power Snatch"],
    video: {
      title: "The Power Snatch",
      url: "https://www.youtube.com/watch?v=TL8SMp7RdXQ",
      duration: "1:08",
    },
  },
  {
    names: ["Squat Snatch", "Snatch", "Full Snatch"],
    video: {
      title: "The Snatch",
      url: "https://www.youtube.com/watch?v=GhxhiehJcQY",
      duration: "1:15",
    },
  },
  {
    names: ["Handstand Push-up", "HSPU"],
    video: {
      title: "The Strict Handstand Push-Up",
      url: "https://www.youtube.com/watch?v=0wDEO6shVjc",
      duration: "0:49",
    },
  },
  {
    names: ["Sit-up", "AbMat Sit-up"],
    video: {
      title: "The AbMat Sit-Up",
      url: "https://www.youtube.com/watch?v=VIZX2Ru9qU8",
      duration: "0:55",
    },
  },
];
