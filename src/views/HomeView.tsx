import React from 'react';
import { ArrowLeft, ChevronLeft, Check, Heart, BookOpen } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="main-wrapper">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-text">
          <span className="eyebrow">
            <span className="line" /> از دل کلاس، برای زندگی
          </span>

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

        {/* Arched Panel */}
        <div className="hero-panel-wrapper">
          <div className="hero-panel">
            <div className="panel-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={18} />
                <span>به نام بانوی مهربانی</span>
              </div>
              <span>۱۴۰۵</span>
            </div>

            <div className="panel-center">
              <span className="panel-line" />
              <p>
                هر کلاس،<br />
                آغاز یک <span>روایت روشن</span>
              </p>
              <span className="panel-line" />
            </div>

            <div className="panel-bottom">
              <span>قصه می‌گوییم</span>
              <span>با هم می‌سازیم</span>
              <span>مهربانی می‌آموزیم</span>
            </div>
          </div>

          <div className="paper-tag">
            <Heart size={18} /> از تجربه‌های کوچک، تا اثرهای بزرگ
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section id="journey" className="journey-section">
        <div className="section-title">
          <span className="eyebrow">
            <span className="line" /> مسیر همراهی شما
          </span>
          <h2>چهار قدم تا یک تجربه مشترک</h2>
          <p>مراحل عضویت و فعالیت مبلغین و معلمان گرامی در سامانه پیک مهر</p>
        </div>

        <div className="steps-grid">
          {[
            ['۰۱', 'ثبت‌نام و عضویت', 'مشخصات فردی، پایه تحصیلی، نام مدرسه و اطلاعات محل خدمت خود را ثبت فرمایید.'],
            ['۰۲', 'ورود پیامکی امن', 'با شماره همراه خود و دریافت کد تأیید یکبار مصرف به سادگی وارد سامانه شوید.'],
            ['۰۳', 'ثبت گزارش و آثار', 'روایت اجرای فعالیت‌ها، عکس‌ها و ویدیوهای کلاس درس را در سامانه بارگذاری فرمایید.'],
            ['۰۴', 'شرکت در نظرسنجی', 'در نظرسنجی‌های دوره‌ای شرکت نموده و بازخوردهای آموزشی خود را به اشتراک بگذارید.'],
          ].map(([n, t, d]) => (
            <div className="step-card" key={n}>
              <span className="step-number">{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="section-title" style={{ textAlign: 'center' }}>
          <span className="eyebrow">
            <span className="line" /> راهنما و پشتیبانی
          </span>
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
