import React from 'react';
import { MapPin, Navigation, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface GpsPermissionModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function GpsPermissionModal({ onAccept, onDecline }: GpsPermissionModalProps) {
  return (
    <div className="absolute inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-sm bg-white/95 border border-white/80 rounded-[32px] p-6 shadow-2xl text-slate-800 text-center relative overflow-hidden"
      >
        {/* Glow behind logo */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Satellite / Radar scan graphic */}
        <div className="flex justify-center mb-6 mt-2">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Pulsing rings */}
            <motion.div
              animate={{ scale: [1, 2], opacity: [0.4, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border border-indigo-500/30"
            />
            <motion.div
              animate={{ scale: [1, 1.5], opacity: [0.2, 0] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.6, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border border-sky-500/10"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute inset-2 rounded-full border border-dashed border-indigo-500/20"
            />
            
            {/* Center icon */}
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center relative shadow-lg shadow-indigo-500/5">
              <Navigation className="text-indigo-600 rotate-45" size={28} />
            </div>
          </div>
        </div>

        {/* Title & Info */}
        <h3 className="font-display text-lg font-bold tracking-tight text-indigo-600 mb-2">
          KÍCH HOẠT HỆ THỐNG ĐỊNH VỊ
        </h3>
        <p className="text-slate-500 text-xs leading-relaxed mb-6 px-2">
          Hãy cho phép chúng tôi sử dụng GPS của bạn để chiếu vị trí thời gian thực trên bản đồ Việt Nam và tối ưu hóa các gợi ý địa điểm du lịch lân cận.
        </p>

        {/* Info badges */}
        <div className="flex justify-center gap-3 mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-600">
            <ShieldCheck size={12} className="text-indigo-600" /> Bảo mật
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-600">
            <MapPin size={12} className="text-indigo-600" /> GPS Realtime
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onAccept}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-2xl font-display text-xs font-bold text-white shadow-lg shadow-indigo-600/15 transition-all cursor-pointer"
          >
            CHO PHÉP TRUY CẬP GPS
          </motion.button>
          
          <button
            onClick={onDecline}
            className="w-full py-3 bg-transparent hover:bg-slate-100 rounded-2xl font-display text-xs font-bold text-slate-400 hover:text-slate-500 transition-colors cursor-pointer"
          >
            Khám phá thủ công
          </button>
        </div>
      </motion.div>
    </div>
  );
}
