"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { StopInput } from "@/lib/api";

interface MapProps {
  stops: StopInput[];
  routeOrder: number[] | null;
  onMapClick?: (lat: number, lng: number) => void;
  clickToAdd?: boolean;
}

const DEFAULT_CENTER: [number, number] = [-105.16, 40.12];
const DEFAULT_ZOOM = 11;

export default function Map({ stops, routeOrder, onMapClick, clickToAdd }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapLoaded = useRef(false);
  const [noToken, setNoToken] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || token === "pk.your_mapbox_token_here") {
      setNoToken(true);
      return;
    }
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    map.on("load", () => { mapLoaded.current = true; });
    mapRef.current = map;
    return () => { mapLoaded.current = false; map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !clickToAdd || !onMapClick) return;
    const handler = (e: mapboxgl.MapMouseEvent) => onMapClick(e.lngLat.lat, e.lngLat.lng);
    map.on("click", handler);
    map.getCanvas().style.cursor = "crosshair";
    return () => { map.off("click", handler); map.getCanvas().style.cursor = ""; };
  }, [clickToAdd, onMapClick]);

  const updateMap = useCallback(() => {
    const map = mapRef.current;
    if (!map || noToken) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const orderedStops = routeOrder
      ? routeOrder.map((id) => stops.find((s) => s.id === id)).filter((s): s is StopInput => !!s)
      : stops;

    orderedStops.forEach((stop, idx) => {
      const el = document.createElement("div");
      const isOpt = routeOrder !== null;
      el.innerHTML = `<div style="width:30px;height:30px;border-radius:50%;background:${isOpt ? "linear-gradient(135deg,#6366f1,#06b6d4)" : "#6366f1"};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;font-family:system-ui;border:2px solid rgba(255,255,255,0.2);box-shadow:0 2px 10px rgba(99,102,241,0.4);cursor:pointer">${idx + 1}</div>`;

      const popup = new mapboxgl.Popup({ offset: 20, closeButton: true, maxWidth: "260px" }).setHTML(
        `<div style="font-size:13px;line-height:1.5"><div style="font-weight:700;color:#818cf8">Stop #${idx + 1}</div><div style="margin-top:2px">${stop.address || `${stop.lat.toFixed(5)}, ${stop.lng.toFixed(5)}`}</div></div>`
      );

      const marker = new mapboxgl.Marker({ element: el }).setLngLat([stop.lng, stop.lat]).setPopup(popup).addTo(map);
      markersRef.current.push(marker);
    });

    const drawLine = () => {
      if (map.getLayer("route-line")) map.removeLayer("route-line");
      if (map.getLayer("route-line-bg")) map.removeLayer("route-line-bg");
      if (map.getSource("route")) map.removeSource("route");

      if (routeOrder && orderedStops.length >= 2) {
        const coords = orderedStops.map((s) => [s.lng, s.lat] as [number, number]);
        coords.push(coords[0]);
        map.addSource("route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } } });
        map.addLayer({ id: "route-line-bg", type: "line", source: "route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#6366f1", "line-width": 8, "line-opacity": 0.15 } });
        map.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#818cf8", "line-width": 3, "line-opacity": 0.9 } });
      }
    };

    if (mapLoaded.current) drawLine();
    else map.once("load", drawLine);

    if (orderedStops.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      orderedStops.forEach((s) => bounds.extend([s.lng, s.lat]));
      map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 600 });
    } else {
      map.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: 600 });
    }
  }, [stops, routeOrder, noToken]);

  useEffect(() => { updateMap(); }, [updateMap]);

  if (noToken) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0f1a] to-[#06080f] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Map requires Mapbox token</p>
          <p className="text-xs text-muted mt-1">Set <code className="text-accent px-1.5 py-0.5 rounded bg-accent/10">NEXT_PUBLIC_MAPBOX_TOKEN</code></p>
          <p className="text-xs text-muted mt-1">Free at mapbox.com</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {clickToAdd && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full glass border border-accent/30 text-xs text-accent-hover font-medium shadow-lg">
          Click on the map to add a stop
        </div>
      )}
    </div>
  );
}
