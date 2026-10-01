import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
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
  ClipboardList,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { api, getTeacherInfo, clearAuth } from '../api';

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

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const teacher = getTeacherInfo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Data states
  const [tags, setTags] = useState<TagItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

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

  // Load initial data (tags & teacher reports)
  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [fetchedTags, fetchedReports] = await Promise.all([
        api.getTags().catch(() => []),
        api.getReports().catch(() => []),
      ]);
      setTags(fetchedTags);
      setReports(fetchedReports);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  // Submit Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!reportText.trim()) {
      setSubmitError('لطفاً شرح و روایت فعالیت را وارد فرمایید.');
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

      setSubmitSuccess('گزارش فعالیت شما با موفقیت ثبت شد.');
      setReportText('');
      setSelectedTagIds([]);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh reports list
      const updatedReports = await api.getReports();
      setReports(updatedReports);
    } catch (err: any) {
      setSubmitError(err.message || 'خطا در ثبت گزارش. لطفاً مجدداً تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Report
  const handleDeleteReport = async (id: number) => {
    if (!window.confirm('آیا از حذف این گزارش اطمینان دارید؟')) return;

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

  return (
    <div className="main-wrapper">
      {/* Welcome Banner */}
      <div className="welcome-strip" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="welcome-avatar">
            {teacher?.first_name ? teacher.first_name[0] : 'م'}
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800 }}>
              {teacher?.first_name && teacher?.last_name
                ? `${teacher.first_name} ${teacher.last_name} گرامی`
                : 'همکار ارجمند، به سامانه پیک مهر خوش آمدید'}
            </h2>
            <p>
              {teacher?.school ? `محل فعالیت: ${teacher.school} · ` : ''}
              سامانه ثبت فعالیت‌ها و تجارب آموزشی و پرورشی
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-astra btn-astra-outline btn-astra-sm"
            onClick={() => onNavigate('survey')}
          >
            <ClipboardList size={16} />
            نظرسنجی‌های فعال
          </button>
          <button
            type="button"
            className="btn-astra btn-astra-primary btn-astra-sm"
            onClick={() => {
              textInputRef.current?.focus();
              textInputRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Send size={16} />
            ثبت گزارش جدید
          </button>
        </div>
      </div>

      {/* Action Shortcut Cards */}
      <div className="action-cards-grid">
        <div
          className="action-card"
          onClick={() => {
            textInputRef.current?.focus();
            textInputRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <div>
            <div className="action-icon-box">
              <FileText size={28} />
            </div>
            <h2>ثبت فعالیت کلاسی</h2>
            <p>
              تجارب و مستندات ابتکارات آموزشی، عکس‌ها و ویدیوهای مرتبط با فضای کلاس را با
              سایر همکاران به اشتراک بگذارید.
            </p>
          </div>
          <div className="action-card-footer">
            <span>تکمیل و ارسال گزارش</span>
            <span style={{ fontSize: '18px' }}>←</span>
          </div>
        </div>

        <div className="action-card" onClick={() => onNavigate('survey')}>
          <div>
            <div className="action-icon-box" style={{ background: '#f5efe1', color: '#8a6e38' }}>
              <ClipboardList size={28} />
            </div>
            <h2>پرسشنامه‌ها و نظرسنجی‌ها</h2>
            <p>
              در نظرسنجی‌های دوره‌ای شرکت فرمایید و نظرات کارشناسی خود را جهت بهبود
              رویکردهای تربیتی و آموزشی ارائه دهید.
            </p>
          </div>
          <div className="action-card-footer" style={{ color: '#8a6e38' }}>
            <span>ورود به بخش نظرسنجی</span>
            <span style={{ fontSize: '18px' }}>←</span>
          </div>
        </div>

        <div className="action-card" style={{ cursor: 'default' }}>
          <div>
            <div className="action-icon-box" style={{ background: '#eaf4ee', color: '#236352' }}>
              <Sparkles size={28} />
            </div>
            <h2>نکات ارسال موفق</h2>
            <p>
              عکس‌ها و ویدیوها با حجم استاندارد ارسال شوند. انتخاب برچسب‌های مرتبط به
              دسته‌بندی و دیده‌شدن بهتر روایت شما کمک می‌کند.
            </p>
          </div>
          <div className="action-card-footer" style={{ color: '#236352' }}>
            <span>پشتیبانی مداوم</span>
            <CheckCircle size={16} />
          </div>
        </div>
      </div>

      {/* Studio Grid: Left Form, Right History */}
      <div className="studio-grid">
        {/* Form Column */}
        <div>
          <div className="auth-box" style={{ position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Send size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                ثبت گزارش فعالیت جدید
              </h3>
            </div>

            <p style={{ margin: '0 0 20px', fontSize: '0.88rem', color: 'var(--muted-foreground)' }}>
              روایت آموزشی، دستاوردها یا اقدامات ابتکاری خود در کلاس را مرقوم فرمایید.
            </p>

            {submitSuccess && (
              <div
                className="banner banner-success"
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '16px',
                  fontSize: '0.9rem',
                }}
              >
                <CheckCircle size={18} />
                <span>{submitSuccess}</span>
              </div>
            )}

            {submitError && (
              <div
                className="banner banner-error"
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '16px',
                  fontSize: '0.9rem',
                }}
              >
                <AlertCircle size={18} />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReport}>
              {/* Report Text */}
              <div className="form-group">
                <label className="form-label" htmlFor="reportText">
                  شرح و روایت فعالیت <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea
                  id="reportText"
                  ref={textInputRef}
                  className="form-control"
                  rows={5}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="توضیح دهید چه فعالیتی انجام شده، بازخورد دانش‌آموزان چه بوده و چه دستاوردی داشته است..."
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>

              {/* Tags Selector */}
              {tags.length > 0 && (
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TagIcon size={15} />
                    برچسب‌های موضوعی (اختیاری)
                  </label>
                  <div className="tag-chips">
                    {tags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <span
                          key={tag.id}
                          className={`tag-chip ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleTag(tag.id)}
                        >
                          {isSelected && '✓ '}
                          {tag.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Media Dropzone */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={15} />
                  ضمیمه عکس یا ویدیو
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
                    <Upload size={22} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--foreground)' }}>
                    انتخاب فایل‌ها یا کشیدن و رها کردن اینجا
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                    فرمت‌های مجاز: عکس (JPG, PNG) و ویدیو (MP4, WEBM)
                  </div>
                </div>

                {/* Selected Files Preview List */}
                {selectedFiles.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px' }}>
                      فایل‌های انتخاب‌شده ({selectedFiles.length} فایل):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: '#f8faf6',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.84rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            {file.type.startsWith('video/') ? (
                              <Film size={16} color="var(--primary)" />
                            ) : (
                              <ImageIcon size={16} color="var(--primary)" />
                            )}
                            <span
                              style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '200px',
                                direction: 'ltr',
                                textAlign: 'left',
                              }}
                            >
                              {file.name}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                              ({formatFileSize(file.size)})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              padding: '4px',
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

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-astra btn-astra-primary btn-astra-block btn-astra-lg"
                disabled={submitting}
                style={{ marginTop: '24px' }}
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
            </form>
          </div>
        </div>

        {/* History Column */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800 }}>
                فعالیت‌های ثبت‌شده شما
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                {reports.length} گزارش در سامانه ثبت شده است
              </p>
            </div>

            <button
              type="button"
              className="btn-astra btn-astra-outline btn-astra-sm"
              onClick={fetchData}
              title="بروزرسانی لیست"
            >
              <RefreshCw size={15} />
              بروزرسانی
            </button>
          </div>

          {loadingData ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#ffffff',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
              }}
            >
              <Loader2
                size={36}
                className="spinner"
                style={{ color: 'var(--primary)', marginBottom: '12px' }}
              />
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                در حال دریافت گزارش‌های ثبت‌شده...
              </p>
            </div>
          ) : reports.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#ffffff',
                borderRadius: 'var(--radius)',
                border: '1.5px dashed var(--border)',
              }}
            >
              <FileText
                size={48}
                style={{ color: 'var(--muted-foreground)', marginBottom: '16px', opacity: 0.5 }}
              />
              <h4 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>
                هنوز گزارشی ثبت نکرده‌اید
              </h4>
              <p
                style={{
                  color: 'var(--muted-foreground)',
                  fontSize: '0.88rem',
                  maxWidth: '380px',
                  margin: '0 auto',
                  lineHeight: 1.8,
                }}
              >
                اولین روایت فعالیت آموزشی یا تربیتی خود را از طریق فرم سمت راست ارسال نمایید تا در
                این بخش ثبت و نمایش داده شود.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {reports.map((report) => (
                <div key={report.id} className="history-item">
                  {/* Top Bar: Date, Tags, and Delete Button */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginBottom: '14px',
                      borderBottom: '1px solid var(--border-light)',
                      paddingBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.82rem',
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        <Clock size={14} />
                        {formatDate(report.created_at)}
                      </span>

                      {report.tags && report.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {report.tags.map((tag) => (
                            <span
                              key={tag.id}
                              style={{
                                background: 'var(--gold-tag)',
                                color: '#5e4e24',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                              }}
                            >
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
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.82rem',
                      }}
                      title="حذف گزارش"
                    >
                      {deletingId === report.id ? (
                        <Loader2 size={15} className="spinner" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>

                  {/* Text Content */}
                  <div
                    style={{
                      fontSize: '0.94rem',
                      lineHeight: 1.9,
                      whiteSpace: 'pre-wrap',
                      color: 'var(--foreground)',
                      marginBottom: '16px',
                    }}
                  >
                    {report.text}
                  </div>

                  {/* Media Gallery Grid */}
                  {(report.images?.length > 0 || report.videos?.length > 0) && (
                    <div className="media-preview-grid">
                      {report.images?.map((img) => (
                        <div
                          key={`img-${img.id}`}
                          className="media-preview-card"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setActiveMediaUrl(img.image);
                            setActiveMediaType('image');
                          }}
                        >
                          <img src={img.image} alt="تصویر پیوست" loading="lazy" />
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              insetInline: 0,
                              background: 'rgba(0,0,0,0.5)',
                              color: '#fff',
                              fontSize: '0.7rem',
                              textAlign: 'center',
                              padding: '2px 4px',
                            }}
                          >
                            تصویر
                          </div>
                        </div>
                      ))}

                      {report.videos?.map((vid) => (
                        <div
                          key={`vid-${vid.id}`}
                          className="media-preview-card"
                          style={{ cursor: 'pointer', position: 'relative' }}
                          onClick={() => {
                            setActiveMediaUrl(vid.video);
                            setActiveMediaType('video');
                          }}
                        >
                          <video src={vid.video} preload="metadata" />
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'grid',
                              placeItems: 'center',
                              background: 'rgba(0,0,0,0.3)',
                              color: '#fff',
                            }}
                          >
                            <Film size={24} />
                          </div>
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              insetInline: 0,
                              background: 'rgba(0,0,0,0.6)',
                              color: '#fff',
                              fontSize: '0.7rem',
                              textAlign: 'center',
                              padding: '2px 4px',
                            }}
                          >
                            ویدیو
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Media Viewer Modal */}
      {activeMediaUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setActiveMediaUrl(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '85vh',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#000',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveMediaUrl(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                zIndex: 10,
              }}
            >
              <X size={20} />
            </button>

            {activeMediaType === 'video' ? (
              <video
                src={activeMediaUrl}
                controls
                autoPlay
                style={{ maxWidth: '100%', maxHeight: '80vh', display: 'block' }}
              />
            ) : (
              <img
                src={activeMediaUrl}
                alt="نمایش کامل تصویر"
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
