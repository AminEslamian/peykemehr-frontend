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

  const res = await fetch(url, { ...options, headers });

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
    throw new Error(msg || 'خطایی در ارتباط با سرور رخ داد.');
  }

  return data as T;
}

export const api = {
  // Auth
  sendOtp: (phone_number: string) =>
    request<{ detail: string }>('/api/auth/send-otp/', {
      method: 'POST',
      body: JSON.stringify({ phone_number }),
    }),

  verifyOtp: (phone_number: string, code: string) =>
    request<{ access: string; refresh: string; teacher?: any }>('/api/auth/verify-otp/', {
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
