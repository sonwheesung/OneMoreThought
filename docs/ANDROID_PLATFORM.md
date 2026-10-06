# ANDROID_PLATFORM — 감지 · 화면 띄우기 · 알림 · 권한 · Play 정책

> 정본 관계: 규칙이 **언제** 발동하나는 [`RULE_SYSTEM.md`](./RULE_SYSTEM.md), **어떻게** 감지하고 띄우나는 이 문서다.
> 🔴 **이 앱의 존립은 Play 정책에 걸려 있다**(기획서 §22 *"접근성 API 사용 목적과 Play 정책을 개발 초기 단계에서 먼저 검증해야 한다"*).
> 정책 · API 사실은 **이 문서 한 곳에만** 출처와 함께 적고, 다른 문서는 여기를 가리킨다(`DOC_DISCIPLINE.md` §8).
>
> 작성 2026-10-06. 출처 조사는 같은 날 서브 에이전트가 공식 페이지를 읽어 모았다.
> 각 줄의 확신도: **✔ 공식 페이지에서 확인** · **△ 추론 또는 비공식 출처**(구현 · 심사 전에 다시 확인한다).
> ⚠ developer.android.com 의 `UsageStatsManager` · `AccessibilityService` API 참조 본문은 그날 렌더링되지 않아 검색 요약으로 읽었다. 해당 줄은 △ 다.

---

## 0. 구현 현황

| 영역 | 상태 | 비고 |
|---|---|---|
| 감지 방식 확정(§2) | ✅ 2026-10-06 결정 #10 | 🔴 실기기 확인은 Phase 0 스파이크(§9) · 막히면 다시 연다 |
| 네이티브 모듈 골격(§6) | ❌ | Phase 0 · SnoreLess `modules/alarm-tone` 선례 |
| 확인 화면 띄우기(§3) | ❌ | Phase 2 |
| 실행 확인 알람 · 재부팅(§4) | ❌ | Phase 3 |
| 설치 앱 목록(§5) | ❌ | Phase 1 |
| 권한 온보딩 · 접근성 공개 문구(§7) | ❌ | Phase 2 · 🔴 Play 심사 대상 |
| 정책 원문 대조 · 실제 사례 조사(§8 · `review/`) | ✅ 2026-10-06 | 추천안 유지 · 정정 1건(규칙 기반 예외의 출처) |
| Play 접근성 선언 · 시연 영상(§8) | ❌ | Phase 6 · 🔴 출시 차단 |

---

## 1. 결론 먼저 (결정 #10 · 2026-10-06)

| 기능 | 추천 방식 | 피하는 것 |
|---|---|---|
| A. 실행 전 확인 | **접근성 서비스**(`AccessibilityService`)가 창 전환 이벤트로 대상 앱을 감지 → **접근성 오버레이 창** 또는 우리 Activity 로 확인 화면 | 다른 앱 위에 그리기(`SYSTEM_ALERT_WINDOW`) · 상시 포그라운드 서비스 폴링 |
| B. 실행 확인 | 확인 시각에 **부정확 알람**(`setWindow`) → 그때 "오늘 열었나"를 확인 → 알림 · 재부팅 후 알람 재등록 | `USE_EXACT_ALARM`(쓸 자격 없음) · 상시 서비스 |
| 앱 고르기 | 매니페스트 `<queries>` 에 MAIN/LAUNCHER 인텐트 | `QUERY_ALL_PACKAGES` |

✅ 이 표는 **결정 #10**(CLAUDE §14 · 2026-10-06 사용자 승인)이다. 🔴 Phase 0 스파이크(§9 S1 ~ S4)가 실기기에서 막히면 다시 연다.

**2026-10-06 정책 점검 결과**([`review/2026-10-06-play-policy.md`](./review/2026-10-06-play-policy.md)): 추천안을 유지한다.
- 같은 용도(사용자가 고른 앱을 감지해 개입)의 앱이 접근성으로 여럿 게시돼 있다(one sec 등록정보 문장이 기능 A 와 거의 같다).
- 찾은 반려는 전부 **공개 문구 절차**였다(§7.1 로 처음부터 피한다).
- 남는 위험: Android 17 고급 보호 모드에서 강제로 꺼진다(§8.5) · 정책이 더 조여질 가능성. 사용 기록 폴링을 대체 경로로 MVP 에 넣을지는 **미결정 P**(추천: MVP 는 접근성만).

