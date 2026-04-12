export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="rounded-2xl border border-slate-300 bg-slate-50 px-8 py-6 text-center shadow-lg">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        <p className="text-sm font-medium text-slate-700">
          Loading upload screen...
        </p>
      </div>
    </div>
  );
}
