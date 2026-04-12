"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error("Global app error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-900">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            <h1 className="text-base font-semibold">Application error</h1>
            <p className="mt-2 text-sm">
              A critical error occurred. Please try to recover the session.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Reload route
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
