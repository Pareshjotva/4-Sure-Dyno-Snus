import { cn } from "@/lib/utils";

function Line({ className }: { className?: string }) {
  return <span className={cn("page-loading-line block", className)} />;
}

function Block({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-[#161616] via-[#3a3a3a] to-[#161616] bg-[length:220%_100%]",
        className
      )}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="surface overflow-hidden rounded-2xl lg:grid lg:grid-cols-2">
      <Block className="min-h-72 rounded-none" />
      <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <Line className="w-28" />
          <Line className="w-24" />
        </div>
        <Line className="w-2/3" />
        <Line className="w-1/2" />
        <Line className="w-full" />
        <Line className="w-5/6" />
        <Block className="mt-2 h-10 w-36 rounded-md" />
      </div>
    </div>
  );
}

export function PageSkeleton({
  variant = "page",
}: {
  variant?: "page" | "home" | "products" | "detail" | "form" | "list" | "panel";
}) {
  return (
    <div
      className="page-skeleton relative"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="page-loading-sweep" />
      <span className="sr-only">Loading</span>

      {variant === "home" ? (
        <div>
          <div className="relative h-[75vh] overflow-hidden bg-black">
            <Block className="absolute inset-0 rounded-none" />
            <div className="absolute inset-x-0 bottom-0 z-10 mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-14 sm:px-6">
              <Block className="h-12 w-48 sm:h-16 sm:w-72" />
              <Block className="h-6 w-64 sm:w-96" />
              <Line className="w-full max-w-lg" />
              <Line className="w-4/5 max-w-md" />
              <div className="mt-4 flex gap-3">
                <Block className="h-11 w-40 rounded-md" />
                <Block className="h-11 w-36 rounded-md" />
              </div>
            </div>
          </div>
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <Block className="mb-10 h-80 rounded-2xl" />
            <div className="grid gap-6 lg:grid-cols-2">
              <Block className="h-80 rounded-2xl" />
              <Block className="h-80 rounded-2xl" />
            </div>
          </div>
        </div>
      ) : null}

      {variant === "products" ? (
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <Line className="w-36" />
          <Line className="mt-3 w-72 sm:w-96" />
          <Line className="mt-3 w-full max-w-2xl" />
          <Line className="mt-2 w-4/5 max-w-xl" />
          <div className="mt-10 grid gap-8">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      ) : null}

      {variant === "detail" ? (
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <Line className="w-28" />
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <Block className="min-h-96 rounded-2xl" />
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Line className="w-28" />
                <Line className="w-24" />
              </div>
              <Line className="w-3/4" />
              <Line className="w-1/2" />
              <Line className="mt-2 w-full" />
              <Line className="w-5/6" />
              <Line className="w-2/3" />
              <div className="mt-4 space-y-2">
                <Line className="w-1/2" />
                <Line className="w-2/5" />
                <Line className="w-1/3" />
              </div>
              <Block className="mt-4 h-11 w-40 rounded-md" />
            </div>
          </div>
        </div>
      ) : null}

      {variant === "form" ? (
        <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
          <Line className="w-56" />
          <Line className="mt-2 w-3/4" />
          <div className="mt-6 space-y-4">
            <Block className="h-11 w-full rounded-md" />
            <Block className="h-11 w-full rounded-md" />
            <Block className="h-11 w-full rounded-md" />
            <Block className="h-11 w-32 rounded-md" />
          </div>
        </div>
      ) : null}

      {variant === "list" ? (
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <Line className="w-24" />
          <Line className="mt-3 w-64" />
          <div className="mt-8 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="surface space-y-2 rounded-xl p-5">
                <Line className="w-2/3" />
                <Line className="w-full" />
                <Line className="w-4/5" />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {variant === "panel" ? (
        <div className="space-y-4">
          <Line className="w-48" />
          <Line className="w-2/3" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="surface flex items-center gap-4 rounded-xl p-4"
              >
                <Block className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Line className="w-1/2" />
                  <Line className="w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {variant === "page" ? (
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <Line className="w-32" />
          <Line className="mt-3 w-72 sm:w-96" />
          <Line className="mt-3 w-full max-w-2xl" />
          <Line className="mt-2 w-4/5 max-w-xl" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Block className="h-48 rounded-2xl" />
            <Block className="h-48 rounded-2xl" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
