<template>
  <main class="dashboard-shell">
    <header class="dashboard-toolbar">
      <div class="dashboard-title">Dashboard</div>
      <button class="icon-button" :disabled="loading" title="刷新数据" @click="refresh">
        <svg :class="{ spinning: loading }"><use xlink:href="#iconRefresh" /></svg>
      </button>
    </header>

    <div class="dashboard-content">
      <section class="hero card">
        <div class="hero-icon">{{ greeting.icon }}</div>
        <div class="hero-copy">
          <h1>{{ greeting.text }}，回来啦</h1>
          <p>{{ quote }}</p>
        </div>
        <div class="hero-time">
          <strong>{{ formattedDate }}</strong>
          <span>{{ formattedWeek }} · {{ formattedTime }}</span>
        </div>
      </section>

      <div v-if="error" class="error-card card">
        <span>数据读取失败：{{ error }}</span>
        <button class="b3-button b3-button--outline" @click="refresh">重试</button>
      </div>

      <section class="stats-grid" :aria-busy="loading">
        <article v-for="item in statCards" :key="item.label" class="stat-card card">
          <span class="stat-icon">{{ item.icon }}</span>
          <div>
            <strong>{{ item.value }}</strong>
            <p>{{ item.label }}</p>
            <small>{{ item.sub }}</small>
          </div>
        </article>
      </section>

      <section class="panel card year-panel">
        <div class="panel-heading">
          <h2>🗓️ {{ year }} 年时间进度</h2>
          <span>已过 {{ yearProgress.passed }} 天 · 剩 {{ yearProgress.left }} 天</span>
        </div>
        <div class="progress-track">
          <div class="progress-value" :style="{ width: `${yearProgress.percent}%` }">
            <span>{{ yearProgress.percent }}%</span>
          </div>
        </div>
        <div class="progress-dates"><span>{{ year }}-01-01</span><span>{{ year }}-12-31</span></div>
      </section>

      <section class="panel card activity-panel">
        <div class="panel-heading">
          <h2>🔥 写作热力图 · 最近 365 天</h2>
          <span>活跃 {{ activeDays }} 天 · 修改 {{ activityTotal }} 篇文档</span>
        </div>
        <div class="heatmap-scroller">
          <div class="heatmap" aria-label="最近365天写作热力图">
            <button
              v-for="day in heatmapDays"
              :key="day.key"
              class="heat-cell"
              :class="`level-${day.level}`"
              :title="`${day.label}：修改 ${day.count} 篇文档`"
              :aria-label="`${day.label}，修改 ${day.count} 篇文档`"
            />
          </div>
        </div>
        <div class="legend"><span>少</span><i v-for="level in [0, 1, 2, 3, 4]" :key="level" :class="`level-${level}`"/><span>多</span></div>
      </section>

      <section class="panel card recent-panel">
        <div class="panel-heading">
          <h2>📝 最近修改</h2>
          <span>点击直接打开文档</span>
        </div>
        <div v-if="recent.length" class="recent-list">
          <button v-for="doc in recent" :key="doc.id" class="recent-item" @click="openDocument(doc.id)">
            <span class="recent-dot" />
            <span class="recent-main"><strong>{{ doc.content || '未命名文档' }}</strong><small>{{ doc.hpath }}</small></span>
            <time>{{ relativeTime(doc.updated) }}</time>
          </button>
        </div>
        <div v-else class="empty-state">暂无文档</div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { openTab } from "siyuan";
import { ActivityRow, DocumentRow, loadDashboardData, toDayKey } from "@/api";

const props = defineProps<{ siyuanApp: unknown }>();
const now = ref(new Date());
const loading = ref(true);
const error = ref("");
const stats = ref({ noteCount: 0, wordCount: 0, newCount: 0, modifiedCount: 0 });
const activity = ref<ActivityRow[]>([]);
const recent = ref<DocumentRow[]>([]);
let clockTimer: number | undefined;

const quotes = [
  "愿你写下的每一行，都成为照亮前路的自己。",
  "日拱一卒，功不唐捐。",
  "记录不是为了囤积，而是为了更好地思考。",
  "慢慢积累，时间会让知识产生复利。",
];
const quote = quotes[new Date().getDate() % quotes.length];

const greeting = computed(() => {
  const hour = now.value.getHours();
  if (hour < 5) return { text: "夜深了", icon: "🌙" };
  if (hour < 11) return { text: "早上好", icon: "🌅" };
  if (hour < 13) return { text: "中午好", icon: "☀️" };
  if (hour < 18) return { text: "下午好", icon: "⛅" };
  if (hour < 23) return { text: "晚上好", icon: "🌙" };
  return { text: "夜深了", icon: "🌙" };
});

const formattedDate = computed(() => {
  const d = now.value;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
});
const formattedWeek = computed(() => `周${"日一二三四五六"[now.value.getDay()]}`);
const formattedTime = computed(() => now.value.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }));
const year = computed(() => now.value.getFullYear());

const yearProgress = computed(() => {
  const start = new Date(year.value, 0, 1);
  const end = new Date(year.value + 1, 0, 1);
  const total = Math.round((end.getTime() - start.getTime()) / 86400000);
  const passed = Math.floor((now.value.getTime() - start.getTime()) / 86400000) + 1;
  return { passed, left: total - passed, percent: Math.round((passed / total) * 1000) / 10 };
});

const compactNumber = (value: number) => value >= 10000 ? `${Math.round(value / 100) / 100} 万` : value.toLocaleString("zh-CN");
const statCards = computed(() => [
  { icon: "📚", value: compactNumber(stats.value.noteCount), label: "笔记总数", sub: "所有时间" },
  { icon: "✍️", value: compactNumber(stats.value.wordCount), label: "字数估算", sub: "全部内容块" },
  { icon: "🆕", value: stats.value.newCount.toLocaleString("zh-CN"), label: "本周新建", sub: "近 7 天" },
  { icon: "🔧", value: stats.value.modifiedCount.toLocaleString("zh-CN"), label: "本周改动", sub: "近 7 天" },
]);

const activityMap = computed(() => new Map(activity.value.map((item) => [item.day, Number(item.count)])));
const heatmapDays = computed(() => {
  const result = [];
  for (let i = 364; i >= 0; i--) {
    const date = new Date(now.value);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const key = toDayKey(date);
    const count = activityMap.value.get(key) || 0;
    const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;
    result.push({ key, count, level, label: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` });
  }
  return result;
});
const activeDays = computed(() => heatmapDays.value.filter((item) => item.count > 0).length);
const activityTotal = computed(() => heatmapDays.value.reduce((sum, item) => sum + item.count, 0));

async function refresh() {
  loading.value = true;
  error.value = "";
  try {
    const data = await loadDashboardData();
    stats.value = data.stats;
    activity.value = data.activity;
    recent.value = data.recent;
  } catch (exception) {
    error.value = exception instanceof Error ? exception.message : String(exception);
  } finally {
    loading.value = false;
  }
}

function openDocument(id: string) {
  openTab({ app: props.siyuanApp as never, doc: { id } });
}

function relativeTime(timestamp: string) {
  const date = new Date(`${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}T${timestamp.slice(8, 10)}:${timestamp.slice(10, 12)}:${timestamp.slice(12, 14)}`);
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 2592000000) return `${Math.floor(diff / 86400000)} 天前`;
  return `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}`;
}

onMounted(() => {
  refresh();
  clockTimer = window.setInterval(() => { now.value = new Date(); }, 60000);
});
onBeforeUnmount(() => window.clearInterval(clockTimer));
</script>
