# 2026-10-06 Play 정책 점검: 실제 반려 · 통과 사례 (🔴 정본 아님)

> 🔴 **정본이 아니다.** 정책 원문과 그 해석의 정본은 [`../ANDROID_PLATFORM.md`](../ANDROID_PLATFORM.md) §8 이다. 채택한 것만 그쪽과 `../../CLAUDE.md` §14 로 올린다.
> 사용자 지시(2026-10-06): *"가장 큰 위험인 정책부터 확인해보자"*.
> 방법: ① 정책 원문 5개 페이지를 직접 읽어 대조(→ ANDROID_PLATFORM §8) ② 서브 에이전트가 개발자 글 · GitHub · Play 등록정보에서 실제 사례 수집 ③ 그중 결정적인 2건(아래 R1 · R2)은 원문을 직접 다시 읽어 확인했다.
> 표기: **직접 확인** = 이 세션이 원문을 읽었다 · **에이전트 수집** = 에이전트가 읽었고 이 세션은 다시 안 읽었다(`SESSION_PROTOCOL.md` §3).

---

## 1. 반려 사례 — 전부 "눈에 띄는 공개 문구 없음"이었다

| # | 앱 · 성격 | 반려 사유(원문) | 고친 법 | 출처 · 확인 |
|---|---|---|---|---|
| R1 | SocialStopper · **화면 시간 관리**(우리와 같은 분류) | *"Missing prominent disclosure. We were unable to approve your app because we could not locate prominent disclosure of your use of the AccessibilityService API in your app."* · **4회 반려** | 접근성 서비스를 **통째로 빼고** 사용 기록 폴링(약 800ms 간격 · 10초 창)으로 바꿨다. 지연 100ms 미만 → 약 800ms. 다시 낸 지 2일 만에 통과 | https://dev.to/lui61140/why-i-removed-accessibilityservice-from-my-android-app-and-finally-got-into-play-store-4i52 (2026-05-27) · **직접 확인** |
| R2 | GlucoDataHandler · 혈당 표시(AOD 기능) | 공개 문구가 메뉴 > 설정 안에 있었다(*"Must be displayed in the normal usage of the app and not require the user to navigate through a menu or settings"*) · **동의 전에 스위치가 먼저 켜졌다** · 첫 실행 대화상자 버튼이 "Got it" 하나였다 | 메인 화면 카드에서 진입 · **"동의 / 나중에" 두 버튼 공개 화면을 시스템 설정 열기 전에** · 동의 전엔 스위치가 안 바뀐다 · `canRetrieveWindowContent="false"` · 기능은 선택이고 기본 꺼짐 | https://github.com/pachi81/GlucoDataHandler/pull/364 (2026-09-28) · **직접 확인** |
| R3 | TelePort · Android TV 리모컨 | "Missing prominent disclosure (in-app)"(2026-06-23) | "동의 / 거절" 대화상자에 *"아무것도 수집 · 저장 · 공유하지 않는다"* · `isAccessibilityTool="false"` | https://github.com/ravitejakamalapuram/TelePort/pull/249 (2026-09-23) · 에이전트 수집 |

- ★ 찾은 반려는 **전부 절차(공개 문구) 문제**였다. "용도가 안 된다"로 반려된 디지털 웰빙 앱 사례는 찾지 못했다(없다는 뜻은 아니다).
- 🔴 R1 의 덫: 접근성 서비스가 든 **옛 AAB 가 알파 · 내부 테스트 트랙에 남아 있으면**, 새 빌드에서 뺐어도 선언 요구가 계속 걸렸다. 모든 트랙에 새 AAB 를 올려야 풀렸다.
- R1 은 "접근성을 빼면 통과한다"의 증거이지 "접근성은 안 된다"의 증거가 아니다. 공개 문구를 제대로 만들지 못한 채 4번 냈다.

## 2. 통과 사례 — 같은 일을 하는 앱이 게시돼 있다 (Play 등록정보 문구 · 에이전트 수집 2026-10-06)

