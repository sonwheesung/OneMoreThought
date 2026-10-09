package expo.modules.intervention

import android.content.Context
import android.content.res.Configuration
import android.graphics.Canvas
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.RenderEffect
import android.graphics.Shader
import android.graphics.Typeface
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.LayerDrawable
import android.graphics.text.LineBreakConfig
import android.os.Build
import android.text.Layout
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowInsets
import android.view.animation.DecelerateInterpolator
import android.view.animation.PathInterpolator
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

/**
 * 확인 화면 그림 · 결정 #33 «새벽 호수» · 시안 원모어 #1(세로) · #2(가로) · #3(고른 뒤).
 * 액티비티(InterventionActivity)와 오버레이판(InterventionService)이 같은 그림을 쓴다.
 *
 * 🔴 기둥 1: [취소] · [열기] 둘뿐 · 버튼은 애니메이션 밖(첫 프레임부터 보이고 눌린다) · [열기]는 걷힘 없이 즉시.
 * 🔴 기둥 2: 두 알약은 똑같다(색 · 크기 · 글자). 확인 화면에 그라데이션 주 버튼을 쓰지 않는다. 빨강 없음.
 * 🔴 기둥 4: 메시지는 쓴 그대로 · 자르지 않는다(길면 줄이 는다).
 * 🔴 ANDROID_PLATFORM §8.2: 맨 위 «우리 앱 · 대상 앱». 이름은 박지 않고 시스템에서 읽는다(서비스명 미정 · 미결정 N).
 * 🔴 바탕은 불투명(omt_bg + 우리 번짐). 창 블러 · 반투명 창으로 뒤 앱을 비치게 하지 않는다.
 *    블러(RenderEffect · API 31+)는 우리 번짐 층에만 건다. 그 아래 버전은 그라데이션만(단색 대체).
 * 색은 res/values(-night)/colors.xml 의 omt_* (정본: 시안 세션 calm_tokens.md §5).
 */
