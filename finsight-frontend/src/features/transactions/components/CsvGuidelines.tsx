export default function CsvGuidelines() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-700">File Requirements</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-500">
        <li>• Format: .csv</li>
        <li>• Maximum size: 10 MB</li>
        <li>• Date format: YYYY-MM-DD</li>
        <li>
          • Required columns:
          <br />
          <code className="text-xs text-primary">fecha, tipo, categoria, monto, descripcion</code>
        </li>
      </ul>
    </div>
  );
}