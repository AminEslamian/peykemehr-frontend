import React, { useState } from 'react';
import { ArrowLeft, Check, AlertCircle, Info } from 'lucide-react';
import { api, setTokens, setTeacherInfo } from '../api';

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

  const handleGradeToggle = (val: string) => {
    setRegForm((prev) => ({
      ...prev,
      grade: prev.grade.includes(val)
        ? prev.grade.filter((g) => g !== val)
        : [...prev.grade, val],
    }));
  };

  // Submit Phone (Login)
  const handleLoginSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!loginPhone.trim()) return;

    setLoading(true);
    try {
      await api.sendOtp(loginPhone.trim());
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
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

    if (regForm.grade.length === 0) {
      setError('لطفاً حداقل یک پایه تحصیلی را انتخاب فرمایید.');
      return;
    }

    setLoading(true);
    try {
      await api.registerSendOtp(regForm);
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
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
          <div className="auth-brand-mark">ف</div>
          <span className="eyebrow">
            <span className="line" /> پویش فرهنگی آموزشی سفیر مهر
          </span>

          <h1 className="auth-title">
            {step === 'otp'
              ? 'تأیید شماره و ورود'
              : mode === 'login'
              ? 'ورود به حساب معلمان'
              : 'ایجاد حساب کاربری معلم'}
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

        {error && (
          <div
            style={{
              background: 'var(--danger-bg)',
              border: '1px solid #ffcdd2',
              color: 'var(--danger)',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
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
              disabled={loading}
              className="btn-astra btn-astra-primary btn-astra-lg"
              style={{ width: '100%', marginTop: '16px' }}
            >
              {loading ? 'در حال ارسال کد...' : 'ارسال کد تأیید ورود'}
              <ArrowLeft size={18} />
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

            <div className="form-field" style={{ marginTop: '12px' }}>
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
                <option value="principal">مدیر</option>
                <option value="vice_principal">معاون</option>
              </select>
            </div>

            <div className="form-field" style={{ marginTop: '16px' }}>
              <label className="form-label">
                پایه‌های تحصیلی تحت تدریس <span style={{ color: 'var(--danger)' }}>*</span>
                <small style={{ color: 'var(--muted-foreground)', fontWeight: 'normal' }}>
                  {' '}
                  (حداقل یک پایه را انتخاب فرمایید)
                </small>
              </label>
              <div className="grades-grid">
                {GRADES.map((g) => {
                  const isChecked = regForm.grade.includes(g.value);
                  return (
                    <div
                      key={g.value}
                      className={`grade-chip ${isChecked ? 'checked' : ''}`}
                      onClick={() => handleGradeToggle(g.value)}
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
              disabled={loading}
              className="btn-astra btn-astra-primary btn-astra-lg"
              style={{ width: '100%', marginTop: '24px' }}
            >
              {loading ? 'در حال ارسال اطلاعات...' : 'ثبت مشخصات و دریافت کد تأیید'}
              <ArrowLeft size={18} />
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

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                className="btn-astra btn-astra-ghost btn-astra-sm"
                onClick={() => {
                  setStep('phone');
                  setOtpCode('');
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
            <>
              هنوز در سامانه ثبت‌نام نکرده‌اید؟
              <a
                href="#register"
                onClick={(e) => {
                  e.preventDefault();
                  setMode('register');
                  setStep('phone');
                  setError('');
                }}
              >
                ایجاد حساب جدید
              </a>
            </>
          ) : (
            <>
              قبلاً حساب ساخته‌اید؟
              <a
                href="#login"
                onClick={(e) => {
                  e.preventDefault();
                  setMode('login');
                  setStep('phone');
                  setError('');
                }}
              >
                ورود به حساب کاربری
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
