import { z } from "zod";
import { MAX_MOVEMENT_NAME_LENGTH } from "@/constants/wod";
import { WorkoutPartSchema } from "@/schemas/wod";

const text = (max: number) => z.string().trim().max(max);

/** What /api/board needs to redraw an edited part's whiteboard: the old board, and the part now. */
export const BoardPartSchema = z.object({
  board: z.array(text(200)).min(1).max(40),
  label: text(60).nullable(),
  title: text(120).min(1),
  format: WorkoutPartSchema.shape.format,
  rounds: text(200).nullable(),
  duration: text(200).nullable(),
  notes: text(1000).nullable(),
  movements: z
    .array(
      z.object({
        name: text(MAX_MOVEMENT_NAME_LENGTH).min(1),
        reps: text(200).nullable(),
        load: text(200).nullable(),
      }),
    )
    .max(30),
});

export const BoardRequestSchema = z.object({ parts: z.array(BoardPartSchema).min(1).max(10) });

/** The redrawn boards, one per part sent, in the same order. */
export const RedrawnBoardsSchema = z.object({
  parts: z.array(z.object({ board: WorkoutPartSchema.shape.board })),
});

export type BoardPart = z.infer<typeof BoardPartSchema>;
export type BoardRequest = z.infer<typeof BoardRequestSchema>;
