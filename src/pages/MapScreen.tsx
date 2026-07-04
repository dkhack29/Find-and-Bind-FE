import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, SlidersHorizontal, ArrowLeft, Compass, MapPin, 
  Star, X, Landmark, Hotel, Utensils, ChevronRight, Navigation, Heart,
  ArrowUp, ArrowUpLeft, ArrowUpRight, RefreshCw, ChevronUp, ChevronDown, ArrowRight, Camera, Sparkles, Scale, Info, ShieldAlert, ShieldCheck
} from 'lucide-react';
import VietnamSvgMap, { provinces, ProvinceData } from '../components/map/VietnamSvgMap';
import DetailedMap, { MapPlace } from '../components/map/DetailedMap';
import GpsPermissionModal from '../components/map/GpsPermissionModal';
import { Geolocation } from '@capacitor/geolocation';
import { useAppContext } from '../context/AppContext';
import { cn } from '../App';

// Helper function to map OSRM step maneuvers to Lucide Icons
const getStepIcon = (step: any) => {
  if (!step || !step.maneuver) return <ArrowUp size={11} />;
  
  const type = step.maneuver.type;
  const modifier = step.maneuver.modifier || "";

  if (type === 'arrive') return <MapPin size={11} className="fill-current text-white" />;
  if (type === 'depart') return <Compass size={11} />;
  if (type === 'u-turn') return <RefreshCw size={11} />;
  if (type === 'roundabout' || type === 'rotary') return <RefreshCw size={11} />;

  if (modifier.includes('left')) {
    if (modifier.includes('slight')) return <ArrowUpLeft size={12} />;
    return <ArrowLeft size={12} />;
  }
  if (modifier.includes('right')) {
    if (modifier.includes('slight')) return <ArrowUpRight size={12} />;
    return <ArrowRight size={12} />;
  }

  return <ArrowUp size={11} />;
};

// Helper function to construct Vietnamese navigation descriptions from OSRM steps
const getStepInstruction = (step: any) => {
  if (!step || !step.maneuver) return { title: "Đi thẳng", sub: "" };
  
  const type = step.maneuver.type;
  const modifier = step.maneuver.modifier || "";
  const name = step.name || "";
  const distance = step.distance; // in meters
  const duration = step.duration; // in seconds

  let action = "Đi thẳng";
  switch (type) {
    case 'depart':
      action = "Bắt đầu khởi hành";
      break;
    case 'arrive':
      action = "Đến điểm đích";
      break;
    case 'u-turn':
      action = "Quay đầu xe";
      break;
    case 'merge':
      action = "Nhập làn giao thông";
      break;
    case 'ramp':
      action = "Rẽ vào đường tránh/đường nhánh";
      break;
    case 'roundabout':
    case 'rotary':
      action = "Đi vào vòng xuyến";
      break;
    case 'turn':
    case 'new name':
      if (modifier.includes('left')) {
        action = modifier.includes('slight') ? "Rẽ chếch sang bên trái" : modifier.includes('sharp') ? "Rẽ ngoặt sang bên trái" : "Rẽ trái";
      } else if (modifier.includes('right')) {
        action = modifier.includes('slight') ? "Rẽ chếch sang bên phải" : modifier.includes('sharp') ? "Rẽ ngoặt sang bên phải" : "Rẽ phải";
      } else {
        action = "Tiếp tục đi thẳng";
      }
      break;
    default:
      if (modifier.includes('left')) {
        action = "Rẽ trái";
      } else if (modifier.includes('right')) {
        action = "Rẽ phải";
      } else {
        action = "Tiếp tục đi thẳng";
      }
  }

  let title = action;
  if (name) {
    title += ` vào đường ${name}`;
  } else if (type === 'arrive') {
    title = "Bạn đã đến điểm đích";
  }

  const distText = distance >= 1000 
    ? `${(distance / 1000).toFixed(1)} km` 
    : `${Math.round(distance)} m`;

  const timeText = duration >= 60
    ? `${Math.round(duration / 60)} phút`
    : `${Math.round(duration)} giây`;

  let sub = "";
  if (type !== 'arrive') {
    sub = `Di chuyển tiếp ${distText} (${timeText})`;
  }

  return { title, sub };
};

