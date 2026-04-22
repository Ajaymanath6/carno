'use client';

/**
 * MapView — Leaflet map component loaded dynamically (client-only).
 *
 * Leaflet accesses `window` and `document` and cannot run in SSR.
 * This file is a thin wrapper; the real implementation is in MapView.client.js.
 * Import MapView.js everywhere — it handles the dynamic import automatically.
 */

import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/LoadingSpinner';

const MapViewClient = dynamic(() => import('@/components/MapView.client'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
      <LoadingSpinner label="Loading map…" />
    </div>
  ),
});

export default function MapView(props) {
  return <MapViewClient {...props} />;
}
