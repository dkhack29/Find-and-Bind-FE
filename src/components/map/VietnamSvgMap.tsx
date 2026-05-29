import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Compass, Landmark, Hotel } from 'lucide-react';

export interface ProvinceData {
  id: string;
  name: string;
  region: string;
  color: string;
  borderColor: string;
  glowColor: string;
  d: string;
  lat: number;
  lon: number;
  centerX: number;
  centerY: number;
  description: string;
  attractions: number;
}

export const provinces: ProvinceData[] = [
  // 1. Tây Bắc & Đông Bắc (Northern Mountains) - Yellow-Green theme
  {
    id: 'tay-mac-lai-chau',
    name: 'Tây Bắc Bộ (Lai Châu, Điện Biên)',
    region: 'Đông Bắc - Tây Bắc Bộ',
    color: 'fill-lime-100/70 hover:fill-lime-200/90',
    borderColor: 'stroke-lime-500/50',
    glowColor: 'shadow-lime-500/10',
    d: 'M 60,140 L 100,100 L 130,110 L 140,150 L 110,180 L 70,170 Z',
    lat: 21.5,
    lon: 103.0,
    centerX: 100,
    centerY: 140,
    description: 'Vùng biên cương hùng vĩ với đèo Pha Đin và di tích Điện Biên Phủ lừng lẫy.',
    attractions: 28,
  },
  {
    id: 'tay-mac-lao-cai',
    name: 'Lào Cai (Sapa) & Yên Bái',
    region: 'Đông Bắc - Tây Bắc Bộ',
    color: 'fill-emerald-100/70 hover:fill-emerald-200/90',
    borderColor: 'stroke-emerald-400/60',
    glowColor: 'shadow-emerald-500/10',
    d: 'M 130,110 L 170,80 L 200,95 L 180,145 L 140,150 Z',
    lat: 22.3,
    lon: 103.9,
    centerX: 165,
    centerY: 115,
    description: 'Nơi có đỉnh Fansipan - nóc nhà Đông Dương và những thửa ruộng bậc thang tuyệt đẹp.',
    attractions: 42,
  },
  {
    id: 'dong-bac',
    name: 'Đông Bắc (Hà Giang, Cao Bằng)',
    region: 'Đông Bắc - Tây Bắc Bộ',
    color: 'fill-green-100/70 hover:fill-green-200/90',
    borderColor: 'stroke-green-500/50',
    glowColor: 'shadow-green-500/10',
    d: 'M 200,95 L 240,90 L 260,120 L 230,150 L 180,145 Z',
    lat: 22.8,
    lon: 105.0,
    centerX: 220,
    centerY: 120,
    description: 'Cao nguyên đá Đồng Văn kỳ vĩ và thác Bản Giốc đẹp nhất Việt Nam.',
    attractions: 35,
  },
  // 2. Đồng Bằng Sông Hồng & Hà Nội - Red theme
  {
    id: 'ha-noi',
    name: 'Thủ đô Hà Nội',
    region: 'Hà Nội Trung Tâm',
    color: 'fill-rose-200/80 hover:fill-rose-300/90',
    borderColor: 'stroke-rose-500/70',
    glowColor: 'shadow-rose-500/20',
    d: 'M 175,155 L 195,150 L 205,170 L 185,175 Z',
    lat: 21.0285,
    lon: 105.8542,
    centerX: 190,
    centerY: 162,
    description: 'Thủ đô ngàn năm văn hiến, yên bình với 36 phố phường và Hồ Gươm cổ kính.',
    attractions: 84,
  },
  {
    id: 'hai-phong-quang-ninh',
    name: 'Quảng Ninh (Hạ Long) & Hải Phòng',
    region: 'Hà Nội Trung Tâm',
    color: 'fill-rose-100/70 hover:fill-rose-200/90',
    borderColor: 'stroke-rose-400/60',
    glowColor: 'shadow-rose-600/10',
    d: 'M 230,150 L 260,135 L 275,160 L 245,175 L 225,165 Z',
    lat: 20.95,
    lon: 107.0,
    centerX: 250,
    centerY: 155,
    description: 'Kỳ quan thiên nhiên thế giới Vịnh Hạ Long và đảo ngọc Cát Bà xinh đẹp.',
    attractions: 56,
  },
  {
    id: 'dong-bang-song-hong',
    name: 'Đồng Bằng Sông Hồng (Nam Định, Thái Bình)',
    region: 'KV Nam Hà Nội',
    color: 'fill-amber-100/70 hover:fill-amber-200/90',
    borderColor: 'stroke-amber-500/50',
    glowColor: 'shadow-amber-500/10',
    d: 'M 205,170 L 225,165 L 235,190 L 205,200 Z',
    lat: 20.4,
    lon: 106.2,
    centerX: 220,
    centerY: 180,
    description: 'Vùng đất lúa trù phú, cái nôi của nghệ thuật chèo cổ và nhà thờ đá Phát Diệm cổ.',
    attractions: 19,
  },
  // 3. Bắc Trung Bộ (Thanh Hóa to Huế) - Orange/Brown theme
  {
    id: 'thanh-hoa',
    name: 'Thanh Hóa (Sầm Sơn)',
    region: 'Bắc Miền Trung',
    color: 'fill-orange-100/70 hover:fill-orange-200/90',
    borderColor: 'stroke-orange-500/60',
    glowColor: 'shadow-orange-500/15',
    d: 'M 140,180 L 185,175 L 205,200 L 190,225 L 150,215 Z',
    lat: 19.8076,
    lon: 105.7765,
    centerX: 175,
    centerY: 200,
    description: 'Cửa ngõ miền Trung với bãi biển Sầm Sơn, di sản Thành Nhà Hồ độc đáo.',
    attractions: 31,
  },
  {
    id: 'nghe-an-ha-tinh',
    name: 'Nghệ An & Hà Tĩnh',
    region: 'Bắc Miền Trung',
    color: 'fill-orange-100/60 hover:fill-orange-200/80',
    borderColor: 'stroke-orange-400/50',
    glowColor: 'shadow-orange-600/10',
    d: 'M 150,215 L 190,225 L 210,245 L 195,275 L 155,255 Z',
    lat: 19.0,
    lon: 105.3,
    centerX: 180,
    centerY: 245,
    description: 'Vùng đất hiếu học, quê hương của Bác Hồ kính yêu tại Làng Sen quê nội.',
    attractions: 25,
  },
  {
    id: 'quang-binh-quang-tri',
    name: 'Quảng Bình (Phong Nha) & Quảng Trị',
    region: 'Bắc Miền Trung',
    color: 'fill-amber-100/60 hover:fill-amber-200/80',
    borderColor: 'stroke-amber-500/50',
    glowColor: 'shadow-amber-500/10',
    d: 'M 195,275 L 235,285 L 250,305 L 230,320 Z',
    lat: 17.5,
    lon: 106.3,
    centerX: 220,
    centerY: 295,
    description: 'Vương quốc hang động Phong Nha - Kẻ Bàng vĩ đại hàng đầu thế giới.',
    attractions: 38,
  },
  {
    id: 'hue',
    name: 'Thừa Thiên Huế (Cố Đô)',
    region: 'Bắc Miền Trung',
    color: 'fill-purple-100/70 hover:fill-purple-200/90',
    borderColor: 'stroke-purple-400/60',
    glowColor: 'shadow-purple-500/15',
    d: 'M 230,320 L 250,305 L 275,320 L 265,340 Z',
    lat: 16.4637,
    lon: 107.5908,
    centerX: 255,
    centerY: 322,
    description: 'Cố đô mộng mơ với Đại Nội cổ kính, lăng tẩm uy nghiêm và sông Hương lững lờ.',
    attractions: 48,
  },
  // 4. Nam Trung Bộ (Đà Nẵng to Bình Thuận) & Tây Nguyên - Indigo/Pink theme
  {
    id: 'da-nang-quang-nam',
    name: 'Đà Nẵng & Quảng Nam (Hội An)',
    region: 'Nam Miền Trung',
    color: 'fill-indigo-200/80 hover:fill-indigo-300/90',
    borderColor: 'stroke-indigo-400/60',
    glowColor: 'shadow-indigo-500/15',
    d: 'M 265,340 L 295,335 L 310,360 L 285,380 L 255,360 Z',
    lat: 15.9,
    lon: 108.3,
    centerX: 280,
    centerY: 355,
    description: 'Phố cổ Hội An lung linh hoa đăng và thành phố đáng sống Đà Nẵng với Cầu Vàng.',
    attractions: 67,
  },
  {
    id: 'tay-nguyen-kon-tum',
    name: 'Tây Nguyên Bắc (Gia Lai, Kon Tum)',
    region: 'Duyên Hải',
    color: 'fill-yellow-100/70 hover:fill-yellow-200/90',
    borderColor: 'stroke-yellow-600/50',
    glowColor: 'shadow-yellow-700/5',
    d: 'M 255,360 L 285,380 L 280,440 L 245,430 Z',
    lat: 14.3,
    lon: 108.0,
    centerX: 265,
    centerY: 400,
    description: 'Vùng đất đỏ bazan hùng vĩ, tiếng cồng chiêng vang vọng và hồ T\'Nưng xanh biếc.',
    attractions: 22,
  },
  {
    id: 'quang-ngai-binh-dinh',
    name: 'Quảng Ngãi & Bình Định (Quy Nhơn)',
    region: 'Nam Miền Trung',
    color: 'fill-indigo-100/70 hover:fill-indigo-200/90',
    borderColor: 'stroke-indigo-500/50',
    glowColor: 'shadow-indigo-600/10',
    d: 'M 310,360 L 335,375 L 330,425 L 280,440 L 285,380 Z',
    lat: 14.5,
    lon: 109.0,
    centerX: 315,
    centerY: 405,
    description: 'Quy Nhơn hoang sơ xinh đẹp, đảo Lý Sơn vương quốc tỏi trù phú.',
    attractions: 33,
  },
  {
    id: 'tay-nguyen-dak-lak',
    name: 'Đắk Lắk (Buôn Ma Thuột)',
    region: 'Duyên Hải',
    color: 'fill-yellow-100/60 hover:fill-yellow-200/80',
    borderColor: 'stroke-yellow-600/50',
    glowColor: 'shadow-yellow-800/10',
    d: 'M 245,430 L 280,440 L 295,490 L 255,500 Z',
    lat: 12.6,
    lon: 108.0,
    centerX: 270,
    centerY: 465,
    description: 'Thủ phủ cà phê Việt Nam, trải nghiệm cưỡi voi Bản Đôn bên dòng Sêrêpôk.',
    attractions: 29,
  },
  {
    id: 'phu-yen-khanh-hoa',
    name: 'Khánh Hòa (Nha Trang) & Phú Yên',
    region: 'Nam Miền Trung',
    color: 'fill-indigo-100/60 hover:fill-indigo-200/80',
    borderColor: 'stroke-indigo-400/50',
    glowColor: 'shadow-indigo-500/10',
    d: 'M 330,425 L 345,450 L 340,495 L 295,490 L 280,440 Z',
    lat: 12.5,
    lon: 109.1,
    centerX: 320,
    centerY: 460,
    description: 'Vịnh biển Nha Trang tuyệt mỹ và Gành Đá Đĩa Phú Yên kỳ thú hiếm thấy.',
    attractions: 54,
  },
  {
    id: 'lam-dong-binh-thuan',
    name: 'Lâm Đồng (Đà Lạt) & Bình Thuận',
    region: 'Nam Miền Trung',
    color: 'fill-pink-100/70 hover:fill-pink-200/90',
    borderColor: 'stroke-pink-400/50',
    glowColor: 'shadow-pink-500/10',
    d: 'M 295,490 L 340,495 L 320,550 L 275,540 Z',
    lat: 11.5,
    lon: 108.5,
    centerX: 310,
    centerY: 520,
    description: 'Thành phố sương mù Đà Lạt lãng mạn và đồi cát bay Mũi Né hoang sơ lộng gió.',
    attractions: 61,
  },
  // 5. Đông Nam Bộ - Golden Yellow theme
  {
    id: 'dong-nam-bo',
    name: 'Bình Dương, Đồng Nai & Tây Ninh',
    region: 'Miền Đông',
    color: 'fill-yellow-100/70 hover:fill-yellow-200/90',
    borderColor: 'stroke-yellow-500/50',
    glowColor: 'shadow-yellow-500/10',
    d: 'M 255,500 L 275,540 L 260,575 L 225,565 Z',
    lat: 11.2,
    lon: 106.8,
    centerX: 250,
    centerY: 535,
    description: 'Núi Bà Đen linh thiêng kỳ vĩ và thủ phủ công nghiệp phát triển sôi động.',
    attractions: 24,
  },
  {
    id: 'ho-chi-minh',
    name: 'TP. Hồ Chí Minh',
    region: 'KV Hồ Chí Minh',
    color: 'fill-red-200/80 hover:fill-red-300/90',
    borderColor: 'stroke-red-500/70',
    glowColor: 'shadow-red-500/20',
    d: 'M 240,550 L 255,545 L 250,565 L 235,560 Z',
    lat: 10.7769,
    lon: 106.7009,
    centerX: 245,
    centerY: 555,
    description: 'Thành phố mang tên Bác náo nhiệt, trung tâm kinh tế tài chính hiện đại bậc nhất.',
    attractions: 78,
  },
  // 6. Đồng Bằng Sông Cửu Long - Green theme
  {
    id: 'mekong-long-an',
    name: 'Long An & Tiền Giang',
    region: 'KV Bắc MêKông',
    color: 'fill-emerald-100/70 hover:fill-emerald-200/90',
    borderColor: 'stroke-emerald-400/60',
    glowColor: 'shadow-emerald-500/10',
    d: 'M 225,565 L 245,570 L 235,595 L 205,585 Z',
    lat: 10.4,
    lon: 106.2,
    centerX: 228,
    centerY: 580,
    description: 'Cửa ngõ miền Tây sông nước trĩu quả ngọt và văn hóa đờn ca tài tử đặc trưng.',
    attractions: 18,
  },
  {
    id: 'mekong-can-tho',
    name: 'Cần Thơ (Tây Đô) & Đồng Tháp',
    region: 'KV Bắc MêKông',
    color: 'fill-teal-100/70 hover:fill-teal-200/90',
    borderColor: 'stroke-teal-400/60',
    glowColor: 'shadow-teal-500/15',
    d: 'M 205,585 L 235,595 L 210,630 L 175,620 Z',
    lat: 10.0371,
    lon: 105.7883,
    centerX: 205,
    centerY: 605,
    description: 'Thủ phủ miền Tây nước nổi rực rỡ với chợ nổi Cái Răng tấp nập thuyền bè.',
    attractions: 37,
  },
  {
    id: 'mekong-kien-giang',
    name: 'Kiên Giang (Rạch Giá)',
    region: 'KV Nam MêKông',
    color: 'fill-teal-100/60 hover:fill-teal-200/80',
    borderColor: 'stroke-teal-400/50',
    glowColor: 'shadow-teal-500/10',
    d: 'M 175,620 L 200,625 L 185,660 L 150,650 Z',
    lat: 9.9,
    lon: 105.1,
    centerX: 178,
    centerY: 640,
    description: 'Vùng biển Tây trù phú với Vườn quốc gia U Minh Thượng và đất Hà Tiên nên thơ.',
    attractions: 23,
  },
  {
    id: 'mekong-ca-mau',
    name: 'Cà Mau & Bạc Liêu',
    region: 'KV Nam MêKông',
    color: 'fill-emerald-100/60 hover:fill-emerald-200/80',
    borderColor: 'stroke-emerald-500/50',
    glowColor: 'shadow-emerald-600/10',
    d: 'M 185,660 L 210,630 L 195,685 L 155,700 L 140,680 Z',
    lat: 9.1764,
    lon: 104.9081,
    centerX: 175,
    centerY: 670,
    description: 'Mũi đất cực Nam tổ quốc trù phú rừng ngập mặn đước và những cánh đồng quạt gió.',
    attractions: 26,
  },
];