---

## 2. 대상 앱 실행 감지 (기능 A · 결정 #10 = 접근성 서비스)

| | 접근성 서비스 | 사용 기록 폴링(`UsageStatsManager`) |
|---|---|---|
| 방식 | `TYPE_WINDOW_STATE_CHANGED` 이벤트. `packageNames` 로 대상 앱만 받을 수 있다 △ | `queryEvents` 로 `ACTIVITY_RESUMED` 를 주기적으로 조회 |
| 지연 | 거의 즉시(1초 미만) △ | 폴링 간격만큼 늦다. 그 사이 대상 앱 화면이 먼저 보인다 |
| 켜는 법 | 사용자가 **설정 > 접근성**에서 직접 켠다 △ | 사용자가 **설정 > 사용 기록 접근**에서 직접 켠다 ✔ |
| 상시 실행 | 시스템이 서비스를 붙잡아 둔다 | 🔴 폴링하려면 **포그라운드 서비스**가 상시 떠 있어야 한다(상단 알림이 늘 보인다) |
| Play 정책 | 🔴 **접근성 선언 + 시연 영상 + 눈에 띄는 공개 문구**(§8) ✔ | `PACKAGE_USAGE_STATS` 는 민감 권한 정책에 별도 절이 없다(✔ 없음을 확인 · 중간 확신). 다만 포그라운드 서비스 `specialUse` 선언 + 영상이 붙는다(§4.3) ✔ |
| 제조사 절전 | 폴링 서비스보다 잘 살아남지만 **조용히 꺼질 수 있다** △ | 삼성 "절전 앱" 등에서 죽기 쉽다 △ |
| 선례 | one sec · Opal(Android 14+) · ScreenZen · AppBlock 이 접근성으로 같은 일을 하고 Play 에 있다 △ | — |

