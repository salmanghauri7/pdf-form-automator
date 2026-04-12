"use client";

import { Dispatch, SetStateAction, useEffect } from "react";

type PreviewModalProps = {
  isOpen: boolean;
  onClose: Dispatch<SetStateAction<boolean>>;
  previewUrl: string;
  isGenerating: boolean;
};

export default function PreviewModal({
  isOpen,
  onClose,
  previewUrl,
  isGenerating,
}: PreviewModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="relative h-[88vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            PDF Preview
          </h2>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            onClick={() => onClose(false)}
          >
            Close
          </button>
        </div>

        <div className="h-[calc(88vh-57px)] w-full bg-slate-100">
          {isGenerating ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-600">
              Generating preview...
            </div>
          ) : previewUrl ? (
            <iframe
              title="PDF Preview"
              src={previewUrl}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              No preview available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
