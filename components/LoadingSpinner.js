/**
 * LoadingSpinner — flexible spinner used across pages and components.
 * @param {{ size?: 'sm'|'md'|'lg', label?: string, fullPage?: boolean }} props
 */
export default function LoadingSpinner({ size = 'md', label = 'Loading…', fullPage = false }) {
  const sizeMap = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-3' };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizeMap[size]} border-brand-200 border-t-brand-600 rounded-full animate-spin`} />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
