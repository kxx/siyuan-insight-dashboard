# SiYuan Insight Dashboard

> A native-style personal analytics dashboard for SiYuan Note.

SiYuan Insight Dashboard turns workspace data into a focused home view with note statistics, recent activity, yearly progress, a 365-day writing heatmap, and recently edited documents. It runs in its own SiYuan tab and never requires a dashboard document.

[简体中文说明](README_zh_CN.md)

## Features

- Time-aware greeting with current date, weekday, and time.
- Total document count and estimated content size.
- Documents created and modified during the latest seven calendar days.
- Year progress with elapsed days, remaining days, and percentage.
- 365-day activity heatmap based on distinct documents modified each day.
- Recently modified document list with direct navigation.
- Manual refresh from the dashboard toolbar.
- Responsive four-, two-, and one-column layouts.
- Automatic support for SiYuan light, dark, and most third-party themes.

## Key characteristics

- **Native plugin experience:** opens from the top bar or command palette in a dedicated tab.
- **Read-only by design:** uses SiYuan's SQL query endpoint without writing to the database or editing notes.
- **Local-first:** no telemetry, external analytics, API keys, or note uploads.
- **Theme-aware:** colors are derived from SiYuan's `--b3-*` CSS variables.
- **Modular:** plugin registration, data access, dashboard UI, and styling are separated for future extension.
- **Automated builds:** GitHub Actions performs type checking, production builds, and package generation.

## Statistics

| Metric | Definition |
| --- | --- |
| Notes | Number of document blocks where `type = 'd'` |
| Estimated characters | Sum of `length` for non-document blocks |
| New this week | Documents created during the latest seven calendar days |
| Modified this week | Documents updated during the latest seven calendar days |
| Heatmap | Distinct documents modified on each day |

The character count is an estimate intended for scale and trend tracking rather than strict linguistic word counting.

## Installation

1. Download the latest `package.zip` from GitHub Releases.
2. Fully quit SiYuan.
3. Extract the package into:

```text
<workspace>/data/plugins/siyuan-insight-dashboard
```

4. Make sure `plugin.json`, `index.js`, and `index.css` are directly inside that directory.
5. Restart SiYuan and enable **SiYuan Insight Dashboard** under Settings → Marketplace → Downloaded → Plugins.

When upgrading, delete the old plugin directory before extracting the new package to prevent stale files from remaining.

## Usage

- Click the dashboard icon in SiYuan's top toolbar.
- Or run **Open Dashboard** from the command palette.
- Press `Alt+D` to use the default shortcut.
- Use the refresh icon to reload statistics immediately.
- Click a recent document to open it in SiYuan.

## Compatibility

- Minimum SiYuan version: `3.6.0`
- Supports SiYuan desktop and browser frontends.
- Designed for Windows, macOS, Linux, and Docker-backed workspaces supported by SiYuan.

## Privacy and security

- No telemetry or tracking.
- No external network requests for note data.
- No SiYuan API token required.
- No direct access to or modification of `.sy` files.
- No database write statements.

## Development

Node.js 20 or a compatible release is recommended.

```bash
git clone https://github.com/kxx/siyuan-insight-dashboard.git
cd siyuan-insight-dashboard
npm install --legacy-peer-deps
npm run typecheck
npm run build
```

The production package is generated as `package.zip` in the repository root.

## Project structure

```text
src/
├── Dashboard.vue       Dashboard UI and interactions
├── api.ts              SiYuan API access and SQL queries
├── index.ts            Plugin entry, custom tab, command and toolbar button
├── index.scss          Layout, cards, heatmap and responsive styles
└── i18n/               Localized command labels
```

## Roadmap

- Widget visibility and ordering settings.
- Configurable date ranges and heatmap thresholds.
- Daily document drill-down from the heatmap.
- Quick links and pinned documents.
- Habit tracking and custom cards.
- Expanded mobile and third-party theme support.

## Inspiration and acknowledgements

The dashboard concept, modular organization, and parts of the visual layout were inspired by [JiaoTangXQ/obsidian-theme](https://github.com/JiaoTangXQ/obsidian-theme), an open-source modular dashboard for Obsidian built around reusable views, shared components, and theme variables.

This plugin is independently implemented for SiYuan's plugin API, database model, and interface system; it does not depend on Obsidian or Dataview.

Special thanks to **JiaoTangXQ** for sharing the original project and its thoughtful design ideas. Thanks also to the SiYuan team for its open plugin platform, kernel API, and development templates.

## License

[MIT License](LICENSE)
