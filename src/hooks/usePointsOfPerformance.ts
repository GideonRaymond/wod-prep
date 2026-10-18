import { useCallback, useState } from "react";
import {
  requestPointsOfPerformance,
  type PointsOfPerformanceResult,
} from "@/services/pointsOfPerformanceApi";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | ({ status: "success" } & PointsOfPerformanceResult);

/**
 * Loads a movement's points of performance on demand: call `load()` when they're first needed.
 * Calling it again after a success does nothing; after an error it retries.
 */
export function usePointsOfPerformance(name: string) {
  const [state, setState] = useState<State>({ status: "idle" });

  const load = useCallback(async () => {
    if (state.status === "loading" || state.status === "success") return;
    setState({ status: "loading" });
    try {
      setState({ status: "success", ...(await requestPointsOfPerformance(name)) });
    } catch (err) {
      setState({
        status: "error",
        error: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }, [name, state.status]);

  return { ...state, load };
}
