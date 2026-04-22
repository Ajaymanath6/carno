'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * MapView.client.js — actual Leaflet implementation (never imported directly).
 * Always import MapView.js which wraps this with dynamic().
 *
 * @param {{
 *   jobs: Array<{ id, title, slug, location: { lat, lng, city }, company: { name, logoUrl } }>,
 *   center?: { lat: number, lng: number },
 *   zoom?: number,
 *   onJobClick?: (job) => void,
 *   className?: string,
 * }} props
 */
export default function MapViewClient({
  jobs = [],
  center = { lat: 10.8505, lng: 76.2711 },
  zoom = 8,
  onJobClick,
  className = '',
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedJob, setSelectedJob] = useState(null);

  // Init map once
  useEffect(() => {
    if (mapInstanceRef.current) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      // Fix Leaflet default icon path broken by webpack
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center:  [center.lat, center.lng],
        zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Draw initial markers
      drawMarkers(L, map);
    };

    initMap();

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw markers when jobs change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const L = window.L;
    if (!L) return;
    drawMarkers(L, mapInstanceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  async function drawMarkers(L, map) {
    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const validJobs = jobs.filter(
      (j) => j.location?.latitude != null && j.location?.longitude != null
    );

    for (const job of validJobs) {
      const marker = L.marker([job.location.latitude, job.location.longitude]);

      marker.bindPopup(`
        <div style="min-width:160px; font-family: sans-serif;">
          <p style="font-weight:600; font-size:13px; margin:0 0 4px;">${job.title}</p>
          <p style="font-size:12px; color:#64748b; margin:0 0 4px;">${job.company?.name ?? ''}</p>
          <p style="font-size:11px; color:#94a3b8; margin:0;">${job.location.city ?? ''}</p>
          <a href="/jobs/${job.slug}" style="display:inline-block;margin-top:8px;font-size:12px;color:#0369a1;font-weight:600;">
            View job →
          </a>
        </div>
      `);

      marker.on('click', () => {
        setSelectedJob(job);
        onJobClick?.(job);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    }
  }

  // Center map on user's location
  function handleLocate() {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      mapInstanceRef.current.setView([pos.coords.latitude, pos.coords.longitude], 13);
    });
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-xl" />

      {/* Locate me button */}
      <button
        type="button"
        onClick={handleLocate}
        title="Center on my location"
        className="absolute bottom-4 right-4 z-[400] bg-white border border-gray-200 shadow-md rounded-lg p-2 hover:bg-brand-50 transition-colors"
      >
        <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0-6v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>

      {/* Job count badge */}
      {jobs.length > 0 && (
        <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
          {jobs.length} job{jobs.length !== 1 ? 's' : ''} on map
        </div>
      )}
    </div>
  );
}
