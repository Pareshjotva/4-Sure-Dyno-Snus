"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useId, useState } from "react";

export type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type Pending = {
  options: Required<
    Pick<ConfirmOptions, "title" | "confirmLabel" | "cancelLabel" | "danger">
  > & { message?: string };
  resolve: (value: boolean) => void;
};

let pending: Pending | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/** Site-styled confirmation popup. Resolves true when the user confirms. */
export function confirmAction(
  messageOrOptions?: string | ConfirmOptions,
  extra?: ConfirmOptions
): Promise<boolean> {
  const options =
    typeof messageOrOptions === "string"
      ? { ...extra, message: messageOrOptions }
      : { ...messageOrOptions, ...extra };

  return new Promise((resolve) => {
    if (pending) {
      pending.resolve(false);
    }
    pending = {
      options: {
        title: options?.title ?? "Are you sure?",
        message: options?.message,
        confirmLabel: options?.confirmLabel ?? "Yes, continue",
        cancelLabel: options?.cancelLabel ?? "Cancel",
        danger: options?.danger ?? false,
      },
      resolve,
    };
    notify();
  });
}

export function ConfirmDialogHost() {
  const titleId = useId();
  const [, setTick] = useState(0);
  const request = pending;

  useEffect(() => {
    const onChange = () => setTick((n) => n + 1);
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  useEffect(() => {
    if (!request) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") finish(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [request]);

  function finish(value: boolean) {
    if (!pending) return;
    const { resolve } = pending;
    pending = null;
    notify();
    resolve(value);
  }

  if (!request) return null;

  const { options } = request;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm animate-fade sm:items-center sm:p-4"
      role="presentation"
      data-loading-ignore
      onClick={() => finish(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="surface w-full max-w-md rounded-t-2xl p-5 shadow-2xl sm:rounded-2xl sm:p-6"
        data-loading-ignore
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-cyan">
          Confirm
        </p>
        <h2 id={titleId} className="mt-2 font-display text-2xl text-white">
          {options.title}
        </h2>
        {options.message ? (
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            {options.message}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => finish(false)}
          >
            {options.cancelLabel}
          </Button>
          <Button
            type="button"
            variant={options.danger ? "danger" : "primary"}
            onClick={() => finish(true)}
          >
            {options.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
