"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LoaderCircle,
  Pencil,
  Save,
  XCircle,
} from "lucide-react";
import { fetchMonthlyAttendance, saveTeacherAttendance } from "./attendance-client";
import {
  ATTENDANCE_STATUS_LABEL,
  type GrowthAttendanceRecord,
  type GrowthAttendanceStatus,
  type MonthlyAttendanceResponse,
} from "./types";
import styles from "./MonthlyAttendancePanel.module.css";

interface MonthlyAttendancePanelProps {
  accessToken: string;
  studentId: string;
  editable?: boolean;
}

const STATUS_OPTIONS = Object.entries(ATTENDANCE_STATUS_LABEL) as Array<
  [GrowthAttendanceStatus, string]
>;

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function dateForMonth(month: string) {
  const today = new Date();
  const todayKey = currentMonthKey();
  return month === todayKey
    ? `${todayKey}-${String(today.getDate()).padStart(2, "0")}`
    : `${month}-01`;
}

function moveMonth(month: string, offset: number) {
  const [year, value] = month.split("-").map(Number);
  const shifted = new Date(year, value - 1 + offset, 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [year, value] = month.split("-").map(Number);
  return `${year}년 ${value}월`;
}

function dateLabel(value: string) {
  const [, month, day] = value.split("-").map(Number);
  return `${month}월 ${day}일`;
}

function recordIcon(status: GrowthAttendanceStatus) {
  if (status === "present" || status === "makeup") return <CheckCircle2 size={17} />;
  if (status === "absent") return <XCircle size={17} />;
  return <Clock3 size={17} />;
}

export function MonthlyAttendancePanel({
  accessToken,
  studentId,
  editable = false,
}: MonthlyAttendancePanelProps) {
  const [month, setMonth] = useState(currentMonthKey);
  const [attendance, setAttendance] = useState<MonthlyAttendanceResponse | null>(null);
  const [resolvedRequestKey, setResolvedRequestKey] = useState<string | null>(null);
  const [failedRequestKey, setFailedRequestKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [classDate, setClassDate] = useState(() => dateForMonth(currentMonthKey()));
  const [status, setStatus] = useState<GrowthAttendanceStatus>("present");
  const [lessonTitle, setLessonTitle] = useState("정규 수업");
  const [note, setNote] = useState("");
  const requestKey = `${studentId}:${month}`;
  const isLoading = resolvedRequestKey !== requestKey && failedRequestKey !== requestKey;

  useEffect(() => {
    let active = true;
    fetchMonthlyAttendance(accessToken, studentId, month)
      .then((result) => {
        if (active) {
          setAttendance(result);
          setResolvedRequestKey(requestKey);
          setFailedRequestKey(null);
          setErrorMessage("");
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setAttendance(null);
          setResolvedRequestKey(null);
          setFailedRequestKey(requestKey);
          setErrorMessage(error instanceof Error ? error.message : "출석 정보를 불러오지 못했어요.");
        }
      });
    return () => {
      active = false;
    };
  }, [accessToken, month, requestKey, studentId]);

  const summary = attendance?.data.summary;
  const completionRate = useMemo(() => {
    if (!summary?.scheduled) return 0;
    return Math.round((summary.completed / summary.scheduled) * 100);
  }, [summary]);

  const beginEdit = (record: GrowthAttendanceRecord) => {
    setRecordId(record.id);
    setClassDate(record.class_date);
    setStatus(record.status);
    setLessonTitle(record.lesson_title);
    setNote(record.note ?? "");
    setMessage("");
    setErrorMessage("");
  };

  const resetEditor = () => {
    setRecordId(null);
    setClassDate(dateForMonth(month));
    setStatus("present");
    setLessonTitle("정규 수업");
    setNote("");
  };

  const selectMonth = (nextMonth: string) => {
    setMessage("");
    setErrorMessage("");
    setRecordId(null);
    setClassDate(dateForMonth(nextMonth));
    setStatus("present");
    setLessonTitle("정규 수업");
    setNote("");
    setMonth(nextMonth);
  };

  const saveRecord = async () => {
    if (isSaving) return;
    if (!classDate.startsWith(`${month}-`)) {
      setErrorMessage("선택한 달 안의 수업 날짜를 입력해 주세요.");
      return;
    }
    const title = lessonTitle.trim();
    if (!title) {
      setErrorMessage("수업 이름을 입력해 주세요.");
      return;
    }
    setIsSaving(true);
    setErrorMessage("");
    setMessage("");
    try {
      await saveTeacherAttendance(accessToken, {
        studentId,
        recordId,
        classDate,
        status,
        lessonTitle: title,
        note: note.trim(),
      });
      const refreshed = await fetchMonthlyAttendance(accessToken, studentId, month);
      setAttendance(refreshed);
      setMessage(recordId ? "출석 기록을 수정했습니다." : "출석 기록을 저장했습니다.");
      resetEditor();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "출석 기록을 저장하지 못했어요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={styles.panel} aria-labelledby={`attendance-title-${studentId}`}>
      <div className={styles.headingRow}>
        <div className={styles.headingCopy}>
          <span className={styles.icon}><CalendarDays size={21} /></span>
          <div>
            <p>월 수강 기준</p>
            <h2 id={`attendance-title-${studentId}`}>{monthLabel(month)} 출석 현황</h2>
            <span>학습 평가는 매주, 출석은 한 달 단위로 확인합니다.</span>
          </div>
        </div>
        <div className={styles.monthControls} aria-label="출석 확인 월 선택">
          <button type="button" aria-label="이전 달 출석 보기" onClick={() => selectMonth(moveMonth(month, -1))}>
            <ChevronLeft size={18} />
          </button>
          <strong aria-live="polite">{monthLabel(month)}</strong>
          <button type="button" aria-label="다음 달 출석 보기" onClick={() => selectMonth(moveMonth(month, 1))}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading} aria-live="polite"><LoaderCircle size={19} /> 출석 정보를 불러오는 중</div>
      ) : errorMessage && !attendance ? (
        <p className={styles.error} role="status">{errorMessage}</p>
      ) : attendance && summary ? (
        <>
          <div className={styles.metrics}>
            <div><strong>{summary.completed}/{summary.scheduled}</strong><span>수업 이수</span></div>
            <div><strong>{summary.present}회</strong><span>출석</span></div>
            <div><strong>{summary.absent}회</strong><span>결석</span></div>
            <div><strong>{summary.makeup}회</strong><span>보강 완료</span></div>
            <div><strong>{summary.upcoming}회</strong><span>예정 수업</span></div>
          </div>

          <div className={styles.progressBlock}>
            <div><span>수업 이수율</span><strong>{completionRate}%</strong></div>
            <div className={styles.progressTrack} role="progressbar" aria-label={`${monthLabel(month)} 수업 이수율`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionRate}>
              <span style={{ width: `${Math.min(completionRate, 100)}%` }} />
            </div>
          </div>

          {editable ? (
            <div className={styles.editor}>
              <div className={styles.editorHeading}>
                <div><strong>{recordId ? "출석 기록 수정" : "출석 기록 추가"}</strong><span>선생님만 저장할 수 있습니다.</span></div>
                {recordId ? <button type="button" onClick={resetEditor}>새 기록으로 돌아가기</button> : null}
              </div>
              <div className={styles.editorGrid}>
                <label>수업 날짜<input type="date" value={classDate} min={`${month}-01`} max={attendance.period.month_end} onChange={(event) => setClassDate(event.target.value)} /></label>
                <label>출석 상태<select value={status} onChange={(event) => setStatus(event.target.value as GrowthAttendanceStatus)}>{STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label>수업 이름<input type="text" maxLength={120} value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} /></label>
                <label>메모(선택)<input type="text" maxLength={300} value={note} onChange={(event) => setNote(event.target.value)} placeholder="예: 감기 결석, 토요일 보강" /></label>
              </div>
              <button className={styles.saveButton} type="button" disabled={isSaving} onClick={saveRecord}>
                {isSaving ? <><LoaderCircle size={17} /> 저장 중</> : <><Save size={17} /> {recordId ? "수정 내용 저장" : "출석 기록 저장"}</>}
              </button>
              {errorMessage ? <p className={styles.error} role="status">{errorMessage}</p> : null}
              {message ? <p className={styles.success} role="status">{message}</p> : null}
            </div>
          ) : null}

          <div className={styles.records}>
            <h3>날짜별 출석 기록</h3>
            {attendance.data.records.length ? (
              <ul>
                {attendance.data.records.map((record) => (
                  <li key={record.id}>
                    <span className={`${styles.statusIcon} ${styles[record.status]}`}>{recordIcon(record.status)}</span>
                    <div><strong>{dateLabel(record.class_date)} · {record.lesson_title}</strong>{record.note ? <span>{record.note}</span> : null}</div>
                    <em className={styles[record.status]}>{ATTENDANCE_STATUS_LABEL[record.status]}</em>
                    {editable ? <button type="button" aria-label={`${dateLabel(record.class_date)} ${record.lesson_title} 수정`} onClick={() => beginEdit(record)}><Pencil size={15} /> 수정</button> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>이 달에 등록된 출석 기록이 아직 없습니다.</p>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
