import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  Building,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  Save,
  RotateCcw,
  Lock,
  IdCard,
  Briefcase,
  HelpCircle,
  Check,
  Bell,
} from 'lucide-react';
import { api, getTeacherInfo, setTeacherInfo, UserProfile } from '../api';

interface ProfileViewProps {
  onNavigate: (view: string) => void;
}

// Convert numbers to Persian digits
const toPersianDigits = (n: number | string): string => {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
};

// Normalize grade values to canonical English keys ('first', 'second', etc.)
const normalizeGrade = (val: any): string => {
  if (!val) return '';
  const s = String(typeof val === 'object' && val.value ? val.value : val).trim().toLowerCase();
  const map: Record<string, string> = {
    '1': 'first',
    '2': 'second',
    '3': 'third',
    '4': 'fourth',
    '5': 'fifth',
    '6': 'sixth',
    'first': 'first',
    'second': 'second',
    'third': 'third',
    'fourth': 'fourth',
    'fifth': 'fifth',
    'sixth': 'sixth',
    'اول': 'first',
    'دوم': 'second',
    'سوم': 'third',
    'چهارم': 'fourth',
    'پنجم': 'fifth',
    'ششم': 'sixth',
    'پایه اول': 'first',
    'پایه دوم': 'second',
    'پایه سوم': 'third',
    'پایه چهارم': 'fourth',
    'پایه پنجم': 'fifth',
    'پایه ششم': 'sixth',
  };
  return map[s] || s;
};