internal class ConfirmView(
  private val ctx: Context,
  private val targetPkg: String,
  message: String,
  ruleName: String,
  private val onCancel: () -> Unit,
  private val onOpen: () -> Unit,
) {
  private val density = ctx.resources.displayMetrics.density
  private fun dp(v: Float): Int = (v * density + 0.5f).toInt()
  private fun color(id: Int): Int = ctx.getColor(id)
  private val ease = PathInterpolator(0.2f, 0.8f, 0.2f, 1f)
  private val landscape = ctx.resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE

  /** 붙일 뷰(번짐 층 + 내용) */
  val root = FrameLayout(ctx)
  /** 걷힐 것(글자 · 알약). 번짐 층은 제외 — 걷히는 동안 뒤에 보이는 것은 우리 배경이다 */
  private val content = TouchGate(ctx)
  private val meta = text(13f, 500, R.color.omt_text2)
  private val msg = text(if (landscape) 28f else 32f, 600, R.color.omt_text)
  private val rule = text(if (landscape) 14f else 15f, 400, R.color.omt_text2)
  /** 등장 연출을 받는 묶음(버튼 제외) */
  private val reveal = ArrayList<View>()

  init {
    root.addView(glowLayer(), FrameLayout.LayoutParams(-1, -1))
    meta.text = metaLine()
    meta.compoundDrawablePadding = dp(8f)
    meta.setCompoundDrawablesRelativeWithIntrinsicBounds(appDot(), null, null, null)
    msg.letterSpacing = -0.03f
    msg.setLineSpacing(0f, 1.3f)
    msg.breakStrategy = Layout.BREAK_STRATEGY_BALANCED
    rule.letterSpacing = -0.01f
    if (Build.VERSION.SDK_INT >= 33) {
      // 한국어를 어절 단위로 줄바꿈(calm_tokens §4 keep-all)
      msg.lineBreakWordStyle = LineBreakConfig.LINE_BREAK_WORD_STYLE_PHRASE
      rule.lineBreakWordStyle = LineBreakConfig.LINE_BREAK_WORD_STYLE_PHRASE
    }
    setMessage(message, ruleName)

    val cancel = pill(ctx.getString(R.string.intervention_cancel), onCancel)
    val open = pill(ctx.getString(R.string.intervention_open), onOpen)
    if (landscape) buildLandscape(cancel, open) else buildPortrait(cancel, open)
    root.addView(content, FrameLayout.LayoutParams(-1, -1))

    // 시스템 막대 · 노치 안쪽 + 시안 여백(세로 위 28 · 좌우 24 · 아래 34 / 가로 위아래 20 · 좌우 28)
    val (padH, padTop, padBottom) = if (landscape) Triple(28f, 20f, 20f) else Triple(24f, 28f, 34f)
    content.setOnApplyWindowInsetsListener { v, insets ->
      val l: Int; val t: Int; val r: Int; val b: Int
      if (Build.VERSION.SDK_INT >= 30) {
        val s = insets.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout())
        l = s.left; t = s.top; r = s.right; b = s.bottom
      } else {
        @Suppress("DEPRECATION")
        run { l = insets.systemWindowInsetLeft; t = insets.systemWindowInsetTop; r = insets.systemWindowInsetRight; b = insets.systemWindowInsetBottom }
      }
      v.setPadding(l + dp(padH), t + dp(padTop), r + dp(padH), b + dp(padBottom))
      insets
    }
  }

  /** 세로(#1): 맨 위 메타 줄 · 가운데 둥근 표시 + 메시지 + 둘째 줄 · 엄지 자리에 같은 알약 둘 */
  private fun buildPortrait(cancel: View, open: View) {
    val col = MaxWidth(ctx, dp(520f)).apply { orientation = LinearLayout.VERTICAL }
    meta.gravity = Gravity.CENTER
    msg.gravity = Gravity.CENTER
    rule.gravity = Gravity.CENTER
    val textBlock = LinearLayout(ctx).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      addView(halo(), LinearLayout.LayoutParams(dp(56f), dp(56f)))
      addView(msg, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(22f) })
      addView(rule, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(16f) })
    }
    val row = LinearLayout(ctx).apply {
      orientation = LinearLayout.HORIZONTAL
      addView(cancel, LinearLayout.LayoutParams(0, dp(58f), 1f))
      addView(open, LinearLayout.LayoutParams(0, dp(58f), 1f).apply { marginStart = dp(12f) })
    }
    col.addView(meta, LinearLayout.LayoutParams(-1, -2))
    col.addView(textBlock, LinearLayout.LayoutParams(-1, 0, 1f))
    col.addView(row, LinearLayout.LayoutParams(-1, -2))
    content.addView(col, FrameLayout.LayoutParams(-1, -1, Gravity.CENTER_HORIZONTAL))
    reveal += meta
    reveal += textBlock
  }

  /** 가로(#2): 왼쪽 글자 블록(왼쪽 정렬) | 오른쪽 알약 둘(196dp · 위아래) · 카드 최대 520dp · 안전 영역 가운데 */
  private fun buildLandscape(cancel: View, open: View) {
    val card = MaxWidth(ctx, dp(520f)).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
    }
    meta.gravity = Gravity.START or Gravity.CENTER_VERTICAL
    msg.gravity = Gravity.START
    rule.gravity = Gravity.START
    val left = LinearLayout(ctx).apply {
      orientation = LinearLayout.VERTICAL
      addView(meta, LinearLayout.LayoutParams(-2, -2))
      addView(msg, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(18f) })
      addView(rule, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(10f) })
    }
    val right = LinearLayout(ctx).apply {
      orientation = LinearLayout.VERTICAL
      addView(cancel, LinearLayout.LayoutParams(-1, dp(54f)))
      addView(open, LinearLayout.LayoutParams(-1, dp(54f)).apply { topMargin = dp(12f) })
    }
    card.addView(left, LinearLayout.LayoutParams(0, -2, 1f).apply { marginEnd = dp(36f) })
    card.addView(right, LinearLayout.LayoutParams(dp(196f), -2))
    content.addView(card, FrameLayout.LayoutParams(-1, -2, Gravity.CENTER))
    reveal += left
  }

  fun setMessage(message: String, ruleName: String) {
    msg.text = message
    rule.text = ctx.getString(R.string.intervention_rule, ruleName)
    rule.visibility = if (ruleName.isEmpty()) View.GONE else View.VISIBLE
  }

  /** 등장: 글자 묶음만 6dp · 240ms 떠오른다. 🔴 버튼 · 창 바탕은 0ms(창 페이드 중엔 뒤 앱이 비친다) */
  fun playReveal() {
    content.alpha = 1f
    content.blocked = false
    reveal.forEachIndexed { i, v ->
      v.animate().cancel()
      v.alpha = 0f
      v.translationY = dp(6f).toFloat()
      v.animate().alpha(1f).translationY(0f).setStartDelay(i * 60L).setDuration(240).setInterpolator(ease).start()
    }
  }

  /** [취소] 뒤(#3): 글자 · 알약만 140ms 걷힌다. 바탕은 불투명 그대로. 걷히는 동안 터치를 받지 않는다 */
  fun dismiss(then: () -> Unit) {
    content.blocked = true
    content.animate().alpha(0f).setDuration(140).setInterpolator(DecelerateInterpolator()).withEndAction(then).start()
  }

  // ── 부품 ────────────────────────────────────────────────

  private fun metaLine(): String {
    val ours = ctx.applicationInfo.loadLabel(ctx.packageManager).toString()
    val target = try {
      ctx.packageManager.getApplicationLabel(ctx.packageManager.getApplicationInfo(targetPkg, 0)).toString()
    } catch (_: Exception) { "" }
    return if (target.isEmpty()) ours else "$ours · $target"
  }

  private fun text(sp: Float, weight: Int, colorId: Int) = TextView(ctx).apply {
    setTextSize(TypedValue.COMPLEX_UNIT_SP, sp)
    typeface = weighted(weight)
    setTextColor(color(colorId))
    includeFontPadding = false
  }

  /** 시스템 글꼴 굵기. API 28 아래는 굵게 / 보통 둘뿐이다 */
  private fun weighted(weight: Int): Typeface =
    if (Build.VERSION.SDK_INT >= 28) Typeface.create(Typeface.DEFAULT, weight, false)
    else if (weight >= 600) Typeface.DEFAULT_BOLD else Typeface.DEFAULT

  /** [취소][열기] 같은 유리 알약 — Button 대신(기기 테마 · 대문자 · 그림자를 피한다) · 눌림 .97 · 120ms · 스프링 없음 */
  private fun pill(label: String, onClick: () -> Unit) = TextView(ctx).apply {
    text = label
    isAllCaps = false
    gravity = Gravity.CENTER
    setTextSize(TypedValue.COMPLEX_UNIT_SP, 17f)
    typeface = weighted(600)
    letterSpacing = -0.01f
    setTextColor(color(R.color.omt_text))
    background = GradientDrawable().apply {
      cornerRadius = 999f * density
      setColor(color(R.color.omt_confirm_btn))
      setStroke(dp(1f).coerceAtLeast(1), color(R.color.omt_confirm_btn_line))
    }
    isClickable = true
    isFocusable = true
    contentDescription = label
    setOnTouchListener { v, e ->
      when (e.actionMasked) {
        MotionEvent.ACTION_DOWN -> v.animate().scaleX(0.97f).scaleY(0.97f).setDuration(120).setInterpolator(ease).start()
        MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> v.animate().scaleX(1f).scaleY(1f).setDuration(120).setInterpolator(ease).start()
      }
      false
    }
    setOnClickListener { onClick() }
  }

  /** 불투명 bg + 끝이 투명한 반경 그라데이션 3개(라벤더 왼쪽 위 · 민트 오른쪽 가운데 · 라일락 아래) */
  private fun glowLayer(): View = object : View(ctx) {
    override fun onSizeChanged(w: Int, h: Int, ow: Int, oh: Int) {
      val base = if (landscape) h * 2f else w.toFloat()
      fun blob(colorId: Int, cx: Float, cy: Float, r: Float) = GradientDrawable().apply {
        gradientType = GradientDrawable.RADIAL_GRADIENT
        gradientRadius = r
        val c = color(colorId)
        colors = intArrayOf(c, c and 0x00FFFFFF)
        setGradientCenter(cx, cy)
      }
      background = LayerDrawable(arrayOf<Drawable>(
        ColorDrawable(color(R.color.omt_bg)),
        blob(R.color.omt_bg_glow_a, 0.15f, 0.08f, 0.42f * base),
        blob(R.color.omt_bg_glow_b, 0.95f, 0.45f, 0.39f * base),
        blob(R.color.omt_bg_glow_c, 0.20f, 1.00f, 0.43f * base),
      ))
      // 우리 번짐 층만 더 흐리게(창 블러가 아니다 · 뒤 앱과 무관). 가장자리 CLAMP 라 바탕이 비지 않는다
      if (Build.VERSION.SDK_INT >= 31) setRenderEffect(RenderEffect.createBlurEffect(24f * density, 24f * density, Shader.TileMode.CLAMP))
    }
  }

  /** 메타 줄 앞 앱 점: accentSoft 원 위 accent 점(18dp) */
  private fun appDot(): Drawable {
    // 점 하나만(아이콘에 배경을 두지 않는다 · 2026-10-10 사용자 지시)
    val size = dp(8f)
    return GradientDrawable().apply {
      shape = GradientDrawable.OVAL
      setColor(color(R.color.omt_accent))
      setSize(size, size) // 글자 옆 그림은 고유 크기로 놓인다
    }
  }

  /** 둥근 표시: 물결 선(accent)만. 그림 · 캐릭터 없이 "잠깐"을 말한다(유리 원 배경은 걷었다 · 2026-10-10 사용자 지시) */
  private fun halo(): View = View(ctx).apply {
    background = WaveDrawable(color(R.color.omt_accent), 2f * density)
    importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
  }

  /** 물결 두 줄(가운데 · 칸 폭의 40%) */
  private class WaveDrawable(color: Int, stroke: Float) : Drawable() {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      this.color = color; style = Paint.Style.STROKE; strokeWidth = stroke; strokeCap = Paint.Cap.ROUND
    }
    private val path = Path()
    override fun draw(canvas: Canvas) {
      val b = bounds
      val w = b.width() * 0.40f
      val amp = b.height() * 0.05f
      val x0 = b.exactCenterX() - w / 2
      path.reset()
      for (dy in floatArrayOf(-b.height() * 0.07f, b.height() * 0.07f)) {
        val y = b.exactCenterY() + dy
        path.moveTo(x0, y)
        path.cubicTo(x0 + w / 4, y - amp * 2, x0 + w / 4, y + amp * 2, x0 + w / 2, y)
        path.cubicTo(x0 + w * 3 / 4, y - amp * 2, x0 + w * 3 / 4, y + amp * 2, x0 + w, y)
      }
      canvas.drawPath(path, paint)
    }
    override fun setAlpha(alpha: Int) { paint.alpha = alpha }
    override fun setColorFilter(cf: ColorFilter?) { paint.colorFilter = cf }
    @Deprecated("Deprecated in Java")
    override fun getOpacity(): Int = PixelFormat.TRANSLUCENT
  }

  /** 최대 폭을 넘지 않는 LinearLayout(가로 · 태블릿 · 폴더블에서 줄이 끝없이 길어지지 않게) */
  private class MaxWidth(ctx: Context, private val max: Int) : LinearLayout(ctx) {
    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
      val w = MeasureSpec.getSize(widthMeasureSpec)
      val spec = if (w > max) MeasureSpec.makeMeasureSpec(max, MeasureSpec.EXACTLY) else widthMeasureSpec
      super.onMeasure(spec, heightMeasureSpec)
    }
  }

  /** 걷히는 동안 터치를 막는 틀(두 번 누름은 decided 가 이미 막지만 [열기]가 눌린 것처럼 보이지 않게) */
  private class TouchGate(ctx: Context) : FrameLayout(ctx) {
    var blocked = false
    override fun onInterceptTouchEvent(ev: MotionEvent): Boolean = blocked || super.onInterceptTouchEvent(ev)
    @Suppress("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean = blocked || super.onTouchEvent(event)
  }
}
