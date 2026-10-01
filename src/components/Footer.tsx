import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="header-inner" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div className="footer-copy">
          <b>سامانه پیک مهر</b> — همراه مبلغین و معلمین، برای فردای روشن‌تر دانش‌آموزان
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
