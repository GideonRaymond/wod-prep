/** How the login popup ended: logged in, chose the example workout, or closed it. */
export type LoginOutcome = "in" | "example" | "cancel";

export type LoginState = {
  /** The popup is showing. */
  open: boolean;
  /** Why it's asking, from the API ("Log in to break down a new workout."). */
  reason: string | null;
  /** The example workout was chosen and the home page hasn't filled it in yet. */
  exampleWanted: boolean;
};

export type LoginStore = {
  get: () => LoginState;
  subscribe: (listener: () => void) => () => void;
  /**
   * Opens the popup and resolves with how it ended. Requests that need a login at the same time
   * (the workout page asks for several things at once) share the one popup and its outcome.
   */
  request: (reason: string) => Promise<LoginOutcome>;
  /** Closes the popup with an outcome; "example" also leaves the example wanted. */
  finish: (outcome: LoginOutcome) => void;
  /** Whether the example was wanted, clearing it, so it's filled in once. */
  takeExample: () => boolean;
};

const CLOSED: LoginState = { open: false, reason: null, exampleWanted: false };

/**
 * The login popup's state, shaped for `useSyncExternalStore`: API calls open it when they need a
 * login (see fetchWithLogin), the LoginDialog shows it, and the home page fills in the example
 * workout when that's what was chosen.
 */
export function createLoginStore(): LoginStore {
  let state = CLOSED;
  let pending: { promise: Promise<LoginOutcome>; resolve: (o: LoginOutcome) => void } | null = null;
  const listeners = new Set<() => void>();
  const update = (next: Partial<LoginState>) => {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  };

  return {
    get: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    request(reason) {
      if (pending) return pending.promise;
      let resolve!: (o: LoginOutcome) => void;
      const promise = new Promise<LoginOutcome>((r) => (resolve = r));
      pending = { promise, resolve };
      update({ open: true, reason });
      return promise;
    },
    finish(outcome) {
      const done = pending;
      pending = null;
      update({ open: false, reason: null, ...(outcome === "example" && { exampleWanted: true }) });
      done?.resolve(outcome);
    },
    takeExample() {
      if (!state.exampleWanted) return false;
      update({ exampleWanted: false });
      return true;
    },
  };
}

/** The app's one login popup. */
export const loginStore = createLoginStore();