// Coordinate limits for precision linear mapping
const latMin = 8.0;
const latMax = 23.5;
const lonMin = 101.5;
const lonMax = 110.0;

const svgWidth = 450;
const svgHeight = 780;

export function gpsToSvg(lat: number, lon: number) {
  const clampedLat = Math.max(latMin, Math.min(latMax, lat));
  const clampedLon = Math.max(lonMin, Math.min(lonMax, lon));

  // Longitude maps to X (horizontal layout with margins)
  const x = svgWidth * 0.12 + ((clampedLon - lonMin) / (lonMax - lonMin)) * (svgWidth * 0.76);
  
  // Latitude maps to Y (top is 23.5, bottom is 8.0)
  const y = svgHeight * 0.94 - ((clampedLat - latMin) / (latMax - latMin)) * (svgHeight * 0.88);

  return { x, y };
}

interface VietnamSvgMapProps {
  onProvinceSelect: (province: ProvinceData) => void;
  selectedRegion: string | null;
  userCoords: { lat: number; lon: number } | null;
}

export default function VietnamSvgMap({ onProvinceSelect, selectedRegion, userCoords }: VietnamSvgMapProps) {
  const [hoveredProvince, setHoveredProvince] = useState<ProvinceData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handlePointerMove = (e: React.PointerEvent) => {
    // Offset standard container coords to position tooltip cleanly
    const container = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - container.left + 15,
      y: e.clientY - container.top - 70,
    });
  };

  // Convert user position to SVG viewport space if available
  const userSvgPos = userCoords ? gpsToSvg(userCoords.lat, userCoords.lon) : null;

  return (
    <div 
      className="relative w-full h-[620px] bg-white/70 border border-slate-200/80 rounded-[32px] overflow-hidden flex items-center justify-center p-4 backdrop-blur-md shadow-sm"
      onPointerMove={handlePointerMove}
    >
      {/* Grid Pattern overlays in back */}
      <div 
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      />

      <svg 
        viewBox="0 0 450 780" 
        className="w-full h-full max-h-[580px] drop-shadow-[0_2px_12px_rgba(79,70,229,0.08)] select-none pointer-events-auto"
      >
        <defs>
          {/* Soft indigo drop-shadow filter */}
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#4f46e5" flood-opacity="0.25"/>
          </filter>
        </defs>

        {/* Vietnam Provinces Vector Layers */}
        <g id="vietnam-provinces" className="cursor-pointer">
          {provinces.map((prov) => {
            const isHighlighted = selectedRegion === null || prov.region === selectedRegion;
            
            return (
              <path
                key={prov.id}
                d={prov.d}
                onClick={() => onProvinceSelect(prov)}
                onPointerEnter={() => setHoveredProvince(prov)}
                onPointerLeave={() => setHoveredProvince(null)}
                className={`
                  ${prov.color} 
                  ${prov.borderColor}
                  transition-all duration-300 stroke-[1.2] stroke-linejoin-round
                  ${isHighlighted ? 'opacity-100 scale-100' : 'opacity-25 hover:opacity-75'}
                `}
                style={{
                  transformOrigin: `${prov.centerX}px ${prov.centerY}px`,
                  filter: hoveredProvince?.id === prov.id ? 'url(#neon-glow)' : 'none',
                }}
              />
            );
          })}
        </g>

        {/* Islands Vector Layers */}
        {/* Phu Quoc Island */}
        <path
          d="M 105,620 C 100,615 105,600 110,595 C 115,595 120,610 115,625 C 110,630 108,625 105,620 Z"
          onClick={() => onProvinceSelect({
            id: 'phu-quoc',
            name: 'Đảo Ngọc Phú Quốc',
            region: 'KV Nam MêKông',
            color: 'fill-teal-100/70',
            borderColor: 'stroke-teal-400',
            glowColor: 'shadow-teal-500/10',
            d: '',
            lat: 10.2289,
            lon: 103.9564,
            centerX: 110,
            centerY: 610,
            description: 'Đảo ngọc lớn nhất Việt Nam sở hữu bãi cát trắng mịn Bãi Sao, bãi Dài và hoàng hôn lộng lẫy.',
            attractions: 45
          })}
          className="fill-teal-100/70 hover:fill-teal-200/90 stroke-teal-400/80 cursor-pointer stroke-[1] hover:scale-110 transition-transform"
        />

        {/* Con Dao Island */}
        <circle
          cx="220"
          cy="700"
          r="4"
          className="fill-emerald-100/70 hover:fill-emerald-200/90 stroke-emerald-400/80 cursor-pointer stroke-[1] transition-all"
          onClick={() => onProvinceSelect({
            id: 'con-dao',
            name: 'Côn Đảo (Côn Sơn)',
            region: 'KV Nam MêKông',
            color: 'fill-emerald-100/70',
            borderColor: 'stroke-emerald-400',
            glowColor: 'shadow-emerald-500/10',
            d: '',
            lat: 8.6833,
            lon: 106.6000,
            centerX: 220,
            centerY: 700,
            description: 'Điểm du lịch tâm linh, văn hóa lịch sử hào hùng cùng hệ sinh thái biển đảo nguyên sơ vô giá.',
            attractions: 15
          })}
        />

        {/* Hoang Sa Archipelago */}
        <g className="cursor-pointer" onClick={() => onProvinceSelect({
          id: 'hoang-sa',
          name: 'Huyện đảo Hoàng Sa (Đà Nẵng)',
          region: 'Nam Miền Trung',
          color: 'fill-indigo-100/70',
          borderColor: 'stroke-indigo-400',
          glowColor: 'shadow-indigo-500/10',
          d: '',
          lat: 16.5,
          lon: 112.0,
          centerX: 380,
          centerY: 260,
          description: 'Quần đảo tiền tiêu thiêng liêng trực thuộc thành phố Đà Nẵng, Việt Nam.',
          attractions: 5
        })}>
          {[[370, 250], [380, 245], [375, 260], [385, 255], [390, 265]].map((coord, idx) => (
            <circle
              key={idx}
              cx={coord[0]}
              cy={coord[1]}
              r="3.5"
              className="fill-indigo-500/60 stroke-indigo-400 animate-pulse"
              style={{ animationDelay: `${idx * 0.4}s` }}
            />
          ))}
          <text x="360" y="235" className="fill-slate-600 font-display text-[9px] font-bold tracking-wider">H. HOÀNG SA</text>
        </g>

        {/* Truong Sa Archipelago */}
        <g className="cursor-pointer" onClick={() => onProvinceSelect({
          id: 'truong-sa',
          name: 'Huyện đảo Trường Sa (Khánh Hòa)',
          region: 'Nam Miền Trung',
          color: 'fill-indigo-100/70',
          borderColor: 'stroke-indigo-400',
          glowColor: 'shadow-indigo-500/10',
          d: '',
          lat: 8.87,
          lon: 111.9,
          centerX: 410,
          centerY: 520,
          description: 'Quần đảo san hô bao la thiêng liêng trực thuộc tỉnh Khánh Hòa, Việt Nam.',
          attractions: 12
        })}>
          {[[400, 500], [415, 515], [395, 530], [420, 505], [405, 545], [430, 535], [410, 555]].map((coord, idx) => (
            <circle
              key={idx}
              cx={coord[0]}
              cy={coord[1]}
              r="3.5"
              className="fill-indigo-500/60 stroke-indigo-400 animate-pulse"
              style={{ animationDelay: `${idx * 0.3}s` }}
            />
          ))}
          <text x="390" y="490" className="fill-slate-600 font-display text-[9px] font-bold tracking-wider">H. TRƯỜNG SA</text>
        </g>

        {/* Pulsing GPS Dot of User */}
        {userSvgPos && (
          <g>
            {/* Soft pulsing halo */}
            <circle
              cx={userSvgPos.x}
              cy={userSvgPos.y}
              r="18"
              className="fill-indigo-600/15 stroke-indigo-500/10 stroke-[1.5] animate-ping origin-center"
              style={{ animationDuration: '3s', transformOrigin: `${userSvgPos.x}px ${userSvgPos.y}px` }}
            />
            {/* Stronger glowing ring */}
            <circle
              cx={userSvgPos.x}
              cy={userSvgPos.y}
              r="8"
              className="fill-transparent stroke-indigo-500/30 stroke-[2] animate-pulse"
            />
            {/* Center indigo core */}
            <circle
              cx={userSvgPos.x}
              cy={userSvgPos.y}
              r="4.5"
              className="fill-indigo-600 shadow-[0_2px_8px_rgba(79,70,229,0.3)]"
            />
          </g>
        )}
      </svg>

      {/* Floating Glassmorphism Tooltip card */}
      <AnimatePresence>
        {hoveredProvince && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 pointer-events-none w-60 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3.5 shadow-xl flex flex-col gap-1.5 text-slate-700"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
            }}
          >
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold tracking-widest text-indigo-600 uppercase">
                {hoveredProvince.region}
              </span>
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <Compass size={11} className="text-slate-400" /> {hoveredProvince.attractions} địa danh
              </span>
            </div>
            
            <h4 className="font-display font-bold text-sm text-slate-800">
              {hoveredProvince.name}
            </h4>
            
            <p className="text-[11px] text-slate-500 leading-normal font-light">
              {hoveredProvince.description}
            </p>
            
            <div className="flex gap-2 mt-0.5 border-t border-slate-100 pt-1.5 justify-between">
              <span className="text-[9px] font-semibold text-slate-400">
                GPS: {hoveredProvince.lat.toFixed(2)}°N / {hoveredProvince.lon.toFixed(2)}°E
              </span>
              <span className="text-[9px] font-extrabold text-indigo-600 flex items-center gap-0.5">
                Chạm để zoom →
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
