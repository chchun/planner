// 시드 — 테이블이 비어 있을 때만 실행. Phase 1 mock(docs/SPEC.md §8)을 실제 오늘 기준으로 이식.
import bcrypt from "bcryptjs";
import { q } from "./db.js";

const day = (offset: number, h: number, m = 0): Date => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(h, m, 0, 0);
  return d;
};

export async function seedIfEmpty(): Promise<void> {
  const users = await q<{ n: string }>("SELECT COUNT(*)::text AS n FROM users");
  if (Number(users[0].n) > 0) return;
  console.log("[seed] empty database — seeding…");

  const hash = bcrypt.hashSync("planner123", 10);
  await q(
    `INSERT INTO users (username, password_hash, display_name, role, grade_label) VALUES
     ('siyoon', $1, '전시윤', 'student', '고등학교 2학년'),
     ('mom',    $1, '엄마',   'parent',  '학부모'),
     ('dad',    $1, '아빠',   'parent',  '학부모')`,
    [hash],
  );

  await q(`INSERT INTO subjects (name, color, sort) VALUES
    ('수학','#4f46e5',0),('영어','#0ea5e9',1),('국어','#f97316',2),('과학','#10b981',3),('사회','#a855f7',4)`);

  // 할일 — 납기 포함. 이월(과거 납기) 2건은 대시보드 이월 위젯의 소스가 된다 (spec R-13)
  const todo = async (
    title: string, prio: string, source: string, done: boolean, dueAt: Date | null, subs: Array<[string, boolean]> = [],
  ) => {
    const [row] = await q<{ id: string }>(
      "INSERT INTO todos (title, prio, source, done, due_at) VALUES ($1,$2,$3,$4,$5) RETURNING id",
      [title, prio, source, done, dueAt],
    );
    for (let i = 0; i < subs.length; i++) {
      await q("INSERT INTO todo_subtasks (todo_id, title, done, sort) VALUES ($1,$2,$3,$4)", [
        row.id, subs[i][0], subs[i][1], i,
      ]);
    }
  };
  await todo("수학 학원 숙제 (미적분 p.45-50)", "high", "수학 학원", false, day(0, 18), [
    ["45-47p 필수 문제", true], ["48-50p 심화 문제", false], ["오답 노트 정리", false],
  ]);
  await todo("통합과학 수행평가 자료 조사", "mid", "학교", false, day(1, 9), [
    ["주제 3개 선정", false], ["참고문헌 정리", false],
  ]);
  await todo("영어 단어 100개 암기", "low", "영어 학원", true, day(0, 15));
  await todo("국어 비문학 지문 2개 풀이", "mid", "인강", false, day(1, 23, 59));
  await todo("물리 개념 정리 노트", "mid", "물리 학원", false, day(3, 20));
  await todo("화학 실험 보고서 작성", "high", "학교", false, day(-1, 23, 59));
  await todo("수학 문제집 30문항", "mid", "수학 학원", false, day(-2, 22));

  await q(`INSERT INTO plan_items (subject, goal_min, memo, done, sort) VALUES
    ('수학',120,'미적분 문제집 p.45-50',false,0),
    ('영어',60,'단어 100개 + 독해 2지문',true,1),
    ('국어',45,'비문학 지문 2개 풀이',false,2),
    ('과학',90,'통합과학 수행평가 자료',false,3)`);

  await q(`INSERT INTO timetable_blocks (subject, start_h, end_h) VALUES
    ('국어',7,8),('수학',9,11),('영어',13,14.5),('과학',16,18),('수학',20,22)`);

  // 이번 달 일정 — mock의 날짜 간격을 오늘 기준 상대 배치로 이식
  const ev = (offset: number, h: number, m: number, title: string, type: string) =>
    q("INSERT INTO calendar_events (title, type, start_at) VALUES ($1,$2,$3)", [title, type, day(offset, h, m)]);
  await ev(-2, 11, 0, "독서실 자습", "sched");
  await ev(-1, 23, 59, "수학 학원 과제 마감", "hw");
  await ev(0, 16, 0, "수학 학원 수업", "sched");
  await ev(0, 18, 0, "수학 학원 숙제 제출", "hw");
  await ev(1, 9, 0, "통합과학 수행평가", "hw");
  await ev(2, 15, 30, "학교 방과후 수업", "sched");
  await ev(4, 14, 0, "영어 학원", "sched");
  await ev(4, 23, 59, "국어 독서록 마감", "hw");
  await ev(8, 23, 59, "영어 단어 시험 범위", "hw");
  await ev(11, 10, 0, "전국 모의고사", "sched");

  await q(`INSERT INTO memos (folder, color, text, done) VALUES
    ('수학','#fef9c3',E'미적분 극한 공식 정리\\n좌극한 / 우극한 반드시 확인!',false),
    ('시험','#fce7f3',E'통합과학 수행평가 3주차 제출\\n실험 결과 사진 첨부 필수',false),
    ('영어','#dbeafe','관계대명사 계속적 용법 예문 5개 암기하기',false),
    ('아이디어','#dcfce7',E'주말 공부 계획\\n오전 수학 / 오후 영어 인강',false),
    ('국어','#ede9fe','비문학 오답 노트 — 지문 사진 캡처해서 붙여두기',true)`);

  // 타이머 세션 — mock 누적(오늘/주)을 세션으로 분해해 시드
  const [student] = await q<{ id: string }>("SELECT id FROM users WHERE username='siyoon'");
  const todaySec: Record<string, number> = { 수학: 4800, 영어: 2700, 국어: 1800, 과학: 3900, 사회: 0 };
  const weekSec: Record<string, number> = { 수학: 28800, 영어: 18000, 국어: 12600, 과학: 21600, 사회: 7200 };
  const dow = (new Date().getDay() + 6) % 7; // 월=0
  for (const name of Object.keys(todaySec)) {
    if (todaySec[name] > 0) {
      const end = day(0, 12, 0);
      const start = new Date(end.getTime() - todaySec[name] * 1000);
      await q("INSERT INTO timer_sessions (user_id, subject, started_at, ended_at) VALUES ($1,$2,$3,$4)",
        [student.id, name, start, end]);
    }
    // 주 누적 잔여분을 이번 주 과거 요일에 균등 분배
    const rest = weekSec[name] - todaySec[name];
    const pastDays = Math.max(1, dow);
    for (let i = 0; i < Math.min(dow, pastDays); i++) {
      const sec = Math.floor(rest / pastDays);
      if (sec <= 0) continue;
      const end = day(i - dow, 20, 0);
      const start = new Date(end.getTime() - sec * 1000);
      await q("INSERT INTO timer_sessions (user_id, subject, started_at, ended_at) VALUES ($1,$2,$3,$4)",
        [student.id, name, start, end]);
    }
  }
  console.log("[seed] done");
}
