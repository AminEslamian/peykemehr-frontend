import React from 'react';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="header-inner" style={{ flexWrap: 'wrap', gap: '20px', padding: '28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Logo size={38} variant="icon" />
          <div className="footer-copy">
            <b>سامانه پیک مهر</b> — همراه مبلغین و معلمین، برای فردای روشن‌تر دانش‌آموزان
          </div>
        </div>

        <div className="footer-links">
          <a href="#/login">ورود به حساب</a>
          <a href="#/register">ثبت‌نام و عضویت</a>
          <a href="http://127.0.0.1:8000/admin/" target="_blank" rel="noreferrer">
            پنل مدیریت
          </a>
        </div>
      </div>
    </footer>
  );
};
