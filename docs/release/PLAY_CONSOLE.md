# Play 콘솔 답안지 — 비공개 테스트 첫 업로드 (결정 #36 · #37)

> 작성 2026-10-09. **콘솔에 그대로 붙일 답**을 한곳에 모은다. 순서의 정본은 `common/PLAY_FIRST_UPLOAD.md` §1, 테스터 운영은 `common/CLOSED_TESTING.md`, 출시 전 점검은 `common/PRE_LAUNCH_CHECK.md`.
> 🔴 처리방침 · 약관 · 접근성 공개 문구 · 데이터 보안 · 접근성 신고가 **같은 말**을 해야 한다(CLAUDE 기둥 6 · `ANDROID_PLATFORM.md` §8.4). 하나를 고치면 넷을 같이 본다.
> 🔴 콘솔 접속은 `u/1`(`PLAY_FIRST_UPLOAD.md` §0).

## 0. 올리기 전에 끝나 있어야 하는 것 (순서)

| # | 무엇 | 상태 | 누가 |
|---|---|---|---|
| 1 | 처리방침 · 약관 **게시**(유료 앱은 약관이 빌드 심사보다 먼저 · `PRE_LAUNCH_CHECK.md` §2) | ✅ 2026-10-09 게시(volleyball `309749a` · 영문 + 한국어 한 페이지 · 시행일 2026-10-09) · ⚠ 한국어 ChatGPT 검수 뒤 재게시 | volleyball 서버 저장소(이 저장소 밖) · 사용자 또는 그쪽 세션 |
| 2 | 게시 URL 200 확인(`PRE_LAUNCH_CHECK.md` §3.9) | ✅ 2026-10-09 privacy 200 · terms 200(메인 세션 curl) | 게시 뒤 |
| 3 | 접근성 시연 영상(§6) | ❌ | 메인 세션 · 사용자(실기기) |
| 4 | 스크린샷 · 그래픽 이미지(§3) | ❌ | 메인 세션(실기기 캡처) |
| 5 | 업로드 키 · 서명 · R8 · 릴리스 AAB | ✅ `docs/BUILD.md` | 이 세션 |
| 6 | Play 앱 만들기(패키지 `com.vivacegames.onemorethought` · **유료** · 앱) | ❌ | 사용자 지시 후 |
| 7 | 업로드 · 비공개 트랙 · 테스터 · 프로모션 코드 | ❌ | 사용자 지시 후(이번 작업 범위 밖) |

## 1. 앱 만들기 화면 (`create-new-app`)

