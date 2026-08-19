export function BarList({ items }: { items: { label: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados no período selecionado.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3 text-sm">
          <span className="w-52 shrink-0 leading-tight text-muted-foreground line-clamp-2">{item.label}</span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${Math.max((item.count / max) * 100, item.count > 0 ? 6 : 0)}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right font-medium text-foreground">{item.count}</span>
        </div>
      ))}
    </div>
  );
}
