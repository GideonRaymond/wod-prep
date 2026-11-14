import { useSyncExternalStore } from "react";
import { loginStore, type LoginState, type LoginStore } from "@/stores/loginStore";

const CLOSED: LoginState = { open: false, reason: null, exampleWanted: false };

/** The login popup's state (see loginStore); closed while rendering on the server. */
export function useLoginState(store: LoginStore = loginStore): LoginState {
  return useSyncExternalStore(store.subscribe, store.get, () => CLOSED);
}
