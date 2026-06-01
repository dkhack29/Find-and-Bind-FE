import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, SlidersHorizontal, ArrowLeft, Compass, MapPin, 
  Star, X, Landmark, Hotel, Utensils, ChevronRight, Navigation, Heart 
} from 'lucide-react';
import VietnamSvgMap, { provinces, ProvinceData } from '../components/map/VietnamSvgMap';
import DetailedMap, { MapPlace } from '../components/map/DetailedMap';
import GpsPermissionModal from '../components/map/GpsPermissionModal';

export default function MapScreen() {
  // Navigation & View States
  const [activeView, setActiveView] = useState<'overview' | 'detailed'>('overview');
  const [selectedProvince, setSelectedProvince] = useState<ProvinceData | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProvinceData[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ lat: number; lon: number; label: string } | null>(null);

  // Location & Modal States
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [showGpsModal, setShowGpsModal] = useState(false);

  // Cinematic Zoom States
  const [isZooming, setIsZooming] = useState(false);
  const [zoomTransform, setZoomTransform] = useState({ scale: 1, x: 0, y: 0 });

  // Detailed Map Filter States
  const [activeFilter, setActiveFilter] = useState<string>('all'); // all, landmark, hotel, restaurant

  // Region Categories for horizontal filters on stylized overview map
  const regions = [
    { key: 'all', label: 'Tất cả' },
    { key: 'Đông Bắc - Tây Bắc Bộ', label: 'Tây - Đông Bắc' },
    { key: 'Hà Nội Trung Tâm', label: 'Hà Nội & Phụ Cận' },
    { key: 'Bắc Miền Trung', label: 'Bắc Miền Trung' },
    { key: 'Nam Miền Trung', label: 'Nam Miền Trung' },
    { key: 'Duyên Hải', label: 'Tây Nguyên' },
    { key: 'Miền Đông', label: 'Đông Nam Bộ' },
    { key: 'KV Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },
    { key: 'KV Bắc MêKông', label: 'Bắc Mê Kông' },
    { key: 'KV Nam MêKông', label: 'Nam Mê Kông' },
  ];

  // Geolocation Init Flow
  useEffect(() => {
    const consented = localStorage.getItem('gps_consented');
    const denied = localStorage.getItem('gps_denied');

    if (!consented && !denied) {
      // First-time user: prompt consent modal
      setShowGpsModal(true);
    } else if (consented === 'true') {
      // Prior consent: trigger coordinate update immediately
      requestGPS();
    }
  }, []);

  const requestGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setUserCoords({ lat, lon });
          localStorage.setItem('gps_consented', 'true');
          localStorage.setItem('gps_denied', 'false');
          setShowGpsModal(false);
        },
        (error) => {
          console.error("GPS Request failed: ", error);
          // Fallback coordinate on permission error: Thanh Hoa
          setUserCoords({ lat: 19.8076, lon: 105.7765 });
          localStorage.setItem('gps_consented', 'false');
          localStorage.setItem('gps_denied', 'true');
          setShowGpsModal(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      // Geolocation unsupported fallback: Thanh Hoa
      setUserCoords({ lat: 19.8076, lon: 105.7765 });
      setShowGpsModal(false);
    }
  };

  const handleDeclineGps = () => {
    // Default manual experience coordinates: Thanh Hoa (Center of S-curve)
    setUserCoords({ lat: 19.8076, lon: 105.7765 });
    localStorage.setItem('gps_consented', 'false');
    localStorage.setItem('gps_denied', 'true');
    setShowGpsModal(false);
  };

  // Search Query Handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
    } else {
      const filtered = provinces.filter(prov => 
        prov.name.toLowerCase().includes(query.toLowerCase()) || 
        prov.region.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    }
  };

  // Helper to parse coordinates or Google Maps URLs
  const parseCoordinates = (input: string): { lat: number; lon: number } | null => {
    // Matches standard decimal format, e.g. "21.0285, 105.8542" or from a Google Maps URL, e.g. "@21.0285,105.8542"
    const regex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
    const match = input.match(regex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return { lat, lon };
      }
    }
    return null;
  };

  // Helper to construct a dynamic ProvinceData for custom search results
  const mockProvinceFromSearchResult = (lat: number, lon: number, label: string): ProvinceData => {
    return {
      id: `search-${lat}-${lon}`,
      name: label.split(',')[0] || 'Địa điểm tìm thấy',
      region: 'Kết quả tìm kiếm',
      color: 'fill-indigo-100/70',
      borderColor: 'stroke-indigo-400',
      glowColor: 'shadow-indigo-500/10',
      d: '',
      lat,
      lon,
      centerX: 225,
      centerY: 390,
      description: label,
      attractions: 0
    };
  };

  // Navigates and centers map on specific searched coordinates
  const goToLocation = (lat: number, lon: number, label: string) => {
    const mockProv = mockProvinceFromSearchResult(lat, lon, label);
    setSearchResult({ lat, lon, label });
    setSelectedProvince(mockProv);
    setActiveView('detailed');
    setIsSearchFocused(false);
  };

  // Submit search: handles coordinates, Google Maps URL, or geocoding
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    // 1. Check if it matches coordinate pattern or Google Maps URL containing coordinates
    const coords = parseCoordinates(searchQuery);
    if (coords) {
      goToLocation(coords.lat, coords.lon, `Tọa độ: ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`);
      return;
    }

    // 2. Otherwise run Nominatim OpenStreetMap lookup (free, CORS-safe, country codes restricted to Vietnam)
    try {
      setIsSearching(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=vn&limit=5`,
        {
          headers: {
            'User-Agent': 'FindAndBindMobileApp/1.0'
          }
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const first = data[0];
        goToLocation(parseFloat(first.lat), parseFloat(first.lon), first.display_name);
      } else {
        alert("Không tìm thấy địa điểm này. Vui lòng thử lại!");
      }
    } catch (err) {
      console.error("Geocoding lookup error:", err);
      alert("Lỗi kết nối tìm kiếm địa điểm.");
    } finally {
      setIsSearching(false);
    }
  };

  // Cinematic Zoom-In orchestration
  const handleProvinceSelect = (prov: ProvinceData) => {
    setSelectedProvince(prov);
    setIsZooming(true);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);

    // Calculate transformation values to center the selected province centroid inside 450x780 viewport
    // Center point of SVG viewBox is: CX: 225, CY: 390
    const targetScale = 4.2;
    const tx = (225 - prov.centerX) * targetScale;
    const ty = (390 - prov.centerY) * targetScale;

    setZoomTransform({
      scale: targetScale,
      x: tx,
      y: ty
    });

    // Triggers transition from overview vector SVG to Leaflet detailed map
    // Exactly when the zoom transform reaches peak scale (approx 900ms)
    setTimeout(() => {
      setActiveView('detailed');
      setIsZooming(false);
    }, 950);
  };

  // Cinematic Zoom-Out orchestration
  const handleBackToOverview = () => {
    setSelectedPlace(null);
    setSearchResult(null);
    setSearchQuery('');
    setActiveView('overview');
    setIsZooming(true);

    // Scale back SVG maps
    setZoomTransform({ scale: 1, x: 0, y: 0 });

    // Smoothly restore default states
    setTimeout(() => {
      setIsZooming(false);
      setSelectedProvince(null);
      setActiveFilter('all');
    }, 950);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="h-full relative bg-slate-50 overflow-hidden flex flex-col text-slate-800"
    >
      {/* 1. Header Navigation Glass Card */}
      <div className="absolute top-12 left-6 right-6 z-30 flex flex-col gap-3">
        <div className="bg-white/85 backdrop-blur-[20px] border border-white/60 h-14 rounded-full shadow-lg flex items-center px-4 gap-3">
          {activeView === 'detailed' ? (
            <button 
              onClick={handleBackToOverview}
              className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-800 active:scale-95 transition-transform cursor-pointer"
              aria-label="Back to overview"
            >
              <ArrowLeft size={16} />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Compass size={18} className="animate-spin" style={{ animationDuration: '8s' }} />
            </div>
          )}

          <div className="flex-1 flex items-center gap-2 relative">
            <button 
              onClick={() => handleSearchSubmit()} 
              className="text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors active:scale-95 flex items-center justify-center animate-none"
              aria-label="Submit search"
            >
              <Search size={18} />
            </button>
            <input 
              type="text" 
              placeholder={activeView === 'detailed' ? `Tìm kiếm tại ${selectedProvince?.name}...` : "Tìm điểm đến trên bản đồ..."} 
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
              className="flex-1 bg-transparent outline-none text-slate-800 text-xs font-semibold placeholder-slate-400" 
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={14} />
              </button>
            )}
          </div>
          
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer">
            <SlidersHorizontal size={14} />
          </div>
        </div>

        {/* Search Suggestion Results list overlay */}
        <AnimatePresence>
          {isSearchFocused && searchQuery.trim() !== '' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/95 border border-slate-200/80 rounded-3xl p-3 shadow-xl max-h-68 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pointer-events-auto"
            >
              {/* Dynamic Geocoding Search Option */}
              <button
                onClick={() => handleSearchSubmit()}
                className="w-full px-4 py-3 rounded-2xl bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/40 flex items-center justify-between text-left transition-all duration-200 cursor-pointer group shrink-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 shrink-0">
                    {isSearching ? (
                      <Compass size={14} className="text-indigo-600 animate-spin" />
                    ) : (
                      <Search size={14} className="text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-[11.5px] font-extrabold text-indigo-600 group-hover:text-indigo-700 leading-tight">
                      {isSearching ? 'Đang tìm kiếm...' : `Tìm kiếm "${searchQuery}" trên bản đồ`}
                    </h5>
                    <span className="text-[9px] text-indigo-500/85 font-semibold">Tọa độ, URL Google Maps hoặc Địa điểm tự do</span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
              </button>

              {/* Local static province suggestions */}
              {searchResults.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="h-px bg-slate-100 my-1 mx-2"></div>
                  {searchResults.map((prov) => (
                    <button
                      key={prov.id}
                      onClick={() => handleProvinceSelect(prov)}
                      className="w-full px-4 py-3 rounded-2xl bg-white/0 hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        <div>
                          <h5 className="text-xs font-bold text-slate-700 group-hover:text-slate-800 leading-tight">
                            {prov.name}
                          </h5>
                          <span className="text-[10px] text-slate-400 font-semibold">{prov.region}</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Horizontal Category Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-1.5 scroll-smooth">
          {activeView === 'overview' ? (
            // Overview S-shaped map Filters
            regions.map((reg) => (
              <button 
                key={reg.key} 
                onClick={() => setSelectedRegion(reg.key === 'all' ? null : reg.key)}
                className={`
                  px-4 py-2 rounded-full text-[10px] font-extrabold whitespace-nowrap tracking-wide uppercase transition-all duration-300 active:scale-95 cursor-pointer
                  ${(selectedRegion === reg.key || (reg.key === 'all' && selectedRegion === null))
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/15 border border-indigo-500/20' 
                    : 'bg-white/80 backdrop-blur-sm text-slate-500 border border-slate-200/80 shadow-sm hover:text-slate-700 hover:bg-slate-100/80'
                  }
                `}
              >
                {reg.label}
              </button>
            ))
          ) : (
            // Detailed Leaflet map Filters
            [
              { key: 'all', label: 'Tất cả', icon: <Compass size={11} /> },
              { key: 'landmark', label: 'Cảnh đẹp', icon: <Landmark size={11} /> },
              { key: 'hotel', label: 'Khách sạn', icon: <Hotel size={11} /> },
              { key: 'restaurant', label: 'Ẩm thực', icon: <Utensils size={11} /> },
            ].map((filt) => (
              <button 
                key={filt.key} 
                onClick={() => { setActiveFilter(filt.key); setSelectedPlace(null); }}
                className={`
                  px-4 py-2 rounded-full text-[10px] font-extrabold whitespace-nowrap tracking-wide uppercase transition-all duration-300 active:scale-95 cursor-pointer flex items-center gap-1.5
                  ${activeFilter === filt.key
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/15 border border-indigo-500/20' 
                    : 'bg-white/80 backdrop-blur-sm text-slate-500 border border-slate-200/80 shadow-sm hover:text-slate-700 hover:bg-slate-100/80'
                  }
                `}
              >
                {filt.icon}
                {filt.label}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 2. Map Render Canvas Area */}
      <div className="flex-1 w-full relative">
        {/* S-shaped Stylized Vietnam SVG Canvas */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ 
            opacity: activeView === 'overview' ? 1 : 0,
            scale: zoomTransform.scale,
            x: zoomTransform.x,
            y: zoomTransform.y,
            pointerEvents: activeView === 'overview' ? 'auto' : 'none',
          }}
          transition={{ 
            type: "spring", 
            stiffness: 75,
            damping: 18,
            mass: 1.1,
          }}
          className={`absolute inset-0 z-10 origin-center flex items-center justify-center pt-24 pb-8 ${
            activeView === 'overview' || isZooming ? 'block' : 'hidden'
          }`}
        >
          <div className="w-[370px] h-full flex items-center justify-center">
            <VietnamSvgMap 
              onProvinceSelect={handleProvinceSelect} 
              selectedRegion={selectedRegion}
              userCoords={userCoords}
            />
          </div>
        </motion.div>

        {/* Detailed Map (Leaflet) Crossfade Canvas */}
        <AnimatePresence>
          {activeView === 'detailed' && selectedProvince && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 z-20 pointer-events-auto"
            >
              <DetailedMap 
                provinceName={selectedProvince.name}
                lat={selectedProvince.lat}
                lon={selectedProvince.lon}
                userCoords={userCoords}
                onSelectPlace={setSelectedPlace}
                activeFilter={activeFilter}
                searchResult={searchResult}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Bottom Drawer details card */}
      <div className="absolute bottom-28 left-6 right-6 z-20 pointer-events-none">
        <AnimatePresence>
          {selectedPlace ? (
            // Case A: A detailed place (POI) marker is clicked
            <motion.div
              initial={{ y: 150, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 150, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="bg-white/95 backdrop-blur-[20px] p-4 rounded-[32px] border border-white/80 shadow-2xl flex flex-col gap-3 pointer-events-auto select-none text-slate-700"
            >
              <div className="flex gap-4">
                <div className={`w-20 h-20 rounded-2xl ${selectedPlace.image} bg-cover bg-center border border-slate-200/80 shrink-0 flex items-center justify-center text-slate-400 bg-slate-50`}>
                  {selectedPlace.category === 'landmark' && <Landmark size={24} className="text-slate-300" />}
                  {selectedPlace.category === 'hotel' && <Hotel size={24} className="text-slate-300" />}
                  {selectedPlace.category === 'restaurant' && <Utensils size={24} className="text-slate-300" />}
                </div>
                <div className="flex-1 py-0.5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border
                        ${selectedPlace.category === 'landmark' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : ''}
                        ${selectedPlace.category === 'hotel' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : ''}
                        ${selectedPlace.category === 'restaurant' ? 'bg-rose-50 border-rose-100 text-rose-600' : ''}
                      `}>
                        {selectedPlace.category === 'landmark' ? 'Điểm ngắm cảnh' : ''}
                        {selectedPlace.category === 'hotel' ? 'Khách sạn / Resort' : ''}
                        {selectedPlace.category === 'restaurant' ? 'Nhà hàng đặc sản' : ''}
                      </span>
                      <button 
                        onClick={() => setSelectedPlace(null)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <h4 className="font-display font-bold text-slate-800 text-sm leading-tight">
                      {selectedPlace.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-amber-500 font-extrabold flex items-center gap-0.5">
                      <Star size={11} className="fill-amber-400 stroke-amber-400" /> {selectedPlace.rating}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">({selectedPlace.reviews} đánh giá)</span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5 ml-auto">
                      <Navigation size={10} className="text-slate-400" /> {selectedPlace.distance}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-normal leading-relaxed">
                {selectedPlace.description}
              </p>
              <div className="flex gap-2">
                <button className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-display text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/15 transition-all cursor-pointer">
                  Chỉ đường chi tiết
                </button>
                <button className="px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-rose-500 hover:text-rose-600 rounded-2xl flex items-center justify-center transition-colors cursor-pointer">
                  <Heart size={14} className="fill-current" />
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* 4. GPS Consent First-Time Modal Overlay */}
      <AnimatePresence>
        {showGpsModal && (
          <GpsPermissionModal 
            onAccept={requestGPS}
            onDecline={handleDeclineGps}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
