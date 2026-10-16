import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronLeft, User, Heart, Users, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../App';
import { itineraryService } from '@/services/itinerary/itineraryApi';
import { TravelCompanionEnum, TravalStyleEnum, CreateItineraryActivityDto } from '@/services/itinerary/itineraryType';
import { getAccessToken } from '@/helper/callApi';

const COMPANION_MAP: Record<string, TravelCompanionEnum> = {
  'Một mình': TravelCompanionEnum.Solo,
  'Cặp đôi': TravelCompanionEnum.Couple,
  'Gia đình': TravelCompanionEnum.Family,
  'Nhóm bạn': TravelCompanionEnum.Friends,
};

const STYLE_MAP: Record<string, TravalStyleEnum> = {
  'Nghỉ dưỡng & Thư giãn': TravalStyleEnum.Relax,
  'Khám phá Văn hóa': TravalStyleEnum.Culture,
  'Thiên nhiên & Mạo hiểm': TravalStyleEnum.Adventure,
};

export default function AICreator() {
  const navigate = useNavigate();
  const { addTrip, places, refreshTrips } = useAppContext();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customDest, setCustomDest] = useState('');

  const [choices, setChoices] = useState({ dest: '', who: '', style: '' });

  const executePlanGeneration = async (finalChoices: typeof choices) => {
    setIsGenerating(true);
    const destination = finalChoices.dest.trim() || 'Đà Lạt';
    const travelWith = COMPANION_MAP[finalChoices.who] ?? TravelCompanionEnum.Solo;
    const style = STYLE_MAP[finalChoices.style] ?? TravalStyleEnum.Relax;

    try {
      let aiDays: any[] = [];
      try {
        const aiRes: any = await itineraryService.generateTripPlan({
          destination,
          travelWith,
          style,
          budget: 'Trung bình',
          days: 3,
        });

        if (aiRes?.data?.itinerary && Array.isArray(aiRes.data.itinerary)) {
          aiDays = aiRes.data.itinerary;
        } else if (Array.isArray(aiRes?.data)) {
          aiDays = aiRes.data;
        }
      } catch (aiErr) {
        console.warn('AI Trip Plan API request failed or returned error, using fallback:', aiErr);
      }

      // Convert AI response into UI TripDay format
      const mappedItinerary = aiDays.length > 0
        ? aiDays.map((d: any, idx: number) => ({
            day: d.day || idx + 1,
            title: `Ngày ${d.day || idx + 1}: Khám phá ${destination}`,
            activities: (d.activities || []).map((act: any) => ({
              time: act.time || '08:30',
              location: act.location || destination,
              description: act.description || 'Tham quan và trải nghiệm',
              matchedLocationId: act.matchedLocationId || null,
              isVerified: !!act.isVerified,
            })),
            items: (d.activities || []).map((act: any) => ({
              time: act.time || '08:30',
              act: `${act.location ? act.location + ' - ' : ''}${act.description || 'Tham quan điểm du lịch'}`,
              type: act.isVerified ? 'verified' : 'explore',
            })),
          }))
        : [
            {
              day: 1,
              title: `Khởi hành đến ${destination}`,
              activities: [
                { time: '08:00', location: destination, description: `Di chuyển đến ${destination} & Check-in`, isVerified: true },
                { time: '11:30', location: `Ẩm thực ${destination}`, description: 'Thưởng thức ẩm thực đặc sản địa phương', isVerified: true },
                { time: '14:30', location: `Danh lam ${destination}`, description: `Khám phá các danh lam tiêu biểu tại ${destination}`, isVerified: false },
                { time: '18:30', location: `Chợ đêm ${destination}`, description: 'Dạo phố đi bộ & Chợ đêm', isVerified: false },
              ],
              items: [
                { time: '08:00', act: `Di chuyển đến ${destination} & Check-in`, type: 'logistic' },
                { time: '11:30', act: 'Thưởng thức ẩm thực đặc sản địa phương', type: 'food' },
                { time: '14:30', act: `Khám phá các danh lam tiêu biểu tại ${destination}`, type: 'explore' },
                { time: '18:30', act: 'Dạo phố đi bộ & Chợ đêm', type: 'explore' },
              ],
            },
            {
              day: 2,
              title: 'Khám phá văn hóa và thiên nhiên',
              activities: [
                { time: '08:00', location: `Cà phê ${destination}`, description: 'Ăn sáng đặc sản & Cà phê ngắm cảnh', isVerified: true },
                { time: '09:30', location: `Di tích lịch sử`, description: 'Thăm di tích lịch sử và danh lam nổi tiếng', isVerified: true },
                { time: '15:00', location: `Điểm ngắm hoàng hôn`, description: 'Check-in các điểm ngắm hoàng hôn đẹp nhất', isVerified: false },
              ],
              items: [
                { time: '08:00', act: 'Ăn sáng đặc sản & Cà phê ngắm cảnh', type: 'food' },
                { time: '09:30', act: 'Thăm di tích lịch sử và danh lam nổi tiếng', type: 'explore' },
                { time: '15:00', act: 'Check-in các điểm ngắm hoàng hôn đẹp nhất', type: 'explore' },
              ],
            },
            {
              day: 3,
              title: 'Mua quà lưu niệm & Trở về',
              activities: [
                { time: '08:30', location: `Chợ đặc sản`, description: 'Mua đặc sản làm quà lưu niệm', isVerified: false },
                { time: '11:30', location: `Khách sạn`, description: 'Trả phòng khách sạn & Khởi hành về', isVerified: true },
              ],
              items: [
                { time: '08:30', act: 'Mua đặc sản làm quà lưu niệm', type: 'shopping' },
                { time: '11:30', act: 'Trả phòng khách sạn & Khởi hành về', type: 'logistic' },
              ],
            },
          ];

      // Save to Backend if user is logged in
      const token = getAccessToken();
      if (token) {
        try {
          const details: CreateItineraryActivityDto[] = [];
          if (aiDays.length > 0) {
            aiDays.forEach((d: any, dayIdx: number) => {
              (d.activities || []).forEach((act: any) => {
                const locId = act.matchedLocationId || (places.length > 0 ? places[0].id : 1);
                let timeStr = act.time || '08:00';
                if (timeStr.length === 5) timeStr += ':00';
                details.push({
                  locationId: locId,
                  dayIndex: d.day || dayIdx + 1,
                  plannedTime: timeStr,
                  notes: `${act.location ? act.location + ': ' : ''}${act.description || ''}`,
                });
              });
            });
          }

          await itineraryService.create({
            title: `Lịch trình ${destination} (3 ngày)`,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
            details,
          });

          await refreshTrips();
        } catch (saveErr) {
          console.warn('Saving itinerary to BE failed, will save to local store:', saveErr);
        }
      }

      // Always ensure context has the new trip for immediate display
      addTrip({
        name: `Khám phá ${destination}`,
        date: 'Sắp tới',
        location: destination,
        status: 'Mới tạo',
        days: mappedItinerary.length,
        itinerary: mappedItinerary,
      });

      // Brief pause for animation polish
      setTimeout(() => {
        setIsGenerating(false);
        navigate('/plan');
      }, 1500);
    } catch (error) {
      console.error('Plan generation failed:', error);
      setIsGenerating(false);
      navigate('/plan');
    }
  };

  const handleChoice = (key: string, val: string) => {
    const newChoices = { ...choices, [key]: val };
    setChoices(newChoices);
    if (step < 3) {
      setStep(step + 1);
    } else {
      executePlanGeneration(newChoices);
    }
  };

  const handleCustomDestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDest.trim()) return;
    handleChoice('dest', customDest.trim());
  };

  return (
    <motion.div 
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-50 bg-white flex flex-col"
    >
      <header className="p-6 pt-12 flex justify-between items-center bg-white z-10 border-b border-slate-100 shadow-sm">
        <button 
          onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))} 
          disabled={isGenerating} 
          className="p-2 -ml-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-1.5 items-center">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-300", 
                i === step ? "bg-indigo-600 w-8" : i < step ? "bg-indigo-300 w-4" : "bg-slate-200 w-2"
              )} 
            />
          ))}
        </div>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 relative">
        <AnimatePresence mode="wait">
          {!isGenerating ? (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && (
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold mb-2">
                    <Sparkles size={14} /> AI Planner Thông Minh
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">Bạn muốn đi đâu tiếp theo?</h2>

                  {/* Custom destination input */}
                  <form onSubmit={handleCustomDestSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={customDest}
                      onChange={(e) => setCustomDest(e.target.value)}
                      placeholder="Nhập bất kỳ điểm đến nào (VD: Sa Pa, Phú Quốc...)"
                      className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-600 transition-colors text-slate-800"
                    />
                    <button
                      type="submit"
                      disabled={!customDest.trim()}
                      className="px-5 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-40 transition-all flex items-center gap-1 shadow-sm"
                    >
                      <span>Chọn</span>
                      <ArrowRight size={16} />
                    </button>
                  </form>

                  <div className="flex items-center gap-2 my-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <div className="flex-1 h-[1px] bg-slate-100"></div>
                    <span>Hoặc chọn nhanh</span>
                    <div className="flex-1 h-[1px] bg-slate-100"></div>
                  </div>

                  <div className="space-y-3">
                    {['Đà Lạt, Lâm Đồng', 'Đà Nẵng & Hội An', 'Bangkok, Thái Lan', 'Tokyo, Nhật Bản', 'Nha Trang, Khánh Hòa'].map((dest, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleChoice('dest', dest)} 
                        className="w-full text-left p-4.5 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 hover:border-indigo-600 hover:text-indigo-600 transition-colors active:scale-[0.99] flex items-center justify-between group"
                      >
                        <span>{dest}</span>
                        <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold mb-2">
                    <Sparkles size={14} /> Điểm đến: {choices.dest}
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">Bạn đi cùng ai?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: <User size={22} />, label: "Một mình" },
                      { icon: <Heart size={22} />, label: "Cặp đôi" },
                      { icon: <Users size={22} />, label: "Gia đình" },
                      { icon: <Users size={22} />, label: "Nhóm bạn" },
                    ].map((opt, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleChoice('who', opt.label)} 
                        className="p-6 rounded-2xl border-2 border-slate-100 flex flex-col items-center gap-3 text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-[0.98] bg-slate-50/50 hover:bg-indigo-50/20"
                      >
                        <div className="p-3.5 bg-white rounded-2xl shadow-sm text-indigo-600">{opt.icon}</div>
                        <span className="font-bold text-sm">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold mb-2">
                    <Sparkles size={14} /> {choices.dest} • {choices.who}
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">Phong cách du lịch của bạn?</h2>
                  <div className="space-y-3">
                    {[
                      { title: "Nghỉ dưỡng & Thư giãn", desc: "Spa, resort, ẩm thực, không lịch trình gắt gao" },
                      { title: "Khám phá Văn hóa", desc: "Bảo tàng, di tích lịch sử, phố cổ, đời sống địa phương" },
                      { title: "Thiên nhiên & Mạo hiểm", desc: "Leo núi, trekking, cắm trại, trải nghiệm ngoài trời" },
                    ].map((opt, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleChoice('style', opt.title)} 
                        className="w-full text-left p-5 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 transition-all active:scale-[0.99] group bg-slate-50/40 hover:bg-white"
                      >
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 mb-1">{opt.title}</div>
                        <div className="text-xs text-slate-500 font-medium">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-30 rounded-full animate-pulse"></div>
                <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-full flex items-center justify-center text-white shadow-xl relative z-10 animate-bounce">
                  <Sparkles size={40} className="animate-spin-slow" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">AI đang phân tích & lập kế hoạch...</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-[280px]">
                Đang tìm kiếm các điểm đến phù hợp tại <strong>{choices.dest || 'điểm đến'}</strong>, cân đối thời gian và tối ưu hóa chi phí...
              </p>
              
              <div className="mt-10 w-full max-w-[220px] h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: "100%" }} 
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