const GRADES = [
  { value: 'first', label: 'پایه اول' },
  { value: 'second', label: 'پایه دوم' },
  { value: 'third', label: 'پایه سوم' },
  { value: 'fourth', label: 'پایه چهارم' },
  { value: 'fifth', label: 'پایه پنجم' },
  { value: 'sixth', label: 'پایه ششم' },
];

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
  const cachedTeacher = getTeacherInfo();

  // Profile data state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Editable Form fields (Everything except phone_number is editable)
  const [formData, setFormData] = useState<{
    first_name: string;
    last_name: string;
    province: string;
    city: string;
    village: string;
    school: string;
    position: string;
    gender: 'man' | 'woman' | string;
    grade: string[];
  }>({
    first_name: '',
    last_name: '',
    province: '',
    city: '',
    village: '',
    school: '',
    position: 'teacher',
    gender: 'man',
    grade: [],
  });

  // Points for gamification display
  const [totalPoints, setTotalPoints] = useState<number>(0);

  // Toggle grade helper
  const toggleGrade = (rawVal: string) => {
    const val = normalizeGrade(rawVal);
    setFormData((prev) => {
      const current = prev.grade.map(normalizeGrade);
      const exists = current.includes(val);
      const updated = exists ? current.filter((g) => g !== val) : [...current, val];
      return {
        ...prev,
        grade: updated,
      };
    });
  };

  // Fetch initial profile & points
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      api.getProfile().catch(() => null),
      api.getPoints().catch(() => ({ total: 0 })),
    ])
      .then(([profData, ptsData]) => {
        if (!isMounted) return;
        if (profData) {
          setProfile(profData);
          let initialGrades: string[] = [];
          if (Array.isArray(profData.grade)) {
            initialGrades = profData.grade.map(normalizeGrade).filter(Boolean);
          } else if (Array.isArray(cachedTeacher?.grade)) {
            initialGrades = cachedTeacher.grade.map(normalizeGrade).filter(Boolean);
          }

          setFormData({
            first_name: profData.first_name || cachedTeacher?.first_name || '',
            last_name: profData.last_name || cachedTeacher?.last_name || '',
            province: profData.province || '',
            city: profData.city || '',
            village: profData.village || '',
            school: profData.school || '',
            position: profData.position || 'teacher',
            gender: profData.gender || 'man',
            grade: initialGrades,
          });
        }
        if (ptsData && typeof ptsData.total === 'number') {
          setTotalPoints(ptsData.total);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleReset = () => {
    if (!profile) return;
    let initialGrades: string[] = [];
    if (Array.isArray(profile.grade)) {
      initialGrades = profile.grade.map(normalizeGrade).filter(Boolean);
    }
    setFormData({
      first_name: profile.first_name || cachedTeacher?.first_name || '',
      last_name: profile.last_name || cachedTeacher?.last_name || '',
      province: profile.province || '',
      city: profile.city || '',
      village: profile.village || '',
      school: profile.school || '',
      position: profile.position || 'teacher',
      gender: profile.gender || 'man',
      grade: initialGrades,
    });
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!formData.first_name.trim()) {
      setErrorMsg('تکمیل نام الزامی است.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (!formData.last_name.trim()) {
      setErrorMsg('تکمیل نام خانوادگی الزامی است.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (!formData.province.trim()) {
      setErrorMsg('انتخاب استان محل خدمت الزامی است.');
      window.scrollTo({ top: 250, behavior: 'smooth' });
      return;
    }

    if (!formData.city.trim()) {
      setErrorMsg('تکمیل شهرستان / منطقه آموزشی الزامی است.');
      window.scrollTo({ top: 250, behavior: 'smooth' });
      return;
    }

    if (!formData.school.trim()) {
      setErrorMsg('تکمیل نام مدرسه یا واحد آموزشی الزامی است.');
      window.scrollTo({ top: 320, behavior: 'smooth' });
      return;
    }

    if (!formData.position) {
      setErrorMsg('انتخاب سمت سازمانی در مدرسه الزامی است.');
      window.scrollTo({ top: 320, behavior: 'smooth' });
      return;
    }

    if (!formData.gender) {
      setErrorMsg('انتخاب جنسیت الزامی است.');
      window.scrollTo({ top: 320, behavior: 'smooth' });
      return;
    }

    if (!formData.grade || formData.grade.length === 0) {
      setErrorMsg('انتخاب حداقل یک پایه تحصیلی الزامی است. شما نمی‌توانید بدون انتخاب کلاس یا پایه تدریس پروفایل را ثبت نمایید.');
      const gradeSection = document.getElementById('grade-section');
      if (gradeSection) {
        gradeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: 450, behavior: 'smooth' });
      }
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<UserProfile> = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        province: formData.province.trim(),
        city: formData.city.trim(),
        village: formData.village.trim(),
        school: formData.school.trim(),
        position: formData.position,
        gender: formData.gender,
        grade: formData.grade,
      };

      const updated = await api.updateProfile(payload);
      setProfile(updated);
      setSuccessMsg('مشخصات شما با موفقیت در سامانه به‌روزرسانی گردید.');

      // Sync local storage teacher info
      if (cachedTeacher) {
        setTeacherInfo({
          ...cachedTeacher,
          ...payload,
          first_name: updated.first_name || formData.first_name.trim(),
          last_name: updated.last_name || formData.last_name.trim(),
        });
      }

      window.scrollTo({ top: 120, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ثبت تغییرات پروفایل. لطفاً مجدداً امتحان کنید.');
    } finally {
      setSaving(false);
    }
  };

  const honorific =
    (formData.gender || profile?.gender) === 'woman'
      ? 'سرکار خانم'
      : (formData.gender || profile?.gender) === 'man'
      ? 'جناب آقای'
      : '';

  const displayName = [profile?.first_name || cachedTeacher?.first_name, profile?.last_name || cachedTeacher?.last_name]
    .filter(Boolean)
    .join(' ');

  const initialLetter = (profile?.first_name || cachedTeacher?.first_name)?.[0] || '';

  const getPositionTitle = (pos?: string) => {
    switch (pos) {
      case 'Instructor':
        return 'مربی';
      case 'Amin Program Educator':
        return 'مربی طرح امین';
      case 'Independent Preacher':
        return 'مبلغ آزاد';
      default:
        return 'معلم';
    }
  };

  return (
    <div className="main-wrapper" style={{ paddingBottom: '80px' }}>
      {/* Top Breadcrumb & Back bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="btn-astra btn-astra-outline btn-astra-sm"
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          >
            <ArrowRight size={15} />
            بازگشت به میز کار
          </button>
          <span style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>/</span>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--foreground)' }}>
            پروفایل و مشخصات کاربری
          </span>
        </div>

        <div
          className="educator-points-badge"
          style={{ cursor: 'default' }}
          title="مجموع امتیازات کسب‌شده شما در سامانه"
        >
          <Sparkles size={16} />
          <span>مجموع امتیازات:</span>
          <strong>{toPersianDigits(totalPoints)}</strong>
          <span className="points-unit">امتیاز</span>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'var(--card)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}
        >
          <Loader2 size={36} className="spinner" style={{ color: 'var(--primary)', marginBottom: '14px' }} />
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem' }}>
            در حال دریافت اطلاعات پروفایل شما از سرور...
          </p>
        </div>
      ) : (
        <>
          {/* Educator Hero Banner */}
          <div className="educator-profile-bar" style={{ marginBottom: '28px' }}>
            <div className="educator-profile-main">
              <div className="educator-avatar">
                {initialLetter ? <span>{initialLetter}</span> : <GraduationCap size={28} />}
              </div>

              <div className="educator-profile-info">
                <h2>
                  {honorific} {displayName || 'همکار گرامی'}
                  <span className="educator-status-pill">
                    <span className="status-dot" />
                    حساب فعال و تأییدشده
                  </span>
                </h2>
                <p className="educator-meta-row">
                  <span>
                    <Briefcase size={14} style={{ display: 'inline', verticalAlign: '-2px', marginLeft: '4px' }} />
                    سمت: <strong>{getPositionTitle(formData.position)}</strong>
                  </span>
                  <span> · </span>
                  <span>
                    <Building size={14} style={{ display: 'inline', verticalAlign: '-2px', marginLeft: '4px' }} />
                    مدرسه: <strong>{formData.school || 'نامشخص'}</strong>
                  </span>
                  <span> · </span>
                  <span>
                    <MapPin size={14} style={{ display: 'inline', verticalAlign: '-2px', marginLeft: '4px' }} />
                    {formData.province} ({formData.city})
                  </span>
                  {formData.grade.length > 0 && (
                    <>
                      <span> · </span>
                      <span>
                        <GraduationCap size={14} style={{ display: 'inline', verticalAlign: '-2px', marginLeft: '4px' }} />
                        {formData.grade.map((g) => GRADES.find((item) => item.value === normalizeGrade(g))?.label || g).join('، ')}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="educator-profile-actions">
              <span
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--muted-foreground)',
                  background: '#f8faf6',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
                سامانه مبلغین و معلمان پیک مهر
              </span>
            </div>
          </div>

          {/* Feedback Alerts */}
          {successMsg && (
            <div className="auth-success-box" style={{ marginBottom: '24px' }}>
              <CheckCircle size={20} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="auth-error-box" style={{ marginBottom: '24px' }}>
              <AlertCircle size={20} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Main Profile Form Card */}
          <div className="studio-card">
            <form onSubmit={handleSave}>
              {/* SECTION 1: IDENTITY & READ-ONLY */}
              <div style={{ marginBottom: '32px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1.5px solid var(--border-light)',
                    paddingBottom: '12px',
                    marginBottom: '18px',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: 'var(--foreground)',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <IdCard size={20} style={{ color: 'var(--primary)' }} />
                    مشخصات فردی و حساب کاربری
                  </h3>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
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
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="مثال: علی"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label">
                      نام خانوادگی <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="مثال: محمدی"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label">
                      شماره همراه <Lock size={12} style={{ display: 'inline', color: 'var(--muted-foreground)' }} />
                    </label>
                    <input
                      type="text"
                      className="form-input ltr-num"
                      value={profile?.phone_number || cachedTeacher?.phone_number || ''}
                      disabled
                      style={{ background: '#f4f6f2', cursor: 'not-allowed', color: '#55655b' }}
                    />
                    <small style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      شماره همراه شناسه اصلی حساب کاربری است و غیرقابل ویرایش می‌باشد.
                    </small>
                  </div>
                </div>
              </div>

              {/* SECTION 2: EDITABLE PROFESSIONAL & LOCATION DETAILS */}
              <div style={{ marginBottom: '32px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1.5px solid var(--border-light)',
                    paddingBottom: '12px',
                    marginBottom: '18px',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: 'var(--foreground)',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Building size={20} style={{ color: 'var(--primary)' }} />
                    مشخصات سازمانی و محل خدمت (قابل ویرایش)
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
                    قابل اصلاح و ثبت
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                    gap: '16px',
                  }}
                >
                  <div className="form-field">
                    <label className="form-label">
                      استان محل خدمت <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="مثال: تهران یا قم"
                      required
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label">
                      شهرستان / منطقه آموزشی <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="مثال: ناحیه ۳ یا کهریزک"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label">
                      نام روستا <small style={{ color: 'var(--muted-foreground)' }}>(اختیاری)</small>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="در صورت خدمت در روستا وارد کنید"
                      value={formData.village}
                      onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label">
                      نام مدرسه / واحد آموزشی <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="مثال: دبستان شهید چمران"
                      required
                      value={formData.school}
                      onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label">
                      سمت سازمانی در مدرسه <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <select
                      className="form-select"
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    >
                      <option value="teacher">معلم</option>
                      <option value="Instructor">مربی</option>
                      <option value="Amin Program Educator">مربی طرح امین</option>
                      <option value="Independent Preacher">مبلغ آزاد</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="form-label">
                      جنسیت <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <select
                      className="form-select"
                      required
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="man">مرد</option>
                      <option value="woman">زن</option>
                    </select>
                  </div>

                  <div id="grade-section" className="form-field" style={{ gridColumn: '1 / -1', marginTop: '4px' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <GraduationCap size={16} style={{ color: 'var(--primary)' }} />
                        پایه‌های تدریس و کلاس‌های تحت پوشش <span style={{ color: 'var(--danger)' }}>*</span>
                        <small style={{ color: 'var(--muted-foreground)', fontWeight: 'normal' }}>(حداقل یک پایه الزامی است)</small>
                      </span>
                      {formData.grade.length > 0 ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700 }}>
                          {toPersianDigits(formData.grade.length)} پایه انتخاب‌شده
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 700 }}>
                          هیچ پایه‌ای انتخاب نشده (الزامی)
                        </span>
                      )}
                    </label>

                    <div className="grades-grid" style={{ marginTop: '8px' }}>
                      {GRADES.map((g) => {
                        const isSelected = formData.grade.some((item) => normalizeGrade(item) === g.value);
                        return (
                          <button
                            key={g.value}
                            type="button"
                            className={`grade-chip ${isSelected ? 'checked active' : ''}`}
                            onClick={() => toggleGrade(g.value)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                            }}
                          >
                            {isSelected && <Check size={16} style={{ color: 'var(--primary)' }} />}
                            <span>{g.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div
                className="form-action-group mobile-stack-buttons"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: '14px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--border-light)',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-astra btn-astra-primary btn-astra-lg form-action-primary"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="spinner" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      ذخیره تغییرات مشخصات
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="btn-astra btn-astra-outline form-action-secondary"
                >
                  <RotateCcw size={16} />
                  انصراف و بازنشانی
                </button>
              </div>
            </form>
          </div>

          {/* QUICK SHORTCUTS CARD */}
          <div
            style={{
              marginTop: '32px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            <div
              className="hub-card"
              onClick={() => onNavigate('dashboard')}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
            >
              <div className="hub-card-icon hub-icon-primary">
                <GraduationCap size={24} />
              </div>
              <div className="hub-card-content">
                <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800 }}>
                  میز کار و ارسال روایت‌ها
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                  ثبت تجارب کلاسی، بارگذاری عکس و ویدیو و مشاهده سوابق گزارش‌ها
                </p>
              </div>
            </div>

            <div
              className="hub-card"
              onClick={() => onNavigate('survey')}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
            >
              <div className="hub-card-icon hub-icon-gold">
                <Sparkles size={24} />
              </div>
              <div className="hub-card-content">
                <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800 }}>
                  نظرسنجی‌های دوره‌ای
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                  پاسخ به پرسش‌های ارزیابی کیفی طرح آموزشی فرهنگی زیتون
                </p>
              </div>
            </div>

            <div
              className="hub-card"
              onClick={() => onNavigate('blog')}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
            >
              <div className="hub-card-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                <Bell size={24} />
              </div>
              <div className="hub-card-content">
                <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800 }}>
                  اخبار و اطلاعیه‌های پویش
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                  مشاهده آخرین بخشنامه‌ها، پوسترها و پیام‌های رسمی دبیرخانه پویش
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
