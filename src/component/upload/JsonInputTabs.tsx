import { Dispatch, SetStateAction, useState } from "react";

type JsonInputTabsProps = {
  onJsonParsed: Dispatch<SetStateAction<unknown>>;
  onError: Dispatch<SetStateAction<string | null>>;
};

const MAX_JSON_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_RAW_JSON_BYTES = 2 * 1024 * 1024;

function formatBytesToMb(sizeInBytes: number): string {
  return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
}

const JSON_TABS = {
  FILE: "file",
  RAW: "raw",
};

const JsonInputTabs = ({ onJsonParsed, onError }: JsonInputTabsProps) => {
  const [activeTab, setActiveTab] = useState<string | null>(JSON_TABS.FILE);
  const [rawJson, setRawJson] = useState<string>("");

  const handleJsonFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onError(null);

    const file = event.target.files?.[0];
    if (!file) {
      onError("No file selected. Please choose a JSON file.");
      return;
    }

    const isJsonMime =
      file.type === "application/json" || file.type === "text/json";
    const isJsonExtension = file.name.toLowerCase().endsWith(".json");
    if (!isJsonMime && !isJsonExtension) {
      onError("Invalid file type. Only .json files are allowed.");
      return;
    }

    if (file.size > MAX_JSON_FILE_SIZE_BYTES) {
      onError(
        `JSON file is too large (${formatBytesToMb(file.size)}). Maximum allowed size is ${formatBytesToMb(MAX_JSON_FILE_SIZE_BYTES)}.`,
      );
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      onJsonParsed(parsed);
      onError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown parsing error occurred.";
      onError(`Invalid JSON file. ${message}`);
    }
  };

  const handleRawJsonApply = () => {
    onError(null);

    const rawBytes = new TextEncoder().encode(rawJson).length;
    if (rawBytes > MAX_RAW_JSON_BYTES) {
      onError(
        `Pasted JSON is too large (${formatBytesToMb(rawBytes)}). Maximum allowed size is ${formatBytesToMb(MAX_RAW_JSON_BYTES)}.`,
      );
      return;
    }

    try {
      const parsed = JSON.parse(rawJson);
      onJsonParsed(parsed);
      onError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown parsing error occurred.";
      onError(`JSON is not valid. ${message}`);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-300 bg-slate-100/80 p-5 shadow-sm">
      <div className="mb-4 flex rounded-xl border border-slate-300 bg-slate-200/70 p-1">
        <button
          type="button"
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
            activeTab === JSON_TABS.FILE
              ? "border border-slate-300 bg-slate-50 text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab(JSON_TABS.FILE)}
        >
          Upload File
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
            activeTab === JSON_TABS.RAW
              ? "border border-slate-300 bg-slate-50 text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab(JSON_TABS.RAW)}
        >
          Paste Raw JSON
        </button>
      </div>

      {activeTab === JSON_TABS.FILE ? (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-400 bg-slate-100 px-4 py-8 text-center">
          <span className="text-sm font-medium text-slate-700">
            Upload UTF-8 JSON file
          </span>
          <span className="text-xs text-slate-500">
            Accepts .json files up to 5 MB
          </span>
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleJsonFileUpload}
          />
        </label>
      ) : (
        <div className="space-y-3">
          <textarea
            value={rawJson}
            onChange={(event) => setRawJson(event.target.value)}
            placeholder='{
  "customer": {
    "name": "Jane Doe"
  }
}'
            className="h-44 w-full rounded-xl border border-slate-400 bg-slate-50 px-3 py-2 font-mono text-sm outline-none ring-blue-500 transition focus:ring-2"
          />
          <button
            type="button"
            onClick={handleRawJsonApply}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Parse JSON
          </button>
          <p className="text-xs text-slate-500">Raw JSON limit: 2 MB.</p>
        </div>
      )}
    </div>
  );
};

export default JsonInputTabs;
