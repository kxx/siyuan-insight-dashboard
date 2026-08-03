import { fetchSyncPost, IWebSocketData } from "siyuan";

export interface DocumentRow {
  id: string;
  content: string;
  hpath: string;
  created: string;
  updated: string;
}

export interface ActivityRow {
  day: string;
  count: number | string;
}

async function request<T>(url: string, data: unknown): Promise<T> {
  const response: IWebSocketData = await fetchSyncPost(url, data);
  if (response.code !== 0) {
    throw new Error(response.msg || "思源接口请求失败");
  }
  return response.data as T;
}

export function sql<T = Record<string, unknown>>(statement: string): Promise<T[]> {
  return request<T[]>("/api/query/sql", { stmt: statement });
}

export function toSiyuanTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export function toDayKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

export async function loadDashboardData() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const activityStart = new Date();
  activityStart.setDate(activityStart.getDate() - 364);
  activityStart.setHours(0, 0, 0, 0);

  const [statsRows, activity, recent] = await Promise.all([
    sql<{
      note_count: number | string;
      word_count: number | string;
      new_count: number | string;
      modified_count: number | string;
    }>(`
      SELECT
        (SELECT COUNT(*) FROM blocks WHERE type = 'd') AS note_count,
        (SELECT COALESCE(SUM(length), 0) FROM blocks WHERE type <> 'd') AS word_count,
        (SELECT COUNT(*) FROM blocks WHERE type = 'd' AND created >= '${toSiyuanTimestamp(sevenDaysAgo)}') AS new_count,
        (SELECT COUNT(*) FROM blocks WHERE type = 'd' AND updated >= '${toSiyuanTimestamp(sevenDaysAgo)}') AS modified_count
    `),
    sql<ActivityRow>(`
      SELECT SUBSTR(updated, 1, 8) AS day, COUNT(DISTINCT id) AS count
      FROM blocks
      WHERE type = 'd' AND updated >= '${toSiyuanTimestamp(activityStart)}'
      GROUP BY SUBSTR(updated, 1, 8)
      ORDER BY day ASC
    `),
    sql<DocumentRow>(`
      SELECT id, content, hpath, created, updated
      FROM blocks
      WHERE type = 'd'
      ORDER BY updated DESC
      LIMIT 10
    `),
  ]);

  const stats = statsRows[0] || {
    note_count: 0,
    word_count: 0,
    new_count: 0,
    modified_count: 0,
  };
  return {
    stats: {
      noteCount: Number(stats.note_count || 0),
      wordCount: Number(stats.word_count || 0),
      newCount: Number(stats.new_count || 0),
      modifiedCount: Number(stats.modified_count || 0),
    },
    activity,
    recent,
  };
}
