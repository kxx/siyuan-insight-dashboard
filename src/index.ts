import { App as VueApp, createApp } from "vue";
import { Custom, Plugin, getFrontend, openTab } from "siyuan";
import Dashboard from "@/Dashboard.vue";
import "@/index.scss";

const TAB_TYPE = "siyuan_insight_dashboard_tab";

export default class SiyuanDashboardPlugin extends Plugin {
  private dashboardApps = new Map<Element, VueApp>();

  async onload() {
    const plugin = this;
    this.addIcons(`<symbol id="iconDashboardHome" viewBox="0 0 32 32">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h6A2.5 2.5 0 0 1 15 5.5v8a2.5 2.5 0 0 1-2.5 2.5h-6A2.5 2.5 0 0 1 4 13.5v-8Zm13 0A2.5 2.5 0 0 1 19.5 3h6A2.5 2.5 0 0 1 28 5.5v4a2.5 2.5 0 0 1-2.5 2.5h-6A2.5 2.5 0 0 1 17 9.5v-4Zm0 11A2.5 2.5 0 0 1 19.5 14h6a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5h-6a2.5 2.5 0 0 1-2.5-2.5v-10ZM4 20.5A2.5 2.5 0 0 1 6.5 18h6a2.5 2.5 0 0 1 2.5 2.5v6a2.5 2.5 0 0 1-2.5 2.5h-6A2.5 2.5 0 0 1 4 26.5v-6Z"/>
    </symbol>`);

    this.addTab({
      type: TAB_TYPE,
      init(this: Custom) {
        this.element.classList.add("sy-dashboard-tab");
        const host = document.createElement("div");
        host.className = "sy-dashboard-root";
        this.element.appendChild(host);
        try {
          const app = createApp(Dashboard, { siyuanApp: plugin.app });
          app.mount(host);
          plugin.dashboardApps.set(this.element, app);
        } catch (error) {
          console.error("[siyuan-insight-dashboard] mount failed", error);
          host.innerHTML = `<div style="padding:24px;color:var(--b3-card-error-color)">仪表盘加载失败，请打开开发者工具查看错误。</div>`;
        }
      },
      destroy(this: Custom) {
        plugin.dashboardApps.get(this.element)?.unmount();
        plugin.dashboardApps.delete(this.element);
      },
    });

    this.addCommand({
      langKey: "openDashboard",
      hotkey: "⌥D",
      callback: () => this.openDashboard(),
    });
  }

  onLayoutReady() {
    this.addTopBar({
      icon: "iconDashboardHome",
      title: "打开仪表盘",
      position: "right",
      callback: () => this.openDashboard(),
    });
  }

  onunload() {
    this.dashboardApps.forEach((app) => app.unmount());
    this.dashboardApps.clear();
  }

  private openDashboard() {
    const frontend = getFrontend();
    openTab({
      app: this.app,
      custom: {
        id: this.name + TAB_TYPE,
        icon: "iconDashboardHome",
        title: "仪表盘",
        data: { frontend },
      },
    });
  }
}
