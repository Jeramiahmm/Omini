"use client";

import { useEffect, useRef } from "react";
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

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.warn("NEXT_PUBLIC_MAPBOX_TOKEN not set");
      return;
    }

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-105.1019, 40.1672], // Longmont, CO
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers and route line
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const orderedStops = routeOrder
      ? routeOrder
          .map((id) => stops.find((s) => s.id === id))
          .filter((s): s is Stop => s !== undefined)
      : stops;

    // Add markers
    orderedStops.forEach((stop, idx) => {
      const el = document.createElement("div");
      el.className = "omini-marker";
      el.style.cssText = `
        width: 28px; height: 28px; border-radius: 50%;
        background: #3b82f6; color: white;
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; font-weight: 700;
        border: 2px solid #1e3a5f;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      `;
      el.textContent = String(idx + 1);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([stop.lng, stop.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 20 }).setHTML(
            `<div style="color:#222;font-size:13px;padding:2px"><strong>#${idx + 1}</strong><br/>${stop.address || `${stop.lat.toFixed(4)}, ${stop.lng.toFixed(4)}`}</div>`
          )
        )
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Update route line
    const updateLine = () => {
      if (map.getSource("route")) {
        map.removeLayer("route-line");
        map.removeSource("route");
      }

      if (routeOrder && orderedStops.length >= 2) {
        const coords = orderedStops.map((s) => [s.lng, s.lat] as [number, number]);
        // Close the loop back to depot
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

    if (map.isStyleLoaded()) {
      updateLine();
    } else {
      map.once("style.load", updateLine);
    }

    // Fit bounds
    if (orderedStops.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      orderedStops.forEach((s) => bounds.extend([s.lng, s.lat]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    }
  }, [stops, routeOrder]);

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}
