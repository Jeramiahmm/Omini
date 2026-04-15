"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface Stop {
  id: number;
  lat: number;
  lng: number;
  address: string;
}

interface MapProps {
  stops: Stop[];
  routeOrder: number[] | null;
}

export default function Map({ stops, routeOrder }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapLoaded = useRef(false);
  const [noToken, setNoToken] = useState(false);

  // Initialize map once
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
      center: [-105.1019, 40.1672],
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      mapLoaded.current = true;
    });

    mapRef.current = map;

    return () => {
      mapLoaded.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers and route line when stops/routeOrder change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || noToken) return;

    // Clear markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const orderedStops = routeOrder
      ? routeOrder
          .map((id) => stops.find((s) => s.id === id))
          .filter((s): s is Stop => s !== undefined)
      : stops;

    // Add numbered markers
    orderedStops.forEach((stop, idx) => {
      const el = document.createElement("div");
      el.style.cssText = `
        width: 28px; height: 28px; border-radius: 50%;
        background: #3b82f6; color: white;
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 700; font-family: system-ui, sans-serif;
        border: 2px solid #1d4ed8;
        box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        cursor: pointer;
      `;
      el.textContent = String(idx + 1);

      const popup = new mapboxgl.Popup({ offset: 18, closeButton: false }).setHTML(
        `<div style="color:#1a1a1a;font-size:13px;line-height:1.4;padding:2px 0">
          <strong style="color:#3b82f6">#${idx + 1}</strong><br/>
          ${stop.address || `${stop.lat.toFixed(5)}, ${stop.lng.toFixed(5)}`}
        </div>`
      );

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([stop.lng, stop.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Draw route line
    const drawLine = () => {
      // Remove old layer/source
      if (map.getLayer("route-line")) map.removeLayer("route-line");
      if (map.getSource("route")) map.removeSource("route");

      if (routeOrder && orderedStops.length >= 2) {
        const coords = orderedStops.map(
          (s) => [s.lng, s.lat] as [number, number]
        );
        // Close loop back to depot
        coords.push(coords[0]);

        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: coords },
          },
        });

        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#3b82f6",
            "line-width": 3,
            "line-opacity": 0.8,
          },
        });
      }
    };

    if (mapLoaded.current) {
      drawLine();
    } else {
      map.once("load", drawLine);
    }

    // Fit bounds to stops
    if (orderedStops.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      orderedStops.forEach((s) => bounds.extend([s.lng, s.lat]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 500 });
    }
  }, [stops, routeOrder, noToken]);

  if (noToken) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1a2e] text-muted gap-3">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <p className="text-sm">Set <code className="text-accent">NEXT_PUBLIC_MAPBOX_TOKEN</code> in <code>.env.local</code></p>
        <p className="text-xs">Get a free token at mapbox.com</p>

        {/* Show stops as a simple list when no map is available */}
        {stops.length > 0 && (
          <div className="mt-4 w-full max-w-md px-6">
            <p className="text-xs text-muted mb-2 text-center">
              {stops.length} stops loaded {routeOrder ? "(optimized)" : ""}
            </p>
          </div>
        )}
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}
