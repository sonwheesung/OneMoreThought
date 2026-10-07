import { Intervention } from '@/modules/intervention';

/**
 * JS 쪽 진단 신호 · 결정 #20 · `docs/DIAGNOSTICS_SYSTEM.md`.
 * 버퍼는 네이티브 한 곳(`DiagLog.kt`)이다. JS 는 거기에 쓴다.
 *
 * 🔴 전역 크래시 핸들러: 처리되지 않은 JS 예외를 진단 버퍼에 남기고 **원래 핸들러로 넘긴다**
 *    (개발 빌드의 빨간 화면 · 출시 빌드의 종료를 그대로 둔다). 승계: 배구명가 `lib/deviceLog.ts installCrashHandler()`
 *    · *"전역 핸들러 부재가 갭이었다"*(배구명가 BACKEND §13.20 ④-0).
 * 🔴 기록이 앱을 막지 않는다. 실패는 삼킨다.
 */

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;
interface ErrorUtilsLike {
  getGlobalHandler(): GlobalHandler;
  setGlobalHandler(h: GlobalHandler): void;
}

export function logDiag(kind: string, fields: Record<string, unknown> = {}): void {
  try {
    Intervention?.logDiag(kind, JSON.stringify(fields));
  } catch {
    // 진단 기록 실패로 앱을 멈추지 않는다
  }
}

let installed = false;

export function installJsCrashHandler(): void {
  if (installed) return;
  const eu = (globalThis as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
  if (!eu) return;
  installed = true;
  const prev = eu.getGlobalHandler();
  eu.setGlobalHandler((error, isFatal) => {
    const e = error instanceof Error ? error : new Error(String(error));
    logDiag(isFatal ? 'crash_js_fatal' : 'crash_js', {
      error: `${e.name}: ${e.message}`,
      stack: (e.stack ?? '').split('\n').slice(0, 12).join('\n'),
    });
    prev(error, isFatal);
  });
}
