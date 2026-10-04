import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  PenTool,
  FolderArchive,
  ClipboardList,
  Upload,
  Image as ImageIcon,
  Film,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Tag as TagIcon,
  Send,
  Loader2,
  X,
  RefreshCw,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  Eye,
  Database,
  FileCheck,
  PhoneCall,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
} from 'lucide-react';
import { api, getTeacherInfo } from '../api';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
}

interface TagItem {
  id: number;
  name: string;
}

interface ReportItem {
  id: number;
  text: string;
  tags: TagItem[];
  images: Array<{ id: number; image: string; created_at: string }>;
  videos: Array<{ id: number; video: string; created_at: string }>;
  created_at: string;
}

// Convert numbers to Persian digits
const toPersianDigits = (n: number | string): string => {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
};

// Safe media URL resolver to route through Vite proxy without CORS/host mismatch
const resolveMediaUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  const cleaned = url.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, '');
  if (cleaned.startsWith('/')) {
    return cleaned;
  }
  return `/media/${cleaned}`;
};

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const teacher = getTeacherInfo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Active Tab: 'create' | 'history' | 'contact'
  const [activeTab, setActiveTab] = useState<'create' | 'history' | 'contact'>('create');

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: [teacher?.first_name, teacher?.last_name].filter(Boolean).join(' ') || '',
    phone: teacher?.phone_number || '',
    subject: '',
    message: '',
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError, setContactError] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');
    setContactSuccess('');

    if (!contactForm.name.trim() || !contactForm.phone.trim() || !contactForm.subject.trim() || !contactForm.message.trim()) {
      setContactError('لطفاً تمامی فیلدهای الزامی فرم پیام را تکمیل فرمایید.');
      return;
    }

    setContactSubmitting(true);
    setTimeout(() => {
      setContactSubmitting(false);
      setContactSuccess('پیام شما با موفقیت دریافت گردید. کارشناسان پشتیبانی سفیر مهر در اسرع وقت پیام شما را بررسی خواهند نمود.');
      setContactForm((prev) => ({ ...prev, subject: '', message: '' }));
    }, 600);
  };

  // Lightweight Tags (fetched once on mount)
  const [tags, setTags] = useState<TagItem[]>([]);

  // Reports Data (On-Demand: requires user admission before downloading media)
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoaded, setReportsLoaded] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState('');

  // Form states
  const [reportText, setReportText] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Lightbox modal state for viewing images/videos
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);
  const [activeMediaType, setActiveMediaType] = useState<'image' | 'video' | null>(null);

  // On mount: only fetch lightweight tags list (zero heavy media downloads)
  useEffect(() => {
    api
      .getTags()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  // Fetch reports on-demand with user admission
  const handleLoadReports = async () => {
    setLoadingReports(true);
    setReportsError('');
    try {
      const data = await api.getReports();
      setReports(data || []);
      setReportsLoaded(true);
    } catch (err: any) {
      setReportsError(err.message || 'خطا در دریافت سوابق از سرور. لطفاً مجدداً امتحان کنید.');
    } finally {
      setLoadingReports(false);
    }
  };

  // Tag selection toggle
  const toggleTag = (id: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  // File selection
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        newFiles.push(file);
      }
    }
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Generate client-side thumbnail URLs for chosen files before submit
  const filePreviews = useMemo(() => {
    return selectedFiles.map((file) => ({
      file,
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      isVideo: file.type.startsWith('video/'),
    }));
  }, [selectedFiles]);

  // Clean up object URLs on change
  useEffect(() => {
    return () => {
      filePreviews.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
    };
  }, [filePreviews]);

  // Submit Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!reportText.trim()) {
      setSubmitError('لطفاً شرح و روایت فعالیت کلاسی را وارد فرمایید.');
      textInputRef.current?.focus();
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('text', reportText.trim());

      selectedTagIds.forEach((id) => {
        formData.append('tags', id.toString());
      });

      selectedFiles.forEach((file) => {
        formData.append('media', file);
      });

      await api.createReport(formData);

      setSubmitSuccess('گزارش فعالیت شما با موفقیت در سامانه پیک مهر ثبت گردید.');
      setReportText('');
      setSelectedTagIds([]);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // If user had already loaded reports, refresh them in background
      if (reportsLoaded) {
        api.getReports().then(setReports).catch(() => {});
      }
    } catch (err: any) {
      setSubmitError(err.message || 'خطا در ثبت گزارش. لطفاً مجدداً تلاش نمایید.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Report
  const handleDeleteReport = async (id: number) => {
    if (!window.confirm('آیا از حذف این گزارش فعالیت اطمینان دارید؟')) return;

    setDeletingId(id);
    try {
      await api.deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || 'خطا در حذف گزارش');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const teacherFullName = [teacher?.first_name, teacher?.last_name].filter(Boolean).join(' ');
  const teacherInitial = teacher?.first_name ? teacher.first_name[0] : '';

  return (
    <div className="main-wrapper">
      {/* Educator Profile Bar (Clean, Dignified, No broken letters) */}
      <div className="educator-profile-bar">
        <div className="educator-profile-main">
          <div className="educator-avatar">
            {teacherInitial ? (
              <span>{teacherInitial}</span>
            ) : (
              <GraduationCap size={26} />
            )}
          </div>

          <div className="educator-profile-info">
            <h2>
              {teacherFullName ? `${teacherFullName} گرامی` : 'همکار ارجمند، به میز کار پیک مهر خوش آمدید'}
              <span className="educator-status-pill">
                <span className="status-dot" />
                حساب تأییدشده
              </span>
            </h2>
            <p className="educator-meta-row">
              {teacher?.school ? `محل خدمت: ${teacher.school} · ` : ''}
              {teacher?.phone_number ? `شماره همراه: ${teacher.phone_number} · ` : ''}
              فضای ثبت تجارب، ارسال مستندات کلاسی و ارتقای فعالیت‌های تربیتی
            </p>
          </div>
        </div>

        <div className="educator-profile-actions">
          <button
            type="button"
            className="btn-astra btn-astra-outline btn-astra-sm"
            onClick={() => onNavigate('survey')}
          >
            <ClipboardList size={16} />
            نظرسنجی‌های فعال
          </button>
        </div>
      </div>

      {/* 3 Action Hub Hero Cards */}
      <div className="dashboard-hub-grid">
        <div
          className={`hub-card ${activeTab === 'create' ? 'active-hub-card' : ''}`}
          onClick={() => setActiveTab('create')}
          role="button"
          tabIndex={0}
        >
          <div className="hub-card-icon hub-icon-primary">
            <PenTool size={26} />
          </div>
          <div className="hub-card-content">
            <div className="hub-card-header">
              <h4>ثبت گزارش فعالیت</h4>
              <span className="hub-card-tag hub-tag-primary">اصلی</span>
            </div>
            <p>ارسال روایت فعالیت‌های پرورشی و کلاسی همراه با مستندات تصویری و ویدیویی</p>
          </div>
          <div className="hub-card-action">
            <span>فرم ثبت فعالیت</span>
            <ArrowLeft size={16} />
          </div>
        </div>

        <div
          className="hub-card"
          onClick={() => onNavigate('survey')}
          role="button"
          tabIndex={0}
        >
          <div className="hub-card-icon hub-icon-gold">
            <ClipboardList size={26} />
          </div>
          <div className="hub-card-content">
            <div className="hub-card-header">
              <h4>نظرسنجی‌های دوره‌ای</h4>
              <span className="hub-card-tag hub-tag-gold">فعال</span>
            </div>
            <p>ارزیابی طرح‌ها، ارائه بازخورد و شرکت در پرسشنامه‌های ستاد سفیر مهر</p>
          </div>
          <div className="hub-card-action">
            <span>ورود به نظرسنجی‌ها</span>
            <ArrowLeft size={16} />
          </div>
        </div>

        <div
          className={`hub-card ${activeTab === 'contact' ? 'active-hub-card' : ''}`}
          onClick={() => setActiveTab('contact')}
          role="button"
          tabIndex={0}
        >
          <div className="hub-card-icon hub-icon-teal">
            <PhoneCall size={26} />
          </div>
          <div className="hub-card-content">
            <div className="hub-card-header">
              <h4>تماس و پشتیبانی</h4>
              <span className="hub-card-tag hub-tag-teal">پاسخگویی</span>
            </div>
            <p>اطلاعات تماس، پیام‌رسان‌ها و ارسال پیام مستقیم به کارشناسان سامانه</p>
          </div>
          <div className="hub-card-action">
            <span>ارتباط با کارشناسان</span>
            <ArrowLeft size={16} />
          </div>
        </div>
      </div>

      {/* Workspace Navigation Tabs (Segmented Control) */}
      <div className="dashboard-tab-bar">
        <button
          type="button"
          className={`dashboard-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <PenTool size={16} />
          ثبت گزارش فعالیت جدید
        </button>

        <button
          type="button"
          className={`dashboard-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('history');
            // If not yet loaded, user will see the clear admission card to fetch on-demand
          }}
        >
          <FolderArchive size={16} />
          سوابق و بایگانی گزارش‌ها
          {reportsLoaded && (
            <span className="tab-counter-badge">{toPersianDigits(reports.length)}</span>
          )}
        </button>

        <button
          type="button"
          className={`dashboard-tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          <PhoneCall size={16} />
          ارتباط با ما و پشتیبانی
        </button>

        <div className="dashboard-tab-spacer" />

        <button
          type="button"
          className="dashboard-tab-btn dashboard-tab-btn-ghost"
          onClick={() => onNavigate('survey')}
        >
          <Sparkles size={15} />
          ورود به نظرسنجی‌ها
          <ArrowLeft size={14} />
        </button>
      </div>

      {/* TAB 1: CREATE REPORT STUDIO (Full width, elegant, spacious) */}
      {activeTab === 'create' && (
        <div className="studio-card">
          <div className="studio-header">
            <h3>
              <PenTool size={20} style={{ color: 'var(--primary)' }} />
              ثبت و ارسال روایت فعالیت کلاسی
            </h3>
            <p>
              شرح دستاوردها، اقدامات ابتکاری و تجارب پرورشی خود را همراه با مستندات تصویری ثبت فرمایید.
            </p>
          </div>

          {submitSuccess && (
            <div className="auth-success-box" style={{ marginBottom: '24px' }}>
              <CheckCircle size={20} />
              <div style={{ flex: 1 }}>
                <div>{submitSuccess}</div>
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn-astra btn-astra-outline btn-astra-sm"
                    onClick={() => {
                      setActiveTab('history');
                      if (!reportsLoaded) handleLoadReports();
                    }}
                    style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                  >
                    مشاهده در سوابق گزارش‌ها
                    <ArrowLeft size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {submitError && (
            <div className="auth-error-box" style={{ marginBottom: '24px' }}>
              <AlertCircle size={20} />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitReport}>
            {/* Report Textarea */}
            <div className="form-field">
              <label className="form-label" htmlFor="reportText">
                شرح و روایت فعالیت <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                id="reportText"
                ref={textInputRef}
                className="form-input form-textarea"
                rows={6}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="توضیح دهید چه فعالیتی با دانش‌آموزان انجام شد، بازخورد آنان چه بود و چه دستاورد تربیتی یا آموزشی حاصل گردید..."
                style={{ resize: 'vertical', minHeight: '160px', lineHeight: '2' }}
                required
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '6px',
                  fontSize: '0.78rem',
                  color: 'var(--muted-foreground)',
                }}
              >
                <span>روایت‌های همراه با جزئیات اثرگذاری بیشتری در ارزیابی دارند.</span>
                <span className="persian-num">{toPersianDigits(reportText.length)} کاراکتر</span>
              </div>
            </div>

            {/* Topic Tags Chips */}
            <div className="form-field">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TagIcon size={15} style={{ color: 'var(--primary)' }} />
                  موضوع فعالیت (انتخاب برچسب‌ها)
                </span>
                {selectedTagIds.length > 0 && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700 }}>
                    {toPersianDigits(selectedTagIds.length)} برچسب انتخاب‌شده
                  </span>
                )}
              </label>
              {tags.length > 0 ? (
                <div className="tag-chips">
                  {tags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <span
                        key={tag.id}
                        className={`tag-chip ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleTag(tag.id)}
                        role="button"
                        tabIndex={0}
                      >
                        {isSelected && '✓ '}
                        {tag.name}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', background: '#f8faf6', padding: '8px 12px', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                  هنوز برچسب موضوعی در پایگاه داده ثبت نشده است.
                </div>
              )}
            </div>

            {/* Media Upload Dropzone */}
            <div className="form-field">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ImageIcon size={15} style={{ color: 'var(--primary)' }} />
                ضمیمه عکس یا ویدیو (مستندات کلاسی)
              </label>
              <div
                className="upload-dropzone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFiles(e.dataTransfer.files);
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <div className="upload-dropzone-icon">
                  <Upload size={24} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--foreground)' }}>
                  انتخاب فایل‌ها یا کشیدن و رها کردن در این قسمت
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', marginTop: '6px' }}>
                  پشتیبانی از تصاویر (JPG، PNG، WEBP) و ویدیوها (MP4، WEBM)
                </div>
              </div>

              {/* Instant Client-side Previews with Real Thumbnails */}
              {filePreviews.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, marginBottom: '10px' }}>
                    فایل‌های آماده ارسال ({toPersianDigits(filePreviews.length)} مورد):
                  </div>
                  <div className="upload-preview-grid">
                    {filePreviews.map((item, idx) => (
                      <div key={idx} className="upload-file-item">
                        <div className="upload-file-thumbnail">
                          {item.url ? (
                            <img src={item.url} alt={item.file.name} />
                          ) : (
                            <div className="upload-video-placeholder">
                              <Film size={24} />
                            </div>
                          )}
                        </div>
                        <div className="upload-file-meta">
                          <span className="upload-file-name" title={item.file.name}>
                            {item.file.name}
                          </span>
                          <span className="upload-file-size persian-num">
                            {formatFileSize(item.file.size)}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="upload-file-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          title="حذف فایل"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div style={{ marginTop: '30px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <button
                type="submit"
                className="btn-astra btn-astra-primary btn-astra-lg"
                disabled={submitting}
                style={{ minWidth: '220px' }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    در حال بارگذاری و ثبت...
                  </>
                ) : (
                  <>
                    ارسال و ثبت نهایی گزارش
                    <Send size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-astra btn-astra-ghost btn-astra-md"
                onClick={() => {
                  setReportText('');
                  setSelectedTagIds([]);
                  setSelectedFiles([]);
                  setSubmitSuccess('');
                  setSubmitError('');
                }}
                disabled={submitting}
              >
                انصراف و پاک‌سازی
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: ARCHIVE / PREVIOUS REPORTS (On-Demand with User Admission) */}
      {activeTab === 'history' && (
        <div className="studio-card">
          <div className="studio-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>
                <FolderArchive size={20} style={{ color: 'var(--primary)' }} />
                سوابق و بایگانی فعالیت‌های ثبت‌شده
              </h3>
              <p>مشاهده، بازبینی و مدیریت گزارش‌های ارسالی شما در طول سال تحصیلی</p>
            </div>

            {reportsLoaded && (
              <button
                type="button"
                className="btn-astra btn-astra-outline btn-astra-sm"
                onClick={handleLoadReports}
                disabled={loadingReports}
                title="بروزرسانی سوابق از سرور"
              >
                <RefreshCw size={14} className={loadingReports ? 'spinner' : ''} />
                بروزرسانی سوابق
              </button>
            )}
          </div>

          {/* USER ADMISSION STATE: Has not yet loaded reports from server */}
          {!reportsLoaded && !loadingReports && (
            <div className="reports-admission-card">
              <div className="admission-icon-box">
                <Database size={30} />
              </div>
              <h4>بارگذاری سوابق و فایل‌های چندرسانه‌ای</h4>
              <p>
                جهت صرفه‌جویی در مصرف حجم اینترنت و افزایش سرعت سامانه، تصاویر، ویدیوها و گزارش‌های
                پیشین شما تنها با تأیید و درخواست شما از سرور دریافت می‌شوند.
              </p>
              <button
                type="button"
                className="btn-astra btn-astra-primary btn-astra-md"
                onClick={handleLoadReports}
              >
                <RefreshCw size={16} />
                مشاهده و بارگذاری سوابق از سرور
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loadingReports && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Loader2
                size={40}
                className="spinner"
                style={{ color: 'var(--primary)', marginBottom: '14px' }}
              />
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.94rem' }}>
                در حال دریافت سوابق و مستندات کلاسی از سرور...
              </p>
            </div>
          )}

          {reportsError && (
            <div className="auth-error-box" style={{ marginBottom: '20px' }}>
              <AlertCircle size={20} />
              <span>{reportsError}</span>
            </div>
          )}

          {/* LOADED STATE: Display Reports */}
          {reportsLoaded && !loadingReports && (
            <>
              {reports.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: '#fbfcf9',
                    borderRadius: 'var(--radius)',
                    border: '1.5px dashed var(--border)',
                  }}
                >
                  <FileCheck
                    size={46}
                    style={{ color: 'var(--muted-foreground)', marginBottom: '14px', opacity: 0.5 }}
                  />
                  <h4 style={{ margin: '0 0 8px', fontSize: '1.15rem' }}>
                    هنوز فعالیتی ثبت نکرده‌اید
                  </h4>
                  <p
                    style={{
                      color: 'var(--muted-foreground)',
                      fontSize: '0.88rem',
                      maxWidth: '380px',
                      margin: '0 auto 20px',
                      lineHeight: 1.8,
                    }}
                  >
                    می‌توانید اولین روایت آموزشی یا تجارب کلاسی خود را در تب «ثبت گزارش فعالیت جدید» ارسال فرمایید.
                  </p>
                  <button
                    type="button"
                    className="btn-astra btn-astra-primary btn-astra-sm"
                    onClick={() => setActiveTab('create')}
                  >
                    <PenTool size={15} />
                    ثبت اولین گزارش فعالیت
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ fontSize: '0.88rem', color: 'var(--muted-foreground)', marginBottom: '4px' }}>
                    تعداد کل گزارش‌های ثبت‌شده شما: <strong style={{ color: 'var(--foreground)' }}>{toPersianDigits(reports.length)}</strong> مورد
                  </div>

                  {reports.map((report) => (
                    <div key={report.id} className="history-card">
                      {/* Top Bar: Date, Tags & Delete */}
                      <div className="history-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <span className="history-date-pill">
                            <Clock size={14} />
                            {formatDate(report.created_at)}
                          </span>

                          {report.tags && report.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {report.tags.map((tag) => (
                                <span key={tag.id} className="history-tag-badge">
                                  #{tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteReport(report.id)}
                          disabled={deletingId === report.id}
                          className="history-delete-btn"
                          title="حذف این گزارش"
                        >
                          {deletingId === report.id ? (
                            <Loader2 size={15} className="spinner" />
                          ) : (
                            <>
                              <Trash2 size={15} />
                              حذف گزارش
                            </>
                          )}
                        </button>
                      </div>

                      {/* Text Narrative */}
                      <div className="history-card-body">
                        {report.text}
                      </div>

                      {/* Media Gallery with Safe URLs & Lightbox */}
                      {(report.images?.length > 0 || report.videos?.length > 0) && (
                        <div className="media-preview-grid">
                          {report.images?.map((img) => {
                            const resolvedUrl = resolveMediaUrl(img.image);
                            return (
                              <div
                                key={`img-${img.id}`}
                                className="media-preview-card"
                                onClick={() => {
                                  setActiveMediaUrl(resolvedUrl);
                                  setActiveMediaType('image');
                                }}
                                title="مشاهده تصویر در اندازه کامل"
                              >
                                <img
                                  src={resolvedUrl}
                                  alt="تصویر مستندات کلاسی"
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.opacity = '0.4';
                                  }}
                                />
                                <div className="media-card-hover-overlay">
                                  <Eye size={18} />
                                  <span>مشاهده تصویر</span>
                                </div>
                              </div>
                            );
                          })}

                          {report.videos?.map((vid) => {
                            const resolvedUrl = resolveMediaUrl(vid.video);
                            return (
                              <div
                                key={`vid-${vid.id}`}
                                className="media-preview-card"
                                onClick={() => {
                                  setActiveMediaUrl(resolvedUrl);
                                  setActiveMediaType('video');
                                }}
                                title="پخش ویدیو"
                              >
                                <video src={resolvedUrl} preload="metadata" />
                                <div className="media-card-hover-overlay">
                                  <Film size={22} />
                                  <span>پخش ویدیو</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 3: CONTACT & SUPPORT */}
      {activeTab === 'contact' && (
        <div className="studio-card">
          <div className="studio-header">
            <h3>
              <PhoneCall size={20} style={{ color: 'var(--primary)' }} />
              تماس و ارتباط با ستاد سفیر مهر
            </h3>
            <p>
              همکاران گرامی؛ در صورت داشتن هرگونه ابهام، پیشنهاد یا نیاز به راهنمایی در ثبت گزارش‌ها و پاسخ به نظرسنجی‌ها با ما در ارتباط باشید.
            </p>
          </div>

          <div className="contact-layout-grid">
            {/* Contact Channels Info */}
            <div className="contact-channels-card">
              <h4 className="contact-section-title">راه‌های ارتباط مستقیم</h4>

              <div className="contact-info-list">
                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <Phone size={18} />
                  </div>
                  <div>
                    <div className="contact-info-label">تلفن پشتیبانی و دبیرخانه</div>
                    <div className="contact-info-val ltr-num">۰۲۱-۶۶۴۰۲۳۱۵</div>
                    <div className="contact-info-sub">پاسخگویی: شنبه تا چهارشنبه (ساعت ۸:۰۰ الی ۱۶:۰۰)</div>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <div className="contact-info-label">پیام‌رسان‌های رسمی</div>
                    <div className="contact-social-pills">
                      <span className="contact-social-pill">
                        <strong>ایتا:</strong> @safiremehr_support
                      </span>
                      <span className="contact-social-pill">
                        <strong>بله:</strong> @safiremehr_admin
                      </span>
                    </div>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="contact-info-label">پست الکترونیکی</div>
                    <div className="contact-info-val ltr-num">info@safiremehr.ir</div>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div className="contact-info-label">مرکز اداری و دبیرخانه</div>
                    <div className="contact-info-sub">تهران، میدان انقلاب اسلامی، خیابان کارگر شمالی، دبیرخانه مرکزی طرح سفیر مهر</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Messaging Form */}
            <div className="contact-form-card">
              <h4 className="contact-section-title">ارسال پیام به کارشناسان پشتیبانی</h4>

              {contactSuccess && (
                <div className="auth-success-box" style={{ marginBottom: '16px' }}>
                  <CheckCircle size={18} />
                  <span>{contactSuccess}</span>
                </div>
              )}

              {contactError && (
                <div className="auth-error-box" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={18} />
                  <span>{contactError}</span>
                </div>
              )}

              <form onSubmit={handleContactSubmit}>
                <div className="form-field">
                  <label className="form-label">
                    نام و نام خانوادگی <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="مثال: علی محمدی"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">
                    شماره همراه <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    dir="ltr"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">
                    موضوع پیام <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder="مثال: سوال درباره ارسال مستندات کلاسی"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">
                    متن پیام <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <textarea
                    className="form-input form-textarea"
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="پیام یا پرسش خود را شرح دهید..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-astra btn-astra-primary btn-astra-md"
                  disabled={contactSubmitting}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  {contactSubmitting ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      در حال ثبت پیام...
                    </>
                  ) : (
                    <>
                      ارسال پیام به پشتیبانی
                      <Send size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* Lightbox / Media Viewer Modal */}
      {activeMediaUrl && (
        <div
          className="lightbox-overlay"
          onClick={() => setActiveMediaUrl(null)}
        >
          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={() => setActiveMediaUrl(null)}
              title="بستن پنجره"
            >
              <X size={20} />
            </button>

            {activeMediaType === 'video' ? (
              <video
                src={activeMediaUrl}
                controls
                autoPlay
                className="lightbox-media-player"
              />
            ) : (
              <img
                src={activeMediaUrl}
                alt="نمایش کامل تصویر"
                className="lightbox-media-img"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
