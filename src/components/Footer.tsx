import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="header-inner" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div className="footer-copy">
          <b>پویش فرهنگی آموزشی سفیر مهر</b> — همراه معلمان، برای فردای روشن‌تر کودکان
        </div>

        <div className="footer-links">
          <a href="#/login">ورود به حساب</a>
          <a href="#/register">ثبت‌نام معلم</a>
          <a href="http://127.0.0.1:8000/admin/" target="_blank" rel="noreferrer">
            پنل مدیریت
          </a>
        </div>
      </div>
    </footer>
  );
};