export default function MapScreen() {
  const navigate = useNavigate();
  const { privacySettings, featureFlags, incrementQuota, places, avoidList } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const isRoutingActive = searchParams.get('routing') === 'true';

  // Routing Details state
  const [routeDetails, setRouteDetails] = useState<{ distance: string; duration: string; steps: any[] } | null>(null);
  const [isDirectionsExpanded, setIsDirectionsExpanded] = useState(false);

  const setIsRoutingActive = (active: boolean) => {
    if (active) {
      setSearchParams({ routing: 'true' });
    } else {
      setSearchParams({});
      setRouteDetails(null);
      setIsDirectionsExpanded(false);
    }
  };

  // Navigation & View States
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

  // Detailed Map Filter States
  const [activeFilter, setActiveFilter] = useState<string>('all'); // all, landmark, hotel, restaurant

  // Phase 1 states
  const [isVisualSearching, setIsVisualSearching] = useState(false);
  const [comparePlaces, setComparePlaces] = useState<MapPlace[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

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
      setShowGpsModal(true);
    } else if (consented === 'true') {
      requestGPS();
    }
  }, []);

  // Clear GPS coordinate marker immediately if user opts out of location tracking
  useEffect(() => {
    if (!privacySettings.trackLocation) {
      setUserCoords(null);
    }
  }, [privacySettings.trackLocation]);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const radlat1 = (Math.PI * lat1) / 180;
    const radlat2 = (Math.PI * lat2) / 180;
    const theta = lon1 - lon2;
    const radtheta = (Math.PI * theta) / 180;
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) dist = 1;
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    return dist * 60 * 1.1515 * 1.609344;
  };

  const findClosestProvince = (lat: number, lon: number, provinceList: ProvinceData[]): ProvinceData | null => {
    if (!provinceList || provinceList.length === 0) return null;
    
    let closestProv = provinceList[0];
    let minDistance = getDistance(lat, lon, provinceList[0].lat, provinceList[0].lon);

    for (let i = 1; i < provinceList.length; i++) {
      const dist = getDistance(lat, lon, provinceList[i].lat, provinceList[i].lon);
      if (dist < minDistance) {
        minDistance = dist;
        closestProv = provinceList[i];
      }
    }
    return closestProv;
  };

  const requestGPS = async () => {
    if (!privacySettings.trackLocation) {
      alert("Quyền định vị đã bị tắt trong Cài đặt riêng tư của bạn. Vui lòng bật lại ở trang Cá nhân.");
      return;
    }
    try {
      const hasPermission = await Geolocation.checkPermissions();
      if (hasPermission.location !== 'granted') {
        await Geolocation.requestPermissions();
      }
      
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setUserCoords({ lat, lon });
      localStorage.setItem('gps_consented', 'true');
      localStorage.setItem('gps_denied', 'false');
      setShowGpsModal(false);
      setTimeout(() => {
        const localProvince = findClosestProvince(lat, lon, provinces);
        if (localProvince) {
          handleProvinceSelect(localProvince);
        }
      }, 300);
    } catch (err) {
      console.warn("Capacitor Geolocation not available or failed, falling back to browser geolocation:", err);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            setUserCoords({ lat, lon });
            localStorage.setItem('gps_consented', 'true');
            localStorage.setItem('gps_denied', 'false');
            setShowGpsModal(false);
            setTimeout(() => {
              const localProvince = findClosestProvince(lat, lon, provinces);
              if (localProvince) {
                handleProvinceSelect(localProvince);
              }
            }, 300);
          },
          (error) => {
            console.warn("Browser GPS High Accuracy failed, trying low accuracy fallback:", error);
            navigator.geolocation.getCurrentPosition(
              (pos2) => {
                const lat = pos2.coords.latitude;
                const lon = pos2.coords.longitude;
                setUserCoords({ lat, lon });
                localStorage.setItem('gps_consented', 'true');
                localStorage.setItem('gps_denied', 'false');
                setShowGpsModal(false);
                setTimeout(() => {
                  const localProvince = findClosestProvince(lat, lon, provinces);
                  if (localProvince) {
                    handleProvinceSelect(localProvince);
                  }
                }, 300);
              },
              (error2) => {
                console.error("Browser GPS Low Accuracy also failed: ", error2);
                setUserCoords({ lat: 19.8076, lon: 105.7765 });
                localStorage.setItem('gps_consented', 'false');
                localStorage.setItem('gps_denied', 'true');
                setShowGpsModal(false);
              },
              { enableHighAccuracy: false, timeout: 10000 }
            );
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setUserCoords({ lat: 19.8076, lon: 105.7765 });
        setShowGpsModal(false);
      }
    }
  };

  const handleDeclineGps = () => {
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

  const parseCoordinates = (input: string): { lat: number; lon: number } | null => {
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

  const goToLocation = (lat: number, lon: number, label: string) => {
    const mockProv = mockProvinceFromSearchResult(lat, lon, label);
    setSearchResult({ lat, lon, label });
    setSelectedProvince(mockProv);
    setIsSearchFocused(false);
  };

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    const coords = parseCoordinates(searchQuery);
    if (coords) {
      goToLocation(coords.lat, coords.lon, `Tọa độ: ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`);
      return;
    }

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

  // Phase 1: Visual Search handler (FR-05)
  const handleVisualSearchFile = (file: File) => {
    setIsVisualSearching(true);
    incrementQuota('geminiVision');

    // Simulate Gemini Vision AI processing delay
    setTimeout(() => {
      setIsVisualSearching(false);
      
      // Match one of our key demo places randomly
      const placesToMatch = [
        { id: 1, name: "Vịnh Hạ Long", lat: 20.9489, lon: 107.0734, provName: "Quảng Ninh" },
        { id: 2, name: "Phố cổ Hội An", lat: 15.8801, lon: 108.3380, provName: "Quảng Nam" },
        { id: 3, name: "Đà Lạt Chill", lat: 11.9404, lon: 108.4583, provName: "Lâm Đồng" },
        { id: 5, name: "Chợ Bến Thành", lat: 10.7719, lon: 106.6983, provName: "Hồ Chí Minh" }
      ];
      
      const match = placesToMatch[Math.floor(Math.random() * placesToMatch.length)];
      const foundProv = provinces.find(p => p.name.includes(match.provName));

      if (foundProv) {
        setSelectedProvince(foundProv);
        // Find place in AppContext places
        const ctxPlace = places.find(p => p.id === match.id);
        if (ctxPlace) {
          const mapPlace: MapPlace = {
            id: String(ctxPlace.id),
            name: ctxPlace.title,
            category: (ctxPlace.tag.toLowerCase().includes('khách') ? 'hotel' : ctxPlace.tag.toLowerCase().includes('ẩm') ? 'restaurant' : 'landmark') as 'landmark' | 'hotel' | 'restaurant',
            lat: ctxPlace.lat!,
            lon: ctxPlace.lon!,
            rating: ctxPlace.rating,
            reviews: Number(ctxPlace.reviewsCount) || 0,
            image: ctxPlace.imageClass,
            description: ctxPlace.description,
            distance: '1.5 km',
            isSponsored: ctxPlace.isSponsored,
            trustScore: ctxPlace.trustScore,
            riskLevel: ctxPlace.riskLevel
          };
          setSelectedPlace(mapPlace);
        }
        alert(`AI Gemini (Vision) đã nhận diện ảnh: "${match.name}"! Tự động hiển thị trên bản đồ.`);
      }
    }, 2200);
  };

  // Phase 1: Toggle place in comparison list
  const toggleCompare = (place: MapPlace) => {
    setComparePlaces(prev => {
      const exists = prev.some(p => p.id === place.id);
      if (exists) {
        return prev.filter(p => p.id !== place.id);
      } else {
        if (prev.length >= 3) {
          alert("Bạn chỉ có thể so sánh tối đa 3 địa điểm cùng lúc.");
          return prev;
        }
        return [...prev, place];
      }
    });
  };

  const handleProvinceSelect = (prov: ProvinceData) => {
    setSelectedProvince(prov);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  const handleBackToOverview = () => {
    setSelectedPlace(null);
    setSearchResult(null);
    setSearchQuery('');
    setSelectedProvince(null);
    setActiveFilter('all');
    setSelectedRegion(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="h-full relative bg-slate-50 overflow-hidden flex flex-col text-slate-800"
    >
      {/* 1. Header Navigation Glass Card */}
      {!isRoutingActive && (
        <div className="absolute top-12 left-6 right-6 z-30 flex flex-col gap-3">
          <div className="bg-white/85 backdrop-blur-[20px] border border-white/60 h-14 rounded-full shadow-lg flex items-center px-4 gap-3">
            {selectedProvince ? (
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
                placeholder={selectedProvince ? `Tìm kiếm tại ${selectedProvince?.name}...` : "Tìm điểm đến tại Việt Nam..."} 
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
                className="flex-1 bg-transparent outline-none text-slate-800 text-xs font-semibold placeholder-slate-400" 
              />
              
              {/* Visual Search Button (FR-05) */}
              {featureFlags.visualSearch && !featureFlags.globalKillSwitch && (
                <>
                  <button 
                    onClick={() => document.getElementById('visual-search-file-picker')?.click()}
                    className="text-slate-400 hover:text-indigo-600 active:scale-95 transition-colors p-1"
                    title="Tìm bằng ảnh (Gemini AI)"
                  >
                    <Camera size={18} />
                  </button>
                  <input 
                    id="visual-search-file-picker"
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVisualSearchFile(file);
                    }}
                  />
                </>
              )}

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
                <button
                  onClick={() => handleSearchSubmit()}
                  className="w-full px-4 py-3 rounded-2xl bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/40 flex items-center justify-between text-left transition-all duration-200 cursor-pointer group shrink-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 shrink-0">
                      {isSearching ? (
                        <Compass size={14} className="text-indigo-600 animate-spin" style={{ animationDuration: '1.5s' }} />
                      ) : (
                        <Search size={14} className="text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black text-indigo-600 group-hover:text-indigo-700 leading-tight">
                        {isSearching ? 'Đang tìm kiếm...' : `Tìm kiếm "${searchQuery}" trên bản đồ`}
                      </h5>
                      <span className="text-[9px] text-indigo-500/85 font-semibold">Tọa độ, URL Google Maps hoặc Địa điểm tự do</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                </button>

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
            {!selectedProvince ? (
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
      )}

      {/* Gemini Vision loading overlay */}
      <AnimatePresence>
        {isVisualSearching && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white pointer-events-auto">
            <div className="w-24 h-24 border-4 border-dashed border-indigo-500 rounded-full animate-spin flex items-center justify-center mb-6">
              <Camera size={36} className="text-indigo-400 animate-pulse" />
            </div>
            <h3 className="font-display font-black text-lg mb-2">Gemini AI Vision</h3>
            <p className="text-xs text-slate-300 font-semibold tracking-wide animate-pulse">Đang quét phân tích nhận diện hình ảnh của bạn...</p>
          </div>
        )}
      </AnimatePresence>

      {/* OSRM Detailed Routing Top Panel */}
      {isRoutingActive && selectedPlace && (
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-12 left-6 right-6 z-30 pointer-events-auto bg-white/95 backdrop-blur-[20px] shadow-xl rounded-[28px] border border-white/60 p-4 flex gap-3.5 items-center select-none"
        >
          <button 
            onClick={() => setIsRoutingActive(false)}
            className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition-transform cursor-pointer shrink-0"
            aria-label="Thoát dẫn đường"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex flex-col items-center justify-between h-[56px] w-3 relative shrink-0">
            <div className="w-3 h-3 rounded-full border-2 border-indigo-600 bg-white"></div>
            <div className="w-0.5 h-6 border-l border-dashed border-slate-300"></div>
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
          </div>

          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <div className="bg-slate-50 border border-slate-200/50 rounded-xl px-3 py-1.5 flex items-center">
              <span className="font-display text-[9px] font-black text-slate-400 uppercase tracking-wide mr-2 shrink-0">Từ:</span>
              <span className="font-display text-[10.5px] font-extrabold text-slate-700 truncate">
                Vị trí của bạn
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200/50 rounded-xl px-3 py-1.5 flex items-center">
              <span className="font-display text-[9px] font-black text-slate-400 uppercase tracking-wide mr-2 shrink-0">Đến:</span>
              <span className="font-display text-[10.5px] font-extrabold text-indigo-600 truncate">
                {selectedPlace.name}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. Map Render Canvas Area */}
      <div className="flex-1 w-full relative z-10">
        <div className="absolute inset-0 pointer-events-auto">
          <DetailedMap 
            selectedProvince={selectedProvince}
            userCoords={userCoords}
            onSelectPlace={setSelectedPlace}
            activeFilter={activeFilter}
            searchResult={searchResult}
            selectedPlace={selectedPlace}
            isRoutingActive={isRoutingActive}
            onSelectProvince={handleProvinceSelect}
            selectedRegion={selectedRegion}
            onRouteCalculate={setRouteDetails}
            onRequestGPS={requestGPS}
          />
        </div>
      </div>

      {/* 3. Bottom Drawer details card */}
      <div className="absolute bottom-28 left-6 right-6 z-20 pointer-events-none">
        <AnimatePresence>
          {selectedPlace && !isRoutingActive ? (
            <motion.div
              initial={{ y: 150, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 150, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="bg-white/95 backdrop-blur-[20px] p-4 rounded-[32px] border border-white/80 shadow-2xl flex flex-col gap-3 pointer-events-auto select-none text-slate-700 text-left"
            >
              {/* Check if Avoid List active */}
              {avoidList.includes(Number(selectedPlace.id)) && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-2xl text-[11px] font-semibold flex items-center gap-2">
                  <ShieldAlert size={14} className="shrink-0" />
                  <span>Địa điểm này nằm trong danh sách tránh xa của bạn.</span>
                </div>
              )}

              <div className="flex gap-4">
                <div className={`w-20 h-20 rounded-2xl ${selectedPlace.image} bg-cover bg-center border border-slate-200/80 shrink-0 flex items-center justify-center text-slate-400 bg-slate-50 relative`}>
                  {selectedPlace.isSponsored && (
                    <span className="absolute top-1 left-1 bg-amber-500 text-white text-[7px] font-black uppercase px-1 py-0.2 rounded border border-white">Ad</span>
                  )}
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
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] text-amber-500 font-extrabold flex items-center gap-0.5">
                      <Star size={11} className="fill-amber-400 stroke-amber-400" /> {selectedPlace.rating}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">({selectedPlace.reviews} đánh giá)</span>
                    
                    {selectedPlace.trustScore && (
                      <span className="text-[9px] bg-green-50 text-green-700 font-bold px-1.5 py-0.2 rounded border border-green-150 flex items-center gap-0.5">
                        <ShieldCheck size={9} /> Trust {selectedPlace.trustScore}
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5 ml-auto">
                      <Navigation size={10} className="text-slate-400" /> {selectedPlace.distance}
                    </span>
                  </div>
                </div>
              </div>
<<<<<<< HEAD
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                {selectedPlace.description}
              </p>
=======
              {/* Description with short-review annotation */}
              <div className="relative">
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  {selectedPlace.description}
                </p>
                {selectedPlace.description && selectedPlace.description.length < 80 && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-amber-500 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                    <Star size={8} className="fill-amber-400 stroke-amber-400" />
                    Dữ liệu được thu thập từ cộng đồng theo quy trình nội bộ
                  </span>
                )}
              </div>

              {/* 3-button action row */}
>>>>>>> 6d10b0462304bd2a311987c3f46183c555177b21
              <div className="flex gap-2">
                {/* Nút 1: Chi tiết – show tất cả reviews gần nhất */}
                <button
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 text-slate-700 font-display text-[10.5px] font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Xem tất cả đánh giá gần nhất"
                >
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  Chi tiết
                </button>

                {/* Nút 2: Đường dẫn – chỉ đường từ vị trí hiện tại */}
                <button
                  onClick={async () => {
                    if (avoidList.includes(Number(selectedPlace.id))) {
                      alert("Không thể tìm đường đến địa điểm trong danh sách tránh xa.");
                      return;
                    }
                    if (!userCoords) {
                      await requestGPS();
                    }
                    setIsRoutingActive(true);
                  }}
<<<<<<< HEAD
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-display text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/15 transition-all cursor-pointer text-center"
=======
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-display text-[10.5px] font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                  title="Chỉ đường từ vị trí hiện tại"
>>>>>>> 6d10b0462304bd2a311987c3f46183c555177b21
                >
                  <Navigation size={12} className="fill-current" />
                  Đường dẫn
                </button>

<<<<<<< HEAD
                {/* POI Compare Checkbox Option (FR-13) */}
                {featureFlags.comparePois && !featureFlags.globalKillSwitch && (
                  <label className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 px-3.5 py-2.5 rounded-2xl cursor-pointer active:scale-95 transition-all text-[11px] font-black uppercase shrink-0">
                    <input 
                      type="checkbox"
                      checked={comparePlaces.some(p => p.id === selectedPlace.id)}
                      onChange={() => toggleCompare(selectedPlace)}
                      className="w-3.5 h-3.5 accent-indigo-600 rounded border-slate-300"
                    />
                    So sánh
                  </label>
                )}

                <button 
                  onClick={() => navigate(`/place/${selectedPlace.id}`)}
                  className="px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl flex items-center justify-center transition-colors cursor-pointer"
                >
                  Chi tiết
=======
                {/* Nút 3: Yêu thích – thêm vào danh sách yêu thích */}
                <button
                  className="w-11 h-10 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-100 text-rose-500 hover:text-rose-600 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0"
                  title="Thêm vào danh sách yêu thích"
                >
                  <Heart size={14} className="fill-current" />
>>>>>>> 6d10b0462304bd2a311987c3f46183c555177b21
                </button>
              </div>
            </motion.div>
          ) : isRoutingActive && selectedPlace ? (
            <motion.div
              initial={{ y: 150, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 150, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="bg-white/95 backdrop-blur-[20px] p-4 rounded-[32px] border border-white/80 shadow-2xl flex flex-col gap-3 pointer-events-auto select-none text-slate-700 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Navigation size={14} className="fill-current animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display font-black text-slate-800 text-lg leading-none">
                        {routeDetails ? routeDetails.duration : '-- phút'}
                      </span>
                      <span className="font-display font-bold text-slate-400 text-xs">
                        ({routeDetails ? routeDetails.distance : '-- km'})
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Tuyến đường nhanh nhất qua OSRM</p>
                  </div>
                </div>

                {routeDetails && routeDetails.steps && routeDetails.steps.length > 0 && (
                  <button
                    onClick={() => setIsDirectionsExpanded(!isDirectionsExpanded)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-[10.5px] font-extrabold text-indigo-600 cursor-pointer transition-colors"
                  >
                    <span>{isDirectionsExpanded ? "Ẩn chỉ dẫn" : "Chi tiết rẽ"}</span>
                    {isDirectionsExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                  </button>
                )}
              </div>

              <AnimatePresence>
                {isDirectionsExpanded && routeDetails && routeDetails.steps && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-slate-100 pt-3"
                  >
                    <div className="max-h-[220px] overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-200">
                      {routeDetails.steps.map((step: any, idx: number) => {
                        const iconInfo = getStepIcon(step);
                        const textInstruction = getStepInstruction(step);
                        const isLast = idx === routeDetails.steps.length - 1;

                        return (
                          <div key={idx} className="flex gap-3 items-start relative">
                            <div className="flex flex-col items-center shrink-0 w-6 relative">
                              <div className={`w-6 h-6 rounded-full border flex items-center justify-center
                                ${idx === 0 ? 'bg-indigo-600 border-indigo-600 text-white' : ''}
                                ${isLast ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-600'}
                              `}>
                                {iconInfo}
                              </div>
                              {!isLast && (
                                <div className="w-0.5 h-8 bg-slate-100 absolute top-6 bottom-0"></div>
                              )}
                            </div>
                            
                            <div className="flex-1 py-0.5">
                              <p className="text-[11.5px] font-bold text-slate-700 leading-tight">
                                {textInstruction.title}
                              </p>
                              {textInstruction.sub && (
                                <p className="text-[9.5px] font-medium text-slate-400 mt-0.5">
                                  {textInstruction.sub}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Sticky Bottom Compare Banner */}
      {comparePlaces.length > 0 && (
        <div className="fixed bottom-28 left-6 right-6 z-40 bg-slate-900 text-white p-4 rounded-3xl flex justify-between items-center shadow-2xl pointer-events-auto border border-slate-800 text-left">
          <div className="flex items-center gap-2">
            <Scale className="text-amber-400 animate-pulse" size={16} />
            <div>
              <div className="text-xs font-black uppercase text-indigo-400 tracking-wider">So sánh POIs ({comparePlaces.length}/3)</div>
              <p className="text-[10px] text-slate-400 font-semibold leading-none mt-1">Đã chọn: {comparePlaces.map(p => p.name).join(', ')}</p>
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button 
              onClick={() => setShowCompareModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase px-3 py-2 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              So sánh
            </button>
            <button 
              onClick={() => setComparePlaces([])}
              className="bg-slate-800 text-slate-400 hover:text-white text-[10px] font-black uppercase px-2.5 py-2 rounded-xl transition-all cursor-pointer"
            >
              Xóa
            </button>
          </div>
        </div>
      )}

      {/* POI Side-by-Side Comparison Modal */}
      <AnimatePresence>
        {showCompareModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCompareModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden relative z-10 shadow-2xl flex flex-col max-h-[85vh] text-left text-slate-800"
            >
              <div className="bg-gradient-to-r from-indigo-950 to-slate-900 text-white p-5 flex justify-between items-center shrink-0 border-b border-indigo-900/50">
                <div className="flex items-center gap-2">
                  <Scale className="text-amber-400" size={20} />
                  <h3 className="font-display font-black text-base uppercase tracking-wider text-white">Bảng So sánh Địa điểm</h3>
                </div>
                <button 
                  onClick={() => setShowCompareModal(false)} 
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 transition-colors"
                >
                  <X size={18}/>
                </button>
              </div>

              <div className="flex-1 overflow-x-auto p-6 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-3 pr-4 font-black uppercase text-[10px] text-slate-400 tracking-wider w-24">Thuộc tính</th>
                      {comparePlaces.map(place => (
                        <th key={place.id} className="py-3 px-3 min-w-[120px] font-black text-slate-900 text-xs">
                          <div className="flex flex-col gap-1">
                            <span className="truncate max-w-[120px]">{place.name}</span>
                            <span className="text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/50 w-max">{place.category}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 pr-4 font-bold text-slate-500">Đánh giá</td>
                      {comparePlaces.map(p => (
                        <td key={p.id} className="py-3 px-3 font-semibold">
                          <span className="text-amber-500 font-extrabold flex items-center gap-0.5">{p.rating} <Star size={11} className="fill-amber-400"/></span>
                          <span className="text-[9px] text-slate-400">({p.reviews} reviews)</span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 pr-4 font-bold text-slate-500">Độ tin cậy</td>
                      {comparePlaces.map(p => (
                        <td key={p.id} className="py-3 px-3">
                          {p.trustScore ? (
                            <span className="bg-green-50 border border-green-200 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-black uppercase">
                              Trust {p.trustScore}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">Chưa xác minh</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 pr-4 font-bold text-slate-500">Mức rủi ro</td>
                      {comparePlaces.map(p => {
                        const isHigh = p.riskLevel === 'Trung bình' || p.riskLevel === 'Cao';
                        return (
                          <td key={p.id} className={cn("py-3 px-3 font-extrabold text-[10.5px]", isHigh ? "text-rose-600" : "text-emerald-600")}>
                            {p.riskLevel || 'Bình thường'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 pr-4 font-bold text-slate-500">Khoảng cách</td>
                      {comparePlaces.map(p => (
                        <td key={p.id} className="py-3 px-3 font-bold text-slate-700">
                          {p.distance}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 pr-4 font-bold text-slate-500">Tài trợ (Ad)</td>
                      {comparePlaces.map(p => (
                        <td key={p.id} className="py-3 px-3">
                          {p.isSponsored ? (
                            <span className="bg-amber-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded border border-white">Được tài trợ</span>
                          ) : (
                            <span className="text-slate-400 font-medium">Không</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 shrink-0">
                <button 
                  onClick={() => setShowCompareModal(false)}
                  className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-2xl text-xs text-center cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/10 active:scale-95 transition-transform"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
