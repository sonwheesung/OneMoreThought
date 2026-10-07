package expo.modules.intervention

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Calendar

/**
 * JS ↔ 네이티브 다리. 결정 #10 · docs/ANDROID_PLATFORM.md §2 ~ §6 · §8.5.
 * 실패는 JS 로 던지지 않고 false · null · "unknown" 을 돌려준다(SnoreLess alarm-tone 승계).
 */
class InterventionModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context lost")

  override fun definition() = ModuleDefinition {
    Name("Intervention")

    // ── 접근성 서비스(기능 A) ──
    Function("isServiceEnabled") {
      val me = ComponentName(context, InterventionService::class.java).flattenToString()
      val enabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: ""
      enabled.split(':').any { it.equals(me, ignoreCase = true) }
    }

    /** 🔴 공개 화면(§7.1)에서 동의를 받은 뒤에만 부른다 */
    Function("openAccessibilitySettings") {
      context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    Function("setSpikeRule") { targets: List<String>, message: String ->
      SpikeStore.setRule(context, targets, message)
    }

    Function("getLog") { SpikeStore.log(context) }
    Function("clearLog") { SpikeStore.clearLog(context) }

    // ── 사용 기록(기능 B · S5) ──
    Function("hasUsageAccess") { hasUsageAccess() }

    Function("openUsageAccessSettings") {
      context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    /** 오늘(기기 시간 자정 · 미결정 B 추천안) 이후 그 앱이 처음 앞에 나온 시각(ms). 없으면 null */
    Function("firstOpenedToday") { pkg: String ->
      if (!hasUsageAccess()) return@Function null
      val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val start = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
      }.timeInMillis
      val events = usm.queryEvents(start, System.currentTimeMillis())
      val e = UsageEvents.Event()
      while (events.hasNextEvent()) {
        events.getNextEvent(e)
        // ACTIVITY_RESUMED(29+) == MOVE_TO_FOREGROUND(구) == 1
        if (e.packageName == pkg && e.eventType == 1) return@Function e.timeStamp.toDouble()
      }
      null
    }

    // ── 앱 고르기(§5) ──
    Function("listLaunchableApps") {
      val pm = context.packageManager
      val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      pm.queryIntentActivities(intent, 0)
        .map { it.activityInfo.packageName to it.loadLabel(pm).toString() }
        .distinctBy { it.first }
        .filter { it.first != context.packageName }
        .sortedBy { it.second.lowercase() }
        .map { mapOf("packageName" to it.first, "label" to it.second) }
    }

    // ── 고급 보호 모드(§8.5 · S7) ──
    /** "on" · "off" · "unknown"(API 없음 · 권한 거부 등). 리플렉션이라 컴파일 SDK 와 무관하다 */
    Function("advancedProtection") {
      try {
        val cls = Class.forName("android.security.advancedprotection.AdvancedProtectionManager")
        val mgr = context.getSystemService(cls) ?: return@Function "unknown"
        val on = cls.getMethod("isAdvancedProtectionEnabled").invoke(mgr) as Boolean
        if (on) "on" else "off"
      } catch (e: Throwable) {
        "unknown"
      }
    }

    Function("sdkInt") { Build.VERSION.SDK_INT }
  }

  private fun hasUsageAccess(): Boolean {
    val ops = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    } else {
      @Suppress("DEPRECATION")
      ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }
}
