import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/** Shared Claude client. Reads ANTHROPIC_API_KEY from the environment. */
export const anthropic = new Anthropic();

export const MODEL = "claude-opus-5-5";

/** For quick steps where speed matters more than depth, like finding a workout's structure. */
export const FAST_MODEL = "claude-haiku-5-5";
