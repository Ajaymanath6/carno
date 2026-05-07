/** Shown when totals can’t be computed, or to explain labels. */
export function HistoryCalorieBanner({
  message,
  title = `About “— kcal”`,
}: {
  message: string;
  title?: string;
}) {
  return (
    <div
      role="status"
      className="rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-fill px-4 py-3 text-sm"
    >
      <p className="font-medium text-brandcolor-text-strong">{title}</p>
      <p className="mt-1 leading-relaxed text-brandcolor-text-weak">{message}</p>
    </div>
  );
}
