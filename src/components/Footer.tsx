import React from 'react';

interface FooterProps {
  onNavigate?: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNav = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
    } else {
      window.location.hash = `#/${view}`;
    }
  };

  return (
    <footer className="site-footer">
      <div className="header-inner footer-inner">
        <div className="footer-brand">
          <div className="footer-copy">
            <span className="footer-brand-title">سامانه پیک مهر</span>
            <span className="footer-brand-sub">همراه معلمین و مربیان</span>
          </div>
        </div>

        <nav className="footer-links" aria-label="پیوندهای پاورقی">
          <button
            type="button"
            className="footer-nav-btn"
            onClick={() => handleNav('login')}
          >
            ورود به حساب
          </button>
          <span className="footer-dot-divider" aria-hidden="true">•</span>
          <button
            type="button"
            className="footer-nav-btn"
            onClick={() => handleNav('register')}
          >
            ثبت‌نام و عضویت
          </button>
        </nav>
      </div>
    </footer>
  );
};
