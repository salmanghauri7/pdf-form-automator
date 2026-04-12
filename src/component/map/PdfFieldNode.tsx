import { Handle, Position } from "@xyflow/react";

type PdfFieldNodeProps = {
  data: {
    fields?: string[];
  };
};

export default function PdfFieldNode({ data }: PdfFieldNodeProps) {
  const fields = data?.fields ?? [];

  return (
    <div className="w-90 rounded-xl border border-slate-300 bg-slate-50 p-3 shadow-md">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        PDF Fields
      </div>
      <div className="max-h-[66vh] space-y-2 overflow-auto pr-2">
        {fields.map((fieldName) => (
          <div
            key={fieldName}
            className="relative rounded border border-slate-300 bg-slate-100 px-5 py-2"
          >
            <Handle
              type="target"
              position={Position.Left}
              id={fieldName}
              className="h-2.5! w-2.5! border-0! bg-emerald-500!"
              style={{ left: 2, top: "50%", transform: "translateY(-50%)" }}
            />
            <p className="truncate text-sm font-medium text-slate-700">
              {fieldName}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
