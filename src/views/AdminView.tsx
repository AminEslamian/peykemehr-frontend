import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  ClipboardList,
  Bell,
  ShieldAlert,
  Search,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  Loader2,
  X,
  Send,
  ArrowLeft,
  Award,
  Image as ImageIcon,
  Film,
  Upload,
  Tag as TagIcon,
  ToggleLeft,
  ToggleRight,
  Download,
  ChevronRight,
  ChevronLeft,
  Filter,
  Calendar,
  MapPin,
  School,
  Phone,
  User,
  Star,
  Play,
  Check,
} from 'lucide-react';
import { api, getTeacherInfo } from '../api';

interface AdminViewProps {
  onNavigate: (view: string) => void;
}

type AdminTab = 'overview' | 'teachers' | 'reports' | 'surveys' | 'tickets' | 'blogs' | 'tags' | 'points';

// Convert numbers to Persian digits
const toPersianDigits = (n: number | string | null | undefined): string => {
  if (n === null || n === undefined) return '۰';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
};

const formatDate = (isoString: string) => {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
};

// UTF-8 BOM CSV / Excel Export Helper
const exportToCsv = (filename: string, rows: Array<Record<string, any>>, headers: Record<string, string>) => {
  if (!rows || rows.length === 0) {
    alert('اطلاعاتی جهت خروجی اکسل یافت نشد.');
    return;
  }

  const keys = Object.keys(headers);
  const headerRow = keys.map((k) => `"${headers[k].replace(/"/g, '""')}"`).join(',');
  const dataRows = rows.map((row) =>
    keys
      .map((k) => {
        const val = row[k] !== undefined && row[k] !== null ? String(row[k]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const AdminView: React.FC<AdminViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Overall Statistics
  const [stats, setStats] = useState({
    teachersCount: 0,
    reportsCount: 0,
    imagesCount: 0,
    videosCount: 0,
    ticketsCount: 0,
    surveysCount: 0,
    tagsCount: 0,
  });

  // 1. Teachers State
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherProvince, setTeacherProvince] = useState('');
  const [teacherCity, setTeacherCity] = useState('');
  const [viewingTeacher, setViewingTeacher] = useState<any | null>(null);
  const [viewingTeacherReports, setViewingTeacherReports] = useState<any[]>([]);
  const [viewingTeacherPoints, setViewingTeacherPoints] = useState<any[]>([]);
  const [loadingTeacherDetail, setLoadingTeacherDetail] = useState(false);

  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [teacherEditForm, setTeacherEditForm] = useState<any>({});
  const [teacherUpdating, setTeacherUpdating] = useState(false);

  // Points Modal State
  const [selectedTeacherForPoint, setSelectedTeacherForPoint] = useState<any | null>(null);
  const [pointForm, setPointForm] = useState({ score: 10, reason: '' });
  const [pointSubmitting, setPointSubmitting] = useState(false);

  // 2. Reports State
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportSearch, setReportSearch] = useState('');
  const [reportProvince, setReportProvince] = useState('');
  const [reportCity, setReportCity] = useState('');
  const [reportMediaType, setReportMediaType] = useState<'all' | 'image' | 'video'>('all');
  const [reportTeacherFilter, setReportTeacherFilter] = useState<string>('');
  const [viewingReport, setViewingReport] = useState<any | null>(null);
  const [reportPointScore, setReportPointScore] = useState<number>(10);
  const [reportPointReason, setReportPointReason] = useState<string>('ثبت گزارش فعالیت آموزشی');
  const [reportPointSubmitting, setReportPointSubmitting] = useState(false);

  // 3. Surveys State
  const [surveys, setSurveys] = useState<any[]>([]);
  const [surveysLoading, setSurveysLoading] = useState(false);
  const [showSurveyCreateModal, setShowSurveyCreateModal] = useState(false);
  const [surveyCreateForm, setSurveyCreateForm] = useState({ title: '', description: '', is_active: true });
  const [surveySubmitting, setSurveySubmitting] = useState(false);

  // Survey Detail (Managing Questions & Submissions)
  const [detailSurvey, setDetailSurvey] = useState<any | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [surveySubmissions, setSurveySubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [viewingAnswers, setViewingAnswers] = useState<{ submission: any; answers: any[] } | null>(null);

  // Add Question Modal
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newQuestionForm, setNewQuestionForm] = useState<{
    text: string;
    question_type: 'text' | 'single_choice' | 'multiple_choice';
    is_required: boolean;
    order: number;
    options: string[];
  }>({
    text: '',
    question_type: 'single_choice',
    is_required: true,
    order: 1,
    options: ['گزینه اول', 'گزینه دوم'],
  });
  const [questionSubmitting, setQuestionSubmitting] = useState(false);

  // 4. Tickets State
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [answeringTicketId, setAnsweringTicketId] = useState<number | null>(null);
  const [ticketAnswerText, setTicketAnswerText] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'pending' | 'answered'>('all');

  // 5. Announcements / Blogs State
  const [blogs, setBlogs] = useState<any[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [blogForm, setBlogForm] = useState({ title: '', content: '' });
  const [blogFile, setBlogFile] = useState<File | null>(null);
  const [blogFilePreview, setBlogFilePreview] = useState<string | null>(null);
  const [blogFileType, setBlogFileType] = useState<'image' | 'video' | null>(null);
  const [blogSubmitting, setBlogSubmitting] = useState(false);
  const blogFileInputRef = useRef<HTMLInputElement>(null);

  // 6. Tags State
  const [tags, setTags] = useState<any[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [tagSubmitting, setTagSubmitting] = useState(false);

  // 7. Points Log State
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);

  // Lightbox Media Viewer
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);
  const [activeMediaType, setActiveMediaType] = useState<'image' | 'video' | null>(null);

  // On Mount: Load Initial Data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setAccessDenied(false);

    try {
      // 1. Fetch Teachers (and filter out admin itself so admin is never listed as teacher)
      const teachersRes = await api.admin.getTeachers({ page: 1 });
      const rawTeachersList = Array.isArray(teachersRes) ? teachersRes : (teachersRes?.results || []);
      const teachersList = rawTeachersList.filter((t: any) => !t.is_superuser && t.phone_number !== '09127519135');
      const teachersTotal = teachersList.length;
      setTeachers(teachersList);

      // 2. Concurrently fetch all other modules
      const [reportsRes, ticketsRes, surveysRes, tagsRes, blogsRes] = await Promise.all([
        api.admin.getReports().catch(() => ({ results: [], count: 0 })),
        api.admin.getTickets().catch(() => ({ results: [], count: 0 })),
        api.admin.getSurveys().catch(() => []),
        api.admin.getTags().catch(() => []),
        api.getBlogs().catch(() => []),
      ]);

      const reportsList = Array.isArray(reportsRes) ? reportsRes : (reportsRes?.results || []);
      const reportsTotal = Array.isArray(reportsRes) ? reportsRes.length : (reportsRes?.count || 0);

      let totalImages = 0;
      let totalVideos = 0;
      reportsList.forEach((r: any) => {
        totalImages += r.images_count || (r.images ? r.images.length : 0);
        totalVideos += r.videos_count || (r.videos ? r.videos.length : 0);
      });

      const ticketsList = Array.isArray(ticketsRes) ? ticketsRes : (ticketsRes?.results || []);
      const ticketsTotal = Array.isArray(ticketsRes) ? ticketsRes.length : (ticketsRes?.count || 0);
      const surveysList = Array.isArray(surveysRes) ? surveysRes : (surveysRes?.results || []);
      const tagsList = Array.isArray(tagsRes) ? tagsRes : (tagsRes?.results || []);

      setReports(reportsList);
      setTickets(ticketsList);
      setSurveys(surveysList);
      setTags(tagsList);
      setBlogs(blogsRes || []);

      setStats({
        teachersCount: teachersTotal,
        reportsCount: reportsTotal,
        imagesCount: totalImages,
        videosCount: totalVideos,
        ticketsCount: ticketsTotal,
        surveysCount: surveysList.length,
        tagsCount: tagsList.length,
      });
    } catch (err: any) {
      if (err.status === 403 || /permission/i.test(err.message)) {
        setAccessDenied(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    if (activeTab === 'teachers') await fetchTeachers();
    else if (activeTab === 'reports') await fetchReports();
    else if (activeTab === 'surveys') await fetchSurveys();
    else if (activeTab === 'tickets') await fetchTickets();
    else if (activeTab === 'blogs') await fetchBlogs();
    else if (activeTab === 'tags') await fetchTags();
    else if (activeTab === 'points') await fetchPoints();
    setRefreshing(false);
  };

  // Tab Switching Fetcher
  useEffect(() => {
    if (accessDenied) return;
    if (activeTab === 'teachers') fetchTeachers();
    else if (activeTab === 'reports') fetchReports();
    else if (activeTab === 'surveys') fetchSurveys();
    else if (activeTab === 'tickets') fetchTickets();
    else if (activeTab === 'blogs') fetchBlogs();
    else if (activeTab === 'tags') fetchTags();
    else if (activeTab === 'points') fetchPoints();
  }, [activeTab]);

  // Data Fetchers
  const fetchTeachers = async () => {
    setTeachersLoading(true);
    try {
      const res = await api.admin.getTeachers({
        search: teacherSearch,
        province: teacherProvince,
        city: teacherCity,
      });
      const list = Array.isArray(res) ? res : (res?.results || []);
      setTeachers(list.filter((t: any) => !t.is_superuser && t.phone_number !== '09127519135'));
    } catch {
      // Handled
    } finally {
      setTeachersLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await api.admin.getReports({
        search: reportSearch,
        province: reportProvince,
        city: reportCity,
        teacher: reportTeacherFilter ? Number(reportTeacherFilter) : undefined,
      });
      let list = Array.isArray(res) ? res : (res?.results || []);
      if (reportMediaType === 'image') {
        list = list.filter((r: any) => (r.images_count || r.images?.length) > 0);
      } else if (reportMediaType === 'video') {
        list = list.filter((r: any) => (r.videos_count || r.videos?.length) > 0);
      }
      setReports(list);
    } catch {
      // Handled
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchSurveys = async () => {
    setSurveysLoading(true);
    try {
      const res = await api.admin.getSurveys();
      setSurveys(Array.isArray(res) ? res : (res?.results || []));
    } catch {
      // Handled
    } finally {
      setSurveysLoading(false);
    }
  };

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await api.admin.getTickets();
      setTickets(Array.isArray(res) ? res : (res?.results || []));
    } catch {
      // Handled
    } finally {
      setTicketsLoading(false);
    }
  };

  const fetchBlogs = async () => {
    setBlogsLoading(true);
    try {
      const res = await api.getBlogs();
      setBlogs(res || []);
    } catch {
      // Handled
    } finally {
      setBlogsLoading(false);
    }
  };

  const fetchTags = async () => {
    setTagsLoading(true);
    try {
      const res = await api.admin.getTags();
      setTags(Array.isArray(res) ? res : (res?.results || []));
    } catch {
      // Handled
    } finally {
      setTagsLoading(false);
    }
  };

  const fetchPoints = async () => {
    setPointsLoading(true);
    try {
      const res = await api.admin.getPoints();
      setPointsHistory(Array.isArray(res) ? res : (res?.results || []));
    } catch {
      // Handled
    } finally {
      setPointsLoading(false);
    }
  };

  // =========================================================================
  // ACTIONS: TEACHER MANAGEMENT & DETAIL
  // =========================================================================
  const handleOpenTeacherDetail = async (teacher: any) => {
    setViewingTeacher(teacher);
    setLoadingTeacherDetail(true);
    setViewingTeacherReports([]);
    setViewingTeacherPoints([]);

    try {
      const [reportsRes, pointsRes] = await Promise.all([
        api.admin.getReports({ teacher: teacher.id }),
        api.admin.getPoints(),
      ]);
      const repList = Array.isArray(reportsRes) ? reportsRes : (reportsRes?.results || []);
      setViewingTeacherReports(repList);

      const allPoints = Array.isArray(pointsRes) ? pointsRes : (pointsRes?.results || []);
      setViewingTeacherPoints(allPoints.filter((p: any) => p.teacher === teacher.id));
    } catch {
      // Handled
    } finally {
      setLoadingTeacherDetail(false);
    }
  };

  const handleDeleteTeacher = async (id: number, name: string) => {
    if (!window.confirm(`آیا از حذف کامل حساب کاربری ${name} اطمینان دارید؟ تمامی گزارش‌ها و سوابق وی حذف خواهد شد.`)) return;

    try {
      await api.admin.deleteTeacher(id);
      setTeachers((prev) => prev.filter((t) => t.id !== id));
      if (viewingTeacher?.id === id) setViewingTeacher(null);
      alert('کاربر با موفقیت حذف گردید.');
    } catch (err: any) {
      alert(err.message || 'خطا در حذف کاربر');
    }
  };

  const handleOpenEditTeacher = (t: any) => {
    setEditingTeacher(t);
    setTeacherEditForm({
      first_name: t.first_name || '',
      last_name: t.last_name || '',
      phone_number: t.phone_number || '',
      national_id: t.national_id || '',
      school: t.school || '',
      province: t.province || '',
      city: t.city || '',
      village: t.village || '',
      position: t.position || 'teacher',
    });
  };

  const handleSaveTeacherEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    setTeacherUpdating(true);
    try {
      await api.admin.updateTeacher(editingTeacher.id, teacherEditForm);
      alert('اطلاعات معلم با موفقیت به‌روزرسانی شد.');
      setEditingTeacher(null);
      fetchTeachers();
    } catch (err: any) {
      alert(err.message || 'خطا در به‌روزرسانی اطلاعات معلم');
    } finally {
      setTeacherUpdating(false);
    }
  };

  const handleAwardPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherForPoint || !pointForm.reason.trim()) return;

    setPointSubmitting(true);
    try {
      await api.admin.awardPoints({
        teacher: selectedTeacherForPoint.id,
        score: Number(pointForm.score),
        reason: pointForm.reason.trim(),
      });
      alert(`امتیاز با موفقیت به ${selectedTeacherForPoint.full_name || selectedTeacherForPoint.first_name} اعطا شد.`);
      setSelectedTeacherForPoint(null);
      setPointForm({ score: 10, reason: '' });
      fetchTeachers();
      if (viewingTeacher && viewingTeacher.id === selectedTeacherForPoint.id) {
        handleOpenTeacherDetail(viewingTeacher);
      }
    } catch (err: any) {
      alert(err.message || 'خطا در اعطای امتیاز');
    } finally {
      setPointSubmitting(false);
    }
  };

  // Export Teachers to Excel
  const handleExportTeachersExcel = () => {
    const data = teachers.map((t) => ({
      name: t.full_name || `${t.first_name} ${t.last_name}`,
      phone: t.phone_number,
      national_id: t.national_id || '',
      province: t.province || '',
      city: t.city || '',
      village: t.village || '',
      school: t.school || '',
      position: t.position || '',
      grades: Array.isArray(t.grade) ? t.grade.join(' - ') : '',
      points: t.point_total || 0,
      reports: t.report_count || 0,
    }));

    exportToCsv('teachers_list_safiremehr', data, {
      name: 'نام و نام خانوادگی',
      phone: 'شماره تلفن',
      national_id: 'کد ملی',
      province: 'استان',
      city: 'شهر',
      village: 'روستا',
      school: 'مدرسه',
      position: 'سمت',
      grades: 'پایه‌های تدریس',
      points: 'مجموع امتیازات',
      reports: 'تعداد گزارش‌ها',
    });
  };

  // =========================================================================
  // ACTIONS: REPORTS MANAGEMENT & DETAIL
  // =========================================================================
  const handleDeleteReport = async (id: number) => {
    if (!window.confirm('آیا از حذف کامل این گزارش و فایل‌های رسانه‌ای آن اطمینان دارید؟')) return;

    try {
      await api.admin.deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (viewingReport?.id === id) setViewingReport(null);
      alert('گزارش با موفقیت حذف گردید.');
    } catch (err: any) {
      alert(err.message || 'خطا در حذف گزارش');
    }
  };

  const handleOpenReportDetail = (report: any) => {
    setViewingReport(report);
    setReportPointScore(10);
    setReportPointReason(`ارزیابی و تأیید گزارش فعالیت #${report.id}`);
  };

  const handleAwardPointForReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingReport || !viewingReport.teacher) return;

    setReportPointSubmitting(true);
    try {
      await api.admin.awardPoints({
        teacher: viewingReport.teacher,
        score: Number(reportPointScore),
        reason: reportPointReason.trim(),
      });
      alert(`امتیاز ارزیابی این گزارش با موفقیت ثبت شد.`);
      setReportPointReason('');
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت امتیاز گزارش');
    } finally {
      setReportPointSubmitting(false);
    }
  };

  const handleExportReportsExcel = () => {
    const data = reports.map((r) => ({
      id: r.id,
      teacher: r.teacher_name || '',
      phone: r.teacher_phone || '',
      province: r.teacher_province || '',
      city: r.teacher_city || '',
      school: r.teacher_school || '',
      text: r.text || '',
      tags: Array.isArray(r.tags) ? r.tags.map((tg: any) => tg.name).join(' - ') : '',
      images_count: r.images_count || (r.images ? r.images.length : 0),
      videos_count: r.videos_count || (r.videos ? r.videos.length : 0),
      created_at: formatDate(r.created_at),
    }));

    exportToCsv('reports_list_safiremehr', data, {
      id: 'شناسه گزارش',
      teacher: 'نام معلم',
      phone: 'شماره تماس',
      province: 'استان',
      city: 'شهر',
      school: 'مدرسه',
      text: 'متن گزارش',
      tags: 'برچسب‌ها',
      images_count: 'تعداد تصویر',
      videos_count: 'تعداد ویدیو',
      created_at: 'تاریخ ثبت',
    });
  };

  // =========================================================================
  // ACTIONS: SURVEYS MANAGEMENT & DETAIL
  // =========================================================================
  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyCreateForm.title.trim()) return;

    setSurveySubmitting(true);
    try {
      await api.admin.createSurvey({
        title: surveyCreateForm.title.trim(),
        description: surveyCreateForm.description.trim(),
        is_active: surveyCreateForm.is_active,
      });
      setShowSurveyCreateModal(false);
      setSurveyCreateForm({ title: '', description: '', is_active: true });
      fetchSurveys();
      alert('نظرسنجی جدید با موفقیت ایجاد گردید.');
    } catch (err: any) {
      alert(err.message || 'خطا در ایجاد نظرسنجی');
    } finally {
      setSurveySubmitting(false);
    }
  };

  const handleToggleSurveyStatus = async (survey: any) => {
    try {
      await api.admin.updateSurvey(survey.id, { is_active: !survey.is_active });
      setSurveys((prev) =>
        prev.map((s) => (s.id === survey.id ? { ...s, is_active: !s.is_active } : s))
      );
      if (detailSurvey?.id === survey.id) {
        setDetailSurvey((prev: any) => ({ ...prev, is_active: !prev.is_active }));
      }
    } catch (err: any) {
      alert(err.message || 'خطا در تغییر وضعیت نظرسنجی');
    }
  };

  const handleDeleteSurvey = async (id: number, title: string) => {
    if (!window.confirm(`آیا از حذف نظرسنجی «${title}» و کلیه سؤالات و پاسخ‌های آن اطمینان دارید؟`)) return;

    try {
      await api.admin.deleteSurvey(id);
      setSurveys((prev) => prev.filter((s) => s.id !== id));
      if (detailSurvey?.id === id) setDetailSurvey(null);
      alert('نظرسنجی با موفقیت حذف شد.');
    } catch (err: any) {
      alert(err.message || 'خطا در حذف نظرسنجی');
    }
  };

  const handleOpenSurveyDetail = async (survey: any) => {
    setDetailSurvey(survey);
    setLoadingQuestions(true);
    setLoadingSubmissions(true);
    setSurveyQuestions([]);
    setSurveySubmissions([]);

    try {
      const [questionsRes, submissionsRes] = await Promise.all([
        api.admin.getQuestions(survey.id),
        api.admin.getSubmissions(survey.id),
      ]);
      setSurveyQuestions(Array.isArray(questionsRes) ? questionsRes : (questionsRes?.results || []));
      setSurveySubmissions(Array.isArray(submissionsRes) ? submissionsRes : (submissionsRes?.results || []));
    } catch {
      // Handled
    } finally {
      setLoadingQuestions(false);
      setLoadingSubmissions(false);
    }
  };

  const handleSaveSurveyMetadata = async () => {
    if (!detailSurvey) return;
    try {
      await api.admin.updateSurvey(detailSurvey.id, {
        title: detailSurvey.title,
        description: detailSurvey.description,
        is_active: detailSurvey.is_active,
      });
      alert('مشخصات نظرسنجی با موفقیت ذخیره شد.');
      fetchSurveys();
    } catch (err: any) {
      alert(err.message || 'خطا در به‌روزرسانی نظرسنجی');
    }
  };

  // Add Question to Survey
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailSurvey || !newQuestionForm.text.trim()) return;

    setQuestionSubmitting(true);
    try {
      const qRes = await api.admin.createQuestion({
        survey: detailSurvey.id,
        text: newQuestionForm.text.trim(),
        question_type: newQuestionForm.question_type,
        is_required: newQuestionForm.is_required,
        order: newQuestionForm.order,
      });

      // If choice question, create options
      if (newQuestionForm.question_type !== 'text') {
        const optionPromises = newQuestionForm.options
          .filter((opt) => opt.trim().length > 0)
          .map((opt, idx) =>
            api.admin.createOption({
              question: qRes.id,
              text: opt.trim(),
              order: idx + 1,
            })
          );
        await Promise.all(optionPromises);
      }

      setShowAddQuestionModal(false);
      setNewQuestionForm({
        text: '',
        question_type: 'single_choice',
        is_required: true,
        order: surveyQuestions.length + 1,
        options: ['گزینه اول', 'گزینه دوم'],
      });
      // Refresh questions
      const qList = await api.admin.getQuestions(detailSurvey.id);
      setSurveyQuestions(Array.isArray(qList) ? qList : (qList?.results || []));
      alert('سؤال جدید با موفقیت به نظرسنجی افزوده شد.');
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت سؤال');
    } finally {
      setQuestionSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!window.confirm('آیا از حذف این سؤال اطمینان دارید؟')) return;
    try {
      await api.admin.deleteQuestion(questionId);
      setSurveyQuestions((prev) => prev.filter((q) => q.id !== questionId));
      alert('سؤال با موفقیت حذف گردید.');
    } catch (err: any) {
      alert(err.message || 'خطا در حذف سؤال');
    }
  };

  const handleViewSubmissionAnswers = async (sub: any) => {
    try {
      const res = await api.admin.getAnswers(sub.id);
      const answersList = Array.isArray(res) ? res : (res?.results || []);
      setViewingAnswers({ submission: sub, answers: answersList });
    } catch {
      alert('خطا در دریافت پاسخ‌های کاربر.');
    }
  };

  // =========================================================================
  // ACTIONS: SUPPORT TICKETS
  // =========================================================================
  const handleAnswerTicket = async (ticketId: number) => {
    if (!ticketAnswerText.trim()) {
      alert('لطفاً متن پاسخ مدیر را وارد نمایید.');
      return;
    }

    setTicketSubmitting(true);
    try {
      await api.admin.answerTicket(ticketId, ticketAnswerText.trim());
      setAnsweringTicketId(null);
      setTicketAnswerText('');
      fetchTickets();
      alert('پاسخ با موفقیت ثبت شد و وضعیت تیکت به «پاسخ داده شده» تغییر یافت.');
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت پاسخ تیکت');
    } finally {
      setTicketSubmitting(false);
    }
  };

  const handleDeleteTicket = async (id: number) => {
    if (!window.confirm('آیا از حذف این تیکت اطمینان دارید؟')) return;

    try {
      await api.admin.deleteTicket(id);
      setTickets((prev) => prev.filter((t) => t.id !== id));
      alert('تیکت با موفقیت حذف گردید.');
    } catch (err: any) {
      alert(err.message || 'خطا در حذف تیکت');
    }
  };

  // =========================================================================
  // ACTIONS: ANNOUNCEMENTS / BLOGS (Strict Media Upload to avoid backend 400)
  // =========================================================================
  const handleBlogFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');

    if (!isImg && !isVid) {
      alert('لطفاً تنها فایل تصویری (عکس) یا ویدیویی معتبر انتخاب نمایید.');
      if (blogFileInputRef.current) blogFileInputRef.current.value = '';
      return;
    }

    setBlogFile(file);
    setBlogFileType(isImg ? 'image' : 'video');
    setBlogFilePreview(URL.createObjectURL(file));
  };

  const handleClearBlogFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBlogFile(null);
    setBlogFilePreview(null);
    setBlogFileType(null);
    if (blogFileInputRef.current) blogFileInputRef.current.value = '';
  };

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogForm.title.trim()) {
      alert('لطفاً عنوان اطلاعیه را وارد نمایید.');
      return;
    }
    if (!blogForm.content.trim()) {
      alert('لطفاً متن اطلاعیه را وارد نمایید.');
      return;
    }
    if (!blogFile) {
      alert('ارسال فایل رسانه‌ای (عکس یا ویدیو پوستر) طبق معماری سامانه الزامی است. لطفاً یک فایل بارگذاری کنید.');
      return;
    }

    setBlogSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', blogForm.title.trim());
      formData.append('content', blogForm.content.trim());
      formData.append('media', blogFile);

      await api.admin.createBlog(formData);
      alert('اطلاعیه جدید با موفقیت منتشر گردید.');
      setBlogForm({ title: '', content: '' });
      setBlogFile(null);
      setBlogFilePreview(null);
      setBlogFileType(null);
      if (blogFileInputRef.current) blogFileInputRef.current.value = '';
      fetchBlogs();
    } catch (err: any) {
      alert(err.message || 'خطا در انتشار اطلاعیه');
    } finally {
      setBlogSubmitting(false);
    }
  };

  const handleDeleteBlog = async (id: number) => {
    if (!window.confirm('آیا از حذف این اطلاعیه اطمینان دارید؟')) return;
    try {
      await api.admin.deleteBlog(id);
      setBlogs((prev) => prev.filter((b) => b.id !== id));
      alert('اطلاعیه با موفقیت حذف گردید.');
    } catch (err: any) {
      alert(err.message || 'خطا در حذف اطلاعیه');
    }
  };

  // =========================================================================
  // ACTIONS: TAGS MANAGEMENT
  // =========================================================================
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setTagSubmitting(true);
    try {
      await api.admin.createTag(newTagName.trim());
      setNewTagName('');
      fetchTags();
      alert('برچسب جدید با موفقیت افزوده شد.');
    } catch (err: any) {
      alert(err.message || 'خطا در ایجاد برچسب');
    } finally {
      setTagSubmitting(false);
    }
  };

  const handleDeleteTag = async (id: number, name: string) => {
    if (!window.confirm(`آیا از حذف تگ «${name}» اطمینان دارید؟`)) return;
    try {
      await api.admin.deleteTag(id);
      setTags((prev) => prev.filter((t) => t.id !== id));
      alert('برچسب با موفقیت حذف شد.');
    } catch (err: any) {
      alert(err.message || 'خطا در حذف برچسب');
    }
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    if (ticketFilter === 'pending') return !t.is_answered;
    if (ticketFilter === 'answered') return t.is_answered;
    return true;
  });

  const unansweredTicketsCount = tickets.filter((t) => !t.is_answered).length;

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <Loader2 size={40} className="spinner" style={{ color: 'var(--primary)' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>در حال ورود و بارگذاری پنل مدیریت ارشد...</h3>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>لطفاً شکیبا باشید.</p>
      </div>
    );
  }

  // Access Denied Screen
  if (accessDenied) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            background: '#ffffff',
            border: '1px solid #fecdd3',
            borderRadius: 'var(--radius-lg)',
            padding: '40px 30px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              background: '#ffe4e6',
              color: '#e11d48',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#9f1239', margin: '0 0 12px' }}>
            عدم احراز دسترسی مدیریت
          </h2>
          <p style={{ color: '#4b5563', lineHeight: '1.8', fontSize: '0.92rem', margin: '0 0 24px' }}>
            دسترسی به بخش مدیریت سامانه منحصراً متعلق به مدیران ارشد ستادی (is_staff) می‌باشد.
          </p>
          <button
            type="button"
            className="btn-astra btn-astra-primary btn-astra-md"
            onClick={() => onNavigate('home')}
            style={{ margin: '0 auto' }}
          >
            <ArrowLeft size={16} />
            بازگشت به صفحه اصلی
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container" style={{ display: 'flex', minHeight: 'calc(100vh - 75px)', background: '#f8fafc' }}>
      {/* =====================================================================
          SIDEBAR NAVIGATION (Matches Django Admin Panel Structure)
      ====================================================================== */}
      <aside
        style={{
          width: '260px',
          background: '#0f172a',
          color: '#cbd5e1',
          borderLeft: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '15px',
              }}
            >
              م
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>مدیریت کلان سامانه</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>سفیر مهر - کنترل جامع</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            بخش‌های اصلی
          </div>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={18} />
            <span>داشبورد کلان</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'teachers' ? 'active' : ''}`}
            onClick={() => setActiveTab('teachers')}
          >
            <Users size={18} />
            <span>مدیریت معلمان</span>
            <span className="admin-nav-count">{toPersianDigits(stats.teachersCount)}</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <FileText size={18} />
            <span>گزارش‌ها و رسانه‌ها</span>
            <span className="admin-nav-count">{toPersianDigits(stats.reportsCount)}</span>
          </button>

          <div style={{ padding: '12px 12px 6px', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            نظرسنجی و بازخورد
          </div>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'surveys' ? 'active' : ''}`}
            onClick={() => setActiveTab('surveys')}
          >
            <ClipboardList size={18} />
            <span>نظرسنجی‌ها و سؤالات</span>
            <span className="admin-nav-count">{toPersianDigits(stats.surveysCount)}</span>
          </button>

          <div style={{ padding: '12px 12px 6px', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            ارتباطات و اطلاعیه‌ها
          </div>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <MessageSquare size={18} />
            <span>تیکت‌های پشتیبانی</span>
            <span className="admin-nav-count">{toPersianDigits(stats.ticketsCount)}</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'blogs' ? 'active' : ''}`}
            onClick={() => setActiveTab('blogs')}
          >
            <Bell size={18} />
            <span>اطلاعیه‌ها و بلاگ</span>
          </button>

          <div style={{ padding: '12px 12px 6px', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            ساماندهی و امتیازدهی
          </div>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'tags' ? 'active' : ''}`}
            onClick={() => setActiveTab('tags')}
          >
            <TagIcon size={18} />
            <span>برچسب‌ها (تگ‌ها)</span>
            <span className="admin-nav-count">{toPersianDigits(stats.tagsCount)}</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'points' ? 'active' : ''}`}
            onClick={() => setActiveTab('points')}
          >
            <Award size={18} />
            <span>سوابق امتیازات</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e293b', fontSize: '11px', color: '#64748b' }}>
          <div>ورژن پرتال: ۲.۴ ستادی</div>
          <div style={{ marginTop: '2px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            سرور متصل است
          </div>
        </div>
      </aside>

      {/* =====================================================================
          MAIN WORKSPACE
      ====================================================================== */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <header
          style={{
            height: '70px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
              {activeTab === 'overview' && 'داشبورد نظارت کلان'}
              {activeTab === 'teachers' && 'مدیریت و پایش معلمان'}
              {activeTab === 'reports' && 'مدیریت جامع گزارش‌ها و رسانه‌ها'}
              {activeTab === 'surveys' && 'طراحی و مدیریت نظرسنجی‌ها'}
              {activeTab === 'tickets' && 'میز پاسخگویی به تیکت‌ها'}
              {activeTab === 'blogs' && 'انتشار و مدیریت اطلاعیه‌ها'}
              {activeTab === 'tags' && 'مدیریت برچسب‌های سامانه'}
              {activeTab === 'points' && 'سوابق و امتیازات ثبت‌شده'}
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
              دسترسی کامل مدیریت، حذف، ویرایش، امتیازدهی و گزارش‌گیری
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn-astra btn-astra-outline btn-astra-sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? 'spinner' : ''} />
              به‌روزرسانی داده‌ها
            </button>

            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#065f46',
                background: '#d1fae5',
                padding: '6px 12px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
              مدیر ارشد: ۰۹۱۲۷۵۱۹۱۳۵
            </span>
          </div>
        </header>

        {/* Content Body */}
        <div style={{ padding: '28px', flex: 1, overflowY: 'auto' }}>
          {/* ===================================================================
              TAB 1: OVERVIEW DASHBOARD (Exact Replica of dashboard.html)
          ==================================================================== */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Top 4 Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <div className="admin-stat-label">کل معلمان ثبت‌شده</div>
                    <div className="admin-stat-value">{toPersianDigits(stats.teachersCount)}</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <div className="admin-stat-label">کل گزارش‌های ارسالی</div>
                    <div className="admin-stat-value">{toPersianDigits(stats.reportsCount)}</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                    <ImageIcon size={24} />
                  </div>
                  <div>
                    <div className="admin-stat-label">تصاویر ثبت‌شده</div>
                    <div className="admin-stat-value">{toPersianDigits(stats.imagesCount)}</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                    <Film size={24} />
                  </div>
                  <div>
                    <div className="admin-stat-label">ویدیوهای بارگذاری‌شده</div>
                    <div className="admin-stat-value">{toPersianDigits(stats.videosCount)}</div>
                  </div>
                </div>
              </div>

              {/* Split Row: Recent Reports & Recent Media Gallery */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(320px, 1fr)', gap: '20px' }}>
                {/* Recent Reports */}
                <div className="admin-panel-card">
                  <div className="admin-panel-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.95rem' }}>
                      <FileText size={18} style={{ color: 'var(--primary)' }} />
                      آخرین گزارش‌های ارسالی معلمان
                    </div>
                    <button
                      type="button"
                      className="btn-astra btn-astra-outline btn-astra-sm"
                      onClick={() => setActiveTab('reports')}
                    >
                      مشاهده همه
                    </button>
                  </div>
                  <div style={{ padding: '16px' }}>
                    {reports.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        هنوز گزارشی ثبت نگردیده است.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {reports.slice(0, 5).map((r) => (
                          <div
                            key={r.id}
                            style={{
                              padding: '14px',
                              borderRadius: '12px',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px',
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                                  {r.teacher_name || 'معلم ناشناس'}
                                </span>
                                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                  ({r.teacher_school || r.teacher_city || 'بدون مدرسه'})
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.83rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {r.text || 'بدون توضیحات متنی'}
                              </p>
                            </div>

                            <button
                              type="button"
                              className="btn-astra btn-astra-outline btn-astra-sm"
                              onClick={() => handleOpenReportDetail(r)}
                            >
                              بررسی
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Shortcuts & System Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="admin-panel-card">
                    <div className="admin-panel-card-header">
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>دسترسی‌های سریع مدیریتی</div>
                    </div>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn-astra btn-astra-primary btn-astra-md"
                        onClick={() => setShowSurveyCreateModal(true)}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        <Plus size={16} />
                        ساخت نظرسنجی جدید
                      </button>

                      <button
                        type="button"
                        className="btn-astra btn-astra-outline btn-astra-md"
                        onClick={() => setActiveTab('blogs')}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        <Bell size={16} />
                        انتشار اطلاعیه جدید
                      </button>

                      <button
                        type="button"
                        className="btn-astra btn-astra-outline btn-astra-md"
                        onClick={() => {
                          setActiveTab('tickets');
                          setTicketFilter('pending');
                        }}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        <MessageSquare size={16} />
                        بررسی تیکت‌های در انتظار پاسخ ({toPersianDigits(unansweredTicketsCount)})
                      </button>
                    </div>
                  </div>

                  <div className="admin-panel-card">
                    <div className="admin-panel-card-header">
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>اطلاعات سرور پایگاه‌داده</div>
                    </div>
                    <div style={{ padding: '16px', fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>وضعیت دسترسی:</span>
                        <span style={{ fontWeight: 700, color: '#059669' }}>مدیر کل (SuperUser)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>نوع کاربر در سیستم:</span>
                        <span style={{ fontWeight: 700 }}>مدیریت ستادی</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>مدیریت فایل‌ها:</span>
                        <span style={{ fontWeight: 700 }}>فعال (Django Media)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB 2: TEACHERS MANAGEMENT (Exact Replica of teachers.html)
          ==================================================================== */}
          {activeTab === 'teachers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Filter Bar & Export */}
              <div className="admin-panel-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={18} style={{ color: 'var(--primary)' }} />
                    فیلتر و جستجوی معلمان
                  </div>
                  <button
                    type="button"
                    className="btn-astra btn-astra-outline btn-astra-sm"
                    onClick={handleExportTeachersExcel}
                    style={{ borderColor: '#16a34a', color: '#16a34a' }}
                  >
                    <Download size={14} />
                    خروجی اکسل (Excel)
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
                  <div>
                    <label className="admin-form-label">جستجو (نام، کد ملی، تلفن)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="نام یا شماره تماس..."
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">استان</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="مثلاً قم، تهران..."
                      value={teacherProvince}
                      onChange={(e) => setTeacherProvince(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">شهر</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="مثلاً قم، کهک..."
                      value={teacherCity}
                      onChange={(e) => setTeacherCity(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-astra btn-astra-primary btn-astra-md"
                      onClick={fetchTeachers}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <Search size={15} />
                      اعمال فیلتر
                    </button>
                    <button
                      type="button"
                      className="btn-astra btn-astra-outline btn-astra-md"
                      onClick={() => {
                        setTeacherSearch('');
                        setTeacherProvince('');
                        setTeacherCity('');
                        fetchTeachers();
                      }}
                      title="پاکسازی فیلتر"
                    >
                      <RefreshCw size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Teachers Table Card */}
              <div className="admin-panel-card">
                <div className="admin-panel-card-header">
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>فهرست معلمان سامانه</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', marginRight: '8px' }}>
                      (تعداد: {toPersianDigits(teachers.length)} نفر)
                    </span>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  {teachersLoading ? (
                    <div style={{ padding: '50px', textAlign: 'center' }}>
                      <Loader2 size={32} className="spinner" style={{ color: 'var(--primary)' }} />
                      <p style={{ marginTop: '10px', color: '#64748b' }}>در حال دریافت لیست معلمان...</p>
                    </div>
                  ) : teachers.length === 0 ? (
                    <div style={{ padding: '50px', textAlign: 'center', color: '#94a3b8' }}>
                      هیچ معلمی با این مشخصات یافت نشد.
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>معلم</th>
                          <th>شماره تماس</th>
                          <th>محل خدمت</th>
                          <th>مدرسه</th>
                          <th>پایه‌های تدریس</th>
                          <th>سمت</th>
                          <th>امتیاز</th>
                          <th>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teachers.map((t) => (
                          <tr key={t.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="admin-user-avatar">
                                  {(t.first_name?.[0] || 'م')}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 800, color: '#0f172a' }}>
                                    {t.full_name || `${t.first_name} ${t.last_name}`}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    کد ملی: {t.national_id || '-'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ direction: 'ltr', textAlign: 'right' }}>{t.phone_number}</td>
                            <td>{t.province ? `${t.province} - ${t.city || ''}` : '-'}</td>
                            <td>{t.school || '-'}</td>
                            <td>
                              {Array.isArray(t.grade) && t.grade.length > 0 ? (
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  {t.grade.map((g: string, i: number) => (
                                    <span key={i} className="admin-badge admin-badge-neutral">{g}</span>
                                  ))}
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td>
                              <span className="admin-badge admin-badge-primary">
                                {t.position === 'teacher' ? 'آموزگار' : (t.position || 'معلم')}
                              </span>
                            </td>
                            <td>
                              <span className="admin-badge admin-badge-warning" style={{ fontWeight: 800 }}>
                                <Star size={12} fill="#d97706" style={{ marginLeft: '4px' }} />
                                {toPersianDigits(t.point_total || 0)}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  className="btn-astra btn-astra-outline btn-astra-sm"
                                  onClick={() => handleOpenTeacherDetail(t)}
                                  title="مشاهده کارنامه و جزئیات"
                                >
                                  <Eye size={14} />
                                  کارنامه
                                </button>

                                <button
                                  type="button"
                                  className="btn-astra btn-astra-outline btn-astra-sm"
                                  onClick={() => handleOpenEditTeacher(t)}
                                  title="ویرایش مشخصات"
                                >
                                  <Edit3 size={14} />
                                </button>

                                <button
                                  type="button"
                                  className="btn-astra btn-astra-outline btn-astra-sm"
                                  onClick={() => setSelectedTeacherForPoint(t)}
                                  title="اعطای امتیاز"
                                  style={{ borderColor: '#d97706', color: '#d97706' }}
                                >
                                  <Award size={14} />
                                </button>

                                <button
                                  type="button"
                                  className="btn-astra btn-astra-danger btn-astra-sm"
                                  onClick={() => handleDeleteTeacher(t.id, t.full_name || t.first_name)}
                                  title="حذف حساب"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB 3: REPORTS & MEDIA (Exact Replica of reports.html)
          ==================================================================== */}
          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Filter Bar */}
              <div className="admin-panel-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={18} style={{ color: 'var(--primary)' }} />
                    فیلتر گزارش‌ها و رسانه‌ها
                  </div>
                  <button
                    type="button"
                    className="btn-astra btn-astra-outline btn-astra-sm"
                    onClick={handleExportReportsExcel}
                    style={{ borderColor: '#16a34a', color: '#16a34a' }}
                  >
                    <Download size={14} />
                    خروجی اکسل گزارش‌ها
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', alignItems: 'end' }}>
                  <div>
                    <label className="admin-form-label">جستجو در متن</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="متن گزارش..."
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">استان</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="استان..."
                      value={reportProvince}
                      onChange={(e) => setReportProvince(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">شهر</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="شهر..."
                      value={reportCity}
                      onChange={(e) => setReportCity(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">نوع رسانه</label>
                    <select
                      className="admin-form-input"
                      value={reportMediaType}
                      onChange={(e) => setReportMediaType(e.target.value as any)}
                    >
                      <option value="all">همه رسانه‌ها</option>
                      <option value="image">دارای تصویر</option>
                      <option value="video">دارای ویدیو</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-astra btn-astra-primary btn-astra-md"
                      onClick={fetchReports}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <Search size={15} />
                      فیلتر
                    </button>
                    <button
                      type="button"
                      className="btn-astra btn-astra-outline btn-astra-md"
                      onClick={() => {
                        setReportSearch('');
                        setReportProvince('');
                        setReportCity('');
                        setReportMediaType('all');
                        setReportTeacherFilter('');
                        fetchReports();
                      }}
                      title="پاکسازی فیلتر"
                    >
                      <RefreshCw size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Reports Grid */}
              {reportsLoading ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <Loader2 size={36} className="spinner" style={{ color: 'var(--primary)' }} />
                  <p style={{ marginTop: '12px', color: '#64748b' }}>در حال بارگذاری گزارش‌ها...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="admin-panel-card" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                  هیچ گزارشی مطابق فیلتر یافت نشد.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {reports.map((report) => (
                    <div key={report.id} className="admin-report-card">
                      {/* Media Slider / Preview */}
                      <div className="admin-report-media-box">
                        {report.images && report.images.length > 0 ? (
                          <img
                            src={report.images[0].url || report.images[0].image}
                            alt="تصویر گزارش"
                            onClick={() => {
                              setActiveMediaUrl(report.images[0].url || report.images[0].image);
                              setActiveMediaType('image');
                            }}
                          />
                        ) : report.videos && report.videos.length > 0 ? (
                          <div
                            style={{ position: 'relative', width: '100%', height: '100%', cursor: 'pointer' }}
                            onClick={() => {
                              setActiveMediaUrl(report.videos[0].url || report.videos[0].video);
                              setActiveMediaType('video');
                            }}
                          >
                            <video src={report.videos[0].url || report.videos[0].video} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div className="video-overlay-btn">
                              <Play size={24} fill="#ffffff" />
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                            فاقد فایل رسانه‌ای
                          </div>
                        )}

                        <div className="media-badge">
                          {toPersianDigits((report.images_count || report.images?.length || 0) + (report.videos_count || report.videos?.length || 0))} رسانه
                        </div>
                      </div>

                      {/* Report Content */}
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                              {report.teacher_name || 'معلم ناشناس'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {report.teacher_school || report.teacher_city || 'بدون مدرسه'}
                            </div>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatDate(report.created_at)}</span>
                        </div>

                        <p
                          style={{
                            fontSize: '0.85rem',
                            color: '#334155',
                            lineHeight: '1.8',
                            margin: '0 0 12px',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            flex: 1,
                          }}
                        >
                          {report.text || 'بدون توضیحات متنی'}
                        </p>

                        {/* Tags */}
                        {report.tags && report.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '14px' }}>
                            {report.tags.map((tg: any) => (
                              <span key={tg.id} className="admin-badge admin-badge-neutral" style={{ fontSize: '10px' }}>
                                #{tg.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                          <button
                            type="button"
                            className="btn-astra btn-astra-primary btn-astra-sm"
                            onClick={() => handleOpenReportDetail(report)}
                            style={{ flex: 1, justifyContent: 'center' }}
                          >
                            <Eye size={14} />
                            مشاهده و ارزیابی
                          </button>

                          <button
                            type="button"
                            className="btn-astra btn-astra-danger btn-astra-sm"
                            onClick={() => handleDeleteReport(report.id)}
                            title="حذف گزارش"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              TAB 4: SURVEYS & DETAIL (Exact Replica of surveys.html & survey_detail.html)
          ==================================================================== */}
          {activeTab === 'surveys' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header with Create Button */}
              <div className="admin-panel-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 900 }}>نظرسنجی‌های دوره‌ای معلمان</h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                    ایجاد نظرسنجی جدید، طراحی سؤالات تشریحی و تستی، و مشاهده کامل پاسخ‌های دریافتی
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-astra btn-astra-primary btn-astra-md"
                  onClick={() => setShowSurveyCreateModal(true)}
                >
                  <Plus size={16} />
                  ساخت نظرسنجی جدید
                </button>
              </div>

              {/* Surveys Grid */}
              {surveysLoading ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <Loader2 size={36} className="spinner" style={{ color: 'var(--primary)' }} />
                  <p style={{ marginTop: '12px', color: '#64748b' }}>در حال دریافت نظرسنجی‌ها...</p>
                </div>
              ) : surveys.length === 0 ? (
                <div className="admin-panel-card" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                  هنوز نظرسنجی تعریف نشده است. با دکمه بالا اولین نظرسنجی را بسازید.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                  {surveys.map((survey) => (
                    <div key={survey.id} className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className="admin-panel-card-header" style={{ alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>{survey.title}</h4>
                            <span className={`admin-badge ${survey.is_active ? 'admin-badge-success' : 'admin-badge-neutral'}`}>
                              {survey.is_active ? 'فعال' : 'غیرفعال'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatDate(survey.created_at)}</span>
                        </div>
                      </div>

                      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#475569', lineHeight: '1.8', flex: 1 }}>
                          {survey.description || 'بدون توضیحات تکمیلی'}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', marginBottom: '16px', fontSize: '0.82rem' }}>
                          <div>
                            <span style={{ color: '#64748b' }}>تعداد سؤالات: </span>
                            <span style={{ fontWeight: 800 }}>{toPersianDigits(survey.question_count || 0)}</span>
                          </div>
                          <div>
                            <span style={{ color: '#64748b' }}>مشارکت‌ها: </span>
                            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{toPersianDigits(survey.submission_count || 0)}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn-astra btn-astra-primary btn-astra-sm"
                            onClick={() => handleOpenSurveyDetail(survey)}
                            style={{ flex: 1, justifyContent: 'center' }}
                          >
                            <Edit3 size={14} />
                            طراحی سؤالات و پاسخ‌ها
                          </button>

                          <button
                            type="button"
                            className={`btn-astra ${survey.is_active ? 'btn-astra-outline' : 'btn-astra-primary'} btn-astra-sm`}
                            onClick={() => handleToggleSurveyStatus(survey)}
                            title={survey.is_active ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                          >
                            {survey.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>

                          <button
                            type="button"
                            className="btn-astra btn-astra-danger btn-astra-sm"
                            onClick={() => handleDeleteSurvey(survey.id, survey.title)}
                            title="حذف نظرسنجی"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              TAB 5: TICKETS (Exact Replica of tickets.html)
          ==================================================================== */}
          {activeTab === 'tickets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Tickets Filter Tabs */}
              <div className="admin-panel-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className={`btn-astra ${ticketFilter === 'all' ? 'btn-astra-primary' : 'btn-astra-outline'} btn-astra-sm`}
                    onClick={() => setTicketFilter('all')}
                  >
                    همه تیکت‌ها ({toPersianDigits(tickets.length)})
                  </button>
                  <button
                    type="button"
                    className={`btn-astra ${ticketFilter === 'pending' ? 'btn-astra-primary' : 'btn-astra-outline'} btn-astra-sm`}
                    onClick={() => setTicketFilter('pending')}
                  >
                    در انتظار پاسخ ({toPersianDigits(tickets.filter((t) => !t.is_answered).length)})
                  </button>
                  <button
                    type="button"
                    className={`btn-astra ${ticketFilter === 'answered' ? 'btn-astra-primary' : 'btn-astra-outline'} btn-astra-sm`}
                    onClick={() => setTicketFilter('answered')}
                  >
                    پاسخ داده شده ({toPersianDigits(tickets.filter((t) => t.is_answered).length)})
                  </button>
                </div>
              </div>

              {/* Tickets List */}
              {ticketsLoading ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <Loader2 size={36} className="spinner" style={{ color: 'var(--primary)' }} />
                  <p style={{ marginTop: '12px', color: '#64748b' }}>در حال بارگذاری تیکت‌ها...</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="admin-panel-card" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                  تیکتی در این دسته‌بندی یافت نشد.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredTickets.map((t) => (
                    <div key={t.id} className="admin-panel-card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>{t.title}</h4>
                            <span className={`admin-badge ${t.is_answered ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                              {t.is_answered ? 'پاسخ داده شده' : 'در انتظار پاسخ مدیر'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            ارسال توسط: {t.first_name || ''} {t.last_name || ''} | شماره تماس: {t.phone_number || '-'} | تاریخ: {formatDate(t.created_at)}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn-astra btn-astra-danger btn-astra-sm"
                          onClick={() => handleDeleteTicket(t.id)}
                          title="حذف تیکت"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Question Content */}
                      <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', lineHeight: '1.8', color: '#334155', marginBottom: '16px' }}>
                        {t.content}
                      </div>

                      {/* Existing Answer if present */}
                      {t.answer && (
                        <div style={{ padding: '14px', background: '#ecfdf5', borderRadius: '10px', border: '1px solid #a7f3d0', fontSize: '0.88rem', lineHeight: '1.8', color: '#065f46', marginBottom: '16px' }}>
                          <div style={{ fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle size={14} />
                            پاسخ ثبت‌شده مدیر ارشد:
                          </div>
                          {t.answer}
                        </div>
                      )}

                      {/* Reply Box */}
                      {answeringTicketId === t.id ? (
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '12px' }}>
                          <label className="admin-form-label">متن پاسخ رسمی مدیریت</label>
                          <textarea
                            className="admin-form-input"
                            rows={3}
                            placeholder="متن پاسخ خود را به کاربر بنویسید..."
                            value={ticketAnswerText}
                            onChange={(e) => setTicketAnswerText(e.target.value)}
                            style={{ resize: 'vertical', marginBottom: '10px' }}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn-astra btn-astra-primary btn-astra-sm"
                              onClick={() => handleAnswerTicket(t.id)}
                              disabled={ticketSubmitting}
                            >
                              {ticketSubmitting ? <Loader2 size={14} className="spinner" /> : <Send size={14} />}
                              ثبت و ارسال پاسخ
                            </button>
                            <button
                              type="button"
                              className="btn-astra btn-astra-outline btn-astra-sm"
                              onClick={() => setAnsweringTicketId(null)}
                            >
                              انصراف
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-astra btn-astra-outline btn-astra-sm"
                          onClick={() => {
                            setAnsweringTicketId(t.id);
                            setTicketAnswerText(t.answer || '');
                          }}
                        >
                          <Send size={14} />
                          {t.is_answered ? 'ویرایش پاسخ مدیر' : 'ثبت پاسخ تیکت'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              TAB 6: ANNOUNCEMENTS & BLOGS (Exact Replica of blog_create.html)
          ==================================================================== */}
          {activeTab === 'blogs' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: '24px' }}>
              {/* Create Blog Form with Mandatory Media Upload */}
              <div className="admin-panel-card" style={{ padding: '24px' }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 900 }}>افزودن بلاگ و اطلاعیه جدید</h3>
                <p style={{ margin: '0 0 20px', fontSize: '0.82rem', color: '#64748b' }}>
                  انتشار بیانیه، اخبار رویدادها یا دستورالعمل‌های مهم به همراه فایل پوستر تصویری یا ویدیو
                </p>

                <form onSubmit={handleCreateBlog} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="admin-form-label">عنوان اطلاعیه *</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="عنوان خبر یا اطلاعیه..."
                      value={blogForm.title}
                      onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">متن اطلاعیه *</label>
                    <textarea
                      className="admin-form-input"
                      rows={5}
                      placeholder="مشروح اطلاعیه، جزئیات و توضیحات..."
                      value={blogForm.content}
                      onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                      required
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {/* Drag & Drop File Upload Area */}
                  <div>
                    <label className="admin-form-label">فایل رسانه پیوست (عکس یا ویدیو) * الزامی</label>
                    <input
                      type="file"
                      ref={blogFileInputRef}
                      onChange={handleBlogFileChange}
                      accept="image/*,video/*"
                      style={{ display: 'none' }}
                    />

                    {blogFilePreview ? (
                      <div
                        style={{
                          position: 'relative',
                          border: '2px solid #e2e8f0',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          height: '220px',
                          background: '#0f172a',
                        }}
                      >
                        {blogFileType === 'image' ? (
                          <img src={blogFilePreview} alt="پیش‌نمایش" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <video src={blogFilePreview} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                        <button
                          type="button"
                          onClick={handleClearBlogFile}
                          style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            background: 'rgba(239, 68, 68, 0.85)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <X size={14} />
                          حذف و تغییر فایل
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => blogFileInputRef.current?.click()}
                        style={{
                          border: '2px dashed #cbd5e1',
                          borderRadius: '14px',
                          padding: '36px 20px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: '#f8fafc',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '14px',
                            background: '#e0e7ff',
                            color: '#4338ca',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                          }}
                        >
                          <Upload size={22} />
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                          برای انتخاب عکس یا ویدیو پوستر اینجا کلیک کنید
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          فرمت‌های مجاز: JPG, PNG, MP4 (ارسال رسانه طبق نیازمندی مدل اجباری است)
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-astra btn-astra-primary btn-astra-md"
                    disabled={blogSubmitting}
                    style={{ marginTop: '8px', justifyContent: 'center' }}
                  >
                    {blogSubmitting ? <Loader2 size={16} className="spinner" /> : <Plus size={16} />}
                    انتشار اطلاعیه در سامانه
                  </button>
                </form>
              </div>

              {/* Published Blogs List */}
              <div className="admin-panel-card" style={{ padding: '20px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 900 }}>اطلاعیه‌های منتشرشده</h4>
                {blogsLoading ? (
                  <div style={{ padding: '30px', textAlign: 'center' }}>
                    <Loader2 size={24} className="spinner" style={{ color: 'var(--primary)' }} />
                  </div>
                ) : blogs.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    هنوز اطلاعیه‌ای ثبت نگردیده است.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {blogs.map((b) => (
                      <div
                        key={b.id}
                        style={{
                          padding: '12px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        {b.media ? (
                          <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#0f172a' }}>
                            <img src={b.media} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : null}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h5 style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {b.title}
                          </h5>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatDate(b.created_at)}</span>
                        </div>
                        <button
                          type="button"
                          className="btn-astra btn-astra-danger btn-astra-sm"
                          onClick={() => handleDeleteBlog(b.id)}
                          title="حذف اطلاعیه"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB 7: TAGS MANAGEMENT (Tags ViewSet)
          ==================================================================== */}
          {activeTab === 'tags' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: '24px' }}>
              <div className="admin-panel-card" style={{ padding: '24px' }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 900 }}>برچسب‌ها (تگ‌های موضوعی گزارش‌ها)</h3>
                <p style={{ margin: '0 0 20px', fontSize: '0.82rem', color: '#64748b' }}>
                  برچسب‌های زیر در فرم ثبت گزارش معلمان نمایش داده می‌شوند.
                </p>

                {tagsLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <Loader2 size={32} className="spinner" style={{ color: 'var(--primary)' }} />
                  </div>
                ) : tags.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    هیچ برچسبی تعریف نشده است.
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {tags.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 14px',
                          borderRadius: '10px',
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: '#1e293b',
                        }}
                      >
                        <TagIcon size={14} style={{ color: 'var(--primary)' }} />
                        <span>{t.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteTag(t.id, t.name)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                          }}
                          title="حذف برچسب"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Tag Card */}
              <div className="admin-panel-card" style={{ padding: '24px' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 900 }}>افزودن برچسب جدید</h4>
                <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#64748b' }}>
                  موضوعات کلیدی گزارش‌های آموزشی، تربیتی یا قرآنی
                </p>

                <form onSubmit={handleCreateTag} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label className="admin-form-label">نام برچسب *</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="مثلاً: حفظ قرآن، کاردستی، هم‌خوانی..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-astra btn-astra-primary btn-astra-md"
                    disabled={tagSubmitting}
                    style={{ justifyContent: 'center' }}
                  >
                    {tagSubmitting ? <Loader2 size={16} className="spinner" /> : <Plus size={16} />}
                    ثبت برچسب
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB 8: POINTS LOG (Points ViewSet)
          ==================================================================== */}
          {activeTab === 'points' && (
            <div className="admin-panel-card">
              <div className="admin-panel-card-header">
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 900 }}>تاریخچه امتیازات اعطا شده در سامانه</h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                    کلیه امتیازات ثبت‌شده برای معلمان به تفکیک دلیل و تاریخ
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                {pointsLoading ? (
                  <div style={{ padding: '50px', textAlign: 'center' }}>
                    <Loader2 size={32} className="spinner" style={{ color: 'var(--primary)' }} />
                  </div>
                ) : pointsHistory.length === 0 ? (
                  <div style={{ padding: '50px', textAlign: 'center', color: '#94a3b8' }}>
                    هنوز سابقه امتیازی ثبت نگردیده است.
                  </div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>شناسه</th>
                        <th>نام معلم</th>
                        <th>امتیاز اعطایی</th>
                        <th>دلیل / شرح امتیاز</th>
                        <th>تاریخ ثبت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pointsHistory.map((p) => (
                        <tr key={p.id}>
                          <td>#{p.id}</td>
                          <td style={{ fontWeight: 800 }}>{p.teacher_name || `معلم #${p.teacher}`}</td>
                          <td>
                            <span className="admin-badge admin-badge-warning" style={{ fontWeight: 800 }}>
                              <Star size={12} fill="#d97706" style={{ marginLeft: '4px' }} />
                              +{toPersianDigits(p.score)} امتیاز
                            </span>
                          </td>
                          <td style={{ color: '#334155' }}>{p.reason || '-'}</td>
                          <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(p.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =====================================================================
          DRAWER: TEACHER DETAIL (Full Replication of teacher_detail.html)
      ====================================================================== */}
      {viewingTeacher && (
        <div className="admin-modal-overlay" onClick={() => setViewingTeacher(null)}>
          <div
            className="admin-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'var(--primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800 }}>
                  {viewingTeacher.first_name?.[0] || 'م'}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 900 }}>
                    {viewingTeacher.full_name || `${viewingTeacher.first_name} ${viewingTeacher.last_name}`}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    کارنامه تفصیلی و سوابق فعالیت در طرح سفیر مهر
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingTeacher(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div className="admin-info-cell">
                <span className="admin-info-cell-label">شماره همراه</span>
                <span className="admin-info-cell-val" style={{ direction: 'ltr' }}>{viewingTeacher.phone_number}</span>
              </div>
              <div className="admin-info-cell">
                <span className="admin-info-cell-label">کد ملی</span>
                <span className="admin-info-cell-val">{viewingTeacher.national_id || '-'}</span>
              </div>
              <div className="admin-info-cell">
                <span className="admin-info-cell-label">محل خدمت</span>
                <span className="admin-info-cell-val">{viewingTeacher.province ? `${viewingTeacher.province} - ${viewingTeacher.city || ''}` : '-'}</span>
              </div>
              <div className="admin-info-cell">
                <span className="admin-info-cell-label">مدرسه</span>
                <span className="admin-info-cell-val">{viewingTeacher.school || '-'}</span>
              </div>
              <div className="admin-info-cell">
                <span className="admin-info-cell-label">پایه‌های تدریس</span>
                <span className="admin-info-cell-val">
                  {Array.isArray(viewingTeacher.grade) ? viewingTeacher.grade.join('، ') : (viewingTeacher.grade || '-')}
                </span>
              </div>
              <div className="admin-info-cell">
                <span className="admin-info-cell-label">مجموع امتیازات</span>
                <span className="admin-info-cell-val" style={{ color: '#d97706', fontWeight: 900 }}>
                  {toPersianDigits(viewingTeacher.point_total || 0)} امتیاز
                </span>
              </div>
            </div>

            {/* Award Points Widget directly inside Teacher Detail */}
            <div style={{ padding: '16px', borderRadius: '12px', background: '#fef3c7', border: '1px solid #fde68a', marginBottom: '24px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#92400e', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Star size={16} fill="#d97706" />
                اعطای مستقیم امتیاز به این معلم
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSelectedTeacherForPoint(viewingTeacher);
                  handleAwardPoint(e);
                }}
                style={{ display: 'grid', gridTemplateColumns: '100px 1fr auto', gap: '10px', alignItems: 'center' }}
              >
                <input
                  type="number"
                  className="admin-form-input"
                  value={pointForm.score}
                  onChange={(e) => setPointForm({ ...pointForm, score: Number(e.target.value) })}
                  placeholder="امتیاز"
                  required
                />
                <input
                  type="text"
                  className="admin-form-input"
                  value={pointForm.reason}
                  onChange={(e) => setPointForm({ ...pointForm, reason: e.target.value })}
                  placeholder="دلیل تشویق / ارزیابی..."
                  required
                />
                <button
                  type="submit"
                  className="btn-astra btn-astra-primary btn-astra-md"
                  disabled={pointSubmitting}
                >
                  {pointSubmitting ? <Loader2 size={14} className="spinner" /> : <Plus size={14} />}
                  ثبت امتیاز
                </button>
              </form>
            </div>

            {/* Teacher's Reports List */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 800 }}>
                گزارش‌های ثبت‌شده توسط این معلم ({toPersianDigits(viewingTeacherReports.length)})
              </h4>
              {loadingTeacherDetail ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Loader2 size={24} className="spinner" style={{ color: 'var(--primary)' }} />
                </div>
              ) : viewingTeacherReports.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  این معلم هنوز گزارشی ارسال نکرده است.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                  {viewingTeacherReports.map((rep) => (
                    <div
                      key={rep.id}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleOpenReportDetail(rep)}
                    >
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>{formatDate(rep.created_at)}</div>
                      <p style={{ margin: 0, fontSize: '0.83rem', color: '#334155', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {rep.text || 'بدون متن'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Points History for this teacher */}
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 800 }}>
                سوابق امتیازات این معلم ({toPersianDigits(viewingTeacherPoints.length)})
              </h4>
              {viewingTeacherPoints.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  هیچ سابقه امتیازی ثبت نشده است.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {viewingTeacherPoints.map((pt) => (
                    <div
                      key={pt.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.83rem',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#d97706' }}>+{toPersianDigits(pt.score)} امتیاز</span>
                      <span style={{ color: '#334155', flex: 1, margin: '0 12px' }}>{pt.reason}</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{formatDate(pt.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          DRAWER: REPORT DETAIL (Full Replication of report_detail.html)
      ====================================================================== */}
      {viewingReport && (
        <div className="admin-modal-overlay" onClick={() => setViewingReport(null)}>
          <div
            className="admin-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 900 }}>
                  جزئیات و ارزیابی گزارش #{viewingReport.id}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  ثبت‌شده توسط {viewingReport.teacher_name || 'معلم ناشناس'} ({viewingReport.teacher_school || viewingReport.teacher_city || ''}) در تاریخ {formatDate(viewingReport.created_at)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingReport(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Media Gallery / Lightbox triggers */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '10px' }}>رسانه‌های پیوست شده:</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                {viewingReport.images?.map((img: any) => (
                  <div
                    key={img.id}
                    style={{ height: '140px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #e2e8f0' }}
                    onClick={() => {
                      setActiveMediaUrl(img.url || img.image);
                      setActiveMediaType('image');
                    }}
                  >
                    <img src={img.url || img.image} alt="تصویر گزارش" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}

                {viewingReport.videos?.map((vid: any) => (
                  <div
                    key={vid.id}
                    style={{ position: 'relative', height: '140px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: '#0f172a' }}
                    onClick={() => {
                      setActiveMediaUrl(vid.url || vid.video);
                      setActiveMediaType('video');
                    }}
                  >
                    <video src={vid.url || vid.video} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div className="video-overlay-btn" style={{ width: '36px', height: '36px' }}>
                      <Play size={18} fill="#ffffff" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Report Text */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '8px' }}>متن کامل گزارش فعالیت:</div>
              <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.9rem', lineHeight: '2', color: '#1e293b', whiteSpace: 'pre-wrap' }}>
                {viewingReport.text || 'بدون توضیحات متنی'}
              </div>
            </div>

            {/* Tags */}
            {viewingReport.tags && viewingReport.tags.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '8px' }}>برچسب‌های موضوعی:</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {viewingReport.tags.map((tg: any) => (
                    <span key={tg.id} className="admin-badge admin-badge-neutral">#{tg.name}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Award Points Widget specifically for this Report */}
            <div style={{ padding: '18px', borderRadius: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#065f46', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={18} />
                ارزیابی و اعطای امتیاز به معلم برای این گزارش
              </div>

              <form onSubmit={handleAwardPointForReport} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '10px', alignItems: 'center' }}>
                <input
                  type="number"
                  className="admin-form-input"
                  value={reportPointScore}
                  onChange={(e) => setReportPointScore(Number(e.target.value))}
                  placeholder="امتیاز"
                  required
                />
                <input
                  type="text"
                  className="admin-form-input"
                  value={reportPointReason}
                  onChange={(e) => setReportPointReason(e.target.value)}
                  placeholder="دلیل ارزیابی و امتیازدهی..."
                  required
                />
                <button
                  type="submit"
                  className="btn-astra btn-astra-primary btn-astra-md"
                  disabled={reportPointSubmitting}
                >
                  {reportPointSubmitting ? <Loader2 size={14} className="spinner" /> : <Check size={14} />}
                  ثبت ارزیابی
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          DRAWER: SURVEY DETAIL & QUESTIONS (Full Replication of survey_detail.html)
      ====================================================================== */}
      {detailSurvey && (
        <div className="admin-modal-overlay" onClick={() => setDetailSurvey(null)}>
          <div
            className="admin-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>طراحی و مدیریت نظرسنجی</h3>
                  <span className={`admin-badge ${detailSurvey.is_active ? 'admin-badge-success' : 'admin-badge-neutral'}`}>
                    {detailSurvey.is_active ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.83rem', color: '#64748b' }}>
                  تعریف سؤالات چندگزینه‌ای یا تشریحی، و مشاهده پاسخ‌های ثبت‌شده معلمان
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDetailSurvey(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Survey Title & Description Editor */}
            <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '14px', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <label className="admin-form-label">عنوان نظرسنجی</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={detailSurvey.title}
                    onChange={(e) => setDetailSurvey({ ...detailSurvey, title: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                  <button
                    type="button"
                    className="btn-astra btn-astra-primary btn-astra-md"
                    onClick={handleSaveSurveyMetadata}
                  >
                    ذخیره مشخصات
                  </button>
                </div>
              </div>

              <div>
                <label className="admin-form-label">توضیحات نظرسنجی</label>
                <textarea
                  className="admin-form-input"
                  rows={2}
                  value={detailSurvey.description}
                  onChange={(e) => setDetailSurvey({ ...detailSurvey, description: e.target.value })}
                />
              </div>
            </div>

            {/* Questions Management */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>
                  سؤالات این نظرسنجی ({toPersianDigits(surveyQuestions.length)})
                </h4>
                <button
                  type="button"
                  className="btn-astra btn-astra-primary btn-astra-sm"
                  onClick={() => setShowAddQuestionModal(true)}
                >
                  <Plus size={14} />
                  افزودن سؤال جدید
                </button>
              </div>

              {loadingQuestions ? (
                <div style={{ padding: '30px', textAlign: 'center' }}>
                  <Loader2 size={24} className="spinner" style={{ color: 'var(--primary)' }} />
                </div>
              ) : surveyQuestions.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px' }}>
                  هنوز هیچ سؤالی برای این نظرسنجی افزوده نشده است.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {surveyQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--primary)' }}>سؤال {toPersianDigits(idx + 1)}:</span>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{q.text}</span>
                          <span className="admin-badge admin-badge-neutral" style={{ fontSize: '10px' }}>
                            {q.question_type === 'text' ? 'تشریحی' : q.question_type === 'single_choice' ? 'تک گزینه‌ای' : 'چند گزینه‌ای'}
                          </span>
                          {q.is_required && <span className="admin-badge admin-badge-warning" style={{ fontSize: '10px' }}>اجباری</span>}
                        </div>

                        {/* Options if choice */}
                        {q.options && q.options.length > 0 && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                            {q.options.map((opt: any, oIdx: number) => (
                              <span key={opt.id || oIdx} style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', color: '#475569' }}>
                                • {opt.text}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className="btn-astra btn-astra-danger btn-astra-sm"
                        onClick={() => handleDeleteQuestion(q.id)}
                        title="حذف این سؤال"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submissions & Participants List */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>
                  پاسخ‌های ثبت‌شده معلمان ({toPersianDigits(surveySubmissions.length)})
                </h4>
              </div>

              {loadingSubmissions ? (
                <div style={{ padding: '30px', textAlign: 'center' }}>
                  <Loader2 size={24} className="spinner" style={{ color: 'var(--primary)' }} />
                </div>
              ) : surveySubmissions.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px' }}>
                  هنوز پاسخی از سوی معلمان ثبت نشده است.
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>معلم</th>
                      <th>شماره تماس</th>
                      <th>تاریخ ثبت پاسخ</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surveySubmissions.map((sub) => (
                      <tr key={sub.id}>
                        <td style={{ fontWeight: 800 }}>{sub.user_name || `معلم #${sub.user}`}</td>
                        <td style={{ direction: 'ltr', textAlign: 'right' }}>{sub.user_phone || '-'}</td>
                        <td>{formatDate(sub.created_at)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-astra btn-astra-outline btn-astra-sm"
                            onClick={() => handleViewSubmissionAnswers(sub)}
                          >
                            <Eye size={13} />
                            مشاهده برگه پاسخ‌ها
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: ADD QUESTION TO SURVEY (With Dynamic Options)
      ====================================================================== */}
      {showAddQuestionModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAddQuestionModal(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>افزودن سؤال به نظرسنجی</h3>
              <button type="button" onClick={() => setShowAddQuestionModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="admin-form-label">متن سؤال *</label>
                <textarea
                  className="admin-form-input"
                  rows={2}
                  placeholder="متن کامل سؤال..."
                  value={newQuestionForm.text}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, text: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="admin-form-label">نوع سؤال</label>
                  <select
                    className="admin-form-input"
                    value={newQuestionForm.question_type}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, question_type: e.target.value as any })}
                  >
                    <option value="single_choice">تک گزینه‌ای (رادیویی)</option>
                    <option value="multiple_choice">چند گزینه‌ای (چک‌باکس)</option>
                    <option value="text">تشریحی (متنی)</option>
                  </select>
                </div>

                <div>
                  <label className="admin-form-label">شماره ترتیب</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    value={newQuestionForm.order}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, order: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="reqQ"
                  checked={newQuestionForm.is_required}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, is_required: e.target.checked })}
                />
                <label htmlFor="reqQ" style={{ fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                  پاسخگویی به این سؤال الزامی باشد
                </label>
              </div>

              {/* Dynamic Options for Choice Questions */}
              {newQuestionForm.question_type !== 'text' && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="admin-form-label" style={{ margin: 0 }}>گزینه‌های سؤال</label>
                    <button
                      type="button"
                      className="btn-astra btn-astra-outline btn-astra-sm"
                      onClick={() => setNewQuestionForm({ ...newQuestionForm, options: [...newQuestionForm.options, `گزینه جدید`] })}
                    >
                      <Plus size={12} />
                      افزودن گزینه
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {newQuestionForm.options.map((opt, i) => (
                      <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="admin-form-input"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newQuestionForm.options];
                            updated[i] = e.target.value;
                            setNewQuestionForm({ ...newQuestionForm, options: updated });
                          }}
                          placeholder={`متن گزینه ${i + 1}`}
                          required
                        />
                        {newQuestionForm.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = newQuestionForm.options.filter((_, idx) => idx !== i);
                              setNewQuestionForm({ ...newQuestionForm, options: updated });
                            }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn-astra btn-astra-primary btn-astra-md"
                disabled={questionSubmitting}
                style={{ marginTop: '8px', justifyContent: 'center' }}
              >
                {questionSubmitting ? <Loader2 size={16} className="spinner" /> : <Plus size={16} />}
                ذخیره سؤال در نظرسنجی
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: VIEW SUBMISSION ANSWERS
      ====================================================================== */}
      {viewingAnswers && (
        <div className="admin-modal-overlay" onClick={() => setViewingAnswers(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>
                  برگه پاسخ‌های {viewingAnswers.submission.user_name || 'معلم'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  ثبت‌شده در {formatDate(viewingAnswers.submission.created_at)}
                </span>
              </div>
              <button type="button" onClick={() => setViewingAnswers(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '65vh', overflowY: 'auto' }}>
              {viewingAnswers.answers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>پاسخی ثبت نگردیده است.</div>
              ) : (
                viewingAnswers.answers.map((ans, idx) => (
                  <div key={ans.id || idx} style={{ padding: '14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', marginBottom: '8px' }}>
                      سؤال: {ans.question_text || `سؤال #${ans.question}`}
                    </div>
                    {ans.text_answer ? (
                      <div style={{ fontSize: '0.85rem', color: '#334155', background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                        {ans.text_answer}
                      </div>
                    ) : ans.selected_options && ans.selected_options.length > 0 ? (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {ans.selected_options.map((opt: any) => (
                          <span key={opt.id} className="admin-badge admin-badge-primary">
                            ✓ {opt.text}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>بدون پاسخ</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: CREATE SURVEY
      ====================================================================== */}
      {showSurveyCreateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowSurveyCreateModal(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>ساخت نظرسنجی جدید</h3>
              <button type="button" onClick={() => setShowSurveyCreateModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSurvey} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="admin-form-label">عنوان نظرسنجی *</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="مثلاً: نظرسنجی کیفیت محتوای آموزشی پاییز..."
                  value={surveyCreateForm.title}
                  onChange={(e) => setSurveyCreateForm({ ...surveyCreateForm, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="admin-form-label">توضیحات و اهداف نظرسنجی</label>
                <textarea
                  className="admin-form-input"
                  rows={3}
                  placeholder="توضیحات تکمیلی برای راهنمایی معلمان شرکت‌کننده..."
                  value={surveyCreateForm.description}
                  onChange={(e) => setSurveyCreateForm({ ...surveyCreateForm, description: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="survActive"
                  checked={surveyCreateForm.is_active}
                  onChange={(e) => setSurveyCreateForm({ ...surveyCreateForm, is_active: e.target.checked })}
                />
                <label htmlFor="survActive" style={{ fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                  نظرسنجی بلافاصله پس از ایجاد فعال باشد
                </label>
              </div>

              <button
                type="submit"
                className="btn-astra btn-astra-primary btn-astra-md"
                disabled={surveySubmitting}
                style={{ marginTop: '8px', justifyContent: 'center' }}
              >
                {surveySubmitting ? <Loader2 size={16} className="spinner" /> : <Plus size={16} />}
                ایجاد نظرسنجی
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: EDIT TEACHER
      ====================================================================== */}
      {editingTeacher && (
        <div className="admin-modal-overlay" onClick={() => setEditingTeacher(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>
                ویرایش اطلاعات {editingTeacher.full_name || editingTeacher.first_name}
              </h3>
              <button type="button" onClick={() => setEditingTeacher(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTeacherEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="admin-form-label">نام</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={teacherEditForm.first_name}
                    onChange={(e) => setTeacherEditForm({ ...teacherEditForm, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="admin-form-label">نام خانوادگی</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={teacherEditForm.last_name}
                    onChange={(e) => setTeacherEditForm({ ...teacherEditForm, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="admin-form-label">شماره همراه</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={teacherEditForm.phone_number}
                    onChange={(e) => setTeacherEditForm({ ...teacherEditForm, phone_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="admin-form-label">کد ملی</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={teacherEditForm.national_id}
                    onChange={(e) => setTeacherEditForm({ ...teacherEditForm, national_id: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="admin-form-label">استان</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={teacherEditForm.province}
                    onChange={(e) => setTeacherEditForm({ ...teacherEditForm, province: e.target.value })}
                  />
                </div>
                <div>
                  <label className="admin-form-label">شهر</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={teacherEditForm.city}
                    onChange={(e) => setTeacherEditForm({ ...teacherEditForm, city: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="admin-form-label">نام مدرسه</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={teacherEditForm.school}
                  onChange={(e) => setTeacherEditForm({ ...teacherEditForm, school: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn-astra btn-astra-primary btn-astra-md"
                disabled={teacherUpdating}
                style={{ marginTop: '10px', justifyContent: 'center' }}
              >
                {teacherUpdating ? <Loader2 size={16} className="spinner" /> : <Check size={16} />}
                ذخیره تغییرات مشخصات
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: QUICK AWARD POINT
      ====================================================================== */}
      {selectedTeacherForPoint && (
        <div className="admin-modal-overlay" onClick={() => setSelectedTeacherForPoint(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>
                اعطای امتیاز به {selectedTeacherForPoint.full_name || selectedTeacherForPoint.first_name}
              </h3>
              <button type="button" onClick={() => setSelectedTeacherForPoint(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAwardPoint} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="admin-form-label">میزان امتیاز</label>
                <input
                  type="number"
                  className="admin-form-input"
                  value={pointForm.score}
                  onChange={(e) => setPointForm({ ...pointForm, score: Number(e.target.value) })}
                  min={1}
                  required
                />
              </div>

              <div>
                <label className="admin-form-label">دلیل / شرح امتیاز *</label>
                <textarea
                  className="admin-form-input"
                  rows={3}
                  placeholder="مثلاً: ارزیابی گزارش برتر هفتگی، فعالیت کلاسی ممتاز..."
                  value={pointForm.reason}
                  onChange={(e) => setPointForm({ ...pointForm, reason: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-astra btn-astra-primary btn-astra-md"
                disabled={pointSubmitting}
                style={{ marginTop: '8px', justifyContent: 'center' }}
              >
                {pointSubmitting ? <Loader2 size={16} className="spinner" /> : <Award size={16} />}
                ثبت و اعمال امتیاز در کارنامه
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          LIGHTBOX: MEDIA VIEWER (Image / Video Full Size)
      ====================================================================== */}
      {activeMediaUrl && (
        <div className="admin-lightbox-overlay" onClick={() => setActiveMediaUrl(null)}>
          <div className="admin-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="admin-lightbox-close"
              onClick={() => setActiveMediaUrl(null)}
            >
              <X size={22} />
            </button>

            {activeMediaType === 'video' ? (
              <video src={activeMediaUrl} controls autoPlay style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px' }} />
            ) : (
              <img src={activeMediaUrl} alt="نمایش بزرگ رسانه" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', objectFit: 'contain' }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
