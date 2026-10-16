import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Calendar, Clock, MapPin, ShieldCheck, Sparkles, Navigation, 
  ChevronDown, ChevronUp, CheckCircle2, Circle, ExternalLink, Compass,
  Share2, ArrowRight, Info, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Trip, TripDay, TripActivity } from '../../context/AppContext';
import { cn } from '../../App';

interface ItineraryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip | null;
}

// Helper: Parse "HH:mm" to total minutes
function parseTimeToMinutes(t: string): number {
  if (!t) return 0;
  const clean = t.trim().slice(0, 5);
  const parts = clean.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

// Helper: Format minutes into human-friendly Vietnamese text
function formatMinutesToDuration(mins: number): string {
  if (mins <= 0) return 'Bắt đầu ngay sau đó';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} giờ ${m} phút`;
  if (h > 0) return `${h} giờ`;
  return `${m} phút`;
}

// Helper: Add minutes to "HH:mm" and return "HH:mm"
function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const total = parseTimeToMinutes(timeStr) + minutesToAdd;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export default function ItineraryDetailModal({
  isOpen,
  onClose,
  trip
}: ItineraryDetailModalProps) {
  const navigate = useNavigate();
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'all'>('all');
  const [expandedActivityKeys, setExpandedActivityKeys] = useState<Record<string, boolean>>({});
  const [completedActivityKeys, setCompletedActivityKeys] = useState<Record<string, boolean>>({});

  // Sort days ascending: Day 1 first, then Day 2, Day 3...
  const sortedDays = useMemo(() => {
    if (!trip?.itinerary) return [];
    return [...trip.itinerary].sort((a, b) => a.day - b.day);
  }, [trip]);

  // Filtered days based on tab selection
  const displayedDays = useMemo(() => {
    if (selectedDayFilter === 'all') return sortedDays;
    return sortedDays.filter(d => d.day === selectedDayFilter);
  }, [sortedDays, selectedDayFilter]);

  // Total activities across all days
  const totalActivitiesCount = useMemo(() => {
    return sortedDays.reduce((acc, d) => {
      const count = d.activities?.length || d.items?.length || 0;
      return acc + count;
    }, 0);
  }, [sortedDays]);

  const toggleExpandActivity = (key: string) => {
    setExpandedActivityKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleCompleteActivity = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    setCompletedActivityKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!isOpen || !trip) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog Content */}
      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="relative z-10 w-full sm:w-[480px] bg-slate-50 rounded-t-[36px] sm:rounded-[36px] shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[86vh] overflow-hidden border border-slate-200/80"
      >
        {/* Header Bar */}
        <div className="bg-white px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                <Sparkles size={16} />
              </span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  Chi tiết Lịch trình
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-500 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
            {trip.name}
          </h2>

          <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold mt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar size={13} className="text-slate-400" />
              {trip.days} ngày ({totalActivitiesCount} hoạt động)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin size={13} className="text-slate-400" />
              {trip.location}
            </span>
          </div>

          {/* Day Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pt-3.5 pb-1">
            <button
              onClick={() => setSelectedDayFilter('all')}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                selectedDayFilter === 'all'
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              Tất cả ({totalActivitiesCount})
            </button>
            {sortedDays.map(d => {
              const actsCount = d.activities?.length || d.items?.length || 0;
              return (
                <button
                  key={d.day}
                  onClick={() => setSelectedDayFilter(d.day)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                    selectedDayFilter === d.day
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  Ngày {d.day} ({actsCount})
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Itinerary Activities Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {displayedDays.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Compass size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">Chưa có thông tin lịch trình cho chuyến đi này.</p>
            </div>
          ) : (
            displayedDays.map(day => {
              // Standardize activities list for this day
              const rawActivities: TripActivity[] = day.activities && day.activities.length > 0
                ? day.activities
                : (day.items || []).map((item, idx) => ({
                    time: item.time || '08:00',
                    location: item.act?.split('-')[0]?.trim() || `Điểm tham quan ${idx + 1}`,
                    description: item.act || 'Tham quan và trải nghiệm',
                    isVerified: item.type === 'verified',
                  }));

              // Sort activities chronologically by time
              const sortedActivities = [...rawActivities].sort(
                (a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time)
              );

              return (
                <div key={day.day} className="space-y-3">
                  {/* Day Header Badge */}
                  <div className="sticky top-0 z-20 flex items-center justify-between bg-slate-50/95 backdrop-blur-md py-1 px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {day.day}
                      </span>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">
                          Ngày {day.day}: {day.title || `Khám phá ${trip.location}`}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400">
                          {sortedActivities.length} hoạt động được lên lịch
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Vertical Timeline container */}
                  <div className="relative pl-6 space-y-3 before:absolute before:inset-0 before:left-[11px] before:-z-0 before:w-[2px] before:bg-indigo-100">
                    {sortedActivities.map((act, index) => {
                      const activityKey = `day-${day.day}-act-${index}`;
                      const isExpanded = !!expandedActivityKeys[activityKey];
                      const isCompleted = !!completedActivityKeys[activityKey];

                      const nextAct = sortedActivities[index + 1];
                      const currMinutes = parseTimeToMinutes(act.time);
                      const nextMinutes = nextAct ? parseTimeToMinutes(nextAct.time) : 0;

                      // Time range calculation
                      let endTime = act.endTime;
                      let gapDurationText = '';

                      if (nextAct) {
                        const gapMinutes = Math.max(0, nextMinutes - currMinutes);
                        if (!endTime) {
                          // Estimated end time
                          endTime = nextAct.time;
                        }
                        gapDurationText = `Còn ${formatMinutesToDuration(gapMinutes)} nữa sẽ tới hoạt động tiếp theo (${nextAct.time})`;
                      } else {
                        // Last activity in current day
                        if (!endTime) {
                          endTime = addMinutesToTime(act.time, 90);
                        }
                        const nextDay = sortedDays.find(d => d.day === day.day + 1);
                        if (nextDay && nextDay.activities && nextDay.activities.length > 0) {
                          gapDurationText = `Hoạt động cuối cùng trong Ngày ${day.day} • Ngày ${nextDay.day} bắt đầu lúc ${nextDay.activities[0].time}`;
                        } else {
                          gapDurationText = `Hoạt động cuối cùng trong Ngày ${day.day} • Tự do nghỉ ngơi`;
                        }
                      }

                      return (
                        <div key={index} className="relative z-10 group">
                          {/* Timeline Node Bullet */}
                          <div 
                            className={cn(
                              "absolute -left-[29px] top-4 w-3.5 h-3.5 rounded-full border-2 transition-all",
                              isCompleted 
                                ? "bg-emerald-500 border-emerald-300 ring-2 ring-emerald-100" 
                                : act.isVerified
                                  ? "bg-indigo-600 border-white ring-2 ring-indigo-100"
                                  : "bg-slate-300 border-white"
                            )}
                          />

                          {/* Activity Card */}
                          <div
                            onClick={() => toggleExpandActivity(activityKey)}
                            className={cn(
                              "bg-white rounded-2xl p-4 border transition-all cursor-pointer text-left shadow-xs hover:shadow-md",
                              isExpanded 
                                ? "border-indigo-400 ring-2 ring-indigo-50" 
                                : "border-slate-200/80 hover:border-slate-300",
                              isCompleted && "bg-slate-50/70 opacity-80"
                            )}
                          >
                            {/* Card Header Info */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                {/* Title as requested: Ngày X: Địa điểm: ... */}
                                <h4 className={cn(
                                  "font-black text-sm tracking-tight leading-snug flex items-center gap-1.5 flex-wrap",
                                  isCompleted ? "line-through text-slate-400" : "text-slate-900"
                                )}>
                                  <span className="text-indigo-600">Ngày {day.day}:</span>
                                  <span>Địa điểm:</span>
                                  <span className="text-slate-950 font-black">{act.location}</span>
                                </h4>

                                {/* Time interval info */}
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                                    <Clock size={11} />
                                    Thời gian: từ {act.time} đến {endTime}
                                  </span>

                                  {act.isVerified ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                      <ShieldCheck size={11} className="text-emerald-600" />
                                      Đã xác minh
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                      Khám phá
                                    </span>
                                  )}
                                </div>

                                {/* Dynamic time gap to next activity */}
                                <p className="text-[11px] text-amber-700 font-bold mt-1.5 bg-amber-50/80 border border-amber-200/50 px-2 py-1 rounded-lg flex items-center gap-1.5 leading-tight">
                                  <span className="text-xs">⏳</span>
                                  <span>{gapDurationText}</span>
                                </p>
                              </div>

                              {/* Toggle Check & Expand Buttons */}
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                <button
                                  onClick={(e) => toggleCompleteActivity(e, activityKey)}
                                  className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                                  title={isCompleted ? "Đánh dấu chưa làm" : "Đánh dấu đã hoàn thành"}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 size={20} className="text-emerald-600 fill-emerald-50" />
                                  ) : (
                                    <Circle size={20} />
                                  )}
                                </button>
                                <div className="p-1 text-slate-400">
                                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </div>
                              </div>
                            </div>

                            {/* Brief preview if collapsed */}
                            {!isExpanded && (
                              <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-2">
                                {act.description}
                              </p>
                            )}

                            {/* Detailed View when Expanded */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="pt-3.5 mt-3 border-t border-slate-100 text-xs space-y-3"
                                >
                                  <div>
                                    <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block mb-1">
                                      Chi tiết hoạt động & Hướng dẫn:
                                    </span>
                                    <p className="text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                                      {act.description}
                                    </p>
                                  </div>

                                  {/* Actions inside detailed activity card */}
                                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                                    {act.matchedLocationId ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onClose();
                                          navigate(`/place/${act.matchedLocationId}`);
                                        }}
                                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                                      >
                                        <span>Xem trang địa điểm</span>
                                        <ExternalLink size={13} />
                                      </button>
                                    ) : null}

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onClose();
                                        navigate('/map');
                                      }}
                                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                    >
                                      <Navigation size={13} className="text-indigo-600" />
                                      <span>Mở trên bản đồ</span>
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            <span className="font-bold text-slate-800">
              {Object.values(completedActivityKeys).filter(Boolean).length} / {totalActivitiesCount}
            </span>{' '}
            hoạt động hoàn thành
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onClose();
                navigate(`/plan/detail/${trip.id}`);
              }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span>Vào trang hành trình</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