| 칸 | 답 | 되돌릴 수 있나 |
|---|---|---|
| 앱 이름 | `OneMoreThought` (가칭 · 미결정 N · 스토어 등록정보에서 언제든 바꾼다) | ✅ |
| 기본 언어 | 영어(미국) – en-US (결정 #14 · 기본 `en`) | ✅ |
| 앱 / 게임 | 앱 | ✅ |
| 무료 / 유료 | **유료**(결정 #18) | ⚠ 게시 전까지만 · 무료로 낸 뒤 유료는 불가 |
| 패키지 이름 | `com.vivacegames.onemorethought`(결정 #36) · "사용 가능 여부 확인" 초록 체크 | 🔴 영구 |
| 선언 2개 | 개발자 프로그램 정책 · 미국 수출법 — 화면 문구 그대로 읽고 체크 | — |

## 2. 스토어 등록정보

> 🔴 2026-10-09: **"안 열었을 때 알림"(실행 확인 알림)을 설명에서 뺐다.** 이번 빌드에는 알람 · 알림 발송 코드가 없다(결정 #37 · `modules/intervention` 에 AlarmManager · 알림 없음). 사용자 규칙 *없는 기능을 약속하는 문구 금지*(결정 #33). Phase 3 에서 알림이 나가면 설명 문단 · 기능 줄 · 권한 줄(사용 기록 접근 · 알림)을 되살린다. 처리방침 · 약관 소개 문단도 같은 날 같이 뺐다(`docs/legal/`).
> 나이 확인(결정 #41)은 설명에 넣지 않는다(처리방침 제11조 · 약관 제5조에 있다).

### 2.1 영어 (en-US · 기본)

- **App name**: `OneMoreThought`
- **Short description** (≤80자): `Asks you once, in your own words, before you open the apps you chose.`
- **Full description**:

```
Pause for one more thought — before you open the app you're trying to cut back on.

Pick the apps you want to think twice about and write one sentence to yourself, like "Really ordering again?". When you open one of those apps during the times you set, the app shows your sentence once and lets you choose: Cancel, or Open. Open always works with one tap. Nothing is blocked or locked — you decide.

WHAT IT DOES
• Ask before opening: your own sentence, shown once, only during the days and hours you choose
• A simple weekly view of how often you were asked, cancelled or opened anyway — no scores, no blame
• Light and dark themes

WHAT IT DOESN'T DO
• No timers, no forced waiting, no puzzles, no locks
• It never reads what's on your screen or what you type. The accessibility service only sees the name of the app that comes to the front.
• No ads. No account or sign-up.

PERMISSIONS
• Accessibility (only for "ask before opening"): detects which app comes to the front so it can ask you at the right moment. Shown and agreed to inside the app before you turn it on.

DATA
Your rules, the messages you write and your prompt results are stored on our server and used to improve the service and for statistics. Screen content and anything you type are never read or sent. Details: https://vivace-games.com/onemorethought/privacy

One-time purchase. All future updates included.
```

### 2.2 한국어 (ko-KR)

- **앱 이름**: `OneMoreThought`
- **간단한 설명**(80자 이하): `고른 앱을 열 때, 내가 쓴 한 문장으로 한 번 더 생각하게 해 줘요.`
- **자세한 설명**:

```
줄이고 싶은 앱을 열기 전에, 한 번 더 생각하게 해 줘요.

한 번 더 생각하고 싶은 앱을 고르고 나에게 하는 한 문장을 적어요. 예를 들면 "정말 시킬 거야?". 정한 요일과 시간에 그 앱을 열면 내 문장이 한 번 뜨고, [취소]와 [열기] 중에서 고르면 돼요. [열기]는 언제나 한 번에 눌려요. 막거나 잠그지 않아요. 결정은 내가 해요.

이런 걸 해요
• 열기 전에 묻기: 내가 고른 요일과 시간에만, 내가 쓴 문장으로 한 번
• 지난 7일 동안 몇 번 물었고, 몇 번 취소하고 열었는지 보여 줘요. 점수나 꾸중은 없어요.
• 밝은 화면 · 어두운 화면

이런 건 안 해요
• 타이머, 억지로 기다리기, 문제 풀기, 잠금이 없어요.
• 화면 내용이나 입력한 글을 읽지 않아요. 접근성 서비스는 화면 앞에 나온 앱의 이름만 봐요.
• 광고가 없어요. 회원가입도 없어요.

권한
• 접근성(열기 전에 묻기에만): 어떤 앱이 화면 앞에 나왔는지 알아야 제때 물을 수 있어요. 켜기 전에 앱 안에서 먼저 알려 드리고 동의를 받아요.

데이터
규칙, 직접 쓴 메시지, 확인 결과는 회사 서버에 저장되고 서비스 개선과 통계에 쓰여요. 화면 내용과 입력한 글은 읽지도 보내지도 않아요. 자세한 내용: https://vivace-games.com/onemorethought/privacy

한 번 구매로 앞으로의 업데이트까지 모두 받아요.
```

⚠ 한국어 문구는 ChatGPT 검수 대상이다(CLAUDE §10 · `KOREAN_WRITING.md` §2). 영어는 기본 언어라 먼저 채운다.
🔴 "모든 데이터는 기기에만" · "개인정보를 수집하지 않아요" 같은 문장을 쓰지 않는다(결정 #21 · #22 · #30 으로 거짓이다).

### 2.3 분류 · 연락처

| 칸 | 답 |
|---|---|
| 앱 카테고리 | 생산성(Productivity) |
| 태그 | 디지털 웰빙 · 습관(콘솔이 주는 목록에서 고른다) |
| 이메일 | support@vivace-games.com |
| 웹사이트 | (비움 · 또는 https://vivace-games.com) |
| 전화 | ⚠ 사용자 결정 대기(판매자 전화 공개 여부) |
| 처리방침 URL | https://vivace-games.com/onemorethought/privacy |

## 3. 그래픽

| 무엇 | 규격 | 파일 |
|---|---|---|
| 앱 아이콘 | 512×512 PNG · 32비트 | `assets/brand/store-512.png`(🔴 자리표시 · 시안 세션 정식 아이콘 대기 · `tools/make-icon.mjs`) · ✅ 2026-10-10 콘솔에 올림 |
| 그래픽 이미지 | 1024×500 PNG/JPG · 알파 없음 | ✅ `assets/brand/feature-1024x500.png`(`tools/make-feature-graphic.py`) · 2026-10-10 콘솔에 올림 · AI 애셋 선언 «라벨 지정 안 함»(코드로 그림) |
| 휴대전화 스크린샷 | 2 ~ 8장 · 9:16 · 알파 없음(4장 이상이면 추천 노출 대상) | ✅ 2026-10-10 3장 올림(`assets/store/ko-*.png` · 기본 등록정보 en-US 에 한국어 화면 · 사용자 *"스크린샷 이정도면 되잖아 그냥 해"*). S24 화면(19.5:9)에서 상태바 · 하단 바를 잘라 1080×1920 에 맞춤. 앱 고르기 화면은 남의 앱 이름 · 아이콘이 보여 뺐다. ⏳ 확인 화면(접근성 켜야 뜸) · 영어 화면은 나중에 |

스크린샷 목록(언어마다 · 순서대로):
1. 확인 화면(예시 메시지 "정말 시킬 거야?" / "Really ordering?")
2. 홈(규칙 두 묶음 · 오늘 요약)
3. 규칙 만들기 — 앱 고르기 또는 시간 고르기
4. 접근성 공개 문구 화면(무엇을 보고 무엇을 안 보는지)
5. 기록(지난 7일)
6. 설정

🔴 **남의 상표가 보이면 안 된다**: 확인 화면 맨 위 메타 줄(«우리 앱 · 대상 앱») · 앱 고르기 목록이 **실제 앱 이름 · 아이콘**을 보여 준다. 스크린샷용 대상은 상표가 없는 앱(기본 계산기 등)으로 고르거나 메타 줄이 일반 이름으로 보이는 상태에서 찍는다. → 메인 세션 확인 항목.

## 4. 가격 · 국가

| 칸 | 답 |
|---|---|
| 가격 | 기본 **₩3,300**(대한민국) · **US$1.99**(미국) · 나머지는 Play 자동 환산(결정 #25) |
| 국가 | **145개국** — EEA 30 · 영국 · 스위스(32개국)를 뺀 전체(결정 #14 · [`../DISTRIBUTION_POLICY.md`](../DISTRIBUTION_POLICY.md)) |
| 비공개 트랙 국가 | 위와 같다 |

⚠ 유료 앱 비공개 트랙은 **테스터도 산다** → 100% 할인 프로모션 코드. ~~doply 테스터와 유료 앱의 조합은 ⚠ 사용자 결정 대기~~ → 2026-10-09 **0원 할인(판매)으로 간다**(CLAUDE §7). 콘솔 [판매] 탭은 앱 게시 전이라 아직 잠겨 있다 → 비공개 트랙 첫 게시 뒤 판매를 만든다(1 ~ 14일 · 다음 판매까지 30일 간격 · 14일 테스트를 덮으려면 시작일을 맞춘다). 막히면 프로모션 코드.
✅ 2026-10-09 콘솔 가격 저장: 전 국가 US$1.99 기준 자동 환산(177개 국가 · 배포 국가는 트랙에서 145개로 고른다) · 대한민국만 ₩3,300 으로 고침.

## 5. 앱 콘텐츠(정책 설문)

### 5.1 앱 액세스 — 🔴 먼저 채운다(대상 연령 설문이 이 뒤에 열린다)

- 답: **"모든 기능을 특별한 액세스 권한 없이 사용할 수 있음"** — 로그인이 없다.
- 심사자 안내(그래도 적는다 · 접근성 기능을 보여 주려고):

```
No login is needed. To see the core feature:
1) Open the app → tap "+ New rule" → "Ask when I open an app" → pick any app (e.g. Calculator) → choose a time range that includes now → write a sentence → Save.
2) The app shows an in-app disclosure explaining what the accessibility service sees (only the foreground app's package name) and what it does not (screen content, typed text). Tap "Agree and open settings".
3) In Android Settings → Accessibility → Installed apps → "App check-in", turn it on.
4) Open the app you picked. The confirm screen shows your sentence with [Cancel] and [Open]. Open always works with one tap.
"Remind if not opened" rules need Usage access (Settings → Apps → Special access → Usage access).
```

### 5.2 광고

- **광고 없음.**
- 광고 ID 선언: **"아니요"** — `AD_ID` 권한 없음(AAB 매니페스트로 확인 · `docs/BUILD.md` §4).

### 5.3 콘텐츠 등급(IARC)

| 질문 | 답 |
|---|---|
| 카테고리 | 기타 모든 앱 유형(Utility · Productivity · Communication · Other) |
| 폭력 · 성적 · 욕설 · 약물 · 도박 | 전부 아니요 |
| 사용자끼리 소통 · 콘텐츠 공유 | 아니요(규칙 메시지는 본인만 본다) |
| 위치 공유 | 아니요 |
| 디지털 상품 구매 | 아니요(앱 안 결제 없음 · 유료 앱 자체는 해당 없음) |
| 제한 없는 인터넷 접근(웹 브라우저) | 아니요 |

예상 등급: 전체이용가 / Everyone / PEGI 3.

### 5.4 대상 연령 · 콘텐츠

- ~~⚠ **연령 기준은 사용자 결정 대기.**~~ → 결정 #41(첫 실행에 출생연도 확인 · 만 14세 미만은 서버로 보내지 않음). 대상 연령은 **18세 이상**만 체크한다(아동 대상 아님 · 가족 정책 범위 밖 · 13 ~ 17 을 넣지 않는다). 나이 확인 화면은 아동 대상이라서가 아니라 PIPA §22-2 때문이다.
- ⚠ 나이 확인은 vc1 AAB 에 없다. 다음 AAB 부터 들어간다.
- "아동의 관심을 끌 수 있나": 아니요.

### 5.5 데이터 보안 (결정 #21 · #22 · #24 · #30 · 실제 트래픽 기준)

| 질문 | 답 |
|---|---|
| 수집 · 공유하나 | **예(수집)** |
| 전송 중 암호화 | 예(HTTPS 전부) |
| 삭제 요청 방법 | 예 — support@vivace-games.com 로 요청(앱 안 문의는 결정 #35 로 프로덕션 전에 연다). 앱 안 "이 기기에서만 지우기"는 기기 사본만 |
| 독립 보안 검토 | 아니요 |

수집 항목(공유 없음 · 수탁자 처리는 "공유"가 아니다):

| 유형 | 항목 | 필수/선택 | 목적 |
|---|---|---|---|
| 앱 활동 | 앱 상호작용(확인 결과 · 실행 확인 결과) | 필수 | 앱 기능 · 분석 |
| 앱 활동 | 설치된 앱(**사용자가 규칙에 넣은 대상 앱의 패키지 이름만**) | 필수 | 앱 기능 · 분석 |
| 앱 활동 | 기타 사용자 생성 콘텐츠(규칙 메시지 원문 · 결정 #24) | 필수 | 앱 기능 · 분석 |
| 앱 정보 및 성능 | 비정상 종료 로그 · 진단(하루 요약) | **선택**(설정에서 끔) | 분석 · 앱 기능(오류 수정) |
| 기기 또는 기타 ID | 공용 서버 기기 가명 번호 | 필수 | 앱 기능 · 분석 |

🚫 수집하지 않음: 위치 · 개인 정보(이름 · 이메일 · 전화) · 금융 정보 · 사진 · 연락처 · 웹 기록 · 메시지(SMS · 이메일) · 광고 ID.
⚠ 앱 안 문의 화면(Phase 5)이 생기면 "개인 정보 > 이메일"(선택 · 문의)을 더하고 다시 신고한다.

### 5.6 접근성 API 신고 (`ANDROID_PLATFORM.md` §8.1)

| 질문 | 답 |
|---|---|
| 접근성 서비스를 쓰는 이유 | **앱 기능** + **분석**. 🚫 광고 · 마케팅 고르지 않음 |
| 장애인 보조 도구인가(`isAccessibilityTool`) | 아니요(false · 매니페스트와 같다) |
| 개인 · 민감 정보를 수집 · 공유하나 | 수집함 · 공유 안 함 |
| 어떤 데이터 | 화면 앞에 나온 앱 중 **사용자가 규칙에 넣은 앱**의 패키지 이름 · 그때의 확인 결과 |

설명(영어 · 붙여 넣기):

```
The app lets users create their own rules: "When I open <app I chose> during <days/hours I chose>, show me <a sentence I wrote> once." The accessibility service listens only for window-state changes to learn the package name of the app that comes to the foreground (canRetrieveWindowContent=false). When it matches a user-defined rule, the app shows a full-screen confirm screen with [Cancel] and [Open]; Open always works with one tap. This is deterministic, rule-based behavior defined by the user. The service never reads screen content or text input, never performs actions in other apps, and never blocks the user from disabling or uninstalling any app (the app itself, the launcher, system Settings and the phone app cannot be targets). The package names of the user's target apps and the prompt results are sent to our server for app functionality and analytics, as disclosed in the in-app prominent disclosure and the privacy policy.
```

### 5.7 시연 영상 촬영 목록 (YouTube 일부 공개 링크 · 30~90초)

순서는 정책 원문 그대로(`ANDROID_PLATFORM.md` §8.1): **앱 열기 → 공개 문구 → 동의 → 거절 흐름 → 핵심 기능**.

1. 홈에서 앱을 연다(빈 홈).
2. [+ 규칙 만들기] → 앱을 열 때 묻기 → 대상 앱(상표 없는 앱 · 예: 계산기) → 시간 → 문장 저장.
3. **공개 문구 화면**을 2~3초 멈춰 보여 준다(보는 것 · 안 보는 것 · 보내는 것).
4. **거절 흐름**: [나중에]를 누른다 → 홈에 "접근성 권한이 꺼져 있어요"가 보인다(기능이 조용히 안 되는 척하지 않는다 · 기둥 7).
5. 다시 권한 줄 → 공개 문구 → [동의하고 설정 열기] → Android 설정에서 "App check-in"을 켠다.
6. 대상 앱을 연다 → 확인 화면(내 문장 · [취소] [열기]) → [취소] → 홈으로.
7. 다시 연다 → [열기] → 대상 앱이 바로 열린다.

`adb shell screenrecord`(최대 180초)로 찍고 YouTube 에 "일부 공개"로 올린다.

### 5.8 그 밖의 설문

| 설문 | 답 |
|---|---|
| 정부 앱 | 아니요 |
| 금융 기능 | 없음 |
| 건강 앱 | 아니요(자기관리 도구 · 의료 아님 · 약관 제7조) |
| 뉴스 앱 | 아니요 |
| 코로나 관련 | 아니요 |
| 데이터 보안 외 권한 선언 | 없음(`QUERY_ALL_PACKAGES` · `USE_EXACT_ALARM` · `SYSTEM_ALERT_WINDOW` · 포그라운드 서비스 차단 · `app.json` blockedPermissions · `check:manifest`) |

## 6. 비공개 테스트 트랙

- 트랙: 비공개 테스트(알파) · 국가 §4 와 같다.
- 출시 노트(en-US): `First closed test build.` / (ko-KR): `첫 비공개 테스트 빌드예요.`
- 🔴 결정 #37: 14일 동안 문의 화면 · 실행 확인 알림 발송 · 규칙 수정 · 삭제를 새 AAB 로 채운다. 🔴 **14일 동안 OTA 는 쓰지 않는다**(결정 #39 · 고칠 것은 새 AAB 로).
- ⚠ 함정: 새 AAB 를 올릴 때 **다른 트랙에 남은 옛 AAB** 가 활성이면 경고 · 거부가 난다 — 트랙마다 확인(`common/PLAY_RELEASE_AUTOMATION.md` §5).
- 서비스 계정을 쓰게 되면 권한은 **"테스트 트랙에 출시"만** 준다.
- 버전: `0.1.0` · versionCode 1. 프로모션 코드로 받는 테스터뿐이라 0.x 를 유지한다(`PRE_LAUNCH_CHECK.md` §4 "낯선 사람이 돈을 낼 수 있으면 1.0" — 프로덕션 전에 1.0 으로).
