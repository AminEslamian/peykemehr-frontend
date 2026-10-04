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
  localStorage.removeItem('user_role');
};

export const getUserRole = (): 'admin' | 'teacher' | null => {
  const role = localStorage.getItem('user_role');
  if (role === 'admin' || role === 'teacher') return role;
  const teacher = getTeacherInfo();
  if (teacher?.is_superuser || teacher?.is_staff) return 'admin';
  return role as any;
};

export const setUserRole = (role: 'admin' | 'teacher') => {
  localStorage.setItem('user_role', role);
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

  // Profile
  getProfile: () =>
    request<{
      first_name: string;
      last_name: string;
      gender: 'man' | 'woman';
    }>('/api/auth/profile/'),

  // Points & Gamification
  getPoints: () =>
    request<{
      total: number;
      points: Array<{
        id: number;
        score: number;
        reason: string;
        created_at: string;
      }>;
    }>('/api/reports/points/'),

  // Tickets & Support Desk
  getTickets: () =>
    request<
      Array<{
        id: number;
        title: string;
        content: string;
        answer?: string | null;
        is_answered: boolean;
        created_at: string;
        updated_at: string;
      }>
    >('/api/tickets/'),

  createTicket: (data: { title: string; content: string }) =>
    request<{
      id: number;
      title: string;
      content: string;
    }>('/api/tickets/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteTicket: (id: number) =>
    request<void>(`/api/tickets/${id}/`, {
      method: 'DELETE',
    }),

  // Announcements & Blogs
  getBlogs: () =>
    request<
      Array<{
        id: number;
        title: string;
        content: string;
        media?: string | null;
        created_at: string;
        updated_at: string;
      }>
    >('/api/blogs/'),

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

  // Admin APIs (/admin-panel/api/)
  admin: {
    getTeachers: (params?: { search?: string; province?: string; city?: string; position?: string; page?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.append('search', params.search);
      if (params?.province) q.append('province', params.province);
      if (params?.city) q.append('city', params.city);
      if (params?.position) q.append('position', params.position);
      if (params?.page) q.append('page', params.page.toString());
      return request<any>(`/admin-panel/api/teachers/?${q.toString()}`);
    },

    deleteTeacher: (id: number) =>
      request<void>(`/admin-panel/api/teachers/${id}/`, {
        method: 'DELETE',
      }),

    updateTeacher: (id: number, data: any) =>
      request<any>(`/admin-panel/api/teachers/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    getReports: (params?: { teacher?: number; province?: string; city?: string; search?: string; page?: number }) => {
      const q = new URLSearchParams();
      if (params?.teacher) q.append('teacher', params.teacher.toString());
      if (params?.province) q.append('teacher__province', params.province);
      if (params?.city) q.append('teacher__city', params.city);
      if (params?.search) q.append('search', params.search);
      if (params?.page) q.append('page', params.page.toString());
      return request<any>(`/admin-panel/api/reports/?${q.toString()}`);
    },

    deleteReport: (id: number) =>
      request<void>(`/admin-panel/api/reports/${id}/`, {
        method: 'DELETE',
      }),

    getMediaList: (params?: { media_type?: 'image' | 'video'; search?: string; all?: boolean; page?: number }) => {
      const q = new URLSearchParams();
      if (params?.media_type) q.append('media_type', params.media_type);
      if (params?.search) q.append('search', params.search);
      if (params?.all) q.append('all', 'true');
      if (params?.page) q.append('page', params.page.toString());
      return request<any>(`/admin-panel/api/media-list/?${q.toString()}`);
    },

    getTags: () => request<any>('/admin-panel/api/tags/'),

    createTag: (name: string) =>
      request<any>('/admin-panel/api/tags/', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),

    deleteTag: (id: number) =>
      request<void>(`/admin-panel/api/tags/${id}/`, {
        method: 'DELETE',
      }),

    getPoints: (params?: { page?: number }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', params.page.toString());
      return request<any>(`/admin-panel/api/points/?${q.toString()}`);
    },

    awardPoints: (data: { teacher: number; score: number; reason: string }) =>
      request<any>('/admin-panel/api/points/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getTickets: (params?: { search?: string; page?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.append('search', params.search);
      if (params?.page) q.append('page', params.page.toString());
      return request<any>(`/admin-panel/api/tickets/?${q.toString()}`);
    },

    answerTicket: (id: number, answer: string) =>
      request<any>(`/admin-panel/api/tickets/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ answer }),
      }),

    deleteTicket: (id: number) =>
      request<void>(`/admin-panel/api/tickets/${id}/`, {
        method: 'DELETE',
      }),

    getSurveys: () => request<any>('/admin-panel/api/surveys/'),

    createSurvey: (data: { title: string; description: string; is_active: boolean }) =>
      request<any>('/admin-panel/api/surveys/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateSurvey: (id: number, data: Partial<{ title: string; description: string; is_active: boolean }>) =>
      request<any>(`/admin-panel/api/surveys/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    deleteSurvey: (id: number) =>
      request<void>(`/admin-panel/api/surveys/${id}/`, {
        method: 'DELETE',
      }),

    getSubmissions: (surveyId?: number) => {
      const q = surveyId ? `?survey=${surveyId}` : '';
      return request<any>(`/admin-panel/api/submissions/${q}`);
    },

    getAnswers: (submissionId: number) =>
      request<any>(`/admin-panel/api/answers/?submission=${submissionId}`),

    getTeacherDetail: (id: number) => request<any>(`/admin-panel/api/teachers/${id}/`),

    getReportDetail: (id: number) => request<any>(`/admin-panel/api/reports/${id}/`),

    getQuestions: (surveyId: number) =>
      request<any>(`/admin-panel/api/questions/?survey=${surveyId}`),

    createQuestion: (data: {
      survey: number;
      text: string;
      question_type: 'text' | 'single_choice' | 'multiple_choice';
      is_required: boolean;
      order?: number;
    }) =>
      request<any>('/admin-panel/api/questions/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    deleteQuestion: (id: number) =>
      request<void>(`/admin-panel/api/questions/${id}/`, {
        method: 'DELETE',
      }),

    createOption: (data: { question: number; text: string; order?: number }) =>
      request<any>('/admin-panel/api/options/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    deleteOption: (id: number) =>
      request<void>(`/admin-panel/api/options/${id}/`, {
        method: 'DELETE',
      }),

    createBlog: (data: FormData) =>
      request<any>('/api/blogs/', {
        method: 'POST',
        body: data,
      }),

    deleteBlog: (id: number) =>
      request<void>(`/api/blogs/${id}/`, {
        method: 'DELETE',
      }),
  },
};
