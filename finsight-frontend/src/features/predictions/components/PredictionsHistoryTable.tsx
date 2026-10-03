interface PredictionRecord {
  date: string;
  modelVersion: string;
  riskScore: number;
}

// Placeholder: en el futuro vendrá de GET /companies/{id}/predictions/latest y su historial
const MOCK_HISTORY: PredictionRecord[] = [
  { date: "Sep 28, 2026", modelVersion: "v1.2", riskScore: 0.42 },
  { date: "Aug 30, 2026", modelVersion: "v1.1", riskScore: 0.38 },
  { date: "Jul 31, 2026", modelVersion: "v1.1", riskScore: 0.51 },
];

export default function PredictionsHistoryTable() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">Previous Predictions</p>

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium">Model</th>
            <th className="pb-2 font-medium">Risk Score</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_HISTORY.map((record, i) => (
            <tr key={i} className="border-b border-slate-50 last:border-0">
              <td className="py-3 text-slate-700">{record.date}</td>
              <td className="py-3 text-slate-500">{record.modelVersion}</td>
              <td className="py-3 text-slate-500">{Math.round(record.riskScore * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}