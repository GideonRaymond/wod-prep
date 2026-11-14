"use client";

import { useId, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Dialog } from "@/components/shared/Dialog";
import { FieldError } from "@/components/shared/FieldError";
import { TextInput } from "@/components/shared/TextInput";
import { WOD_STEPS, STEP } from "@/constants/flow";
import { useLoginState } from "@/hooks/useLoginState";
import { logIn } from "@/services/fetchWithLogin";
import { loginStore, type LoginStore } from "@/stores/loginStore";

export type LoginDialogProps = {
  /** The popup's state; the app's own by default. */
  store?: LoginStore;
};

/**
 * The popup that opens when a workout isn't cached yet and breaking it down needs the password:
 * log in, and whatever was asked for carries on; or, instead, try the example workout, which is
 * always ready and fills in on the home page. Closing it leaves the request's error in place.
 */
export function LoginDialog({ store = loginStore }: LoginDialogProps) {
  const { open, reason } = useLoginState(store);
  const router = useRouter();
  const pathname = usePathname();
  const formId = useId();
  const errorId = useId();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function finish(outcome: Parameters<LoginStore["finish"]>[0]) {
    setPassword("");
    setError(null);
    store.finish(outcome);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    const failed = await logIn(password).catch(() => "Couldn't log in. Try again.");
    setBusy(false);
    if (failed) setError(failed);
    else finish("in");
  }

  function chooseExample() {
    finish("example");
    const home = WOD_STEPS[STEP.workout].href;
    if (pathname !== home) router.push(home);
  }

  return (
    <Dialog
      open={open}
      title="Log in to break it down"
      onClose={() => finish("cancel")}
      actions={
        <>
          <Button variant="secondary" onClick={() => finish("cancel")}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={!password || busy}>
            {busy ? "Logging in…" : "Log in"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {reason ?? "Log in to break down a new workout."} Workouts nobody has broken down yet need
        the password for now.
      </p>
      <form id={formId} onSubmit={submit} className="mt-4 space-y-1.5">
        <label htmlFor={`${formId}-password`} className="text-sm font-medium">
          Password
        </label>
        <TextInput
          id={`${formId}-password`}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          invalid={error !== null}
          aria-describedby={error ? errorId : undefined}
          className="w-full"
          data-autofocus
        />
        {error && <FieldError id={errorId}>{error}</FieldError>}
      </form>
      <div className="my-4 flex items-center gap-3 text-xs font-medium tracking-wide text-zinc-500 uppercase">
        <span aria-hidden className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        or
        <span aria-hidden className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <Button variant="dashed" icon={Sparkles} onClick={chooseExample}>
        Use the example workout to test it out!
      </Button>
    </Dialog>
  );
}
