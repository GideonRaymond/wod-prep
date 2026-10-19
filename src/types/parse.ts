import type { PartOutline, Wod, WorkoutPart } from "@/schemas/wod";

/**
 * One line of the streamed parse (newline-delimited JSON): the structure first, then each part as
 * it's read, then the whole workout, or an error at any point.
 */
export type ParseEvent =
  | { type: "outline"; parts: PartOutline[] }
  | { type: "part"; index: number; part: WorkoutPart }
  | { type: "done"; wod: Wod }
  | { type: "error"; error: string };
