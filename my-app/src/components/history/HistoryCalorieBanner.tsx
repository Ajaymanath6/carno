/** Shown when logged meals exist but AI calorie totals could not be filled (env or API). */
export function HistoryCalorieBanner({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-fill px-4 py-3 text-sm"
    >
      <p className="font-medium text-brandcolor-text-strong">About “— kcal”</p>
      <p className="mt-1 leading-relaxed text-brandcolor-text-weak">{message}</p>
    </div>
  );
}
