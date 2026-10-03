import React from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  Check,
  Heart,
  BookOpen,
  UserPlus,
  ShieldCheck,
  FileText,
  BarChart3,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="main-wrapper">
      {/* Hero Section */}
      <section id="hero" className="hero-section">
        <div className="hero-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <span className="hero-badge">
              <Sparkles size={14} /> ویژه سال تحصیلی ۱۴۰۴–۱۴۰۵
            </span>
            <span className="eyebrow">
              <span className="line" /> از دل کلاس، برای زندگی
            </span>
          </div>

          <h1>
            مهربانی را<br />
            با هم <em>روایت می‌کنیم.</em>
          </h1>

          <p className="hero-desc">
            سامانه فرهنگی آموزشی پیک مهر؛ همراه مبلغین و معلمین، برای ثبت تجارب ماندگار در کلاس‌های درس و مدارس، ارائه
            گزارش‌های چندرسانه‌ای و ارتقای فعالیت‌های تربیتی دانش‌آموزان.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="btn-astra btn-astra-primary btn-astra-lg"
              onClick={() => onNavigate('register')}
            >
              عضویت در پیک مهر
              <ArrowLeft size={18} />
            </button>

            <button
              type="button"
              className="btn-astra btn-astra-outline btn-astra-lg"
              onClick={() => onNavigate('login')}
            >
              قبلاً ثبت‌نام کرده‌ام
              <ChevronLeft size={18} />
            </button>
          </div>

          <div className="hero-features">
            <span className="hero-feature-item">
              <Check size={16} /> ویژه مبلغین، معلمان و مربیان تربیتی
            </span>
            <span className="hero-feature-item">
              <Check size={16} /> ثبت گزارش‌های متنی، عکس و فیلم
            </span>
            <span className="hero-feature-item">
              <Check size={16} /> شرکت در نظرسنجی‌های دوره‌ای
            </span>
          </div>
        </div>

        {/* Arched Showcase Panel */}
        <div className="hero-panel-wrapper">
          <div className="hero-panel">
            <div className="panel-top">
              <div className="panel-pill">
                <Sparkles size={14} />
                <span>سامانه تعاملی پیک مهر</span>
              </div>
              <div className="panel-status">
                <span className="status-dot" />
                <span className="persian-num">سال ۱۴۰۴–۱۴۰۵</span>
              </div>
            </div>

            <div className="panel-center">
              <div className="panel-tagline-badge">فضای هم‌افزایی معلمان و مبلغین</div>
              <h2 className="panel-hero-heading">
                روایت تجارب تربیتی،<br />
                <em>در خدمت فردای روشن دانش‌آموزان</em>
              </h2>
              <p className="panel-hero-desc">
                ثبت فعالیت‌های پرورشی و آموزشی، بارگذاری مستندات چندرسانه‌ای و سنجش بازخوردها
              </p>
            </div>

            <div className="panel-bottom">
              <div className="panel-stat-item">
                <span className="stat-title">ثبت تجارب</span>
                <span className="stat-desc">متن، عکس و فیلم</span>
              </div>
              <div className="panel-stat-divider" />
              <div className="panel-stat-item">
                <span className="stat-title">بانک مستندات</span>
                <span className="stat-desc">آرشیو کلاسی</span>
              </div>
              <div className="panel-stat-divider" />
              <div className="panel-stat-item">
                <span className="stat-title">نظرسنجی</span>
                <span className="stat-desc">سنجش بازخوردها</span>
              </div>
            </div>
          </div>

          <div className="paper-tag">
            <Heart size={16} /> همراه مطمئن در مسیر تعلیم و تربیت
          </div>
        </div>
      </section>

      {/* Journey Section (3 Steps) */}
      <section id="journey" className="journey-section">
        <div className="section-title">
          <span className="eyebrow">
            <span className="line" /> مسیر همراهی
          </span>
          <h2>سه گام تا همراهی در پیک مهر</h2>
          <p>مسیر ساده و روان برای فعالیت مبلغین و معلمان گرامی در سامانه</p>
        </div>

        <div className="steps-grid steps-grid-3">
          {[
            {
              num: '۰۱',
              title: 'ثبت‌نام و تکمیل پرونده',
              desc: 'ثبت مشخصات فردی، پایه تحصیلی، نام مدرسه و اطلاعات محل خدمت به سادگی و در چند ثانیه.',
              icon: UserPlus,
            },
            {
              num: '۰۲',
              title: 'ثبت تجارب و آثار کلاسی',
              desc: 'ارسال روایت‌های کلاسی به همراه بارگذاری آسان تصاویر و ویدیوهای فعالیت‌های فرهنگی و تربیتی.',
              icon: FileText,
            },
            {
              num: '۰۳',
              title: 'مشارکت در نظرسنجی‌ها',
              desc: 'تکمیل پرسشنامه‌های دوره‌ای و ارائه بازخورد جهت ارتقای مستمر کیفیت برنامه‌های آموزشی.',
              icon: BarChart3,
            },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div className="step-card" key={step.num}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <span className="step-number">{step.num}</span>
                  <div className="step-icon-badge">
                    <Icon size={20} />
                  </div>
                </div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="section-title" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <HelpCircle size={18} style={{ color: 'var(--gold)' }} />
            <span className="eyebrow">
              <span className="line" /> راهنما و پشتیبانی
            </span>
          </div>
          <h2>پیش از همراهی بدانید</h2>
          <p>پاسخ به متداول‌ترین پرسش‌های مبلغین و معلمان پیرامون نحوه کار با سامانه</p>
        </div>

        <div className="faq-list">
          <details className="faq-item" open>
            <summary>آیا استفاده از سامانه برای مبلغین و معلمان هزینه‌ای دارد؟</summary>
            <p>خیر؛ ثبت‌نام، ارسال گزارش‌ها و شرکت در نظرسنجی‌ها برای تمامی مبلغین، معلمان و مربیان مدارس کاملاً رایگان است.</p>
          </details>

          <details className="faq-item">
            <summary>چه فایل‌هایی را می‌توان همراه گزارش ارسال کرد؟</summary>
            <p>شما می‌توانید تصاویر (با فرمت‌های رایج JPG، PNG، WEBP) و ویدیوهای اجرای برنامه‌ها را به همراه متن توضیحات گزارش بارگذاری نمایید.</p>
          </details>

          <details className="faq-item">
            <summary>چگونه می‌توانم به حساب کاربری خود وارد شوم؟</summary>
            <p>کافی است شماره همراه ثبت‌شده خود را در صفحه ورود وارد نمایید تا کد تأیید برای شما پیامک شود و بدون نیاز به رمز عبور وارد پنل کاربری گردید.</p>
          </details>
        </div>
      </section>
    </div>
  );
};