| 앱 | 등록정보의 접근성 문장 |
|---|---|
| **one sec**(2026-09-23 갱신) | *"This app uses the Accessibility Service API to detect and interrupt user-selected target apps. We do not collect personal information. All data remains offline and on-device."* ← 🔴 **우리 기능 A 와 거의 같다** |
| Lock Me Out | *"The Accessibility Service permission is required to detect which apps or websites are open, so that your chosen apps and websites can be blocked. Information provided by the Accessibility Service is not collected or shared in any way."* |
| Forest | *"Time Guard uses Android AccessibilityService API to detect which app is currently active on your device, so it can block apps you've added to your distraction list during focus sessions."* |
| BlockSite · Stay Focused · Digital Detox · ScreenZen · AppBlock | 같은 모양(무엇을 감지 · 왜 · 수집 · 공유 안 함) |

- 공통 문장 구조: **무엇을 감지하나(앞에 나온 앱) → 왜(사용자가 고른 앱에 개입) → 수집 · 공유하지 않는다.**
- ⏸ 앱 안 공개 화면은 못 봤다. 등록정보 문구만 확인했다. 한국 앱(열품타 · 챌린저스)의 문구 · 사례는 찾지 못했다.

## 3. 찾지 못한 것 (근거가 얇다)

- "기기 및 네트워크 악용"으로 웰빙 오버레이 앱이 걸린 사례: **없음**. 찾은 악용 반려는 코드를 내려받는 SDK 문제였다.
- 영상 내용 때문에 반려된 사례: 없음(정책 문장에서 추론할 뿐).
- 사용 기록 + 오버레이 방식이 반려된 사례: 없음.

## 4. 판정 (이 세션의 평가 · 채택 여부는 사용자 결정)

1. **기능 A 를 접근성 서비스로 만드는 길은 열려 있다.** 같은 용도의 앱이 여럿 게시돼 있고 문구까지 거의 같다. 확인된 반려는 전부 공개 문구 절차였고 고칠 수 있다.
2. **가장 현실적인 위험은 "공개 문구 반려 반복"이다.** R2 의 실수 세 가지(메뉴 속 · 동의 전 켜짐 · 버튼 하나)를 처음부터 피해서 만든다.
3. **두 번째 위험은 OS 쪽이다.** Android 17 고급 보호 모드에서는 접근성이 강제로 꺼진다(ANDROID_PLATFORM §8.5). 사용자는 적지만 그 기기에서는 기능 A 가 멈춘다. 숨기지 않고 알린다(기둥 7).
4. **사용 기록 폴링은 대안이지 공짜가 아니다.** 지연이 약 800ms 로 늘고(R1 실측), 상시 감시를 하려면 포그라운드 서비스 선언(`specialUse` · 영상)이 붙을 수 있다(ANDROID_PLATFORM §4.3 · R1 이 어떻게 했는지는 글에 없다 ⏸).
5. 기능 B(실행 확인)는 사용 기록 사후 조회로 하면 **접근성 선언과 무관**하다. 기능 B 만 쓰는 사용자에게 접근성을 요구하지 않는다.

## 5. 설계로 옮길 것 (ANDROID_PLATFORM §7 · §8 에 반영)

- [ ] 공개 화면: 전체 화면 · **"동의하고 설정 열기" / "나중에"** 두 버튼 · 시스템 접근성 설정을 열기 **전에** · 실행 전 확인 규칙을 처음 만드는 흐름 안(메뉴 속 아님)
- [ ] 동의 전에는 어떤 스위치도 켜진 것처럼 보이지 않는다 · 뒤로가기 · 홈 · 바깥 누르기는 동의가 아니다(User Data 정책)
- [ ] 문구 구조: 감지하는 것(앞에 나온 앱 이름) · 안 보는 것(화면 내용 · 입력 · 다른 앱 사용) · 왜 · 기기 밖으로 안 나간다
- [ ] 같은 문장을 Play 등록정보 · 처리방침에도(세 곳이 같은 말을 한다)
- [ ] `canRetrieveWindowContent="false"` · `isAccessibilityTool="false"` · 가드 `check:manifest`
- [ ] 영상 대본 = 위 흐름 그대로(열기 → 공개 → 동의 → 설정에서 켜기 → 거절 → 유튜브 열 때 확인 화면)
- [ ] 접근성이 든 AAB 를 올린 뒤 방식을 바꾸면 **모든 트랙**에 새 AAB(R1 의 덫)
- [ ] 고급 보호 모드 감지(`AdvancedProtectionManager`) · 규칙 카드에 안내
