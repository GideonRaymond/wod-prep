import { loginStore, type LoginOutcome, type LoginStore } from "@/stores/loginStore";

/**
 * A request that needed a login and didn't get one: the popup was closed, or the example
 * workout was chosen instead. `message` is the API's, for showing as the error.
 */
export class LoginNeededError extends Error {
  constructor(
    message: string,
    readonly outcome: Exclude<LoginOutcome, "in">,
  ) {
    super(message);
  }
}

/**
 * Fetches like `fetch`, but when the API answers that it needs a login (a workout that isn't
 * cached yet), opens the login popup and waits: once logged in, it asks again; otherwise it
 * throws LoginNeededError. Any other answer comes back as it is.
 */
export async function fetchWithLogin(
  url: string,
  init: RequestInit,
  store: LoginStore = loginStore,
): Promise<Response> {
  const res = await fetch(url, init);
  if (res.status !== 401) return res;
  const data = await res
    .clone()
    .json()
    .catch(() => null);
  if (!data?.login) return res;

  const outcome = await store.request(data.error);
  if (outcome !== "in") throw new LoginNeededError(data.error, outcome);
  return fetch(url, init);
}

/** Logs in with the site password; resolves to an error message, or null once logged in. */
export async function logIn(password: string): Promise<string | null> {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return data.error ?? "Couldn't log in. Try again.";
}
