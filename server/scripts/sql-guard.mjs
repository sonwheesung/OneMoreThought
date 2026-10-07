/**
 * 마이그레이션 SQL 이 intervene 스키마 밖을 건드리지 않는지 실행 전에 잰다(docs/DATABASE.md §5).
 * 🔴 조각 운영 DB 에 적용되므로 "규칙을 지켰겠지"가 아니라 문장마다 기계로 본다.
 */

/** `--` 주석을 지우고 `;` 로 나눈다. 문자열 안의 `;` 는 쓰지 않는다(마이그레이션에 그런 문자열이 없다 · 있으면 검사가 죽는다) */
export function splitStatements(sql) {
  const noComments = sql
    .split(/\r?\n/) // 🔴 Windows 체크아웃은 CRLF 다. \r 이 남으면 주석이 안 지워진다(2026-10-08 실측)
    .map((l) => l.replace(/--.*$/, ''))
    .join('\n');
  return noComments
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** @returns 문제가 있으면 이유, 없으면 null */
export function checkStatement(stmt) {
  if (/'/.test(stmt)) {
    // 문자열 리터럴이 있으면 아래 점 이름 검사가 속을 수 있다. CHECK 의 값 목록만 허용한다
    const stripped = stmt.replace(/IN \(('[a-z_]+',?\s*)+\)/gi, 'IN (...)');
    if (/'/.test(stripped)) return '문자열 리터럴은 CHECK 의 값 목록에만 쓴다';
    stmt = stripped;
  }
  if (!/\bintervene(\.|_app\b|\s|;|$)/i.test(stmt)) return 'intervene 을 가리키지 않는 문장';
  if (/search_path/i.test(stmt)) return 'search_path 를 바꾸지 않는다';
  for (const m of stmt.matchAll(/\bSCHEMA\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]*)/gi)) {
    if (m[1].toLowerCase() !== 'intervene') return `intervene 이 아닌 스키마: ${m[1]}`;
  }
  for (const m of stmt.matchAll(/\b([a-z_][a-z0-9_]*)\s*\.\s*([a-z_][a-z0-9_]*)/gi)) {
    if (m[1].toLowerCase() !== 'intervene') return `intervene 밖의 이름: ${m[1]}.${m[2]}`;
  }
  return null;
}

/** 파일 하나 전체. 문제 목록을 돌려준다 */
export function checkSql(sql) {
  const problems = [];
  for (const s of splitStatements(sql)) {
    const why = checkStatement(s);
    if (why) problems.push(`${why} :: ${s.slice(0, 80).replace(/\s+/g, ' ')}`);
  }
  return problems;
}
