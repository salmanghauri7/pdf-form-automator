"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: Props) {
  const router = useRouter();

  useEffect(() => {
    console.error("Map route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        <h2 className="text-base font-semibold">Mapping page failed</h2>
        <p className="mt-2 text-sm">
          An unexpected error occurred while rendering the mapping canvas.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => router.push("/upload")}
            className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Back to Upload
          </button>
        </div>
      </div>
    </div>
  );
}
