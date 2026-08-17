import React, { useState, useEffect } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { 
  Settings, User, Bell, Bookmark, ShieldCheck, MapPin, Plus, Store, 
  Navigation, Star, Shield, Database, Scale, DollarSign, Lock, Camera, 
  Video, Eye, AlertCircle, Fingerprint, Trash, Trash2, Check, X, RefreshCw, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../App';
import { userService } from '@/services/user/userApi'
import AddPlaceModal from '../components/AddPlaceModal';

const GetMyProfile = async () => {
  try {
    const res = await userService.getMyProfile();
    if (res.success && res.data) {
      console.log(res.data);
    }
  } catch (err) {
    console.error(err);
  }
}

export default function Profile() {
  const { 
    role, setRole, places, savedPlaceIds, reviews, 
    user, login, logout, deleteAccount, privacySettings, updatePrivacySettings,
    
    // Phase 1 Context
    featureFlags, updateFeatureFlags, apiQuota, incrementQuota,
    avoidList, removeFromAvoidList, tasteCollections, addTasteCollection,
    savedPlacesCollection, savePlaceToCollection, merchantWalletBalance,
    updateMerchantWallet, appeals, submitAppeal,

    // Phase 2 Context
    legalHoldActive, setLegalHoldActive, purgeLogs, runPurgeWorker, checkPoiFingerprint
  } = useAppContext();

  const navigate = useNavigate();
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Phase 1 states
  const [showEkycModal, setShowEkycModal] = useState(false);
  const [ekycStep, setEkycStep] = useState(1); // 1=cccd, 2=liveness, 3=submitting, 4=success
  const [cccdFront, setCccdFront] = useState<File | null>(null);
  const [cccdBack, setCccdBack] = useState<File | null>(null);
  const [uploadingCccd, setUploadingCccd] = useState(false);
  const [livenessPrompt, setLivenessPrompt] = useState("Vui lòng nhìn thẳng vào camera");
  const [livenessStep, setLivenessStep] = useState(0); // 0, 1, 2, 3

  // Taste Collection state
  const [newCollectionName, setNewCollectionName] = useState("");

  // Merchant states
  const [depositAmount, setDepositAmount] = useState("");
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealPlaceId, setAppealPlaceId] = useState<number | null>(null);
  const [appealCaseId, setAppealCaseId] = useState("");
  const [appealEvidence, setAppealEvidence] = useState("");
  const [appealStep, setAppealStep] = useState(1); // 1=deposit, 2=evidence, 3=signature, 4=done

  const ownedPlaces = places.filter(p => p.ownerId === 'merchant_1' || p.ownerId === 'system');
  const savedPlaces = places.filter(p => savedPlaceIds.includes(p.id));

  // eKYC Live scanner text cycle
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (ekycStep === 2) {
      if (livenessStep === 0) {
        timer = setTimeout(() => {
          setLivenessPrompt("Hãy quay đầu nhẹ sang bên trái");
          setLivenessStep(1);
        }, 1200);
      } else if (livenessStep === 1) {
        timer = setTimeout(() => {
          setLivenessPrompt("Hãy chớp mắt 2 lần");
          setLivenessStep(2);
        }, 1200);
      } else if (livenessStep === 2) {
        timer = setTimeout(() => {
          setLivenessStep(3);
          setEkycStep(3);
        }, 1200);
      }
    }
    return () => clearTimeout(timer);
  }, [ekycStep, livenessStep]);

  // Database verification simulator
  useEffect(() => {
    if (ekycStep === 3) {
      const timer = setTimeout(() => {
        setEkycStep(4);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [ekycStep]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      alert("Vui lòng hoàn thành Captcha bảo mật để tiếp tục.");
      return;
    }
    if (emailInput.trim()) {
      login(emailInput.trim());
    }
  };

  const handleDeleteAccount = () => {
    deleteAccount();
    setShowDeleteConfirm(false);
    alert("Tài khoản của bạn đã được xóa hoàn toàn khỏi hệ thống (RTBF - Tuân thủ Nghị định 13).");
    navigate('/');
  };

  const handleStartEkyc = () => {
    setEkycStep(1);
    setCccdFront(null);
    setCccdBack(null);
    setLivenessStep(0);
    setLivenessPrompt("Vui lòng nhìn thẳng vào camera");
    setShowEkycModal(true);
  };

  const handleUploadCccd = () => {
    setUploadingCccd(true);
    setTimeout(() => {
      setUploadingCccd(false);
      setEkycStep(2);
    }, 1200);
  };

  const handleCompleteEkyc = () => {
    const mockHash = `L3-VNPT-${Math.floor(100000 + Math.random() * 900000)}-SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    // Save to global user session via context
    verifyEkycL3(mockHash);
    // Increment API quota tracking VNPT L3 eKYC
    incrementQuota('vnptEkyc');
    setShowEkycModal(false);
    alert("Xác thực định danh VNPT eKYC L3 thành công!");
  };

  // Merchant Appeal Submitter
  const handleStartAppeal = (placeId: number, caseId: string) => {
    setAppealPlaceId(placeId);
    setAppealCaseId(caseId);
    setAppealStep(1);
    setShowAppealModal(true);
  };

  const handleAppealStep1 = () => {
    if (merchantWalletBalance < 1000000) {
      alert("Ví của bạn không đủ tiền đặt cọc kháng cáo (Yêu cầu tối thiểu 1,000,000đ).");
      return;
    }
    // Deduct fee
    updateMerchantWallet(merchantWalletBalance - 1000000);
    setAppealStep(2);
  };

  const handleAppealStep2 = () => {
    if (!appealEvidence.trim()) {
      alert("Vui lòng ghi giải trình kháng nghị.");
      return;
    }
    setAppealStep(3);
  };

  const handleAppealSubmit = () => {
    if (!appealPlaceId) return;
    
    submitAppeal({
      placeId: appealPlaceId,
      feeDeposited: true,
      evidence: appealEvidence,
      caseId: appealCaseId
    });
    
    setAppealStep(4);
    setTimeout(() => {
      setShowAppealModal(false);
      setAppealEvidence("");
      setAppealPlaceId(null);
    }, 2000);
  };

  const verifyEkycL3 = (hash: string) => {
    // Helper to bypass typescript context binding in locally defined mockup
    const saved = localStorage.getItem('user_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.isVerifiedL3 = true;
      parsed.ekycHash = hash;
      localStorage.setItem('user_session', JSON.stringify(parsed));
      // Reload window to sync state
      window.location.reload();
    }
  };

  if (!user || !user.loggedIn) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="h-full bg-slate-50 flex items-center justify-center p-6"
      >
        <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-soft border border-slate-100 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-6 border border-indigo-100">
            <User size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Đăng nhập tài khoản</h2>
          <p className="text-xs text-slate-500 font-semibold mb-8 leading-relaxed">
            Đăng nhập để đồng bộ kế hoạch, lưu địa điểm yêu thích và nhận đánh giá thực tế.
          </p>

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Địa chỉ Email</label>
              <input 
                type="email" 
                required
                placeholder="tenban@example.com"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>

            {/* Cloudflare Turnstile */}
            <div className="py-2 flex justify-center">
              <Turnstile 
                siteKey={(import.meta as any).env.VITE_CLOUDFLARE_SITE_KEY || "0x4AAAAAAADvU3189MDItU1nP"}
                onSuccess={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
                onError={() => {
                  setCaptchaToken(null);
                  alert("Lỗi tải Captcha. Vui lòng tải lại trang.");
                }}
              />
            </div>

            <button 
              type="submit"
              disabled={!captchaToken}
              className="w-full py-4 bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/10 active:scale-95 transition-transform disabled:transform-none disabled:shadow-none"
            >
              Tiếp tục
            </button>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="h-full overflow-y-auto no-scrollbar bg-slate-50 pb-32 text-left"
    >
      {/* Profile Header */}
      <div className="pt-16 px-6 pb-6 text-center relative bg-white border-b border-slate-100 shadow-sm rounded-b-[40px] z-10">
        <div className="w-20 h-20 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-[32px] mx-auto mb-4 p-1 shadow-sm rotate-3">
          <div className="w-full h-full bg-white rounded-[28px] -rotate-3 overflow-hidden">
            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.email}`} alt="avatar" className="w-full h-full object-cover p-2"/>
          </div>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
          {user.email?.split('@')[0]}
          {user.isVerifiedL3 && <ShieldCheck className="text-indigo-600" size={20} />}
        </h2>
        <p className="text-slate-400 font-bold text-[10px] mt-0.5 mb-2 uppercase tracking-widest">{user.email}</p>

        {/* eKYC L3 Status Bar Widget */}
        {user.isVerifiedL3 ? (
          <div className="inline-flex flex-col items-center bg-green-50 border border-green-200/80 px-4 py-2.5 rounded-2xl max-w-[280px] mb-4">
            <div className="flex items-center gap-1.5 text-green-700 text-[10.5px] font-black uppercase tracking-wider">
              <ShieldCheck size={14} /> VNPT eKYC L3: ĐÃ XÁC THỰC
            </div>
            <span className="font-mono text-[8.5px] text-green-600 mt-1 select-all break-all line-clamp-1 w-full text-center">
              {user.ekycHash}
            </span>
          </div>
        ) : (
          <div className="inline-flex flex-col items-center bg-indigo-50/50 border border-indigo-100/80 px-4 py-2.5 rounded-2xl max-w-[280px] mb-4">
            <div className="flex items-center gap-1.5 text-indigo-700 text-[10.5px] font-black uppercase tracking-wider">
              <Lock size={12} className="text-indigo-600 animate-pulse" /> VNPT eKYC L3: CHƯA XÁC THỰC
            </div>
            <button 
              onClick={handleStartEkyc}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[9.5px] font-black uppercase px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
            >
              Định danh L3 (VNPT eKYC)
            </button>
          </div>
        )}

        {/* Role Switcher */}
        <div className="bg-slate-100 p-1 rounded-2xl mb-6 mx-auto max-w-[340px] grid grid-cols-4 gap-1">
          <button 
            onClick={() => setRole('user')} 
            className={cn("py-2 rounded-xl text-[10px] font-black uppercase transition-all text-center", role === 'user' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700")}
          >
            User
          </button>
          <button 
            onClick={() => setRole('merchant')} 
            className={cn("py-2 rounded-xl text-[10px] font-black uppercase transition-all text-center flex items-center justify-center gap-0.5", role === 'merchant' ? "bg-white shadow-sm text-rose-600" : "text-slate-500 hover:text-slate-700")}
          >
            Partner
          </button>
          <button 
            onClick={() => setRole('moderator')} 
            className={cn("py-2 rounded-xl text-[10px] font-black uppercase transition-all text-center", role === 'moderator' ? "bg-white shadow-sm text-amber-600" : "text-slate-500 hover:text-slate-700")}
          >
            Mod
          </button>
          <button 
            onClick={() => setRole('admin')} 
            className={cn("py-2 rounded-xl text-[10px] font-black uppercase transition-all text-center", role === 'admin' ? "bg-white shadow-sm text-purple-600" : "text-slate-500 hover:text-slate-700")}
          >
            Admin
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* MERCHANT console segment */}
        {role === 'merchant' && (
          <div className="space-y-6">
            
            {/* Wallet Panel (FR-27) */}
            <div className="bg-gradient-to-br from-rose-950 to-slate-900 text-white p-5 rounded-[28px] border border-rose-900 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-rose-200 uppercase tracking-widest flex items-center gap-1"><DollarSign size={12} /> Ví ký quỹ Merchant</span>
                <span className="bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[9px] font-black uppercase px-2 py-0.5 rounded">Active</span>
              </div>
              <h3 className="font-display font-black text-2xl mb-4 text-white">
                {merchantWalletBalance.toLocaleString('vi-VN')} đ
              </h3>
              
              <div className="flex gap-2">
                <input 
                  type="number"
                  placeholder="Nhập số tiền nạp..."
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder-slate-400 text-white"
                />
                <button 
                  onClick={() => {
                    const amt = Number(depositAmount);
                    if (amt > 0) {
                      updateMerchantWallet(merchantWalletBalance + amt);
                      setDepositAmount("");
                      alert(`Đã nạp thành công ${amt.toLocaleString('vi-VN')}đ vào ví!`);
                    }
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black uppercase px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Nạp tiền
                </button>
              </div>
            </div>

            {/* Appeal Center (FR-31) */}
            <div>
              <h3 className="font-bold text-base text-slate-900 mb-3 flex items-center gap-1.5"><Scale size={18} className="text-rose-600" /> Trung tâm Kháng nghị</h3>
              <div className="space-y-3">
                
                {/* List owned places and check for warning status */}
                {ownedPlaces.map(p => {
                  const hasWarnings = p.riskLevel && p.riskLevel !== 'Bình thường';
                  const associatedAppeal = appeals.find(ap => ap.placeId === p.id);

                  return (
                    <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">{p.title}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold">{p.location}</span>
                        </div>
                        {hasWarnings ? (
                          <span className="bg-red-50 text-red-700 text-[8.5px] font-black uppercase px-2 py-0.5 rounded border border-red-100 flex items-center gap-0.5">
                            <AlertCircle size={10} /> Uy tín giảm: Trust {p.trustScore}
                          </span>
                        ) : (
                          <span className="bg-green-50 text-green-700 text-[8.5px] font-black uppercase px-2 py-0.5 rounded border border-green-100">
                            Bình thường
                          </span>
                        )}
                      </div>

                      {hasWarnings && !associatedAppeal && (
                        <button 
                          onClick={() => handleStartAppeal(p.id, 'RP-2938')} // demo linked case
                          className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer text-center"
                        >
                          Nộp đơn Kháng cáo
                        </button>
                      )}

                      {associatedAppeal && (
                        <div className="mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-600 flex justify-between items-center">
                          <span>Trạng thái đơn: <span className="text-indigo-600 font-black uppercase">{associatedAppeal.status}</span></span>
                          <span className="text-slate-400">Mã: {associatedAppeal.id}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Merchant Place Management */}
            <div>
              <div className="flex justify-between items-center mb-3">
                 <h3 className="font-bold text-base text-slate-900">Quản lý địa điểm</h3>
                 <button 
                    onClick={() => setShowAddPlace(true)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                 >
                   <Plus size={14} /> Thêm mới
                 </button>
              </div>
              
              {ownedPlaces.length === 0 ? (
                 <div className="bg-white p-6 rounded-3xl border border-dashed border-slate-300 text-center text-slate-500 text-sm font-medium">
                   Bạn chưa có địa điểm nào. Bạn có thể thêm nhà hàng, khách sạn hoặc dịch vụ của mình.
                 </div>
              ) : (
                 <div className="space-y-4">
                   {ownedPlaces.map(p => (
                     <div key={p.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-slate-100 cursor-pointer hover:border-rose-100 transition-colors" onClick={() => navigate(`/place/${p.id}`)}>
                       <div className={cn("w-16 h-16 rounded-xl", p.imageClass)}></div>
                       <div className="flex-1 overflow-hidden">
                         <h4 className="font-bold text-slate-900 text-sm truncate">{p.title}</h4>
                         <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                           <Star size={12} className="text-yellow-500 fill-yellow-500" /> {p.rating} ({p.reviewsCount} rev)
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
              )}
            </div>
          </div>
        )}

        {/* USER Preferences console (FR-14 / Taste Collections & Avoid List) */}
        {role === 'user' && (
          <div className="space-y-6">
            
            {/* Taste Collections section (FR-14) */}
            <div>
              <h3 className="font-bold text-base text-slate-900 mb-3 flex items-center gap-1.5"><Bookmark size={18} className="text-indigo-600" /> Bộ sưu tập Gu Du lịch</h3>
              <div className="space-y-4">
                {tasteCollections.map(colName => {
                  // Filter saved places in this collection
                  const colPlaces = places.filter(p => savedPlacesCollection[p.id] === colName);
                  return (
                    <div key={colName} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-left">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">{colName}</h4>
                        <span className="text-[10px] text-slate-400 font-bold">{colPlaces.length} địa điểm</span>
                      </div>
                      
                      {colPlaces.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">Bộ sưu tập này trống.</p>
                      ) : (
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                          {colPlaces.map(p => (
                            <div 
                              key={p.id}
                              onClick={() => navigate(`/place/${p.id}`)}
                              className="bg-slate-50 border border-slate-200/50 p-2 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors max-w-[150px] shrink-0"
                            >
                              <div className={cn("w-8 h-8 rounded-lg shrink-0", p.imageClass)}></div>
                              <span className="text-[9.5px] font-bold text-slate-700 truncate">{p.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add new taste collection input */}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Tên bộ sưu tập mới..."
                    value={newCollectionName}
                    onChange={e => setNewCollectionName(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  />
                  <button 
                    onClick={() => {
                      if (newCollectionName.trim()) {
                        addTasteCollection(newCollectionName.trim());
                        setNewCollectionName("");
                        alert("Đã tạo bộ sưu tập mới!");
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    + Tạo
                  </button>
                </div>
              </div>
            </div>

            {/* Avoid List (FR-14) */}
            <div>
              <h3 className="font-bold text-base text-slate-900 mb-3 flex items-center gap-1.5"><AlertCircle size={18} className="text-red-500 animate-pulse" /> Danh sách Tránh xa (Avoid List)</h3>
              <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm space-y-3">
                {avoidList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Danh sách trống. Nhấn "Thêm vào Tránh xa" ở trang chi tiết POI để thêm.</p>
                ) : (
                  avoidList.map(pid => {
                    const p = places.find(placeItem => placeItem.id === pid);
                    if (!p) return null;
                    return (
                      <div key={pid} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-8 h-8 rounded-lg shrink-0", p.imageClass)}></div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-700 leading-tight">{p.title}</h5>
                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider">{p.tag}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            removeFromAvoidList(pid);
                            alert(`Đã gỡ "${p.title}" khỏi danh sách tránh xa.`);
                          }}
                          className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                          title="Gỡ bỏ"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {savedPlaces.length > 0 && (
              <div>
                <h3 className="font-bold text-lg text-slate-900 mb-4">Đã lưu gần đây</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
                  {savedPlaces.map(p => (
                    <div key={p.id} onClick={() => navigate(`/place/${p.id}`)} className="min-w-[140px] bg-white p-2 rounded-[20px] shadow-sm border border-slate-100 cursor-pointer">
                      <div className={cn("w-full h-24 rounded-2xl mb-2", p.imageClass)}></div>
                      <h4 className="font-bold text-slate-900 text-xs px-1 truncate">{p.title}</h4>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADMIN Console & Experimentation Center (FR-33/FR-34) */}
        {role === 'admin' && (
          <div className="space-y-6">
            
            {/* Master API Quota Monitor Dashboard (FR-33) */}
            <div className="bg-gradient-to-br from-indigo-950 to-slate-950 text-white p-5 rounded-[28px] border border-indigo-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl"></div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1"><Database size={12} /> Hạn mức chi phí API</span>
                <span className="bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-[8px] font-black uppercase px-2 py-0.5 rounded">Giờ hệ thống: 2026</span>
              </div>
              
              <div className="flex justify-between items-baseline mb-1.5">
                <h3 className="font-display font-black text-2xl text-white">
                  ${apiQuota.budgetUsed.toFixed(2)} <span className="text-xs text-indigo-300 font-bold">/ ${apiQuota.budgetLimit.toFixed(2)} USD</span>
                </h3>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(apiQuota.budgetUsed / apiQuota.budgetLimit) * 100}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 mb-2">
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                  <div className="text-[9px] text-indigo-300 font-black uppercase">Gemini Vision Calls</div>
                  <div className="text-lg font-black mt-1 text-slate-100">{apiQuota.geminiVisionCalls}</div>
                  <span className="text-[8px] text-indigo-400 font-medium">* Đơn giá: $0.05/lượt</span>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                  <div className="text-[9px] text-indigo-300 font-black uppercase">VNPT eKYC L3 Calls</div>
                  <div className="text-lg font-black mt-1 text-slate-100">{apiQuota.vnptEkycCalls}</div>
                  <span className="text-[8px] text-indigo-400 font-medium">* Đơn giá: $0.20/lượt</span>
                </div>
              </div>
            </div>

            {/* Feature Flags Experimentation Center (FR-34) */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-base text-slate-900">Feature Flags & Kill-Switch</h3>
                {featureFlags.globalKillSwitch && (
                  <span className="bg-red-50 text-red-700 text-[8.5px] font-black uppercase px-2 py-0.5 rounded border border-red-100 animate-pulse">
                    ĐÃ KÍCH HOẠT DỪNG KHẨN CẤP
                  </span>
                )}
              </div>

              {/* Kill-switch widget warning */}
              {featureFlags.globalKillSwitch && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-[11px] font-semibold flex items-start gap-2.5 mb-4 leading-normal">
                  <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <span className="font-black block uppercase mb-0.5">Master Kill-Switch Active</span>
                    Toàn bộ các tính năng bổ sung Giai đoạn 1 đã bị ngắt kết nối an toàn. Trải nghiệm người dùng được chuyển về chế độ P0 cơ bản.
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl p-4 border border-slate-100 space-y-3.5 shadow-sm">
                
                {/* Global Kill Switch toggle */}
                <div className="flex items-center justify-between bg-red-50/50 p-2.5 rounded-xl border border-red-100/50">
                  <div>
                    <h5 className="font-extrabold text-xs text-red-950">Master Kill-Switch (Dừng khẩn cấp)</h5>
                    <p className="text-[9px] text-red-600 font-medium">Ngay lập tức vô hiệu hóa tất cả các flag P1</p>
                  </div>
                  <button 
                    onClick={() => {
                      const nextFlags = { ...featureFlags, globalKillSwitch: !featureFlags.globalKillSwitch };
                      updateFeatureFlags(nextFlags);
                    }}
                    className={cn(
                      "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                      featureFlags.globalKillSwitch ? "bg-red-600 text-right" : "bg-slate-200 text-left"
                    )}
                  >
                    <div className={cn("w-4 h-4 rounded-full bg-white transition-all duration-300", featureFlags.globalKillSwitch ? "translate-x-6" : "")}></div>
                  </button>
                </div>

                <div className="h-[1px] bg-slate-100" />

                {/* Other flags */}
                {[
                  { key: 'priceForecast', label: 'Price Forecasting (AI)' },
                  { key: 'visualSearch', label: 'Visual Search (Gemini)' },
                  { key: 'sponsoredAds', label: 'Sponsored Ad Badges' },
                  { key: 'guidebook', label: 'Travel Guidebook' },
                  { key: 'comparePois', label: 'POI Comparison' },
                  { key: 'tasteCollections', label: 'Taste Collections' },
                  { key: 'avoidList', label: 'Avoid List Grayscale Map' },
                  { key: 'quickReport', label: '2-Tap Quick Report' },
                  { key: 'verifiedStay', label: 'StayPass Verified Stay' }
                ].map(flag => (
                  <div key={flag.key} className="flex items-center justify-between px-1">
                    <div>
                      <h5 className="font-bold text-slate-800 text-xs leading-none mb-1">{flag.label}</h5>
                      <span className="text-[9px] text-slate-400 font-medium">Flag key: {flag.key}</span>
                    </div>
                    <button 
                      disabled={featureFlags.globalKillSwitch}
                      onClick={() => {
                        const nextFlags = { ...featureFlags, [flag.key]: !featureFlags[flag.key as any] };
                        updateFeatureFlags(nextFlags);
                      }}
                      className={cn(
                        "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                        // @ts-ignore
                        featureFlags[flag.key] ? "bg-indigo-600 text-right" : "bg-slate-200 text-left",
                        featureFlags.globalKillSwitch && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      {/* @ts-ignore */}
                      <div className={cn("w-4 h-4 rounded-full bg-white transition-all duration-300", featureFlags[flag.key] ? "translate-x-6" : "")}></div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Phase 2 Systems Control Hub (Admin only) */}
        {role === 'admin' && (
          <div>
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-1.5">
              <Shield className="text-purple-600 animate-pulse" size={20} />
              Bảng quản trị Hệ thống P2 (Admin Only)
            </h3>
            
            <div className="bg-white rounded-[24px] p-5 border border-slate-100 space-y-6 shadow-sm text-left mb-6">
              
              {/* GDPR Legal Hold & Auto Purge Worker */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1">
                    <Database size={14} /> GDPR & NĐ13 Auto-Purge Worker
                  </h4>
                  <span className="bg-purple-50 text-purple-600 text-[8.5px] font-black uppercase px-2 py-0.5 rounded border border-purple-100">
                    Tuân thủ
                  </span>
                </div>

                <p className="text-[10px] text-slate-500 font-semibold mb-4 leading-relaxed">
                  Tự động dọn dẹp Rescue Picks quá hạn (&gt;14 ngày) và dữ liệu tài khoản đã bị yêu cầu xóa.
                </p>

                {/* Legal Hold Switch */}
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs leading-none mb-1 flex items-center gap-1">
                      <Scale size={14} className="text-indigo-600" />
                      Kích hoạt Chế độ Hoãn Hủy (Legal Hold)
                    </h5>
                    <p className="text-[9px] text-slate-400 font-medium mt-1">Dừng tất cả các hoạt động xóa dữ liệu để phục vụ điều tra/pháp lý</p>
                  </div>
                  <button 
                    onClick={() => setLegalHoldActive(!legalHoldActive)}
                    className={cn(
                      "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                      legalHoldActive ? "bg-amber-500 text-right" : "bg-slate-200 text-left"
                    )}
                  >
                    <div className={cn("w-4 h-4 rounded-full bg-white transition-all duration-300", legalHoldActive ? "translate-x-6" : "")}></div>
                  </button>
                </div>

                {/* Trigger Worker */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => {
                      runPurgeWorker();
                      alert("Đã kích hoạt Worker dọn dẹp dữ liệu tự động!");
                    }}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={12} /> Chạy Purge Worker
                  </button>
                </div>

                {/* Purge Logs display */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 h-28 overflow-y-auto no-scrollbar font-mono text-[9px] text-slate-600 space-y-1">
                  <div className="text-[8.5px] font-bold text-slate-400 border-b border-slate-200 pb-1 mb-1">LOG NHẬT KÝ BẢO TRÌ HỆ THỐNG</div>
                  {purgeLogs.map((log: string, idx: number) => (
                    <div key={idx} className={cn(
                      "leading-relaxed",
                      log.includes("[WARNING]") ? "text-amber-600 font-bold" :
                      log.includes("[SUCCESS]") ? "text-green-600" : "text-slate-500"
                    )}>{log}</div>
                  ))}
                </div>
              </div>

              <div className="h-[1px] bg-slate-100" />

              {/* POI Rebranding Fingerprint Simulator */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Fingerprint size={14} className="text-rose-500" />
                  Hệ thống Chống ve sầu thoát xác (POI Fingerprinting)
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold mb-4 leading-relaxed">
                  Ngăn chặn cơ sở vi phạm đổi tên để lách lệnh cấm bằng cách so khớp khoảng cách GPS, mã số thuế và cấu trúc thiết kế của quán.
                </p>

                <div className="space-y-3 bg-slate-50 p-4 border border-slate-200 rounded-2xl">
                  <div>
                    <label className="block text-[8.5px] font-bold text-slate-400 uppercase mb-1">Mô phỏng Đăng ký POI Mới:</label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <span className="text-[8px] text-slate-400 block font-bold">Mã số Thuế (MST)</span>
                        <input
                          type="text"
                          id="taxIdSim"
                          placeholder="Nhập MST..."
                          defaultValue="MST-9999"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block font-bold">Cự ly GPS (mét)</span>
                        <input
                          type="number"
                          id="distSim"
                          placeholder="Khoảng cách..."
                          defaultValue={35}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const taxId = (document.getElementById('taxIdSim') as HTMLInputElement)?.value || 'MST-9999';
                      const dist = Number((document.getElementById('distSim') as HTMLInputElement)?.value || 35);
                      
                      const matchResult = checkPoiFingerprint({
                        taxId,
                        gpsDistance: dist,
                        layoutHash: "hash_structure_99" // matching blacklisted layout structure
                      });

                      if (matchResult.matchedBanned) {
                        alert(`⚠️ CẢNH BÁO GIAN LẬN THOÁT XÁC!\nTrùng khớp địa điểm đen: ${matchResult.matchedFingerprint?.reason}\nĐộ tương đồng: ${matchResult.confidence * 100}%`);
                      } else {
                        alert(`✓ POI Fingerprint An Toàn!\nĐộ tương đồng với danh sách đen: ${matchResult.confidence * 100}%. Cho phép tạo mới.`);
                      }
                    }}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase active:scale-95 transition-all cursor-pointer"
                  >
                    Kiểm tra Fingerprint
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* GDPR & Privacy Controls (FR-24) */}
        <div>
          <h3 className="font-bold text-lg text-slate-900 mb-4">Quyền riêng tư (Nghị định 13)</h3>
          <div className="bg-white rounded-[24px] p-4 border border-slate-100 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs leading-none mb-1">Theo dõi vị trí GPS</h4>
                <p className="text-[10px] text-slate-400 font-medium">Bật để hỗ trợ Geofence, dẫn đường và bằng chứng ghé thăm</p>
              </div>
              <button 
                onClick={() => updatePrivacySettings({ ...privacySettings, trackLocation: !privacySettings.trackLocation })}
                className={cn(
                  "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                  privacySettings.trackLocation ? "bg-indigo-600 text-right" : "bg-slate-200 text-left"
                )}
              >
                <div className={cn("w-4 h-4 rounded-full bg-white transition-all duration-300", privacySettings.trackLocation ? "translate-x-6" : "")}></div>
              </button>
            </div>
            
            <div className="h-[1px] bg-slate-100" />

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs leading-none mb-1">Chia sẻ dữ liệu dịch vụ</h4>
                <p className="text-[10px] text-slate-400 font-medium">Đồng ý cung cấp dữ liệu hành trình ẩn danh cho thuật toán gợi ý</p>
              </div>
              <button 
                onClick={() => updatePrivacySettings({ ...privacySettings, allowShareData: !privacySettings.allowShareData })}
                className={cn(
                  "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                  privacySettings.allowShareData ? "bg-indigo-600 text-right" : "bg-slate-200 text-left"
                )}
              >
                <div className={cn("w-4 h-4 rounded-full bg-white transition-all duration-300", privacySettings.allowShareData ? "translate-x-6" : "")}></div>
              </button>
            </div>
          </div>
        </div>

        {/* General Options */}
        <div>
          <h3 className="font-bold text-lg text-slate-900 mb-4">Tính năng hỗ trợ</h3>
          <div className="space-y-3">
            <div onClick={() => navigate('/profile/cases')} className="bg-white px-5 py-4 rounded-[20px] flex justify-between items-center shadow-sm border border-slate-100 cursor-pointer hover:border-indigo-100 transition-colors">
              <div className="flex items-center gap-3 text-slate-700 font-medium text-sm">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500"><Bell size={18}/></div>
                Theo dõi báo cáo (SLA)
              </div>
              <div className="text-slate-300 font-black px-2">&rsaquo;</div>
            </div>

            {(role === 'admin' || role === 'moderator') && (
              <div onClick={() => navigate('/admin/dispatch')} className="bg-white px-5 py-4 rounded-[20px] flex justify-between items-center shadow-sm border border-slate-100 cursor-pointer hover:border-amber-100 transition-colors">
                <div className="flex items-center gap-3 text-slate-700 font-medium text-sm">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600"><Shield size={18}/></div>
                  Console Điều phối (Mod)
                </div>
                <div className="text-slate-300 font-black px-2">&rsaquo;</div>
              </div>
            )}

            {role === 'admin' && (
              <div onClick={() => navigate('/admin/poi')} className="bg-white px-5 py-4 rounded-[20px] flex justify-between items-center shadow-sm border border-slate-100 cursor-pointer hover:border-purple-100 transition-colors">
                <div className="flex items-center gap-3 text-slate-700 font-medium text-sm">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><Database size={18}/></div>
                  Quản trị POI & Dữ liệu (Admin)
                </div>
                <div className="text-slate-300 font-black px-2">&rsaquo;</div>
              </div>
            )}
          </div>
        </div>

        {/* Danger zone / RTBF */}
        <div className="pt-4">
          <div className="bg-red-50/50 border border-red-100 rounded-[24px] p-5">
            <h4 className="text-sm font-bold text-red-800 mb-1">Khu vực nguy hiểm</h4>
            <p className="text-[10px] text-red-600/80 font-medium mb-4 leading-relaxed">
              Bạn có quyền yêu cầu xóa bỏ vĩnh viễn toàn bộ dữ liệu cá nhân (Right to be Forgotten) theo Khoản 1 Điều 16 Nghị định 13/2023/NĐ-CP. Hành động này không thể hoàn tác.
            </p>
            {!showDeleteConfirm ? (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2.5 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition-colors"
              >
                Yêu cầu xóa tài liệu & dữ liệu
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-bold text-red-900">Xác nhận xóa sạch thông tin?</p>
                <div className="flex gap-2">
                  <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-700 text-white text-xs font-bold rounded-lg hover:bg-red-800">Có, xóa ngay</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300">Hủy</button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={logout}
          className="w-full mt-6 py-4 rounded-2xl text-slate-500 font-bold bg-white border border-slate-200 active:bg-slate-50 transition-colors text-sm cursor-pointer"
        >
          Đăng xuất
        </button>
      </div>

      {showAddPlace && <AddPlaceModal onClose={() => setShowAddPlace(false)} />}

      {/* VNPT eKYC L3 Simulation Modal (FR-21) */}
      <AnimatePresence>
        {showEkycModal && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => ekycStep !== 3 && setShowEkycModal(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="bg-white w-full sm:w-[380px] rounded-t-[32px] sm:rounded-[32px] p-6 relative z-10 shadow-2xl text-center text-slate-800"
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-2">
                  <Fingerprint className="text-indigo-600 animate-pulse" size={20} />
                  <h3 className="font-black text-xl text-slate-900">VNPT eKYC L3 định danh</h3>
                </div>
                {ekycStep !== 3 && (
                  <button onClick={() => setShowEkycModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={18}/></button>
                )}
              </div>

              {ekycStep === 1 && (
                <div className="text-left space-y-4">
                  <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Bước 1: Chụp ảnh CCCD 2 mặt</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-4">
                    Vui lòng chụp ảnh mặt trước và mặt sau CCCD. Đảm bảo ảnh rõ nét, không lóa sáng, không mất góc.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setCccdFront(new File([], 'front.png'))}
                      className={cn(
                        "h-28 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-[10px] font-black uppercase transition-all cursor-pointer",
                        cccdFront ? "border-green-500 bg-green-50/50 text-green-700" : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-400"
                      )}
                    >
                      <Camera size={20} className="mb-1" />
                      {cccdFront ? "Mặt trước: OK" : "Mặt trước CCCD"}
                    </button>
                    <button 
                      onClick={() => setCccdBack(new File([], 'back.png'))}
                      className={cn(
                        "h-28 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-[10px] font-black uppercase transition-all cursor-pointer",
                        cccdBack ? "border-green-500 bg-green-50/50 text-green-700" : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-400"
                      )}
                    >
                      <Camera size={20} className="mb-1" />
                      {cccdBack ? "Mặt sau: OK" : "Mặt sau CCCD"}
                    </button>
                  </div>

                  {cccdFront && cccdBack && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] font-semibold text-slate-600 space-y-1">
                      <div className="font-bold text-slate-800 uppercase tracking-wide mb-1">Dữ liệu OCR CCCD:</div>
                      <div>Họ và Tên: <span className="font-black text-slate-700">{user.email?.split('@')[0].toUpperCase()}</span></div>
                      <div>Số CCCD: <span className="font-black text-slate-700">037095018492</span></div>
                      <div>Năm sinh: <span className="font-black text-slate-700">1995</span></div>
                    </div>
                  )}

                  <button
                    disabled={!cccdFront || !cccdBack || uploadingCccd}
                    onClick={handleUploadCccd}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 cursor-pointer text-center text-xs flex items-center justify-center gap-1.5"
                  >
                    {uploadingCccd ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang tải lên tài liệu...</span>
                      </>
                    ) : "Tiếp tục"}
                  </button>
                </div>
              )}

              {ekycStep === 2 && (
                <div className="space-y-6">
                  <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider text-left">Bước 2: Xác minh thực thể sống (Liveness Test)</h4>
                  
                  <div className="w-40 h-40 rounded-full border-4 border-indigo-600 mx-auto relative overflow-hidden bg-slate-100 flex items-center justify-center shadow-lg">
                    <Video size={48} className="text-indigo-400 animate-pulse" />
                    <div className="absolute inset-0 border border-indigo-400 rounded-full scale-90 animate-ping" style={{ animationDuration: '2s' }}></div>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
                    <p className="text-xs font-black text-indigo-950 animate-pulse leading-normal">
                      {livenessPrompt}
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-400 font-semibold">
                    *Mô phỏng quét sinh trắc khuôn mặt 3D theo tiêu chuẩn VNPT Trust Engine.
                  </div>
                </div>
              )}

              {ekycStep === 3 && (
                <div className="py-8">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <h4 className="font-bold text-slate-800 text-sm mb-2">Đang liên kết Cơ sở dữ liệu Quốc gia...</h4>
                  <p className="text-xs text-slate-400 font-medium">Đối soát dấu vân tay và sinh trắc học thẻ chip CCCD</p>
                </div>
              )}

              {ekycStep === 4 && (
                <div className="space-y-5 text-left">
                  <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto border border-green-100">
                    <ShieldCheck size={28} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm text-center">Định danh eKYC L3 Thành Công!</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed text-center">
                    Cơ sở dữ liệu VNPT Trust Engine trả về kết quả khớp **100%**. Tài khoản của bạn đã được gắn nhãn uy tín.
                  </p>

                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl text-[10px] font-semibold space-y-1.5 font-mono text-slate-600">
                    <div>Trạng thái: <span className="text-green-600 font-black">XÁC THỰC L3</span></div>
                    <div>Chữ ký số: <span className="font-bold text-slate-700">VNPT-CA-2026-ACTIVE</span></div>
                    <div>Hash bảo mật: <span className="text-[9px] text-indigo-600 break-all select-all font-bold">SHA256: 3a28c29b4e54821a84920950184cdd</span></div>
                  </div>

                  <button 
                    onClick={handleCompleteEkyc}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl active:scale-95 transition-transform cursor-pointer text-center text-xs"
                  >
                    Hoàn tất & Lưu trạng thái
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Merchant Appeal Wizard Modal (FR-31) */}
      <AnimatePresence>
        {showAppealModal && appealPlaceId && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => appealStep !== 4 && setShowAppealModal(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="bg-white w-full sm:w-[380px] rounded-t-[32px] sm:rounded-[32px] p-6 relative z-10 shadow-2xl text-left text-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-lg text-slate-900">Nộp đơn Kháng cáo POI</h3>
                {appealStep !== 4 && (
                  <button onClick={() => setShowAppealModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={18}/></button>
                )}
              </div>

              {appealStep === 1 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Bước 1: Nộp phí bảo lãnh cam kết</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Theo quy định xử lý khiếu nại, Đối tác cần đóng phí bảo lãnh **1,000,000đ** trích từ Wallet. Số tiền này sẽ hoàn trả **100%** nếu kháng cáo thành công, hoặc sung quỹ cộng đồng nếu kháng cáo bị từ chối do vi phạm thực tế.
                  </p>

                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl text-xs space-y-1.5">
                    <div className="flex justify-between"><span>Số dư ví hiện tại:</span><span className="font-bold text-slate-800">{merchantWalletBalance.toLocaleString('vi-VN')} đ</span></div>
                    <div className="flex justify-between text-indigo-600"><span>Lệ phí bảo lãnh đóng:</span><span className="font-black">-1,000,000 đ</span></div>
                  </div>

                  <button 
                    onClick={handleAppealStep1}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl active:scale-95 transition-transform cursor-pointer text-center text-xs"
                  >
                    Ký quỹ & Tiếp tục
                  </button>
                </div>
              )}

              {appealStep === 2 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Bước 2: Nhập giải trình & Hóa đơn chứng minh</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Vui lòng cung cấp giải thích rõ ràng và hình ảnh hóa đơn niêm yết tại quầy, hoặc ảnh chụp thông tin hoạt động hợp pháp.
                  </p>

                  <textarea
                    rows={4}
                    value={appealEvidence}
                    onChange={e => setAppealEvidence(e.target.value)}
                    placeholder="Ví dụ: Giá của chúng tôi tăng do phí nguyên liệu từ tuần trước, bảng giá đã dán công khai tại quầy..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                  />

                  <div className="w-full h-20 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 font-bold text-[10px] cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <Camera size={18} className="mb-1 text-slate-350" />
                    <span>+ Tải hóa đơn/bảng giá chứng minh</span>
                  </div>

                  <button 
                    onClick={handleAppealStep2}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl active:scale-95 transition-transform cursor-pointer text-center text-xs"
                  >
                    Tiếp tục
                  </button>
                </div>
              )}

              {appealStep === 3 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Bước 3: Ký số điện tử VNPT SmartCA</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Để đảm bảo tính pháp lý của hồ sơ, đối tác cần ký số bằng chứng thư số VNPT SmartCA.
                  </p>

                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-3">
                    <Fingerprint className="text-indigo-600" size={24} />
                    <div>
                      <span className="text-[10px] text-slate-700 font-black block">SmartCA: {user.email?.split('@')[0]}</span>
                      <span className="text-[9px] text-slate-400 font-bold">Mã số thuế: 037095018492</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleAppealSubmit}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl active:scale-95 transition-transform cursor-pointer text-center text-xs"
                  >
                    Xác nhận ký số & Gửi đơn
                  </button>
                </div>
              )}

              {appealStep === 4 && (
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-100">
                    <ShieldCheck size={28} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">Đã nộp đơn Kháng nghị thành công!</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed px-4">
                    Mã hồ sơ đã được gửi đến ban kiểm duyệt Moderator để đối soát. SLA giải quyết tối đa 4 giờ làm việc.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
