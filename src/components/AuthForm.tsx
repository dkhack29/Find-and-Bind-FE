import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Turnstile } from '@marsidev/react-turnstile';
import { 
  User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, 
  ArrowRight, Clock, RefreshCw, AlertCircle, CheckCircle2, 
  Sparkles, ChevronLeft, CheckSquare, Square, KeyRound
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../App';
import { authService } from '../services/authentication/authApi';
import type { LoginDto, RegisterRequestDto } from '../services/authentication/authType';

interface OtpState {
  email: string;
  name: string;
  phone: string;
  gender: string;
  password?: string;
  otpCode: string;
  expiresAt: number; // Unix timestamp in ms
}

const STORAGE_KEY_OTP = 'find_bind_otp_pending_session';

export default function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useAppContext();

  // Mode: 'login' | 'register' | 'otp' | 'forgot'
  const [mode, setMode] = useState<'login' | 'register' | 'otp' | 'forgot'>('login');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginCaptchaVerified, setLoginCaptchaVerified] = useState(false);
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string; captcha?: string; general?: string }>({});
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regGender, setRegGender] = useState<'Nam' | 'Nữ' | 'Khác'>('Nam');
  const [regAgree, setRegAgree] = useState(true);
  const [regErrors, setRegErrors] = useState<{ name?: string; phone?: string; email?: string; password?: string; confirmPassword?: string; agree?: string; general?: string }>({});

  // OTP State
  const [otpSession, setOtpSession] = useState<OtpState | null>(null);
  const [otpInput, setOtpInput] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check for existing OTP session on mount (to handle browser reload / navigate away & back)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_OTP);
    if (saved) {
      try {
        const parsed: OtpState = JSON.parse(saved);
        const now = Date.now();
        const diffSec = Math.max(0, Math.floor((parsed.expiresAt - now) / 1000));
        
        setOtpSession(parsed);
        setRemainingSeconds(diffSec);
        setMode('otp');
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY_OTP);
      }
    }
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (mode === 'otp' && otpSession) {
      const calcRemaining = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((otpSession.expiresAt - now) / 1000));
        setRemainingSeconds(diff);
      };

      calcRemaining();

      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((otpSession.expiresAt - now) / 1000));
        setRemainingSeconds(diff);
        if (diff <= 0 && interval) {
          clearInterval(interval);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, otpSession]);

  // Validation functions
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  };

  const validatePhone = (phone: string) => {
    // Exactly 10 digits
    const re = /^\d{10}$/;
    return re.test(phone.trim());
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { email?: string; password?: string; captcha?: string; general?: string } = {};

    if (!loginEmail.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ Gmail.';
    } else if (!validateEmail(loginEmail)) {
      errors.email = 'Vui lòng nhập địa chỉ Gmail hợp lệ.';
    }

    if (!loginPassword) {
      errors.password = 'Vui lòng nhập mật khẩu.';
    } else if (loginPassword.length < 6) {
      errors.password = 'Vui lòng nhập mật khẩu tối thiểu 6 ký tự.';
    }

    if (!loginCaptchaVerified) {
      errors.captcha = 'Vui lòng hoàn thành xác minh mã Captcha để đăng nhập!';
    }

    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }

    setLoginErrors({});
    setIsLoggingIn(true);

    try {
      const loginPayload: LoginDto = {
        email: loginEmail.trim(),
        password: loginPassword,
      };
      const res = await authService.login(loginPayload);

      if (res && (res.success || res.data)) {
        login(loginEmail.trim(), undefined, undefined, undefined, 'email');
        if (onSuccess) onSuccess();
      } else {
        setLoginErrors({ general: res?.message || 'Đăng nhập không thành công. Vui lòng thử lại!' });
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu!';
      setLoginErrors({ general: errorMsg });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Submit Forgot Password
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccessMsg(null);

    if (!forgotEmail.trim()) {
      setForgotError('Vui lòng nhập địa chỉ Gmail.');
      return;
    } else if (!validateEmail(forgotEmail)) {
      setForgotError('Vui lòng nhập địa chỉ Gmail hợp lệ.');
      return;
    }

    setIsSubmittingForgot(true);

    try {
      const res = await authService.forgotPassword(forgotEmail.trim());
      if (res && (res.success || res.data)) {
        setForgotSuccessMsg('Hướng dẫn khôi phục mật khẩu đã được gửi đến Gmail của bạn!');
      } else {
        setForgotError(res?.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại!');
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại!';
      setForgotError(errorMsg);
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  // Submit Register
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; phone?: string; email?: string; password?: string; confirmPassword?: string; agree?: string; general?: string } = {};

    if (!regName.trim() || regName.trim().length < 2) {
      errors.name = 'Vui lòng nhập tên của bạn.';
    }

    if (!regPhone.trim() || !validatePhone(regPhone)) {
      errors.phone = 'Vui lòng nhập 10 chữ số.';
    }

    if (!regEmail.trim() || !validateEmail(regEmail)) {
      errors.email = 'Vui lòng nhập địa chỉ Gmail hợp lệ.';
    }

    if (!regPassword) {
      errors.password = 'Vui lòng nhập mật khẩu tối thiểu 6 ký tự.';
    } else if (regPassword.length < 6) {
      errors.password = 'Vui lòng nhập mật khẩu tối thiểu 6 ký tự.';
    }

    if (!regConfirmPassword) {
      errors.confirmPassword = 'Vui lòng nhập lại mật khẩu để xác nhận.';
    } else if (regConfirmPassword !== regPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.';
    }

    if (!regAgree) {
      errors.agree = 'Bạn cần đồng ý với Điều khoản & Chính sách bảo mật.';
    }

    if (Object.keys(errors).length > 0) {
      errors.general = 'Vui lòng kiểm tra và điền đúng định dạng thông tin bên dưới.';
      setRegErrors(errors);
      return;
    }

    setRegErrors({});

    // Generate 6-digit random OTP code
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes from now

    const session: OtpState = {
      email: regEmail.trim(),
      name: regName.trim(),
      phone: regPhone.trim(),
      gender: regGender,
      password: regPassword,
      otpCode: generatedOtp,
      expiresAt
    };

    localStorage.setItem(STORAGE_KEY_OTP, JSON.stringify(session));

    setOtpSession(session);
    setRemainingSeconds(300);
    setOtpInput(['', '', '', '', '', '']);
    setOtpError(null);
    setMode('otp');
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (!otpSession) return;

    const newGeneratedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiresAt = Date.now() + 5 * 60 * 1000;

    const updatedSession: OtpState = {
      ...otpSession,
      otpCode: newGeneratedOtp,
      expiresAt: newExpiresAt
    };

    localStorage.setItem(STORAGE_KEY_OTP, JSON.stringify(updatedSession));
    setOtpSession(updatedSession);
    setRemainingSeconds(300);
    setOtpInput(['', '', '', '', '', '']);
    setOtpError(null);
    setOtpSuccessMsg('Mã OTP mới đã được gửi thành công đến Gmail của bạn!');

    setTimeout(() => {
      setOtpSuccessMsg(null);
    }, 4000);
  };

  // Handle OTP Code Verification
  const handleVerifyOtp = async (fullCode?: string) => {
    const codeToVerify = fullCode || otpInput.join('');

    if (remainingSeconds <= 0) {
      setOtpError('Mã OTP đã hết hạn (quá 5 phút). Vui lòng gửi 1 mã OTP mới.');
      return;
    }

    if (codeToVerify.length < 6) {
      setOtpError('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    if (!otpSession) {
      setIsVerifyingOtp(false);
      return;
    }

    if (codeToVerify !== otpSession.otpCode) {
      setOtpError('Mã OTP nhập không chính xác! Vui lòng thử lại.');
      setIsVerifyingOtp(false);
      return;
    }

    try {
      const registerPayload: RegisterRequestDto = {
        email: otpSession.email,
        password: otpSession.password || '',
      };
      const res = await authService.register(registerPayload);

      if (res && (res.success || res.data)) {
        localStorage.removeItem(STORAGE_KEY_OTP);
        login(otpSession.email, otpSession.name, otpSession.phone, otpSession.gender, 'email');
        if (onSuccess) onSuccess();
      } else {
        setOtpError(res?.message || 'Đăng ký không thành công. Vui lòng thử lại!');
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Đăng ký thất bại. Vui lòng thử lại!';
      setOtpError(errorMsg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Social Login Handler
  const handleSocialAuth = (provider: 'google' | 'apple') => {
    const mockEmail = provider === 'google' ? 'findandbind@gmail.com' : 'apple.user@icloud.com';
    const mockName = provider === 'google' ? 'Google User' : 'Apple User';
    login(mockEmail, mockName, '0123456789', 'Nam', provider);
    if (onSuccess) onSuccess();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpBoxChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newInputs = [...otpInput];
    newInputs[index] = value.slice(-1);
    setOtpInput(newInputs);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    const combined = newInputs.join('');
    if (combined.length === 6) {
      handleVerifyOtp(combined);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData) {
      const arr = pasteData.split('');
      const newInputs = ['', '', '', '', '', ''];
      arr.forEach((char, i) => {
        newInputs[i] = char;
      });
      setOtpInput(newInputs);
      if (arr.length === 6) {
        handleVerifyOtp(pasteData);
      } else if (arr.length < 6) {
        otpInputRefs.current[arr.length]?.focus();
      }
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-[32px] p-6 sm:p-8 shadow-soft border border-slate-100 relative overflow-hidden">
      
      {/* Header section */}
      {mode !== 'otp' && mode !== 'forgot' && (
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4 border border-indigo-100 shadow-sm">
            <Sparkles size={28} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {mode === 'login' ? 'Đăng nhập tài khoản' : 'Đăng ký tài khoản mới'}
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            {mode === 'login' 
              ? 'Chào mừng bạn quay lại với Find & Bind' 
              : 'Tạo tài khoản để trải nghiệm toàn bộ tính năng du lịch'}
          </p>

          {/* Mode Switcher Pills */}
          <div className="bg-slate-100 p-1.5 rounded-2xl mt-6 grid grid-cols-2 gap-1 max-w-[280px] mx-auto">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginErrors({});
              }}
              className={cn(
                "py-2 rounded-xl text-xs font-black uppercase transition-all duration-200 cursor-pointer",
                mode === 'login' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-800"
              )}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRegErrors({});
              }}
              className={cn(
                "py-2 rounded-xl text-xs font-black uppercase transition-all duration-200 cursor-pointer",
                mode === 'register' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-800"
              )}
            >
              Đăng ký
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        
        {/* LOGIN FORM */}
        {mode === 'login' && (
          <motion.form
            key="login-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleLoginSubmit}
            className="space-y-4 text-left"
          >
            {loginErrors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                <span>{loginErrors.general}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Địa chỉ Gmail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="findandbind@gmail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all",
                    loginErrors.email ? "border-red-400 bg-red-50/30" : "border-slate-200"
                  )}
                />
              </div>
              {loginErrors.email && (
                <p className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {loginErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu của bạn"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-10 py-3 bg-slate-50 border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all",
                    loginErrors.password ? "border-red-400 bg-red-50/30" : "border-slate-200"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {loginErrors.password && (
                <p className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {loginErrors.password}
                </p>
              )}

              {/* Forgot Password Link */}
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setForgotEmail(loginEmail);
                    setForgotError(null);
                    setForgotSuccessMsg(null);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
            </div>

            {/* Cloudflare Turnstile Captcha Verification Widget */}
            <div className="pt-2 flex flex-col items-center justify-center">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center w-full">
                Xác minh mã Captcha bảo mật <span className="text-red-500">*</span>
              </label>
              
              <div className={cn(
                "p-2 rounded-2xl border flex justify-center w-full transition-all bg-slate-50",
                loginErrors.captcha ? "border-red-400 bg-red-50/30" : "border-slate-200"
              )}>
                <Turnstile 
                  siteKey={(import.meta as any).env.VITE_CLOUDFLARE_SITE_KEY || "3x00000000000000000000FF"}
                  onSuccess={(token) => {
                    setLoginCaptchaVerified(true);
                    if (loginErrors.captcha) {
                      setLoginErrors(prev => ({ ...prev, captcha: undefined }));
                    }
                  }}
                  onExpire={() => setLoginCaptchaVerified(false)}
                  onError={() => setLoginCaptchaVerified(false)}
                />
              </div>

              {loginErrors.captcha && (
                <p className="text-[11px] font-bold text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} /> {loginErrors.captcha}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 mt-3"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                hoặc đăng nhập bằng
              </span>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialAuth('google')}
                className="py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Google
              </button>

              <button
                type="button"
                onClick={() => handleSocialAuth('apple')}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.14-1.9-14.4-6.08-3.48-2.82-7.39-7.55-11.75-14.2-6.52-9.9-11.66-20.73-15.41-32.5-3.75-11.77-5.63-23.01-5.63-33.72 0-15.54 3.91-28.47 11.74-38.79 7.83-10.32 17.65-15.54 29.45-15.66 4.79 0 10.05 1.25 15.78 3.75 5.73 2.5 9.7 3.75 11.9 3.75 1.96 0 5.82-1.25 11.58-3.75 5.76-2.5 10.76-3.69 15-3.56 12.3.62 22.34 5.38 30.12 14.28-10.98 6.64-16.36 15.86-16.14 27.67.22 9.24 3.72 17.06 10.5 23.47 6.78 6.41 14.9 10.02 24.36 10.83-2.17 6.41-4.99 12.63-8.46 18.66zM119.22 31.6c0-7.07 2.55-13.8 7.65-20.19 5.1-6.39 11.52-10.38 19.26-11.97.22 1.09.33 2.07.33 2.94 0 7.18-2.61 14.02-7.83 20.52-5.22 6.5-11.74 10.49-19.57 11.97-.11-1.09-.16-2.18-.16-3.27z" />
                </svg>
                Apple
              </button>
            </div>
          </motion.form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <motion.form
            key="forgot-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleForgotPasswordSubmit}
            className="space-y-4 text-left"
          >
            <button
              type="button"
              onClick={() => setMode('login')}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer mb-2"
            >
              <ChevronLeft size={16} /> Quay lại đăng nhập
            </button>

            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-2 border border-indigo-100 shadow-sm">
                <KeyRound size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Quên mật khẩu</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Nhập Gmail của bạn để nhận hướng dẫn đặt lại mật khẩu
              </p>
            </div>

            {forgotSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>{forgotSuccessMsg}</span>
              </div>
            )}

            {forgotError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl text-xs font-semibold flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Địa chỉ Gmail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="findandbind@gmail.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingForgot}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmittingForgot ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Đang gửi yêu cầu...
                </>
              ) : (
                <>
                  Gửi mã khôi phục <ArrowRight size={18} />
                </>
              )}
            </button>
          </motion.form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <motion.form
            key="register-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleRegisterSubmit}
            className="space-y-4 text-left"
          >
            {regErrors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl text-xs font-semibold flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
                <span>{regErrors.general}</span>
              </div>
            )}

            {/* Name Field */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Họ và Tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all",
                    regErrors.name ? "border-red-400 bg-red-50/30" : "border-slate-200"
                  )}
                />
              </div>
              {regErrors.name && (
                <p className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {regErrors.name}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Số điện thoại (SĐT) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  placeholder="0123456789"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all",
                    regErrors.phone ? "border-red-400 bg-red-50/30" : "border-slate-200"
                  )}
                />
              </div>
              {regErrors.phone && (
                <p className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {regErrors.phone}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Địa chỉ Gmail <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="findandbind@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all",
                    regErrors.email ? "border-red-400 bg-red-50/30" : "border-slate-200"
                  )}
                />
              </div>
              {regErrors.email && (
                <p className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {regErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all",
                    regErrors.password ? "border-red-400 bg-red-50/30" : "border-slate-200"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {regErrors.password && (
                <p className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {regErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nhập lại mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  placeholder="Xác nhận lại mật khẩu của bạn"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all",
                    regErrors.confirmPassword ? "border-red-400 bg-red-50/30" : "border-slate-200"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showRegConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {regErrors.confirmPassword && (
                <p className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {regErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Gender Field */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Giới tính <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Nam', 'Nữ', 'Khác'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setRegGender(g)}
                    className={cn(
                      "py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center",
                      regGender === g
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Terms checkbox */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={regAgree}
                  onChange={(e) => setRegAgree(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Tôi đồng ý với <span className="text-indigo-600 font-bold">Điều khoản</span> & <span className="text-indigo-600 font-bold">Quyền riêng tư</span>
                </span>
              </label>
              {regErrors.agree && (
                <p className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {regErrors.agree}
                </p>
              )}
            </div>

            {/* Submit Register */}
            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 mt-3"
            >
              Tiếp tục gửi mã OTP <ArrowRight size={18} />
            </button>

            {/* Divider */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                hoặc đăng ký bằng
              </span>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialAuth('google')}
                className="py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Google
              </button>

              <button
                type="button"
                onClick={() => handleSocialAuth('apple')}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.14-1.9-14.4-6.08-3.48-2.82-7.39-7.55-11.75-14.2-6.52-9.9-11.66-20.73-15.41-32.5-3.75-11.77-5.63-23.01-5.63-33.72 0-15.54 3.91-28.47 11.74-38.79 7.83-10.32 17.65-15.54 29.45-15.66 4.79 0 10.05 1.25 15.78 3.75 5.73 2.5 9.7 3.75 11.9 3.75 1.96 0 5.82-1.25 11.58-3.75 5.76-2.5 10.76-3.69 15-3.56 12.3.62 22.34 5.38 30.12 14.28-10.98 6.64-16.36 15.86-16.14 27.67.22 9.24 3.72 17.06 10.5 23.47 6.78 6.41 14.9 10.02 24.36 10.83-2.17 6.41-4.99 12.63-8.46 18.66zM119.22 31.6c0-7.07 2.55-13.8 7.65-20.19 5.1-6.39 11.52-10.38 19.26-11.97.22 1.09.33 2.07.33 2.94 0 7.18-2.61 14.02-7.83 20.52-5.22 6.5-11.74 10.49-19.57 11.97-.11-1.09-.16-2.18-.16-3.27z" />
                </svg>
                Apple
              </button>
            </div>
          </motion.form>
        )}

        {/* OTP VERIFICATION VIEW */}
        {mode === 'otp' && otpSession && (
          <motion.div
            key="otp-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-left space-y-5"
          >
            {/* Back button */}
            <button
              type="button"
              onClick={() => {
                setMode('register');
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer mb-1"
            >
              <ChevronLeft size={16} /> Quay lại đăng ký
            </button>

            <div className="text-center">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-3 border border-indigo-100 shadow-sm">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Xác thực mã OTP</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Chúng tôi đã gửi mã OTP đến Gmail của bạn
              </p>
            </div>

            {/* Test Helper Demo OTP Banner */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/80 rounded-2xl p-3 text-center shadow-sm">
              <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider block">
                Mã OTP thử nghiệm (Giả lập gửi mail):
              </span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="font-mono text-xl font-black text-indigo-900 tracking-widest bg-white px-3 py-0.5 rounded-lg border border-indigo-200">
                  {otpSession.otpCode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const arr = otpSession.otpCode.split('');
                    setOtpInput(arr);
                    handleVerifyOtp(otpSession.otpCode);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-md transition-all active:scale-95 cursor-pointer"
                >
                  Tự động điền
                </button>
              </div>
            </div>

            {/* Success alert message if resent */}
            {otpSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>{otpSuccessMsg}</span>
              </div>
            )}

            {/* Error banner */}
            {otpError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl text-xs font-semibold flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
                <span>{otpError}</span>
              </div>
            )}

            {/* 6-Digit Code Inputs */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                Nhập mã 6 chữ số
              </label>
              <div className="flex justify-between gap-1.5 sm:gap-2">
                {otpInput.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    disabled={remainingSeconds <= 0 || isVerifyingOtp}
                    className={cn(
                      "w-11 h-12 sm:w-12 sm:h-14 text-center font-mono text-xl font-bold rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm",
                      remainingSeconds <= 0 ? "bg-slate-100 border-slate-200 text-slate-400" :
                      digit ? "bg-indigo-50/50 border-indigo-400 text-indigo-900" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Timer Display */}
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Clock size={16} className={cn(remainingSeconds > 0 ? "text-indigo-600 animate-pulse" : "text-red-500")} />
                <span>Mã có hiệu lực trong:</span>
              </div>
              <div className={cn(
                "font-mono text-base font-black px-2.5 py-0.5 rounded-lg border",
                remainingSeconds > 0 
                  ? "bg-white text-indigo-700 border-indigo-100 shadow-sm" 
                  : "bg-red-50 text-red-600 border-red-200"
              )}>
                {formatTimer(remainingSeconds)}
              </div>
            </div>

            {/* Resend OTP button when timer expired or user wants resend */}
            <div className="text-center pt-1">
              {remainingSeconds > 0 ? (
                <p className="text-xs text-slate-400 font-semibold">
                  Chưa nhận được mã?{' '}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    Gửi lại mã OTP
                  </button>
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-red-600">
                    Mã OTP đã hết hạn (quá 5 phút). Bạn cần gửi 1 mã OTP mới.
                  </p>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase"
                  >
                    <RefreshCw size={14} /> Gửi lại mã OTP mới (Khôi phục 5 phút)
                  </button>
                </div>
              )}
            </div>

            {/* Submit Verification Button */}
            {remainingSeconds > 0 && (
              <button
                type="button"
                disabled={otpInput.join('').length < 6 || isVerifyingOtp}
                onClick={() => handleVerifyOtp()}
                className="w-full py-3.5 bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:transform-none disabled:shadow-none"
              >
                {isVerifyingOtp ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Đang xác thực...
                  </>
                ) : (
                  <>
                    Xác nhận & Hoàn tất <ArrowRight size={18} />
                  </>
                )}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
