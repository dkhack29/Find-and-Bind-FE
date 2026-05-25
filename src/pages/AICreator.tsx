import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronLeft, User, Heart } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../App';

export default function AICreator() {
  const navigate = useNavigate();
  const { addTrip } = useAppContext();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const [choices, setChoices] = useState({ dest: '', who: '', style: '' });

  const handleChoice = (key: string, val: string) => {
    setChoices(prev => ({...prev, [key]: val}));
    if (step < 3) setStep(step + 1);
    else {
      setIsGenerating(true);
      setTimeout(() => {
        addTrip({
          name: `Khám phá ${choices.dest || 'Điểm mới'}`,
          date: 'Sắp tới',
          location: choices.dest || 'Không rõ',
          status: 'Mới tạo',
          days: 3,
          itinerary: [
             { day: 1, title: 'Đến nơi', items: [{time: '09:00', act: 'Check-in', type: 'logistic'}] }
          ]
        });
        navigate('/plan'); // Back to plan view to see all
      }, 3500); 
    }
  };

  return (
    <motion.div 
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-50 bg-white flex flex-col"
    >
      <header className="p-6 pt-12 flex justify-between items-center bg-white z-10 border-b border-slate-100 shadow-sm">
        <button onClick={() => navigate(-1)} disabled={isGenerating} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-50 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-1">
          {[1,2,3].map(i => (
            <div key={i} className={cn("h-1.5 rounded-full transition-all duration-300", i <= step ? "bg-indigo-600 w-6" : "bg-slate-200 w-1.5")} />
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
                    <Sparkles size={14} /> AI Planner
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">Bạn muốn đi đâu tiếp theo?</h2>
                  <div className="space-y-3">
                    {['Bangkok, Thái Lan', 'Đà Lạt, Việt Nam', 'Tokyo, Nhật Bản', 'Nha Trang'].map((dest, i) => (
                      <button key={i} onClick={() => handleChoice('dest', dest)} className="w-full text-left p-5 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 hover:border-indigo-600 hover:text-indigo-600 transition-colors active:scale-[0.99]">
                        {dest}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">Bạn đi cùng ai?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: <User />, label: "Một mình" },
                      { icon: <Heart />, label: "Cặp đôi" },
                      { icon: <User />, label: "Gia đình" },
                      { icon: <User />, label: "Nhóm bạn" },
                    ].map((opt, i) => (
                      <button key={i} onClick={() => handleChoice('who', opt.label)} className="p-6 rounded-2xl border-2 border-slate-100 flex flex-col items-center gap-3 text-slate-500 hover:border-indigo-600 hover:text-indigo-600 transition-colors active:scale-[0.98]">
                        <div className="p-3 bg-slate-50 rounded-full">{opt.icon}</div>
                        <span className="font-bold">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">Phong cách du lịch của bạn?</h2>
                  <div className="space-y-3">
                    {[
                      { title: "Nghỉ dưỡng & Thư giãn", desc: "Spa, resort, không lịch trình gắt gao" },
                      { title: "Khám phá Văn hóa", desc: "Bảo tàng, di tích, ẩm thực địa phương" },
                      { title: "Thiên nhiên & Mạo hiểm", desc: "Leo núi, trekking, cắm trại" },
                    ].map((opt, i) => (
                      <button key={i} onClick={() => handleChoice('style', opt.title)} className="w-full text-left p-5 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 transition-colors active:scale-[0.99] group">
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
              <h3 className="text-2xl font-black text-slate-900 mb-3">AI đang phân tích...</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-[250px]">
                Đang tìm kiếm hàng ngàn điểm đến, tối ưu hóa lộ trình và chi phí cho bạn...
              </p>
              
              <div className="mt-12 w-full max-w-[200px] h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 3.5, ease: "easeInOut" }}
                  className="h-full bg-indigo-600 rounded-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
