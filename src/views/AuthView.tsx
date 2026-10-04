import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Check, AlertCircle, Clock, RotateCcw } from 'lucide-react';
import { api, setTokens, setTeacherInfo } from '../api';
import { Logo } from '../components/Logo';

const toPersianDigits = (n: number | string): string => {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
};

const formatTimer = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${toPersianDigits(mins)}:${toPersianDigits(secs < 10 ? `0${secs}` : secs)}`;
};

interface AuthViewProps {
  initialMode: 'login' | 'register';
  onDone: () => void;
  onSwitchMode: (mode: 'login' | 'register') => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ initialMode, onDone, onSwitchMode }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState<number>(0);
  const [successNotice, setSuccessNotice] = useState<string>('');

  // 60-second Countdown Timer Interval
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Clear rate-limit error message when countdown reaches zero
  useEffect(() => {
    if (countdown === 0 && (error.includes('صبر کنید') || error.includes('ثانیه') || error.includes('دقیقه'))) {
      setError('');
    }
  }, [countdown, error]);

  // Dynamically update error with live seconds countdown if rate limited
  const displayedError = useMemo(() => {
    if (!error) return '';
    if (countdown > 0 && (error.includes('صبر کنید') || error.includes('ثانیه') || error.includes('دقیقه') || error.includes('۴۲۹'))) {
      return `لطفاً ${toPersianDigits(countdown)} ثانیه صبر کنید و سپس مجدداً درخواست ارسال کد نمایید.`;
    }
    return error;
  }, [error, countdown]);

  // Login State
  const [loginPhone, setLoginPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Register State
  const [regForm, setRegForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    national_id: '',
    province: '',
    city: '',
    village: '',
    school: '',
    gender: 'man',
    position: 'teacher',
    grade: [] as string[],
  });

  const GRADES = [
    { value: 'first', label: 'پایه اول' },
    { value: 'second', label: 'پایه دوم' },
    { value: 'third', label: 'پایه سوم' },
    { value: 'fourth', label: 'پایه چهارم' },
    { value: 'fifth', label: 'پایه پنجم' },
    { value: 'sixth', label: 'پایه ششم' },
  ];

  const handleGradeSelect = (val: string) => {
    setRegForm((prev) => ({
      ...prev,
      grade: [val],
    }));
  };

  // Submit Phone (Login)
  const handleLoginSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');
    if (!loginPhone.trim()) return;
    if (countdown > 0) return;

    setLoading(true);
    try {
      await api.sendOtp(loginPhone.trim());
      setStep('otp');
      setCountdown(60);
      setSuccessNotice('کد تأیید ورود با موفقیت ارسال گردید.');
    } catch (err: any) {
      setError(err.message);
      if (err.status === 429) {
        setCountdown((prev) => (prev > 0 ? prev : 60));
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit OTP (Login)
  const handleLoginVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otpCode.trim().length !== 4) {
      setError('کد تأیید باید ۴ رقم باشد.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyOtp(loginPhone.trim(), otpCode.trim());
      setTokens(res.access, res.refresh);
      if (res.teacher) setTeacherInfo(res.teacher);
      onDone();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Form (Register)
  const handleRegisterSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');

    if (regForm.grade.length !== 1) {
      setError('لطفاً پایه تحصیلی خود را انتخاب فرمایید.');
      return;
    }
    if (countdown > 0) return;

    setLoading(true);
    try {
      await api.registerSendOtp(regForm);
      setStep('otp');
      setCountdown(60);
      setSuccessNotice('کد تأیید با موفقیت ارسال گردید.');
    } catch (err: any) {
      setError(err.message);
      if (err.status === 429) {
        setCountdown((prev) => (prev > 0 ? prev : 60));
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Handler
  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    setError('');
    setSuccessNotice('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await api.sendOtp(loginPhone.trim());
      } else {
        await api.registerSendOtp(regForm);
      }
      setCountdown(60);
      setSuccessNotice('کد تأیید جدید با موفقیت پیامک شد.');
    } catch (err: any) {
      setError(err.message);
      if (err.status === 429) {
        setCountdown((prev) => (prev > 0 ? prev : 60));
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit OTP (Register)
  const handleRegisterVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otpCode.trim().length !== 4) {
      setError('کد تأیید باید ۴ رقم باشد.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerVerifyOtp({ ...regForm, code: otpCode.trim() });
      setTokens(res.access, res.refresh);
      if (res.teacher) setTeacherInfo(res.teacher);
      onDone();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activePhone = mode === 'login' ? loginPhone : regForm.phone_number;

  return (
    <div className="auth-wrapper">
      <div className={`auth-box ${mode === 'register' && step === 'phone' ? 'auth-box-wide' : ''}`}>
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <Logo size={56} variant="icon" />
          </div>
          <span className="eyebrow">
            <span className="line" /> سامانه مبلغین و معلمین پیک مهر
          </span>

          <h1 className="auth-title">
            {step === 'otp'
              ? 'تأیید شماره و ورود'
              : mode === 'login'
              ? 'ورود به حساب کاربری'
              : 'ایجاد حساب کاربری (مبلغین و معلمین)'}
          </h1>

          <p className="auth-subtitle">
            {step === 'otp'
              ? 'کد تأیید ۴ رقمی ارسال‌شده به شماره زیر را وارد نمایید:'
              : mode === 'login'
              ? 'شماره همراه خود را وارد کنید تا کد تأیید ورود برای شما ارسال شود.'
              : 'مشخصات فردی، مدرسه و پایه‌های تحصیلی خود را جهت عضویت در سامانه وارد فرمایید.'}
          </p>

          {step === 'otp' && (
            <div>
              <span className="phone-display-pill">{activePhone}</span>
            </div>
          )}
        </div>

        {successNotice && (
          <div className="auth-success-box">
            <Check size={18} />
            <span>{successNotice}</span>
          </div>
        )}

        {displayedError && (
          <div className="auth-error-box">
            <AlertCircle size={20} />
            <span>{displayedError}</span>
          </div>
        )}

        {/* STEP 1: LOGIN PHONE */}
        {mode === 'login' && step === 'phone' && (
          <form onSubmit={handleLoginSendOtp}>
            <div className="form-field">
              <label className="form-label" htmlFor="phone">
                شماره همراه
              </label>
              <input
                id="phone"
                type="tel"
                className="form-input"
                placeholder="مثلاً ۰۹۱۲۳۴۵۶۷۸۹"
                maxLength={11}
                dir="ltr"
                required
                autoFocus
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading || countdown > 0}
              className="btn-astra btn-astra-primary btn-astra-lg"
              style={{ width: '100%', marginTop: '16px' }}
            >
              {loading
                ? 'در حال ارسال کد...'
                : countdown > 0
                ? `لطفاً صبر کنید (${formatTimer(countdown)})`
                : 'ارسال کد تأیید ورود'}
              {countdown === 0 && <ArrowLeft size={18} />}
            </button>
          </form>
        )}

        {/* STEP 1: REGISTER FORM */}
        {mode === 'register' && step === 'phone' && (
          <form onSubmit={handleRegisterSendOtp}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px',
              }}
            >
              <div className="form-field">
                <label className="form-label">
                  نام <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: علی"
                  required
                  value={regForm.first_name}
                  onChange={(e) => setRegForm({ ...regForm, first_name: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  نام خانوادگی <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: محمدی"
                  required
                  value={regForm.last_name}
                  onChange={(e) => setRegForm({ ...regForm, last_name: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  شماره همراه <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  maxLength={11}
                  dir="ltr"
                  required
                  value={regForm.phone_number}
                  onChange={(e) => setRegForm({ ...regForm, phone_number: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  کد ملی ده‌رقمی <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="کد ملی ۱۰ رقمی"
                  maxLength={10}
                  dir="ltr"
                  required
                  value={regForm.national_id}
                  onChange={(e) => setRegForm({ ...regForm, national_id: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  استان محل خدمت <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: تهران یا قم"
                  required
                  value={regForm.province}
                  onChange={(e) => setRegForm({ ...regForm, province: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  شهرستان <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: کهک"
                  required
                  value={regForm.city}
                  onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  روستا <small style={{ color: 'var(--muted-foreground)' }}>(اختیاری)</small>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="در صورت وجود نام روستا"
                  value={regForm.village}
                  onChange={(e) => setRegForm({ ...regForm, village: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  نام مدرسه <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: دبستان شهید چمران"
                  required
                  value={regForm.school}
                  onChange={(e) => setRegForm({ ...regForm, school: e.target.value })}
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginTop: '12px',
              }}
            >
              <div className="form-field">
                <label className="form-label">
                  جنسیت <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  className="form-select"
                  required
                  value={regForm.gender}
                  onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                >
                  <option value="man">مرد</option>
                  <option value="woman">زن</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">
                  سمت در مدرسه <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  className="form-select"
                  required
                  value={regForm.position}
                  onChange={(e) => setRegForm({ ...regForm, position: e.target.value })}
                >
                  <option value="teacher">معلم</option>
                  <option value="Instructor">مربی</option>
                  <option value="Amin Program Educator">مربی طرح امین</option>
                  <option value="Independent Preacher">مبلغ آزاد</option>
                </select>
              </div>
            </div>

            <div className="form-field" style={{ marginTop: '16px' }}>
              <label className="form-label">
                پایه تحصیلی تحت تدریس <span style={{ color: 'var(--danger)' }}>*</span>
                <small style={{ color: 'var(--muted-foreground)', fontWeight: 'normal' }}>
                  {' '}
                  (لطفاً یک پایه را انتخاب فرمایید)
                </small>
              </label>
              <div className="grades-grid">
                {GRADES.map((g) => {
                  const isChecked = regForm.grade.includes(g.value);
                  return (
                    <div
                      key={g.value}
                      className={`grade-chip ${isChecked ? 'checked' : ''}`}
                      onClick={() => handleGradeSelect(g.value)}
                      role="button"
                      tabIndex={0}
                    >
                      <span>{g.label}</span>
                      {isChecked && <Check size={16} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || countdown > 0}
              className="btn-astra btn-astra-primary btn-astra-lg"
              style={{ width: '100%', marginTop: '24px' }}
            >
              {loading
                ? 'در حال ارسال اطلاعات...'
                : countdown > 0
                ? `لطفاً صبر کنید (${formatTimer(countdown)})`
                : 'ثبت مشخصات و دریافت کد تأیید'}
              {countdown === 0 && <ArrowLeft size={18} />}
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'otp' && (
          <form onSubmit={mode === 'login' ? handleLoginVerify : handleRegisterVerify}>
            <div className="form-field" style={{ textAlign: 'center' }}>
              <label className="form-label" style={{ textAlign: 'center' }}>
                کد ۴ رقمی پیامک‌شده
              </label>
              <input
                type="text"
                className="form-input"
                maxLength={4}
                inputMode="numeric"
                placeholder="----"
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  letterSpacing: '12px',
                  textAlign: 'center',
                  height: '56px',
                }}
                dir="ltr"
                required
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-astra btn-astra-primary btn-astra-lg"
              style={{ width: '100%', marginTop: '16px' }}
            >
              {loading ? 'در حال بررسی...' : 'تأیید و ورود به پنل معلمان'}
              <Check size={18} />
            </button>

            <div className="otp-resend-row">
              {countdown > 0 ? (
                <div className="otp-countdown-pill">
                  <Clock size={15} />
                  <span>امکان ارسال مجدد کد:</span>
                  <strong className="persian-num">{formatTimer(countdown)}</strong>
                </div>
              ) : (
                <button
                  type="button"
                  className="otp-resend-btn"
                  disabled={loading}
                  onClick={handleResendOtp}
                >
                  <RotateCcw size={14} />
                  ارسال مجدد کد تأیید
                </button>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <button
                type="button"
                className="btn-astra btn-astra-ghost btn-astra-sm"
                onClick={() => {
                  setStep('phone');
                  setOtpCode('');
                  setError('');
                }}
              >
                تغییر شماره همراه
              </button>
            </div>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="auth-footer-nav">
          {mode === 'login' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span>هنوز در سامانه ثبت‌نام نکرده‌اید؟</span>
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => {
                  setMode('register');
                  setStep('phone');
                  setError('');
                  setSuccessNotice('');
                }}
              >
                ایجاد حساب جدید
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span>قبلاً حساب کاربری ساخته‌اید؟</span>
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => {
                  setMode('login');
                  setStep('phone');
                  setError('');
                  setSuccessNotice('');
                }}
              >
                ورود به حساب کاربری
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
