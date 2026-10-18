import type { Wod, WorkoutPart } from "@/schemas/wod";

export const franPart: WorkoutPart = {
  label: null,
  title: "Fran",
  named: true,
  sourceText: '"Fran"\n21-15-9 for time:\nThrusters (95/65 lb)\nPull-ups',
  format: "for_time",
  duration: null,
  rounds: "21-15-9",
  notes: null,
  stimulus: {
    description:
      "Short and intense: a sprint that should finish in under 7 minutes. Light enough to keep thrusters unbroken early and pull-ups in big sets.",
    intensity: 9,
  },
  movements: [
    {
      name: "Thruster",
      originalText: "Thrusters (95/65 lb)",
      reps: "21-15-9",
      load: "95/65 lb",
      category: "weightlifting",
    },
    {
      name: "Pull-up",
      originalText: "Pull-ups",
      reps: "21-15-9",
      load: null,
      category: "gymnastics",
    },
  ],
};

export const fran: Wod = { parts: [franPart] };

/** A typical class: A strength, B metcon, then a cool-down. */
export const strengthAndMetcon: Wod = {
  parts: [
    {
      label: "A",
      title: "Heavy Back Squats",
      named: false,
      sourceText: "A) Back Squat 5x5",
      format: "strength",
      duration: "15 min",
      rounds: "5x5",
      notes: null,
      stimulus: { description: "Build to a heavy set of 5 with perfect positions.", intensity: 7 },
      movements: [
        {
          name: "Back Squat",
          originalText: "Back Squat 5x5",
          reps: "5x5",
          load: null,
          category: "weightlifting",
        },
      ],
    },
    { ...franPart, label: "B", sourceText: "B) 21-15-9 Thrusters (95/65 lb), Pull-ups" },
    {
      label: "Cool-down",
      title: "Easy Flush",
      named: false,
      sourceText: "Cool-down: 5 min easy row",
      format: "other",
      duration: "5 min",
      rounds: null,
      notes: null,
      stimulus: { description: "Easy flush to bring the heart rate down.", intensity: 2 },
      movements: [
        {
          name: "Row",
          originalText: "5 min easy row",
          reps: "5 min",
          load: null,
          category: "monostructural",
        },
      ],
    },
  ],
};
