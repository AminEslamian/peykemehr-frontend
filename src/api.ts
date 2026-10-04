/**
 * API Client for Safire Mehr Django REST Backend
 */

export const getAccessToken = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');

export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

export const clearAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('teacher_info');
};

export const getTeacherInfo = () => {
  try {
    const s = localStorage.getItem('teacher_info');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
};

export const setTeacherInfo = (info: any) => {
  localStorage.setItem('teacher_info', JSON.stringify(info));
};

function translateApiError(detail: any, status?: number): string {
  if (status === 429) {
    return 'لطفاً ۱ دقیقه صبر کنید و سپس مجدداً درخواست ارسال کد نمایید.';
  }

  const raw = String(detail || '').trim();

  // Rate limit
  if (/wait before requesting/i.test(raw) || /too many requests/i.test(raw)) {
    return 'لطفاً ۱ دقیقه صبر کنید و سپس مجدداً درخواست ارسال کد نمایید.';
  }

  // Phone doesn't exist
  if (/phone number doesn't exist/i.test(raw) || (/not found/i.test(raw) && status === 404)) {
    return 'این شماره همراه در سامانه ثبت نشده است. لطفاً ابتدا ثبت‌نام فرمایید.';
  }

  // Already registered
  if (/already registered/i.test(raw)) {
    if (/national_id/i.test(raw) || /national id/i.test(raw)) {
      return 'این کد ملی قبلاً در سامانه ثبت شده است.';
    }
    return 'این شماره همراه قبلاً در سامانه ثبت شده است. لطفاً وارد حساب خود شوید.';
  }

  // OTP Verification errors
  if (/invalid otp/i.test(raw)) {
    return 'کد تأیید واردشده نادرست است. لطفاً مجدداً بررسی فرمایید.';
  }
  if (/otp has expired/i.test(raw)) {
    return 'کد تأیید منقضی شده است. لطفاً درخواست ارسال مجدد کد نمایید.';
  }
  if (/no active otp/i.test(raw)) {
    return 'کد تأیید فعالی یافت نشد. لطفاً ابتدا درخواست ارسال کد نمایید.';
  }

  // Validation errors
  if (/this field is required/i.test(raw)) {
    return 'تکمیل تمامی فیلدهای ستاره‌دار الزامی است.';
  }
  if (/enter a valid/i.test(raw) || /valid phone/i.test(raw)) {
    return 'شماره همراه واردشده نامعتبر است (باید ۱۱ رقم و با ۰۹ آغاز شود).';
  }

  // Token errors
  if (/token/i.test(raw) && /not valid/i.test(raw)) {
    return 'نشست کاربری شما منقضی شده است. لطفاً مجدداً وارد شوید.';
  }

  if (raw) {
    return raw;
  }

  return 'خطایی در ارتباط با سرور رخ داد. لطفاً مجدداً تلاش فرمایید.';
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set content-type to application/json if body is not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new Error('خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی نمایید.');
  }

  if (res.status === 401) {
    clearAuth();
    window.location.hash = '#/login';
    throw new Error('نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.');
  }

  if (res.status === 204) {
    return {} as T;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    let msg = data.detail;
    if (!msg && typeof data === 'object') {
      msg = Object.values(data).flat().join(' - ');
    }
    const translatedMsg = translateApiError(msg, res.status);
    const error: any = new Error(translatedMsg);
    error.status = res.status;
    throw error;
  }

  return data as T;
}

export const api = {
  // Auth
  sendOtp: (phone_number: string) =>
    request<{ detail: string }>('/api/auth/login/send-otp/', {
      method: 'POST',
      body: JSON.stringify({ phone_number }),
    }),

  verifyOtp: (phone_number: string, code: string) =>
    request<{ access: string; refresh: string; teacher?: any; redirect_url?: string }>('/api/auth/login/verify-otp/', {
      method: 'POST',
      body: JSON.stringify({ phone_number, code }),
    }),

  registerSendOtp: (data: any) =>
    request<{ detail: string }>('/api/auth/register/send-otp/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  registerVerifyOtp: (data: any) =>
    request<{ access: string; refresh: string; teacher?: any }>('/api/auth/register/verify-otp/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Reports
  getTags: () => request<Array<{ id: number; name: string }>>('/api/reports/tags/'),

  getReports: () =>
    request<
      Array<{
        id: number;
        text: string;
        tags: Array<{ id: number; name: string }>;
        images: Array<{ id: number; image: string; created_at: string }>;
        videos: Array<{ id: number; video: string; created_at: string }>;
        created_at: string;
      }>
    >('/api/reports/'),

  createReport: (formData: FormData) =>
    request<{ id: number }>('/api/reports/', {
      method: 'POST',
      body: formData,
    }),

  deleteReport: (id: number) =>
    request<void>(`/api/reports/${id}/`, {
      method: 'DELETE',
    }),

  // Surveys
  getSurveys: () =>
    request<Array<{ id: number; title: string; description: string; created_at: string }>>(
      '/api/surveys/'
    ),

  getSurveyDetail: (id: number) =>
    request<{
      id: number;
      title: string;
      description: string;
      questions: Array<{
        id: number;
        text: string;
        question_type: 'text' | 'single_choice' | 'multiple_choice';
        is_required: boolean;
        options: Array<{ id: number; text: string }>;
      }>;
      has_submitted: boolean;
    }>(`/api/surveys/${id}/`),

  submitSurvey: (
    surveyId: number,
    answers: Array<{ question_id: number; text_answer?: string; selected_options?: number[] }>
  ) =>
    request<{ detail: string }>(`/api/surveys/${surveyId}/submit/`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),
};
