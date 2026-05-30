import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Plus, Minus, Landmark, Hotel, Utensils, Star, Heart, Navigation, LocateFixed } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import placesData from '../../assets/places.json';

// Dynamic POI structure
export interface MapPlace {
  id: string;
  name: string;
  category: 'landmark' | 'hotel' | 'restaurant';
  lat: number;
  lon: number;
  rating: number;
  reviews: number;
  image: string;
  description: string;
  distance: string;
}

interface DetailedMapProps {
  provinceName: string;
  lat: number;
  lon: number;
  userCoords: { lat: number; lon: number } | null;
  onSelectPlace: (place: MapPlace | null) => void;
  activeFilter: string;
}

export default function DetailedMap({ 
  provinceName, 
  lat, 
  lon, 
  userCoords, 
  onSelectPlace,
  activeFilter 
}: DetailedMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [selectedLocalPlace, setSelectedLocalPlace] = useState<MapPlace | null>(null);

  // Dùng dữ liệu từ file JSON được geocode
  // Lọc lấy các điểm gần tọa độ trung tâm của tỉnh đang chọn (trong vòng bán kính khoảng 50km = 0.5 độ lat/lon)
  const places = (placesData as any[]).filter(place => {
    return Math.abs(place.lat - lat) < 0.5 && Math.abs(place.lon - lon) < 0.5;
  }) as MapPlace[];

  // Filtered Places list
  const filteredPlaces = places.filter(place => {
    if (activeFilter === 'landmark') return place.category === 'landmark';
    if (activeFilter === 'hotel') return place.category === 'hotel';
    if (activeFilter === 'restaurant') return place.category === 'restaurant';
    return true; // "Tất cả"
  });

  // Inject Leaflet CSS dynamically into document head
  useEffect(() => {
    const cssId = 'leaflet-css-cdn';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  // Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing map if any
    if (mapRef.current) {
      mapRef.current.remove();
    }

    // Initialize leaflet map with default viewport settings
    const map = L.map(mapContainerRef.current, {
      center: [lat, lon],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    mapRef.current = map;

    // Premium Light Theme Voyager Tile Layer (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Add Layer Group for Markers
    markersRef.current = L.layerGroup().addTo(map);

    // Add user location pulsing marker inside Leaflet map if active
    if (userCoords) {
      const userHtml = `
        <div class="relative w-8 h-8 flex items-center justify-center">
          <div class="absolute inset-0 rounded-full bg-indigo-500/15 border border-indigo-400/10 scale-[2.2] animate-ping"></div>
          <div class="absolute w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-[0_2px_8px_rgba(79,70,229,0.3)] flex items-center justify-center">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>
      `;

      const userIcon = L.divIcon({
        html: userHtml,
        className: 'custom-user-leaflet-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker([userCoords.lat, userCoords.lon], { icon: userIcon }).addTo(map);
    }

    // Cleanup map instance on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lon, userCoords]);

  // Update Markers when filtered list changes
  useEffect(() => {
    const map = mapRef.current;
    const markerGroup = markersRef.current;
    if (!map || !markerGroup) return;

    // Clear existing active markers
    markerGroup.clearLayers();

    // Map Category to Icons/Colors
    const getMarkerHtml = (category: string, isSelected: boolean) => {
      const colorClass = 
        category === 'landmark' ? 'bg-emerald-500 border-emerald-400/80' : 
        category === 'hotel' ? 'bg-indigo-500 border-indigo-400/80' : 
        'bg-rose-500 border-rose-400/80';
      
      const glowStyle = isSelected ? 'scale-125 ring-4 ring-white/20 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : '';

      return `
        <div class="w-10 h-10 flex flex-col items-center justify-center select-none cursor-pointer group">
          <div class="w-8 h-8 rounded-full ${colorClass} text-white flex items-center justify-center shadow-lg relative border ${glowStyle} transition-all duration-300">
            ${category === 'landmark' ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="lucide lucide-landmark"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>' : ''}
            ${category === 'hotel' ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="lucide lucide-hotel"><path d="M10 22v-6.57a1 1 0 0 0-.73-.97C7.43 14 6 12.16 6 9.89V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6.89c0 2.27-1.43 4.1-3.27 4.57a1 1 0 0 0-.73.97V22"/><path d="M18 12h4"/><path d="M2 12h4"/></svg>' : ''}
            ${category === 'restaurant' ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="lucide lucide-utensils"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"/><path d="M19 15v7"/></svg>' : ''}
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 ${colorClass.split(' ')[0]} rotate-45 border-r border-b border-inherit"></div>
          </div>
        </div>
      `;
    };

    // Render Markers onto Leaflet map
    filteredPlaces.forEach((place) => {
      const isSelected = selectedLocalPlace?.id === place.id;
      const customIcon = L.divIcon({
        html: getMarkerHtml(place.category, isSelected),
        className: 'custom-leaflet-poi',
        iconSize: [40, 40],
        iconAnchor: [20, 36],
      });

      const marker = L.marker([place.lat, place.lon], { icon: customIcon });

      // Click Event Trigger
      marker.on('click', () => {
        map.setView([place.lat - 0.005, place.lon], 13.5, { animate: true, duration: 0.6 });
        setSelectedLocalPlace(place);
        onSelectPlace(place);
      });

      markerGroup.addLayer(marker);
    });

    // Auto-fit bounds if we have markers to ensure clean viewing
    if (filteredPlaces.length > 0 && !selectedLocalPlace) {
      const points = filteredPlaces.map(p => L.latLng(p.lat, p.lon));
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [filteredPlaces, selectedLocalPlace]);

  // Handle zooming events imperatively
  const zoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const zoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const locateUser = () => {
    if (mapRef.current) {
      if (userCoords) {
        // Zoom to actual user GPS location
        mapRef.current.setView([userCoords.lat, userCoords.lon], 15, {
          animate: true,
          duration: 1
        });
      } else {
        // Fallback: Zoom back to the province center if GPS not available
        mapRef.current.setView([lat, lon], 13, {
          animate: true,
          duration: 1
        });
      }
    }
  };

  return (
    <div className="absolute inset-0 z-0 bg-slate-50 overflow-hidden">
      {/* Target Container for Leaflet Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Controls Overlay */}
      <div className="absolute right-4 bottom-40 z-[9999] flex flex-col gap-3 pointer-events-auto">
        {/* Locate Me Button */}
        <button 
          onClick={locateUser}
          className="w-12 h-12 bg-white shadow-2xl rounded-2xl text-slate-700 flex items-center justify-center border border-slate-100 active:scale-90 transition-all cursor-pointer hover:bg-slate-50"
          aria-label="Vị trí của bạn"
        >
          <LocateFixed size={24} className={userCoords ? "text-indigo-600" : "text-slate-500"} />
        </button>

        {/* Zoom Group */}
        <div className="flex flex-col bg-white shadow-2xl rounded-2xl border border-slate-100 overflow-hidden">
          <button
            onClick={zoomIn}
            className="w-12 h-12 text-slate-700 flex items-center justify-center active:bg-slate-50 transition-colors cursor-pointer hover:bg-slate-50 border-b border-slate-100"
            aria-label="Phóng to"
          >
            <Plus size={24} />
          </button>
          <button
            onClick={zoomOut}
            className="w-12 h-12 text-slate-700 flex items-center justify-center active:bg-slate-50 transition-colors cursor-pointer hover:bg-slate-50"
            aria-label="Thu nhỏ"
          >
            <Minus size={24} />
          </button>
        </div>
      </div>

      {/* Mini Top Indicator overlay showing province name */}
      <div className="absolute top-28 left-6 z-10 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/80 shadow-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          <span className="font-display text-xs font-bold text-slate-700 tracking-wide">
            Detailed Map: {provinceName}
          </span>
        </div>
      </div>
    </div>
  );
}
