interface CategorySlice {
  name: string;
  value: number;
}

const PALETTE = ["#2563EB", "#EF4444", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899", "#06B6D4"];

export default function CategoryBreakdownList({ data }: { data: CategorySlice[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-700">Expenses by Category</p>

      {data.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">No expense data yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {data.map((item, index) => {
            const percent = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={item.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-700">{item.name}</span>
                  <span className="font-medium text-slate-500">
                    ${item.value.toLocaleString()} · {percent.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${percent}%`, backgroundColor: PALETTE[index % PALETTE.length] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}