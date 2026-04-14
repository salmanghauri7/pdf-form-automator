"use client";
import JsonInputTabs from "@/component/upload/JsonInputTabs";
import useFileContext from "@/context/FileContext";
import { useRouter } from "next/navigation";

import { useMemo, useState } from "react";

const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024;

function formatBytesToMb(sizeInBytes: number): string {
  return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UploadPage() {
  const router = useRouter();
  const {
    pdfBuffer,
    setPdfBuffer,
    setMappingObject,
    jsonObject,
    setJsonObject,
    isHydrated,
  } = useFileContext();
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handlePdfUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setPdfError(null);

    const file = event.target.files?.[0];
    if (!file) {
      setPdfError("No file selected. Please choose a PDF file.");
      return;
    }

    const isPdfMime = file.type === "application/pdf";
    const isPdfExtension = file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfMime && !isPdfExtension) {
      setPdfError("Invalid file type. Only .pdf files are allowed.");
      return;
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      setPdfError(
        `PDF is too large (${formatBytesToMb(file.size)}). Maximum allowed size is ${formatBytesToMb(MAX_PDF_SIZE_BYTES)}.`,
      );
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      setPdfBuffer(arrayBuffer);
      setPdfFileName(file.name);
      setMappingObject({});
    } catch {
      setPdfError("Failed to read the PDF file. Please try again.");
    }
  };

  const handleStartMapping = () => {
    router.push("/map");
  };

  const readyToMap = useMemo(
    () =>
      isHydrated &&
      !!pdfBuffer &&
      jsonObject !== null &&
      !pdfError &&
      !jsonError,
    [isHydrated, jsonError, jsonObject, pdfBuffer, pdfError],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#bfdbfe,transparent_35%),radial-gradient(circle_at_bottom_left,#bae6fd,transparent_30%),linear-gradient(#f1f5f9,#e5e7eb)] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-300/80 bg-slate-50/85 p-6 shadow-xl backdrop-blur sm:p-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
            PDF Form Automator & Mapper
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Intake: Upload PDF and JSON
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            Provide both inputs to unlock the mapping canvas. JSON supports
            UTF-8 characters and can be uploaded as a file or pasted directly.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-300 bg-slate-100/80 p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              PDF Upload
            </h2>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-400 bg-slate-100 px-4 py-10 text-center">
              {pdfFileName ? (
                <>
                  <span className="text-sm font-medium text-emerald-700">
                    PDF uploaded
                  </span>
                  <span className="text-xs text-slate-600">{pdfFileName}</span>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-slate-700">
                    Upload PDF file
                  </span>
                  <span className="text-xs text-slate-500">
                    Only PDF files up to 15 MB are accepted.
                  </span>
                </>
              )}
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handlePdfUpload}
              />
            </label>

            {pdfError ? (
              <p className="mt-3 text-xs font-medium text-red-600">
                {pdfError}
              </p>
            ) : null}
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              JSON Input
            </h2>
            <JsonInputTabs
              onJsonParsed={setJsonObject}
              onError={setJsonError}
            />
            {jsonError ? (
              <p className="mt-3 text-xs font-medium text-red-600">
                {jsonError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleStartMapping}
            disabled={!readyToMap}
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Start Mapping
          </button>
        </div>
      </div>
    </div>
  );
}
