import { MovementSchema, type Movement, type WorkoutPart } from "@/schemas/wod";

export const MAX_WOD_LENGTH = 2000;

export const MAX_MOVEMENT_NAME_LENGTH = 100;

export const EXAMPLE_WOD = `"Fran"
21-15-9 for time:
Thrusters (95/65 lb)
Pull-ups`;

export const FORMAT_LABELS: Record<WorkoutPart["format"], string> = {
  for_time: "For Time",
  amrap: "AMRAP",
  emom: "EMOM",
  rounds: "Rounds",
  intervals: "Intervals",
  strength: "Strength",
  other: "Workout",
};

export const MOVEMENT_CATEGORIES: readonly Movement["category"][] =
  MovementSchema.shape.category.options;