- one sec 공식 안내: Android 감지는 *"배터리 최적화의 영향을 받고 다른 접근성 앱과 충돌할 수 있다"* △ (https://tutorials.one-sec.app · 검색 결과)
- 🔴 **기획서 §21 의 약속과 맞춘다**: *"어떤 내용을 입력했는지는 확인하지 않아요. 앱이 실행되었는지만 확인합니다."*
  → 접근성 서비스는 **패키지 이름(어느 앱이 앞에 나왔나)만** 읽는다. 화면 글자 · 입력 내용 · 창 내용을 읽지 않는다.
  서비스 설정에서 `canRetrieveWindowContent=false`, 이벤트 종류는 창 상태 변경만 받는다. 이것을 가드로 잰다(매니페스트 · XML 정적 검사).

---

## 3. 확인 화면을 다른 앱 위에 띄우기 (기능 A)

- 안드로이드 10 이후 **백그라운드 Activity 시작 제한**이 있다. 예외 중 둘이 우리에게 닿는다 ✔ (https://developer.android.com/guide/components/activities/background-starts)
  - 사용자가 허용한 `SYSTEM_ALERT_WINDOW` 를 가진 앱
  - 백그라운드 Activity 시작 권한을 받은 서비스에 시스템이 바인딩한 앱(접근성 서비스가 역사적으로 여기 든다 △)
- 안드로이드 14 · 15 의 바인딩 · PendingIntent 변경은 시스템이 바인딩한 접근성 서비스에는 영향이 없을 것으로 본다 △ (https://developer.android.com/about/versions/15/behavior-changes-15 ✔ 변경 내용 자체)
- **추천**: 접근성 서비스가 `TYPE_ACCESSIBILITY_OVERLAY` 창을 그린다. `SYSTEM_ALERT_WINDOW` 도 Activity 시작도 필요 없다 △. 대안은 서비스에서 우리 Activity 를 여는 것 △.
- 확인 화면은 **JS(React Native) 없이 네이티브로** 그린다. 접근성 서비스는 RN 런타임 밖에서 돈다 △(§6). 지연이 그대로 사용자 눈에 보이는 자리라 RN 을 깨우지 않는다.
- [취소] = 홈으로(⚠ 미결정 E · `GLOBAL_ACTION_HOME`) · [열기] = 오버레이를 닫고 통과 상태를 만든다(`RULE_SYSTEM.md` §3.3).

---

## 4. 확인 시각 알람 · 알림 (기능 B)

### 4.1 "오늘 열었나"를 어떻게 아나

- **방법 1**: 접근성 서비스가 이미 켜져 있으면 대상 앱이 앞에 나올 때마다 직접 `launch_day` 에 적는다(`RULE_SYSTEM.md` §5). 추가 권한 없음 △.
- **방법 2**: 확인 시각에 `queryEvents(오늘 0시, 지금)` 로 사후 조회한다. 상시 서비스 없이 된다 △. 시스템은 이벤트를 *"며칠"*만 보관한다 ✔ (같은 날 조회는 안전).
- ⚠ 사용자가 **실행 확인 규칙만** 쓰는 경우: 방법 1 을 고르면 그 사람도 접근성 서비스를 켜야 한다. 방법 2 를 고르면 사용 기록 접근 권한 하나로 끝난다.
  → **결정 #10**: 판정은 **방법 2(사용 기록 사후 조회)** 로 한다. 실행 확인만 쓰는 사람은 접근성 없이 사용 기록 접근 + 알림 권한만 준다. 접근성 서비스가 켜져 있어도 판정 기준은 하나(방법 2)로 둔다(두 출처가 어긋나는 자리를 만들지 않는다 · △ 우리 판단 · 스파이크 S5 로 확인).

### 4.2 알람

| | 사실 | 확신 |
|---|---|---|
| `USE_EXACT_ALARM` | 알람 · 타이머 · 캘린더가 **핵심 기능인 앱만** 쓸 수 있다. 우리는 해당 없다 | ✔ https://support.google.com/googleplay/android-developer/answer/16558241 |
| `SCHEDULE_EXACT_ALARM` | 안드로이드 14 · API 33+ 대상 새 설치는 **기본 거부**. `canScheduleExactAlarms()` 로 보고 대체 경로를 둔다 | ✔ https://developer.android.com/about/versions/14/changes/schedule-exact-alarms |
| 부정확 알람 | `setAndAllowWhileIdle` 은 최대 약 1시간 늦을 수 있다. `setWindow` 는 최소 10분 창 | ✔ https://developer.android.com/develop/background-work/services/alarms/schedule |
| 재부팅 | 알람은 재부팅 시 전부 지워진다 → `RECEIVE_BOOT_COMPLETED` 로 다시 등록 | ✔ 같은 페이지 |
| 알림 권한 | 안드로이드 13+ `POST_NOTIFICATIONS` 런타임 권한 | ✔ https://developer.android.com/develop/ui/views/notifications/notification-permission |

- **추천**: `setWindow(확인 시각, 10분)`(placeholder 2026-10-06). 23:00 규칙은 23:00~23:10 사이에 울린다. 화면 문구도 "23시쯤"으로 쓴다.
  `SCHEDULE_EXACT_ALARM` 은 선택 업그레이드로만 고려하고 MVP 에선 요청하지 않는다(권한 하나 = 온보딩 한 단계 · 기획서 §21).
- 🔴 23:50 처럼 늦은 확인 시각은 창이 자정을 넘으면 **다음 날 판정이 된다.** 확인 시각 상한(예: 23:45 · placeholder)을 두거나 창을 자정 전에서 자른다.

### 4.3 포그라운드 서비스 (폴링 방식을 고를 때만)

- 사용 감시에 맞는 유형이 없어 `specialUse` + `PROPERTY_SPECIAL_USE_FGS_SUBTYPE` 가 필요하다. Play 가 심사한다 ✔ (https://developer.android.com/develop/background-work/services/fgs/service-types)
- Play 콘솔 포그라운드 서비스 선언: 설명 · 미룰 때의 영향 · **유형마다 영상** ✔ (https://support.google.com/googleplay/android-developer/answer/13392821)
- 안드로이드 15: `SYSTEM_ALERT_WINDOW` 만으로는 백그라운드에서 포그라운드 서비스를 못 시작한다(보이는 오버레이 창이 있어야 한다) ✔

---

## 5. 설치 앱 목록 (앱 고르기)

- 매니페스트 `<queries>` 에 `MAIN` / `LAUNCHER` 인텐트를 선언하면 `queryIntentActivities` 와 `getLaunchIntentForPackage` 로 **실행 가능한 앱**을 나열하고 열 수 있다 ✔ (https://developer.android.com/training/package-visibility/declaring)
- 🚫 `QUERY_ALL_PACKAGES` 를 쓰지 않는다. *"더 좁은 패키지 가시성 선언으로 동작할 수 있으면"* 허용되지 않는다 ✔ (https://support.google.com/googleplay/android-developer/answer/10158779)
- 아이콘 · 이름은 네이티브에서 읽어 넘긴다(아이콘은 캐시 · 크기 제한).

---

## 6. Expo 에서 네이티브를 붙이는 법

- 로컬 모듈: `npx create-expo-module@latest --local` → `modules/` 에 생기고 자동 연결된다 ✔ (https://docs.expo.dev/modules/get-started/)
- 매니페스트 변경은 config plugin(`withAndroidManifest`)으로. **prebuild 때만 돈다** → Expo Go 로는 못 돈다. 처음부터 **개발 빌드**다 ✔ (https://docs.expo.dev/modules/config-plugin-and-native-module-tutorial/)
- 접근성 서비스 클래스 · 설정 XML · `<service>` 항목은 모듈 자신의 매니페스트와 리소스에 둘 수 있고 앱에 병합된다 △.
- 🔴 접근성 서비스 · 알람 수신기는 **RN JS 런타임 없이** 돈다 △. 그래서:
  - 판정 순수 로직(`RULE_SYSTEM.md` §3.1 · §4.1)은 **Kotlin 쪽에도 있어야 한다.** TS 와 Kotlin 이 같은 규칙을 두 번 구현하면 갈라진다.
    → 대응: **같은 시험표(JSON 케이스)** 를 TS 가드와 Kotlin 단위 시험이 함께 읽어 같은 답을 내는지 잰다(Phase 1 · 가드 `check:rules`).
  - 규칙 · 기록 저장소는 네이티브와 JS 가 **같은 SQLite 파일**을 읽는다(또는 규칙만 네이티브로 내려 보낸다). Phase 1 에서 `docs/DATABASE.md` 로 정한다.
- 선례: SnoreLess `modules/alarm-tone`(Android 네이티브 · prebuild 없이 자동 연결 · `snoreLess/CLAUDE.md`).
- `android/` 는 CNG 산출물이라 커밋하지 않는다(형제 공통).

---

## 7. 권한 온보딩 (기획서 §21)

- 🔴 **처음부터 여러 권한을 한꺼번에 요구하지 않는다.** 규칙을 만드는 과정에서 그 규칙에 필요한 권한만 묻는다.

| 규칙을 처음 만들 때 | 필요한 것 |
|---|---|
| 실행 전 확인 | 접근성 서비스 켜기(+ 공개 문구 동의 · §8) |
| 실행 확인 | 알림 권한 · 사용 기록 접근(결정 #10 · 접근성은 묻지 않는다) |
| 둘 다 | 제조사 절전 예외 안내(선택 · 삼성 "절전 앱" 제외 등 △ https://dontkillmyapp.com/samsung 비공식) |

### 7.1 🔴 접근성 공개 화면 (실제 반려 사례에서 거꾸로 짠 것 · `review/2026-10-06-play-policy.md` §5)

```
실행 전 확인 규칙 [저장] → (접근성이 꺼져 있으면) 전체 화면 공개
  · 무엇을 감지하나: 화면 앞에 나온 앱의 이름
  · 무엇을 안 보나: 화면 내용 · 입력한 글 · 고르지 않은 앱
  · 왜: 고른 앱을 정한 시간에 열 때 한 번 묻기 위해
  · 어디 남나: 이 기기에만. 밖으로 보내지 않는다
  [나중에]   [동의하고 설정 열기]
→ 시스템 접근성 설정 → 돌아오면 실제로 켜졌는지 확인
```

- 🚫 메뉴 · 설정 속에만 두기 · 동의 전에 스위치가 켜진 것처럼 보이기 · 버튼 하나("확인") · 뒤로가기를 동의로 치기(R2 의 반려 사유 세 가지 + User Data 정책).
- 설치 앱 목록 고지는 **앱 고르기 화면에 따로** 둔다(접근성 공개와 묶지 않는다 · §8.1).
- [나중에]를 누르면 규칙은 저장되지만 카드에 "접근성이 꺼져 있어 동작하지 않아요"가 보인다(기둥 7).

- 권한이 꺼진 상태를 늘 확인한다. 꺼졌으면 홈과 해당 규칙 카드에 바로 보인다(`RULE_SYSTEM.md` §7). 조용히 안 되는 것이 최악이다.
- 안내 문구는 **무엇을 보고 무엇을 안 보는지**를 말한다(기획서 §21). 사용자에게 보이는 한국어라 검수를 받는다(`KOREAN_WRITING.md` §2).

---

## 8. 🔴 Google Play 정책 (2026-10-06 원문 직접 대조)

> 2026-10-06 2차 확인: 1차 조사(서브 에이전트) 뒤 **정책 원문을 직접 읽어 대조했다.** 아래 ✔ 는 원문 문장을 확인한 것이다.
> 정정 1건: 1차에서 "고정 규칙 자동화 허용"의 출처를 2025-10-30 공지(16550159)로 적었는데 **그 공지에는 그 문장이 없다.** 문장은 접근성 정책 본문(10964491)에 있다.
> 실제 반려 · 통과 사례는 [`review/2026-10-06-play-policy.md`](./review/2026-10-06-play-policy.md) 에 따로 둔다(정본 아님).

### 8.1 접근성 API (https://support.google.com/googleplay/android-developer/answer/10964491 ✔)

- `isAccessibilityTool=true` 는 장애가 있는 사람을 직접 돕는 앱만 쓴다. 우리는 **false** 다 ✔(16558241 *"Apps with a core functionality intended to directly support people with disabilities are eligible"*)
  - 🔴 아닌 앱이 true 로 선언하면 Play 가 반려하고 Play 프로텍트가 기기에서 막는다 △(developer.android.com 검색 요약)
- 2021-11-03 부터 API 31 이상 대상 + 접근성 서비스가 있는 앱은 **Play 콘솔 선언**을 한다 ✔
  - 선언 항목: 왜 필요한가(앱 기능 · 분석 · 광고 등에서 고른다) · 개인정보를 수집 · 공유하나 · 어떤 데이터인가 · **공개 문구가 보이는 짧은 영상 링크** ✔
- 🔴 **영상**: 앱 열기 → 공개 문구 화면까지 → 동의 흐름 → **거절 흐름** → 접근성을 쓰는 핵심 기능 ✔
- 🔴 **눈에 띄는 공개 문구** ✔ 원문 요지:
  - 앱 안에 있다(설명 · 웹사이트에만 두면 안 된다)
  - 평소 사용 흐름에 나온다(메뉴 · 설정 속에 숨기지 않는다)
  - 접근하거나 수집하는 데이터를 설명하고, 어떻게 쓰고 공유하는지 설명한다
  - **적극적 동의 동작**(누르기 · 체크)을 요구한다
  - 처리방침 · 약관에만 두면 안 된다
  - 🔴 **다른 개인정보 고지와 한 화면에 묶지 않는다**(→ §8.3 의 설치 앱 목록 고지와 따로 둔다)
- 🔴 **자율 동작 금지 · 규칙 기반 예외** ✔ 원문: *"Any use of the Accessibility API that enables an app to autonomously initiate, plan, and execute actions or decisions is strictly prohibited. This does not prohibit deterministic, rule-based automation, where behavior follows a static, human-defined script (for example, 'If Trigger X occurs, perform Action Y')."*
  - 우리 규칙(사용자가 정한 대상 앱 · 요일 · 시간 → 확인 화면)은 사람이 정한 고정 규칙이다 △(우리 해석. 원문 예시와 같은 모양이다)
  - 2025-10-30 공지 · 적용 기한 2026-01-28(검색 요약 △) · 공지 원문 https://support.google.com/googleplay/android-developer/answer/16550159 ✔

### 8.2 접근성 API 로 하면 안 되는 것 (https://support.google.com/googleplay/android-developer/answer/16558241 ✔)

원문: *"The Accessibility API cannot be used to: Change user settings without their permission or prevent the ability for users to disable or uninstall any app or service unless authorized by a parent or guardian through a parental control app …; Work around Android built-in platform security controls, privacy controls and notifications; or Change or leverage the user interface in a way that is deceptive …"*

| 금지 | 우리 설계가 피하는 법 |
|---|---|
| 사용자가 앱을 끄거나 지우지 못하게 막기 | 🔴 **이 앱 자신 · 시스템 설정 · 앱 정보 화면은 대상이 될 수 없다**(미결정 L 추천안을 정책 근거로 격상 후보). 확인 화면은 언제나 [열기] 한 번으로 지나간다(결정 #1) |
| 허락 없이 설정 바꾸기 | 접근성 서비스는 설정을 건드리지 않는다 |
| 속이는 UI | 확인 화면에 우리 앱 이름을 밝힌다. 대상 앱의 화면인 척하지 않는다 |
| (자율 동작) | [취소]의 "홈으로"는 **사용자가 누른 뒤에만** 일어난다. ⚠ `performGlobalAction(HOME)` 대신 홈 인텐트를 여는 쪽을 추천한다(접근성으로 동작을 실행하는 자리를 0 으로 둔다 · △ 우리 판단) |

### 8.3 기기 및 네트워크 악용 (https://support.google.com/googleplay/android-developer/answer/9888379 ✔)

원문: *"We don't allow apps that interfere with, disrupt, damage, or access in an unauthorized manner … including but not limited to other apps on the device …"* 예시: 다른 앱의 광고 표시를 막는 앱 · 다른 앱 게임 플레이에 영향을 주는 치트 앱.

- 🔴 **우리 앱은 다른 앱 위에 화면을 띄운다.** 문자 그대로 읽으면 "다른 앱 방해"에 닿을 수 있다 △.
- 방어 논리: 사용자가 **직접 고른 앱 · 직접 정한 시간**에만 · 한 번만 · [열기]로 곧장 지나간다. 사용자가 원해서 설치한 자기관리 기능이다(기둥 1 · 2).
- ⚠ 확인 화면이 대상 앱의 **광고를 가리는 일**이 없게 한다(예시 문장과 겹치는 모양을 피한다). 확인 화면은 앱이 앞에 나오는 순간에만 뜨고 [열기] 뒤에는 남지 않는다.

### 8.4 사용자 데이터 · 데이터 보안 양식

| 사실 | 출처 |
|---|---|
| 🔴 **"기기의 다른 앱 목록(inventory of other apps on the device)"은 개인 · 민감 정보**로 분류된다 | ✔ https://support.google.com/googleplay/android-developer/answer/10144311 |
| 사용자가 예상하지 못할 수집이면 앱 안 공개 + 적극적 동의가 필요하다. **뒤로가기 · 홈 · 다른 곳 누르기를 동의로 치면 안 된다** | ✔ 같은 페이지 |
| 데이터 보안 양식의 "수집"은 **기기 밖으로 보내는 것**이다. *"only processed locally on the user's device and not sent off device does not need to be disclosed"* | ✔ https://support.google.com/googleplay/android-developer/answer/10787469 |
| 관련 항목 이름: 앱 활동 > 설치된 앱 · 앱 상호작용 | ✔ 같은 페이지 |

- → 서버가 없으므로(결정 #5) 데이터 보안 양식은 **"수집 · 공유 없음"** 이 된다 △(우리 판단 · 출시 전 실제 트래픽으로 재확인. 크래시 · 분석 SDK 하나만 붙어도 바뀐다).
- → 그래도 앱 목록은 민감 정보이므로 **앱 고르기 화면에 한 줄로 밝힌다**(접근성 공개 문구와는 다른 화면 · §8.1 "묶지 않는다").
- 정직한 표현 규칙(LinkMemo `CLAUDE.md` §6 승계): *"우리 서버에 저장하지 않습니다"*(O) · *"아무 데이터도 나가지 않습니다"*(X).

### 8.5 OS 쪽 위험: Android 17 고급 보호 모드

- 🔴 **고급 보호 모드(Advanced Protection Mode)를 켠 Android 17 기기에서는 접근성 도구가 아닌 앱의 접근성 권한이 자동 회수된다. 앱별 예외가 없다** △
  - Android Police 실사용기(2026-08-12 · Android 17 안정판 2026-06-16): *"Advanced Protection cuts off the Android Accessibility Services API for anything that isn't a screen reader, switch input, voice input, or Braille tool."* · *"There's no per-app override either."* https://www.androidpolice.com/advanced-protection-mode-week-test/
  - Android 16 에서는 접근성을 건드리지 않았다 △(검색 요약)
  - ⏸ developer.android.com 의 고급 보호 모드 문서(https://developer.android.com/privacy-and-security/advanced-protection-mode)에는 2026-10-06 현재 **접근성 항목이 없다.** 공식 확인은 못 했다.
- 감지 API: `AdvancedProtectionManager.isAdvancedProtectionEnabled` ✔(같은 공식 문서)
- 대응(기둥 7 · 숨기지 않는다): 고급 보호 모드면 실행 전 확인 규칙 카드에 "이 기기 보안 설정에서는 동작하지 않아요"를 띄운다. 실행 확인(사용 기록 사후 조회)은 영향이 없다 △.
- 고급 보호 모드는 위험군(기자 · 활동가 등)을 위한 옵트인 모드라 대상이 좁다. 다만 **같은 방향의 제한이 일반 모드로 넓어질 가능성**은 이 앱의 장기 위험이다(§1 추천안을 정할 때 감안한다).

### 8.6 매니페스트 권한 함정 (형제 실측)

- 🔴 **Expo 템플릿이 `SYSTEM_ALERT_WINDOW` 를 기본으로 넣는다.** Re:Read 는 첫 AAB 에서 이 권한과 `RECORD_AUDIO` 를 발견했고 처리방침과 어긋났다(`Bookmind/docs/EDGE_CASES.md` · `BUILD.md` §권한 수 30 → 28). LinkMemo 도 같은 것을 지웠다(`link_memo/docs/PLAN.md`).
- → 이 앱은 그 권한을 **쓰지 않기로 한 권한**이다(§1). 판정은 `app.json` 이 아니라 **AAB 매니페스트**로 한다(Re:Read 교훈). 가드 `check:manifest`(README §3 예정)가 금지 목록을 잰다:
  `SYSTEM_ALERT_WINDOW` · `QUERY_ALL_PACKAGES` · `USE_EXACT_ALARM` · `RECORD_AUDIO` · `FOREGROUND_SERVICE_SPECIAL_USE` · 접근성 설정 XML 의 `canRetrieveWindowContent="true"` · `isAccessibilityTool="true"`.

---

## 9. 🔴 Phase 0 스파이크: 코드 전에 확인할 것

| # | 확인 | 통과 조건 |
|---|---|---|
| S1 | 접근성 서비스가 대상 앱 실행을 감지하는가 | 실기기 2대 이상(삼성 포함)에서 YouTube 실행 → 확인 화면까지 지연 실측(ms · 기기 · OS 꼬리표) |
| S2 | 오버레이가 대상 앱 첫 화면보다 먼저 덮는가 | 대상 앱 화면이 비치는 시간을 눈 · 화면 녹화로 확인 |
| S3 | [열기] 뒤 재감지가 반복되지 않는가 | 앱 안 화면 전환 · 알림창 · 공유 시트에서 다시 안 묻는다(미결정 D 추천안) |
| S4 | 제조사 절전에서 서비스가 살아남는가 | 삼성 실기기 하룻밤 방치 후 감지 |
| S5 | 사용 기록 사후 조회로 "오늘 열었나"가 맞는가 | 대상 앱 열기 → 23시 판정 일치 · 재부팅 후 알람 재등록 |
| S6 | 공개 문구 · 동의 · 거절 흐름 초안(§7.1) | Play 선언 영상 대본으로 그대로 쓸 수 있다 |
| S7 | 고급 보호 모드 · 접근성 회수 감지 | `AdvancedProtectionManager` 로 감지 · 회수된 뒤 규칙 카드에 안내가 뜬다(Android 17 기기 또는 에뮬) |

🔴 S1 ~ S4 중 하나라도 막히면 기능 A 의 방식(결정 #10)을 다시 연다. **화면을 만들기 전에 끝낸다.**
