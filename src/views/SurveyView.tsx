import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Send,
  Loader2,
  Calendar,
  CheckSquare,
  HelpCircle,
} from 'lucide-react';
import { api } from '../api';

interface SurveyViewProps {
  onNavigate: (view: string) => void;
}

interface SurveyListItem {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

interface QuestionOption {
  id: number;
  text: string;
}

interface SurveyQuestion {
  id: number;
  text: string;
  question_type: 'text' | 'single_choice' | 'multiple_choice';
  is_required: boolean;
  options: QuestionOption[];
}

interface SurveyDetail {
  id: number;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  has_submitted: boolean;
}

export const SurveyView: React.FC<SurveyViewProps> = ({ onNavigate }) => {
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Active survey detail state
  const [activeSurveyId, setActiveSurveyId] = useState<number | null>(null);
  const [surveyDetail, setSurveyDetail] = useState<SurveyDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form answers state: { [questionId]: { text_answer?: string, selected_options?: number[] } }
  const [answers, setAnswers] = useState<
    Record<number, { text_answer?: string; selected_options?: number[] }>
  >({});

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch list of surveys
  useEffect(() => {
    const fetchSurveys = async () => {
      setLoadingList(true);
      try {
        const data = await api.getSurveys();
        setSurveys(data);
      } catch (err: any) {
        console.error('Failed to load surveys:', err);
      } finally {
        setLoadingList(false);
      }
    };
    fetchSurveys();
  }, []);

  // Open a specific survey
  const handleOpenSurvey = async (id: number) => {
    setActiveSurveyId(id);
    setLoadingDetail(true);
    setErrorMsg('');
    setSuccessMsg('');
    setAnswers({});

    try {
      const detail = await api.getSurveyDetail(id);
      setSurveyDetail(detail);

      // Pre-initialize answers map
      const init: Record<number, { text_answer?: string; selected_options?: number[] }> = {};
      detail.questions.forEach((q) => {
        init[q.id] = {
          text_answer: '',
          selected_options: [],
        };
      });
      setAnswers(init);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در بارگذاری اطلاعات نظرسنجی.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Back to list
  const handleBackToList = () => {
    setActiveSurveyId(null);
    setSurveyDetail(null);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Text answer change
  const handleTextAnswerChange = (qId: number, val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], text_answer: val },
    }));
  };

  // Single choice answer change
  const handleSingleChoiceChange = (qId: number, optionId: number) => {
    const numId = Number(optionId);
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || {}),
        selected_options: [numId],
      },
    }));
  };

  // Multiple choice answer toggle
  const handleMultiChoiceToggle = (qId: number, optionId: number) => {
    const numId = Number(optionId);
    setAnswers((prev) => {
      const current = (prev[qId]?.selected_options || []).map(Number);
      const updated = current.includes(numId)
        ? current.filter((id) => id !== numId)
        : [...current, numId];
      return {
        ...prev,
        [qId]: {
          ...(prev[qId] || {}),
          selected_options: updated,
        },
      };
    });
  };

  // Submit survey responses
  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyDetail) return;
    setErrorMsg('');
    setSuccessMsg('');

    // Validation
    for (const q of surveyDetail.questions) {
      if (q.is_required) {
        const a = answers[q.id];
        if (q.question_type === 'text') {
          if (!a?.text_answer?.trim()) {
            setErrorMsg(`پاسخ به سوال «${q.text}» الزامی است.`);
            return;
          }
        } else {
          if (!a?.selected_options || a.selected_options.length === 0) {
            setErrorMsg(`انتخاب گزینه برای سوال «${q.text}» الزامی است.`);
            return;
          }
        }
      }
    }

    // Format payload
    const payload = Object.entries(answers).map(([qIdStr, ans]) => ({
      question_id: Number(qIdStr),
      text_answer: ans.text_answer || '',
      selected_options: ans.selected_options || [],
    }));

    setSubmitting(true);
    try {
      const res = await api.submitSurvey(surveyDetail.id, payload);
      setSuccessMsg(res.detail || 'پاسخ‌های شما با موفقیت ثبت گردید.');
      setSurveyDetail((prev) => (prev ? { ...prev, has_submitted: true } : null));
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ثبت پاسخ‌ها. لطفاً دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="main-wrapper" style={{ maxWidth: '900px' }}>
      {/* View Header */}
      <div style={{ marginBottom: '32px' }}>
        <span className="eyebrow">
          <span className="line" /> همراهی معلمان
        </span>
        <h1 style={{ margin: '8px 0', fontSize: '2rem', fontWeight: 800 }}>
          پرسشنامه‌ها و نظرسنجی‌های سامانه
        </h1>
        <p style={{ margin: 0, color: 'var(--muted-foreground)', fontSize: '0.95rem' }}>
          نظرات و بازخوردهای ارزنده‌ی شما، راهنمای تدوین برنامه‌ها و ارتقای فعالیت‌های تربیتی است.
        </p>
      </div>

      {/* Mode 1: Detailed Survey View */}
      {activeSurveyId && surveyDetail ? (
        <div>
          <button
            type="button"
            className="btn-astra btn-astra-outline btn-astra-sm"
            onClick={handleBackToList}
            style={{ marginBottom: '24px' }}
          >
            <ArrowRight size={16} />
            بازگشت به لیست نظرسنجی‌ها
          </button>

          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              padding: '30px 28px',
              marginBottom: '24px',
            }}
          >
            <h2 style={{ margin: '0 0 10px', fontSize: '1.4rem', fontWeight: 800 }}>
              {surveyDetail.title}
            </h2>
            {surveyDetail.description && (
              <p style={{ margin: 0, color: 'var(--muted-foreground)', lineHeight: 1.8, fontSize: '0.94rem' }}>
                {surveyDetail.description}
              </p>
            )}
          </div>

          {surveyDetail.has_submitted ? (
            <div
              style={{
                background: 'var(--success-bg)',
                border: '1.5px solid #a3d9a5',
                borderRadius: 'var(--radius)',
                padding: '32px 24px',
                textAlign: 'center',
                color: 'var(--success)',
              }}
            >
              <CheckCircle size={48} style={{ margin: '0 auto 14px', display: 'block' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800 }}>
                پاسخ‌های شما قبلاً در سامانه ثبت شده است
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '0.9rem', color: '#2a5a2d', lineHeight: 1.8 }}>
                از اینکه وقت ارزشمند خود را برای مشارکت در این نظرسنجی اختصاص داده‌اید صمیمانه سپاسگزاریم.
              </p>
              <button
                type="button"
                className="btn-astra btn-astra-primary btn-astra-sm"
                onClick={handleBackToList}
              >
                بازگشت به سایر نظرسنجی‌ها
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitSurvey}>
              {errorMsg && (
                <div
                  className="banner banner-error"
                  style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--danger-bg)',
                    color: 'var(--danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px',
                    fontSize: '0.92rem',
                  }}
                >
                  <AlertCircle size={20} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div
                  className="banner banner-success"
                  style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--success-bg)',
                    color: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px',
                    fontSize: '0.92rem',
                  }}
                >
                  <CheckCircle size={20} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Questions List */}
              {surveyDetail.questions.map((q, idx) => (
                <div key={q.id} className="question-card">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                      <span
                        style={{
                          background: 'var(--primary-light)',
                          color: 'var(--primary)',
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.7 }}>
                        {q.text}
                      </h4>
                    </div>

                    {q.is_required ? (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--danger)',
                          background: 'var(--danger-bg)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          whiteSpace: 'nowrap',
                          fontWeight: 600,
                        }}
                      >
                        الزامی
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--muted-foreground)',
                          background: '#f1f1eb',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        اختیاری
                      </span>
                    )}
                  </div>

                  {/* Render Question Inputs based on Type */}
                  {q.question_type === 'text' && (
                    <textarea
                      className="form-control"
                      rows={4}
                      value={answers[q.id]?.text_answer || ''}
                      onChange={(e) => handleTextAnswerChange(q.id, e.target.value)}
                      placeholder="پاسخ خود را در این بخش بنویسید..."
                    />
                  )}

                  {q.question_type === 'single_choice' && (
                    <div>
                      {(!q.options || q.options.length === 0) && (
                        <div style={{ color: 'var(--muted-foreground)', fontSize: '0.86rem', fontStyle: 'italic', padding: '6px 0' }}>
                          گزینه‌ای برای این سوال ثبت نشده است.
                        </div>
                      )}
                      {q.options?.map((opt) => {
                        const isSelected = Boolean(
                          answers[q.id]?.selected_options?.some((id) => Number(id) === Number(opt.id))
                        );
                        return (
                          <div
                            key={opt.id}
                            role="button"
                            tabIndex={0}
                            className={`option-choice-label ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSingleChoiceChange(q.id, opt.id)}
                            onKeyDown={(e) => {
                              if (e.key === ' ' || e.key === 'Enter') {
                                e.preventDefault();
                                handleSingleChoiceChange(q.id, opt.id);
                              }
                            }}
                          >
                            <span
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                border: isSelected ? '6px solid var(--primary)' : '2px solid #a6b5a3',
                                background: '#fff',
                                display: 'inline-block',
                                flexShrink: 0,
                                transition: 'all 0.15s ease',
                              }}
                            />
                            <span style={{ flex: 1, userSelect: 'none' }}>{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.question_type === 'multiple_choice' && (
                    <div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--muted-foreground)',
                          marginBottom: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <HelpCircle size={14} />
                        می‌توانید چند گزینه را هم‌زمان انتخاب فرمایید.
                      </div>
                      {(!q.options || q.options.length === 0) && (
                        <div style={{ color: 'var(--muted-foreground)', fontSize: '0.86rem', fontStyle: 'italic', padding: '6px 0' }}>
                          گزینه‌ای برای این سوال ثبت نشده است.
                        </div>
                      )}
                      {q.options?.map((opt) => {
                        const isSelected = Boolean(
                          answers[q.id]?.selected_options?.some((id) => Number(id) === Number(opt.id))
                        );
                        return (
                          <div
                            key={opt.id}
                            role="button"
                            tabIndex={0}
                            className={`option-choice-label ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleMultiChoiceToggle(q.id, opt.id)}
                            onKeyDown={(e) => {
                              if (e.key === ' ' || e.key === 'Enter') {
                                e.preventDefault();
                                handleMultiChoiceToggle(q.id, opt.id);
                              }
                            }}
                          >
                            <span
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '5px',
                                border: isSelected ? 'none' : '2px solid #a6b5a3',
                                background: isSelected ? 'var(--primary)' : '#fff',
                                display: 'grid',
                                placeItems: 'center',
                                color: '#fff',
                                flexShrink: 0,
                                fontSize: '13px',
                                fontWeight: 'bold',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {isSelected && '✓'}
                            </span>
                            <span style={{ flex: 1, userSelect: 'none' }}>{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '14px', marginTop: '28px' }}>
                <button
                  type="submit"
                  className="btn-astra btn-astra-primary btn-astra-lg"
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="spinner" />
                      در حال ارسال پاسخ‌ها...
                    </>
                  ) : (
                    <>
                      ثبت نهایی پاسخ‌ها
                      <Send size={18} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn-astra btn-astra-outline btn-astra-lg"
                  onClick={handleBackToList}
                  disabled={submitting}
                >
                  انصراف
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* Mode 2: List of Surveys */
        <div>
          {loadingList ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#ffffff',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
              }}
            >
              <Loader2
                size={36}
                className="spinner"
                style={{ color: 'var(--primary)', marginBottom: '12px' }}
              />
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                در حال بارگذاری لیست نظرسنجی‌ها...
              </p>
            </div>
          ) : surveys.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#ffffff',
                borderRadius: 'var(--radius)',
                border: '1.5px dashed var(--border)',
              }}
            >
              <ClipboardList
                size={48}
                style={{ color: 'var(--muted-foreground)', marginBottom: '16px', opacity: 0.5 }}
              />
              <h4 style={{ margin: '0 0 8px', fontSize: '1.15rem' }}>
                در حال حاضر نظرسنجی فعالی وجود ندارد
              </h4>
              <p
                style={{
                  color: 'var(--muted-foreground)',
                  fontSize: '0.9rem',
                  maxWidth: '380px',
                  margin: '0 auto',
                  lineHeight: 1.8,
                }}
              >
                به محض انتشار پرسشنامه یا نظرسنجی جدید در سامانه، در این بخش قابل مشاهده خواهد بود.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {surveys.map((survey) => (
                <div
                  key={survey.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '26px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.82rem',
                        color: 'var(--muted-foreground)',
                        marginBottom: '8px',
                      }}
                    >
                      <Calendar size={14} />
                      تاریخ انتشار: {formatDate(survey.created_at)}
                    </div>
                    <h3 style={{ margin: '0 0 10px', fontSize: '1.25rem', fontWeight: 800 }}>
                      {survey.title}
                    </h3>
                    {survey.description && (
                      <p
                        style={{
                          margin: 0,
                          color: 'var(--muted-foreground)',
                          fontSize: '0.92rem',
                          lineHeight: 1.8,
                        }}
                      >
                        {survey.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
                    <button
                      type="button"
                      className="btn-astra btn-astra-primary btn-astra-sm"
                      onClick={() => handleOpenSurvey(survey.id)}
                      disabled={loadingDetail && activeSurveyId === survey.id}
                    >
                      {loadingDetail && activeSurveyId === survey.id ? (
                        <>
                          <Loader2 size={16} className="spinner" />
                          در حال بارگذاری...
                        </>
                      ) : (
                        <>
                          ورود به نظرسنجی و پاسخ‌گویی
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
