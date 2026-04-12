import { Dispatch, SetStateAction, useState } from "react";
type JsonInputTabsProps = {
  onJsonParsed: Dispatch<SetStateAction<unknown>>;
  onError: Dispatch<SetStateAction<string | null>>;
};

const JSON_TABS = {
  FILE: "file",
  RAW: "raw",
};

const JsonInputTabs = ({ onJsonParsed, onError }: JsonInputTabsProps) => {
  const [activeTab, setActiveTab] = useState<string | null>(JSON_TABS.FILE);
  const [rawJson, setRawJson] = useState<string | null>(null);

  const handleJsonFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      onError("file was not uploaded");
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      onJsonParsed(parsed);
      onError(null);
    } catch {
      onError("Invalid JSON file. Choose a valid JSON file");
    }
  };

  const handleRawJsonApply = () => {
    try {
      const parsed = JSON.parse(rawJson);
      onJsonParsed(parsed);
      onError(null);
    } catch {
      onError("JSON is not valid");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
            activeTab === JSON_TABS.FILE
              ? "bg-white text-slate-900 shadow-sm"
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
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab(JSON_TABS.RAW)}
        >
          Paste Raw JSON
        </button>
      </div>

      {activeTab === JSON_TABS.FILE ? (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
          <span className="text-sm font-medium text-slate-700">
            Upload UTF-8 JSON file
          </span>
          <span className="text-xs text-slate-500">Accepts .json files</span>
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
            className="h-44 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm outline-none ring-blue-500 transition focus:ring-2"
          />
          <button
            type="button"
            onClick={handleRawJsonApply}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Parse JSON
          </button>
        </div>
      )}
    </div>
  );
};

export default JsonInputTabs;
