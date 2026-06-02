import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Plus, Minus, Landmark, Hotel, Utensils, Star, Heart, Navigation, LocateFixed } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import placesData from '../../assets/places.json';
import { ProvinceData, provinces } from './VietnamSvgMap';

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
  selectedProvince: ProvinceData | null;
  userCoords: { lat: number; lon: number } | null;
  onSelectPlace: (place: MapPlace | null) => void;
  activeFilter: string;
  searchResult?: { lat: number; lon: number; label: string } | null;
  selectedPlace?: MapPlace | null;
  isRoutingActive?: boolean;
  onSelectProvince: (province: ProvinceData | null) => void;
  selectedRegion?: string | null;
  onRouteCalculate?: (route: { distance: string; duration: string; steps: any[] } | null) => void;
}

export default function DetailedMap({ 
  selectedProvince,
  userCoords,
  onSelectPlace,
  activeFilter,
  searchResult,
  selectedPlace,
  isRoutingActive,
  onSelectProvince,
  selectedRegion,
  onRouteCalculate
}: DetailedMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null); // Dynamic tile layer ref (Roadmap vs Satellite)
  const routeLayerRef = useRef<L.Polyline | null>(null); // Dynamic routing layer ref
  const markersRef = useRef<L.LayerGroup | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const [selectedLocalPlace, setSelectedLocalPlace] = useState<MapPlace | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  // Memoized places filtering based on selected province coordinates
  const places = useMemo(() => {
    if (!selectedProvince) return [];
    
    // 1. Filter existing places in assets
    const localPlaces = (placesData as any[]).filter(place => {
      return Math.abs(place.lat - selectedProvince.lat) < 0.5 && Math.abs(place.lon - selectedProvince.lon) < 0.5;
    }) as MapPlace[];

    // 2. If no matching POIs exist in places.json, dynamically generate realistic local places
    if (localPlaces.length === 0) {
      const provinceNameClean = selectedProvince.name
        .replace("Thủ đô ", "")
        .replace("TP. ", "")
        .replace("Tỉnh ", "");

      const mockTemplates = [
        { name: `Đặc sản ẩm thực ${provinceNameClean}`, category: 'restaurant', desc: `Thưởng thức ẩm thực truyền thống nổi tiếng của ${provinceNameClean}`, rating: 4.8, reviews: 245 },
        { name: `Quán ăn sân vườn ${provinceNameClean}`, category: 'restaurant', desc: 'Không gian ẩm thực gia đình rộng rãi, thoáng đãng', rating: 4.5, reviews: 89 },
        { name: `Cà phê & Điểm tâm ${provinceNameClean}`, category: 'restaurant', desc: 'Cà phê rang xay nguyên chất và đồ ăn sáng địa phương', rating: 4.3, reviews: 120 },
        { name: `Khách sạn Trung tâm ${provinceNameClean}`, category: 'hotel', desc: 'Phòng nghỉ hiện đại, tiện nghi đầy đủ ngay khu trung tâm sầm uất', rating: 4.6, reviews: 156 },
        { name: `Homestay nghỉ dưỡng ${provinceNameClean}`, category: 'hotel', desc: 'Không gian nghỉ ngơi thư thái, gần gũi với phong cảnh địa phương', rating: 4.9, reviews: 67 },
        { name: `Khu di tích lịch sử ${provinceNameClean}`, category: 'landmark', desc: 'Địa danh lưu giữ lịch sử hào hùng và dấu ấn văn hóa vùng miền', rating: 4.7, reviews: 312 },
        { name: `Hồ sinh thái & Thắng cảnh ${provinceNameClean}`, category: 'landmark', desc: 'Cảnh quan thiên nhiên thơ mộng, không khí trong lành thu hút du khách', rating: 4.8, reviews: 520 },
      ];

      return mockTemplates.map((temp, index) => {
        // Distribute coordinates in a tight cluster (approx 1.5km offset)
        const latOffset = (index % 2 === 0 ? 1 : -1) * (0.004 + (index * 0.002));
        const lonOffset = (index % 3 === 0 ? 1 : -1) * (0.0035 + (index * 0.0018));

        return {
          id: `dynamic-poi-${selectedProvince.id}-${index}`,
          name: temp.name,
          category: temp.category as 'landmark' | 'hotel' | 'restaurant',
          lat: selectedProvince.lat + latOffset,
          lon: selectedProvince.lon + lonOffset,
          rating: temp.rating,
          reviews: temp.reviews,
          image: 'bg-gradient-nature',
          description: temp.desc,
          distance: `${(0.8 + index * 0.5).toFixed(1)} km`
        };
      });
    }

    return localPlaces;
  }, [selectedProvince]);

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

    const initialCenter: L.LatLngExpression = selectedProvince 
      ? [selectedProvince.lat, selectedProvince.lon] 
      : [15.9, 107.5];

    const initialZoom = selectedProvince ? 12 : 5.8;

    const southWest = L.latLng(7.0, 100.5);
    const northEast = L.latLng(24.0, 110.5);
    const bounds = L.latLngBounds(southWest, northEast);

    // Initialize leaflet map with default viewport settings
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
      minZoom: 5.8,
      maxZoom: 18,
      maxBounds: bounds,
      maxBoundsViscosity: 0.95
    });

    mapRef.current = map;

    // Premium Light Theme Voyager Tile Layer (CartoDB Voyager) or Esri Satellite Tile Layer
    const initialUrl = mapType === 'roadmap'
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    const layer = L.tileLayer(initialUrl, {
      maxZoom: 19,
      subdomains: mapType === 'roadmap' ? 'abcd' : [],
    }).addTo(map);
    tileLayerRef.current = layer;

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
  }, [selectedProvince, userCoords]);

  // Dynamic Map Layer Switcher (Roadmap vs Esri Satellite)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const tileUrl = mapType === 'roadmap'
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    const layer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: mapType === 'roadmap' ? 'abcd' : [],
    }).addTo(map);
    tileLayerRef.current = layer;
  }, [mapType]);

  // Dynamic OSRM Routing engine (100% Free & Keyless)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean old route line and state
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }
    setRouteInfo(null);
    onRouteCalculate?.(null);

    if (!userCoords || !selectedPlace) {
      return;
    }

    const fetchOSRMRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userCoords.lon},${userCoords.lat};${selectedPlace.lon},${selectedPlace.lat}?overview=full&geometries=geojson&steps=true`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("OSRM API error");
        
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as L.LatLngExpression);

          const polyline = L.polyline(coordinates, {
            color: '#4f46e5', // Brand Indigo
            weight: 6,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);

          routeLayerRef.current = polyline;

          const km = (route.distance / 1000).toFixed(1);
          const minutes = Math.round(route.duration / 60);

          setRouteInfo({
            distance: `${km} km`,
            duration: `${minutes} phút`
          });

          // Send the full steps array up to the parent component for modern navigation guidance list
          const legs = route.legs || [];
          const steps = legs.length > 0 ? (legs[0].steps || []) : [];
          onRouteCalculate?.({
            distance: `${km} km`,
            duration: `${minutes} phút`,
            steps
          });

          // Zoom fit bounds smoothly
          map.fitBounds(polyline.getBounds(), { padding: [60, 60] });
        }
      } catch (err) {
        console.error("OSRM Route fetching failed: ", err);
        onRouteCalculate?.(null);
      }
    };

    fetchOSRMRoute();
  }, [userCoords, selectedPlace, onRouteCalculate]);

  // Smooth pan to user location when detailed routing is activated
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userCoords) return;

    if (isRoutingActive) {
      map.setView([userCoords.lat, userCoords.lon], 16, {
        animate: true,
        duration: 1.2
      });
    }
  }, [isRoutingActive, userCoords]);

  // Update or fly to search result marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing search marker
    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }

    if (searchResult) {
      const searchResultHtml = `
        <div class="relative w-10 h-10 flex items-center justify-center animate-bounce">
          <div class="absolute -bottom-1 w-3 h-3 bg-red-600/30 blur-[2px] rounded-full scale-[1.5]"></div>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#ef4444" stroke="#ffffff" stroke-width="2" class="text-red-500 drop-shadow-[0_2px_6px_rgba(239,68,68,0.4)] animate-pulse">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3" fill="#ffffff"/>
          </svg>
        </div>
      `;
      const searchResultIcon = L.divIcon({
        html: searchResultHtml,
        className: 'custom-search-result-leaflet-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 36]
      });

      const newSearchMarker = L.marker([searchResult.lat, searchResult.lon], { icon: searchResultIcon })
        .bindPopup(`<div class="p-2 font-display font-semibold text-xs text-slate-800 leading-snug">${searchResult.label}</div>`, {
          closeButton: false,
          className: 'custom-leaflet-popup shadow-xl rounded-2xl border-0 overflow-hidden'
        })
        .addTo(map);

      newSearchMarker.openPopup();
      searchMarkerRef.current = newSearchMarker;

      // Fly to the new coordinate smoothly (Google Maps zoom transition)
      map.flyTo([searchResult.lat, searchResult.lon], 15, {
        animate: true,
        duration: 1.8
      });
    }
  }, [searchResult]);

  // Sync selected place from parent prop and smoothly zoom/pan closer (shifted up to prevent sheet overlapping)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedPlace) {
      map.setView([selectedPlace.lat - 0.0018, selectedPlace.lon], 16.5, {
        animate: true,
        duration: 1.2
      });
      setSelectedLocalPlace(selectedPlace);
    } else {
      setSelectedLocalPlace(null);
    }
  }, [selectedPlace]);

  // Instant zoom/set view to selected province coordinate on change (Snappy transition)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedProvince) {
      map.setView([selectedProvince.lat, selectedProvince.lon], 12, {
        animate: false
      });
    } else {
      map.setView([15.9, 107.5], 5.8, {
        animate: false
      });
    }
  }, [selectedProvince]);

  // Instant fly/set view to selected region center when selectedRegion changes in overview mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map || selectedProvince || !selectedRegion) return;

    const regionProvinces = provinces.filter(p => p.region === selectedRegion && p.lat && p.lon);
    if (regionProvinces.length > 0) {
      const centerProv = regionProvinces[0];
      map.setView([centerProv.lat, centerProv.lon], 7, {
        animate: false
      });
    } else {
      map.setView([15.9, 107.5], 5.8, {
        animate: false
      });
    }
  }, [selectedRegion, selectedProvince]);

  // Dynamic Map click listener to select nearest province without showing dots
  useEffect(() => {
    const map = mapRef.current;
    if (!map || selectedProvince) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      let closestProv: ProvinceData | null = null;
      let minDistance = Infinity;

      provinces.forEach((prov) => {
        if (!prov.lat || !prov.lon) return;
        const d = Math.sqrt(Math.pow(lat - prov.lat, 2) + Math.pow(lng - prov.lon, 2));
        if (d < minDistance) {
          minDistance = d;
          closestProv = prov;
        }
      });

      // 1.5 degrees (~165km) is a perfect click radius for a clean nationwide view
      if (closestProv && minDistance < 1.5) {
        onSelectProvince(closestProv);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [selectedProvince, onSelectProvince]);

  // Update Markers when filtered list changes or selected province changes
  useEffect(() => {
    const map = mapRef.current;
    const markerGroup = markersRef.current;
    if (!map || !markerGroup) return;

    // Clear existing active markers
    markerGroup.clearLayers();

    if (selectedProvince) {
      // 2. Case B: Detailed Province Mode - Render local POI markers
      const getMarkerHtml = (category: string, isSelected: boolean) => {
        const colorClass = 
          category === 'landmark' ? 'bg-emerald-500 border-emerald-400/80' : 
          category === 'hotel' ? 'bg-indigo-500 border-indigo-400/80' : 
          'bg-rose-500 border-rose-400/80';
        
        const ringColor = 
          category === 'landmark' ? 'ring-emerald-500/35 shadow-[0_0_25px_rgba(16,185,129,0.65)] border-emerald-300' : 
          category === 'hotel' ? 'ring-indigo-500/35 shadow-[0_0_25px_rgba(99,102,241,0.65)] border-indigo-300' : 
          'ring-rose-500/35 shadow-[0_0_25px_rgba(244,63,94,0.65)] border-rose-300';

        const glowStyle = isSelected 
          ? `scale-[1.35] ring-[6px] ${ringColor} z-[9999] border-2` 
          : 'hover:scale-110';

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

      filteredPlaces.forEach((place) => {
        const isSelected = selectedLocalPlace?.id === place.id;
        const customIcon = L.divIcon({
          html: getMarkerHtml(place.category, isSelected),
          className: 'custom-leaflet-poi',
          iconSize: [40, 40],
          iconAnchor: [20, 36],
        });

        const marker = L.marker([place.lat, place.lon], { icon: customIcon });

        if (isSelected) {
          marker.setZIndexOffset(1000);
        }

        marker.on('click', () => {
          onSelectPlace(place);
        });

        markerGroup.addLayer(marker);
      });

      if (filteredPlaces.length > 0 && !selectedLocalPlace) {
        const points = filteredPlaces.map(p => L.latLng(p.lat, p.lon));
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [selectedProvince, filteredPlaces, selectedLocalPlace, selectedRegion]);

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
        {/* Toggle Map Type (Roadmap / Satellite) */}
        <button 
          onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
          className="w-12 h-12 bg-white shadow-2xl rounded-2xl text-slate-700 flex items-center justify-center border border-slate-100 active:scale-90 transition-all cursor-pointer hover:bg-slate-50"
          aria-label="Đổi kiểu bản đồ"
        >
          <span className="text-[9px] font-black uppercase leading-tight text-center">
            {mapType === 'roadmap' ? 'Vệ\ntinh' : 'Đường\nbộ'}
          </span>
        </button>

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

      {/* Top Indicators Row */}
      <div className="absolute top-28 left-6 right-6 z-10 pointer-events-none flex flex-col gap-2">
        {/* Mini Top Indicator overlay showing province name */}
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/80 shadow-md flex items-center gap-2 w-max pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          <span className="font-display text-xs font-bold text-slate-700 tracking-wide">
            {selectedProvince ? `Bản đồ: ${selectedProvince.name}` : "Bản đồ Việt Nam"}
          </span>
        </div>

        {/* OSRM Route travel information */}
        {routeInfo && (
          <div className="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl border border-indigo-500 shadow-lg flex items-center gap-2.5 w-max pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
            <Navigation size={12} className="text-white fill-current animate-bounce shrink-0" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest leading-none text-indigo-200">Lộ trình (OSRM)</span>
              <span className="font-display text-[11px] font-extrabold leading-tight">
                {routeInfo.duration} ({routeInfo.distance})
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
