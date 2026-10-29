import React, { useState, useEffect } from 'react';
import {
  Bell,
  ArrowRight,
  Calendar,
  Search,
  Eye,
  Loader2,
  X,
  FileText,
  Sparkles,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { api, resolveMediaUrl } from '../api';

interface BlogViewProps {
  onNavigate: (view: string) => void;
}

interface BlogPost {
  id: number;
  title: string;
  content: string;
  media?: string | null;
  created_at: string;
  updated_at: string;
}

export const BlogView: React.FC<BlogViewProps> = ({ onNavigate }) => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Lightbox modal state for full-resolution posters/photos
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .getBlogs()
      .then((data: any) => {
        if (!isMounted) return;
        if (Array.isArray(data)) setBlogs(data);
        else if (data && Array.isArray(data.results)) setBlogs(data.results);
        else setBlogs([]);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'خطا در دریافت لیست اطلاعیه‌ها');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const toPersianDigits = (n: number | string): string => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
  };

  const filteredBlogs = blogs.filter((b) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      b.title.toLowerCase().includes(query) ||
      b.content.toLowerCase().includes(query)
    );
  });

  return (
    <div className="main-wrapper" style={{ maxWidth: '980px', paddingBottom: '80px' }}>
      {/* Top Breadcrumb & Navigation Bar */}
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
            اخبار و اطلاعیه‌های دبیرخانه
          </span>
        </div>

        {blogs.length > 0 && (
          <span
            style={{
              fontSize: '0.82rem',
              color: 'var(--muted-foreground)',
              background: '#f8faf6',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid var(--border-light)',
            }}
          >
            مجموع اطلاعیه‌ها: <strong style={{ color: 'var(--primary)' }}>{toPersianDigits(blogs.length)}</strong> مورد
          </span>
        )}
      </div>

      {/* Page Header */}
      <div className="blog-page-header">
        <div className="blog-header-badge">
          <Bell size={16} />
          <span>دبیرخانه مرکزی پویش سفیر مهر</span>
        </div>
        <h1 className="blog-page-title">
          اطلاعیه‌ها، بخشنامه‌ها و اخبار پویش
        </h1>
        <p className="blog-page-subtitle">
          آخرین اطلاعیه‌‌های آموزشی، زمان‌بندی رویدادها، معرفی معلمان فعال و مستندات دبیرخانه پویش.
        </p>

        {/* Search Bar */}
        {blogs.length > 1 && (
          <div className="blog-search-bar">
            <Search size={18} className="blog-search-icon" />
            <input
              type="text"
              placeholder="جستجو در متن یا عنوان اطلاعیه‌ها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="blog-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="blog-search-clear"
                title="پاک کردن جستجو"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <Loader2
            size={42}
            className="spinner"
            style={{ color: 'var(--primary)', marginBottom: '14px' }}
          />
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.94rem' }}>
            در حال دریافت آخرین اطلاعیه‌های دبیرخانه...
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="auth-error-box" style={{ marginBottom: '24px' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredBlogs.length === 0 && (
        <div className="blog-empty-state">
          <Bell
            size={52}
            style={{ color: 'var(--muted-foreground)', opacity: 0.4, marginBottom: '16px' }}
          />
          <h4>
            {searchQuery ? 'اطلاعیه‌ای منطبق با جستجوی شما یافت نشد' : 'در حال حاضر اطلاعیه جدیدی منتشر نشده است'}
          </h4>
          <p>
            {searchQuery
              ? 'لطفاً عبارت دیگری را جستجو فرمایید یا متن جستجو را پاک کنید.'
              : 'به محض صدور بخشنامه یا پیام جدید از سوی دبیرخانه، در این بخش قابل مشاهده خواهد بود.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              className="btn-astra btn-astra-outline btn-astra-sm"
              onClick={() => setSearchQuery('')}
              style={{ marginTop: '12px' }}
            >
              مشاهده تمام اطلاعیه‌ها
            </button>
          )}
        </div>
      )}

      {/* Announcements Stream / Grid */}
      {!loading && !error && filteredBlogs.length > 0 && (
        <div className="blog-posts-stream">
          {filteredBlogs.map((post) => {
            const mediaUrl = post.media ? resolveMediaUrl(post.media) : null;
            const isVideo =
              mediaUrl &&
              (mediaUrl.endsWith('.mp4') ||
                mediaUrl.endsWith('.webm') ||
                mediaUrl.endsWith('.mov') ||
                mediaUrl.endsWith('.ogg'));

            return (
              <article key={post.id} className="blog-card">
                {/* Card Header */}
                <div className="blog-card-header">
                  <div className="blog-card-meta">
                    <span className="blog-date-pill">
                      <Calendar size={14} />
                      {formatDate(post.created_at)}
                    </span>
                    <span className="blog-source-badge">
                      دبیرخانه پویش
                    </span>
                  </div>
                  <h2 className="blog-card-title">{post.title}</h2>
                </div>

                {/* Card Media (Photos / Posters / Videos) */}
                {mediaUrl && (
                  <div className="blog-card-media-wrapper">
                    {isVideo ? (
                      <video
                        controls
                        src={mediaUrl}
                        className="blog-card-video"
                        preload="metadata"
                      />
                    ) : (
                      <div
                        className="blog-card-image-box"
                        onClick={() => setActiveMediaUrl(mediaUrl)}
                        title="مشاهده تصویر در اندازه بزرگ"
                        role="button"
                        tabIndex={0}
                      >
                        <img
                          src={mediaUrl}
                          alt={post.title}
                          className="blog-card-img"
                          loading="lazy"
                        />
                        <div className="blog-image-overlay">
                          <Eye size={20} />
                          <span>مشاهده تصویر در اندازه کامل</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Card Body */}
                <div className="blog-card-body">
                  <p className="blog-card-text">{post.content}</p>
                </div>

                {/* Card Footer */}
                <div className="blog-card-footer">
                  <span className="blog-footer-brand">
                    سامانه معلمین و مربیان پویش سفیر مهر
                  </span>
                  {mediaUrl && !isVideo && (
                    <button
                      type="button"
                      className="blog-view-photo-btn"
                      onClick={() => setActiveMediaUrl(mediaUrl)}
                    >
                      <Eye size={15} />
                      مشاهده پوستر با کیفیت اصلی
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Lightbox / Full-Screen Poster Modal */}
      {activeMediaUrl && (
        <div
          className="lightbox-overlay"
          onClick={() => setActiveMediaUrl(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '92vw', maxHeight: '92vh' }}
          >
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={() => setActiveMediaUrl(null)}
              title="بستن تصویر"
            >
              <X size={20} />
            </button>
            <img
              src={activeMediaUrl}
              alt="تصویر اطلاعیه پویش"
              className="lightbox-media-img"
              style={{ maxHeight: '85vh', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
