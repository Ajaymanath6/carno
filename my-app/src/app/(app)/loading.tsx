export default function AppSegmentLoading() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col bg-brandcolor-fill"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-brandcolor-strokeweak/40" />
        <div className="mt-2 flex flex-1 flex-col gap-3 rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white p-4">
          <div className="h-4 w-full rounded bg-brandcolor-fill" />
          <div className="h-4 w-[92%] rounded bg-brandcolor-fill" />
          <div className="h-4 w-[78%] rounded bg-brandcolor-fill" />
        </div>
      </div>
    </div>
  );
}
