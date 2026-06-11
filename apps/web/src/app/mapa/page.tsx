'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

// MapLibre types (loaded dynamically to avoid SSR issues)
type MapLibreMap = import('maplibre-gl').Map;
type MapLibreMarker = import('maplibre-gl').Marker;

interface GeoFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: {
    deviceId: string;
    name: string;
    connected: boolean | null;
    errorCount: number | null;
    lastPollAt: string | null;
    address?: string | null;
    updatedAt: string;
  };
}

interface GeoFeatureCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

async function fetchGeoJson(): Promise<GeoFeatureCollection> {
  const r = await fetch('http://127.0.0.1:4009/geo/devices.geojson');
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json() as Promise<GeoFeatureCollection>;
}

function severityColor(feature: GeoFeature): string {
  if (feature.properties.connected === false) return '#ef4444';
  if ((feature.properties.errorCount ?? 0) > 0) return '#facc15';
  return '#4ade80';
}

export default function MapaPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [selected, setSelected] = useState<GeoFeature | null>(null);
  const [error, setError] = useState('');

  const loadAndRender = useCallback(async () => {
    try {
      const geoData = await fetchGeoJson();
      setFeatures(geoData.features);

      if (!mapRef.current) return;
      const maplibregl = (await import('maplibre-gl')).default;

      // Remove old markers
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];

      for (const feature of geoData.features) {
        const [lng, lat] = feature.geometry.coordinates;
        const el = document.createElement('div');
        el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${severityColor(feature)};border:2px solid #0f172a;cursor:pointer;box-shadow:0 0 8px ${severityColor(feature)}80`;
        el.title = feature.properties.name;
        el.addEventListener('click', () => setSelected(feature));

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);
        markersRef.current.push(marker);
      }
    } catch (err) {
      setError(
        `No se puede conectar al geo-service (puerto 4009): ${err instanceof Error ? err.message : err}`,
      );
    }
  }, []);

  useEffect(() => {
    let destroyed = false;

    async function initMap() {
      if (!mapContainerRef.current) return;
      const maplibregl = (await import('maplibre-gl')).default;

      if (destroyed) return;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors',
            },
          },
          layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
        },
        center: [-69.9, 18.5],
        zoom: 4,
      });

      mapRef.current = map;
      map.on('load', () => {
        void loadAndRender();
      });
    }

    void initMap();
    const t = setInterval(() => {
      void loadAndRender();
    }, 10_000);

    return () => {
      destroyed = true;
      clearInterval(t);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [loadAndRender]);

  return (
    <main className="flex min-h-screen flex-col bg-bg text-text">
      <header className="flex h-[48px] items-center gap-3 bg-nav px-4 text-white">
        <span className="text-sm font-bold tracking-[3px] uppercase">
          ELEC<em className="not-italic text-accent">SCAN</em>
        </span>
        <nav className="ml-4 flex items-center gap-1 text-xs">
          <Link href="/" className="rounded px-2 py-1 text-white/60 transition hover:text-white">
            Inicio
          </Link>
          <Link
            href="/mediciones"
            className="rounded px-2 py-1 text-white/60 transition hover:text-white"
          >
            Mediciones
          </Link>
          <Link
            href="/alarmas"
            className="rounded px-2 py-1 text-white/60 transition hover:text-white"
          >
            Alarmas
          </Link>
          <span className="rounded bg-accent/20 px-2 py-1 font-medium text-accent">Mapa</span>
        </nav>
      </header>

      <div className="relative flex flex-1">
        {/* Map container */}
        <div ref={mapContainerRef} className="flex-1" />

        {/* Sidebar */}
        <div className="absolute right-0 top-0 flex h-full w-64 flex-col gap-2 overflow-y-auto bg-nav/90 p-3 backdrop-blur-sm">
          <h2 className="text-[10px] font-semibold uppercase tracking-[2px] text-muted">
            Dispositivos ({features.length})
          </h2>

          {error && (
            <p className="rounded border border-red-400/30 bg-red-400/5 px-2 py-2 text-[10px] text-red-400">
              {error}
            </p>
          )}

          {features.length === 0 && !error && (
            <p className="text-[10px] text-muted/50">
              Sin dispositivos geolocalizados.
              <br />
              Usa PUT /geo/locations/:deviceId para agregar coordenadas.
            </p>
          )}

          {features.map((f) => (
            <button
              key={f.properties.deviceId}
              type="button"
              onClick={() => setSelected(f)}
              className={`rounded border p-2 text-left text-xs transition ${
                selected?.properties.deviceId === f.properties.deviceId
                  ? 'border-accent bg-accent/10'
                  : 'border-border bg-surface hover:border-accent/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: severityColor(f) }} />
                <span className="font-medium">{f.properties.name}</span>
              </div>
              {f.properties.address && (
                <p className="mt-0.5 text-[10px] text-muted">{f.properties.address}</p>
              )}
              <p className="mt-0.5 text-[9px] text-muted/60">
                {f.properties.connected ? 'Conectado' : 'Sin conexión'}
                {(f.properties.errorCount ?? 0) > 0 && ` · ${f.properties.errorCount} errores`}
              </p>
            </button>
          ))}

          {/* Selected detail */}
          {selected && (
            <div className="mt-2 rounded border border-accent/30 bg-accent/5 p-3 text-xs">
              <p className="font-semibold">{selected.properties.name}</p>
              <p className="mt-1 font-mono text-[10px] text-muted">
                {selected.properties.deviceId}
              </p>
              {selected.properties.address && (
                <p className="mt-1 text-[10px] text-muted">{selected.properties.address}</p>
              )}
              <p className="mt-2 text-[10px]">
                Lat: {selected.geometry.coordinates[1].toFixed(5)}
                <br />
                Lng: {selected.geometry.coordinates[0].toFixed(5)}
              </p>
              {selected.properties.lastPollAt && (
                <p className="mt-1 text-[10px] text-muted/60">
                  Último poll: {new Date(selected.properties.lastPollAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
