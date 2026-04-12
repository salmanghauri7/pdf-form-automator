import { Handle, Position } from "@xyflow/react";

type PdfFieldNodeProps = {
  data: {
    fieldName?: string;
  };
};

export default function PdfFieldNode({ data }: PdfFieldNodeProps) {
  const fieldName = data?.fieldName ?? "";

  return (
    <div className="relative w-65 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 shadow-sm">
      <Handle
        type="target"
        position={Position.Left}
        id={fieldName}
        className="h-2.5 w-2.5 border-0 bg-emerald-500"
        style={{ left: -8, top: "50%", transform: "translateY(-50%)" }}
      />
      <p className="truncate text-sm font-medium text-slate-700">{fieldName}</p>
    </div>
  );
}
