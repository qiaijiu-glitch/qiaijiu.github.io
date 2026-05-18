import { postureAnnotations, postureAnnotationMap } from "./posture-annotations.js";
import { circumferenceAnnotationMap } from "./circumference-annotations.js";

const tabs = [
  { id: "composition", label: "身体成分" },
  { id: "posture", label: "体态评估" },
  { id: "girth", label: "身体围度" },
  { id: "shoulder", label: "肩部功能" },
  { id: "report1", label: "报告1" },
  { id: "report2", label: "报告2" },
  { id: "report3", label: "报告3" },
];

const REPORT_PALETTE = {
  brandBlue: "#2F80FF",
  brandIce: "#8FD4FF",
  brandPurple: "#A78BFA",
  statusNormal: "#59B8FF",
  statusLow: "#FFC857",
  statusTip: "#A78BFA",
  statusMid: "#A78BFA",
  statusHigh: "#FF6B8A",
  statusWarn: "#FFC857",
};

function withAlpha(hex, alpha) {
  const value = hex.replace("#", "");
  const channelSize = value.length === 3 ? 1 : 2;
  const channels = value.match(channelSize === 1 ? /./g : /../g) || ["00", "00", "00"];
  const [r, g, b] = channels.map((channel) => {
    const normalized = channelSize === 1 ? channel.repeat(2) : channel;
    return Number.parseInt(normalized, 16);
  });
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function statusTone(type) {
  if (type === "high") return REPORT_PALETTE.statusHigh;
  if (type === "mid") return REPORT_PALETTE.statusMid;
  if (type === "warn") return REPORT_PALETTE.statusWarn;
  if (type === "low") return REPORT_PALETTE.statusLow;
  if (type === "tip") return REPORT_PALETTE.statusTip;
  return REPORT_PALETTE.statusNormal;
}

function compositionStatusColor(type) {
  if (type === "high") return "#ff6b6b";
  if (type === "low") return "#a78bfa";
  return "#2fff82";
}

const metrics = [
  { name: "体重", value: "73.2", unit: "kg", change: "↑ 6.2", status: "超标准", statusType: "high", pointer: 62, limits: ["58", "85"], trend: [70.7, 63.2, 64.7, 65.1, 69.5, 69.2] },
  { name: "体脂肪", value: "12.3", unit: "kg", change: "↓ 1.4", status: "低标准", statusType: "low", pointer: 28, limits: ["8", "14"], trend: [10.8, 11.4, 10.9, 12.1, 12.5, 12.3] },
  { name: "肌肉量", value: "56.2", unit: "kg", change: "↑ 0.9", status: "标准", statusType: "normal", pointer: 54, limits: ["45", "68"], trend: [51.5, 53.2, 55.1, 55.7, 56.4, 56.2] },
  { name: "骨骼肌", value: "19.2", unit: "kg", change: "↓ 0.3", status: "低标准", statusType: "low", pointer: 31, limits: ["18", "25"], trend: [18.4, 18.9, 19.1, 18.8, 19.4, 19.2] },
  { name: "去脂体重", value: "36.2", unit: "kg", change: "↓ 5.6", status: "标准", statusType: "normal", pointer: 48, limits: ["30", "45"], trend: [34.1, 34.8, 35.2, 35.6, 36.1, 36.2] },
  { name: "无机盐", value: "8.2", unit: "kg", change: "↑ 0.4", status: "超标准", statusType: "high", pointer: 74, limits: ["5", "8"], trend: [7.1, 7.4, 7.7, 7.8, 8.1, 8.2] },
  { name: "蛋白质", value: "12.5", unit: "kg", change: "↑ 0.2", status: "标准", statusType: "normal", pointer: 56, limits: ["10", "14"], trend: [11.8, 12.0, 12.1, 12.4, 12.6, 12.5] },
  { name: "总水分", value: "45.6", unit: "kg", change: "↑ 1.2", status: "超标准", statusType: "high", pointer: 71, limits: ["34", "44"], trend: [42.1, 43.0, 43.4, 44.0, 45.2, 45.6] },
  { name: "代谢年龄", value: "27", unit: "岁", change: "↓ 1", status: "", statusType: "tip", pointer: 39, limits: ["24", "32"], trend: [29, 28, 28, 27, 27, 27] },
  { name: "基础代谢", value: "1225.9", unit: "kcal/d", change: "↕ 0.0", status: "低标准", statusType: "low", pointer: 32, limits: ["1160", "1450"], trend: [1201, 1218, 1220, 1224, 1226, 1225.9] },
  { name: "内脏脂肪等级", value: "11.0", unit: "kg", change: "↑ 2.6", status: "超标准", statusType: "high", pointer: 76, limits: ["4", "10"], trend: [8.2, 8.8, 9.4, 10.1, 10.8, 11] },
  { name: "细胞内液", value: "16.8", unit: "kg", change: "↕ 0.0", status: "标准", statusType: "normal", pointer: 52, limits: ["14", "20"], trend: [15.9, 16.1, 16.5, 16.6, 16.9, 16.8] },
  { name: "细胞外液", value: "11.7", unit: "kg", change: "↓ 0.2", status: "", statusType: "tip", pointer: 46, limits: ["9", "13"], trend: [11.1, 11.3, 11.4, 11.6, 11.8, 11.7] },
];

const obesityCards = [
  { name: "体脂率", value: "45.0", unit: "%", change: "↑ 3.1", status: "超标准", statusType: "high", pointer: 82, limits: ["18", "28"], trend: [33, 36, 38, 40, 43, 45] },
  { name: "BMI", value: "16.5", unit: "kg/m²", change: "↓ 0.8", status: "正常", statusType: "normal", pointer: 50, limits: ["18.5", "24"], trend: [18.1, 17.8, 17.2, 16.9, 16.7, 16.5] },
  { name: "腰臀比", value: "0.53", unit: "%", change: "↓ 0.02", status: "低标准", statusType: "low", pointer: 27, limits: ["0.6", "0.8"], trend: [0.57, 0.56, 0.55, 0.54, 0.53, 0.53] },
];

const compositionIcons = {
  titles: {
    "人体成分概览": "./assets/composition/标题图标/人体成分概览.svg",
    "肥胖分析": "./assets/composition/标题图标/肥胖分析.svg",
    "身体参数": "./assets/composition/标题图标/身体参数.svg",
    "节段分析": "./assets/composition/标题图标/节段分析.svg",
    "调节建议": "./assets/composition/标题图标/调节建议.svg",
  },
  cardArrow: "./assets/composition/卡片里的图标/卡片展开的图标.svg",
  statusMark: "./assets/composition/卡片里的图标/结果前面的图标.svg",
  pointer: "./assets/composition/卡片里的图标/位置箭头.svg",
  changes: {
    up: "./assets/composition/卡片里的图标/数据变化/上升2.svg",
    down: "./assets/composition/卡片里的图标/数据变化/下降2.svg",
    flat: "./assets/composition/卡片里的图标/数据变化/不变1.svg",
  },
  segmentFigure: "./assets/composition/节段分析/节段人物插图.png",
  segmentDot: "./assets/composition/节段分析/标注点图标.svg",
};

const modelSwitchIcons = {
  left: "./assets/top-icons/左切换.svg",
  right: "./assets/top-icons/右切换.svg",
};
const shoulderAssetVersion = "20260515-shoulder-colors-v2";
const shoulderStateFigures = {
  abduction: {
    left: {
      normal: `./assets/shoulder/states/abduction-left-normal.svg?v=${shoulderAssetVersion}`,
      limited: `./assets/shoulder/states/abduction-left-limited-purple.svg?v=${shoulderAssetVersion}`,
      excess: `./assets/shoulder/states/abduction-left-excess.svg?v=${shoulderAssetVersion}`,
    },
    right: {
      normal: `./assets/shoulder/states/abduction-right-normal.svg?v=${shoulderAssetVersion}`,
      limited: `./assets/shoulder/states/abduction-right-limited-purple.svg?v=${shoulderAssetVersion}`,
      excess: `./assets/shoulder/states/abduction-right-excess.svg?v=${shoulderAssetVersion}`,
    },
  },
  flexion: {
    left: {
      normal: `./assets/shoulder/states/flexion-left-normal.svg?v=${shoulderAssetVersion}`,
      limited: `./assets/shoulder/states/flexion-left-limited-purple.svg?v=${shoulderAssetVersion}`,
      excess: `./assets/shoulder/states/flexion-left-excess.svg?v=${shoulderAssetVersion}`,
    },
    right: {
      normal: `./assets/shoulder/states/flexion-right-normal.svg?v=${shoulderAssetVersion}`,
      limited: `./assets/shoulder/states/flexion-right-limited-purple.svg?v=${shoulderAssetVersion}`,
      excess: `./assets/shoulder/states/flexion-right-excess.svg?v=${shoulderAssetVersion}`,
    },
  },
};
const shoulderSummaryFigure = "./assets/shoulder/shoulder-summary-custom.png";

const postureIssues = postureAnnotations;
const postureOrderMap = new Map(postureIssues.map((item, index) => [item.id, index]));

const girthItems = [
  { id: "neck", name: "颈围", value: 34.6, statusType: "normal", segment: "upper", line: 12, width: 30, view: "front", trend: [35.0, 34.9, 34.8, 34.7, 34.6, 34.6] },
  { id: "left_upper_arm", name: "左上臂围", value: 26.4, statusType: "normal", segment: "upper", line: 35, width: 22, view: "left", trend: [26.8, 26.8, 26.7, 26.6, 26.5, 26.4] },
  { id: "right_upper_arm", name: "右上臂围", value: 26.1, statusType: "normal", segment: "upper", line: 35, width: 22, view: "right", trend: [26.7, 26.6, 26.5, 26.4, 26.3, 26.1] },
  { id: "chest", name: "胸围", value: 88.5, statusType: "warn", segment: "upper", line: 30, width: 56, view: "front", trend: [90.8, 90.1, 89.7, 89.2, 88.8, 88.5] },
  { id: "high_waist", name: "高腰围", value: 74.1, statusType: "warn", segment: "waist", line: 43, width: 44, view: "front", trend: [75.1, 74.9, 74.7, 74.5, 74.3, 74.1] },
  { id: "mid_waist", name: "中腰围", value: 72.3, statusType: "warn", segment: "waist", line: 49, width: 44, view: "front", trend: [73.5, 73.2, 72.9, 72.7, 72.5, 72.3] },
  { id: "low_waist", name: "低腰围", value: 75.4, statusType: "warn", segment: "waist", line: 55, width: 48, view: "front", trend: [76.5, 76.2, 75.9, 75.8, 75.6, 75.4] },
  { id: "hip", name: "臀围", value: 95.1, statusType: "warn", segment: "lower", line: 58, width: 56, view: "back", trend: [96.0, 95.8, 95.6, 95.4, 95.2, 95.1] },
  { id: "left_thigh", name: "左大腿围", value: 54.8, statusType: "warn", segment: "lower", line: 73, width: 36, view: "left", trend: [55.7, 55.5, 55.3, 55.1, 54.9, 54.8] },
  { id: "left_thigh_min", name: "左大腿最小围", value: 49.3, statusType: "normal", segment: "lower", line: 78, width: 30, view: "left", trend: [49.9, 49.8, 49.7, 49.6, 49.5, 49.3] },
  { id: "right_thigh", name: "右大腿围", value: 54.5, statusType: "warn", segment: "lower", line: 73, width: 36, view: "right", trend: [55.5, 55.3, 55.1, 54.9, 54.7, 54.5] },
  { id: "right_thigh_min", name: "右大腿最小围", value: 49.0, statusType: "normal", segment: "lower", line: 78, width: 30, view: "right", trend: [49.6, 49.5, 49.4, 49.3, 49.2, 49.0] },
  { id: "left_calf", name: "左小腿围", value: 33.2, statusType: "normal", segment: "lower", line: 90, width: 34, view: "front", trend: [33.7, 33.6, 33.5, 33.4, 33.3, 33.2] },
  { id: "right_calf", name: "右小腿围", value: 33.0, statusType: "normal", segment: "lower", line: 90, width: 34, view: "front", trend: [33.5, 33.4, 33.3, 33.2, 33.1, 33.0] },
].map((item) => ({ ...item, change: +(item.trend.at(-1) - item.trend[4]).toFixed(1), status: item.statusType === "normal" ? "正常" : "轻度偏大" }));

const girthHistoryDates = [
  "2024-08-24 15:05",
  "2024-09-21 14:45",
  "2024-10-19 15:10",
  "2024-11-16 14:22",
  "2024-12-21 14:30",
  "2025-01-21 15:16",
];

const shoulderTests = {
  abduction: {
    label: "外展上举",
    reference: "150°-180°",
    limited: "<150°",
    normal: "150°-180°",
    excess: ">180°",
    left: { label: "左手", value: 143.2, change: -6.2, status: "活动度受限", statusType: "mid" },
    right: { label: "右手", value: 179.2, change: 6.2, status: "正常", statusType: "normal" },
    items: [
      {
        title: "外展上举-左手",
        status: "活动度受限",
        statusType: "mid",
        analysis: "肩关节活动受限，多由肌肉紧张，锁骨肩胛骨活动度不足，头颈肩胛不在中立位等原因引起。会影响正常运动模式（导致运动损伤），以及引起相关病理问题（如肩周炎、含胸驼背、颈椎酸痛等现象），长期忽视易导致各类肩关节疾病的发生。",
      },
    ],
  },
  flexion: {
    label: "前屈上举",
    reference: "120°-180°",
    limited: "<120°",
    normal: "120°-180°",
    excess: ">180°",
    left: { label: "左手", value: 193.6, change: -6.2, status: "活动度过大", statusType: "high" },
    right: { label: "右手", value: 193.8, change: 6.2, status: "活动度过大", statusType: "high" },
    items: [
      {
        title: "前屈上举-左手",
        status: "活动度过大",
        statusType: "high",
        analysis: "肩关节活动度过大，多由韧带松弛导致（女性多见），如经常肩部柔韧性训练，也会出现活动过大的现象。",
      },
      {
        title: "前屈上举-右手",
        status: "活动度过大",
        statusType: "high",
        analysis: "肩关节活动度过大，多由韧带松弛导致（女性多见），如经常肩部柔韧性训练，也会出现活动过大的现象。",
      },
    ],
  },
};

let activeTab = "composition";
let activeMetricIndex = 0;
let modalItems = metrics;
let postureView = "front";
let selectedPostureIndex = Math.max(0, postureIssues.findIndex((item) => item.id === "head-tilt"));
postureView = postureIssues[selectedPostureIndex]?.view || "front";
let postureFilter = "all";
let postureTransitionFromView = null;
let postureArrowFlash = null;
let postureListOpen = true;
let postureDetailOpen = false;
let postureDetailTab = "overview";
let postureDefinitionOpen = false;
let girthView = "front";
let selectedGirthIndex = 0;
let girthUnit = "cm";
let girthSegment = "all";
let girthScreen = "overview";
let girthCompareIndex = 4;
let girthTrendOverlayOpen = false;
let girthListOpen = true;
let girthTransitionFromView = null;
let girthArrowFlash = null;
let girthCompareView = "front";
let postureListNeedsAlign = false;
let shoulderMode = "abduction";
let selectedShoulderSide = "left";
let shoulderHistoryOpen = false;
let shoulderConclusionOpen = true;
let shoulderRangeOverlayMode = null;
let reportMenuOpen = false;
let compositionSegmentMode = "fat";
let compositionCompareIndex = 4;
let compositionSelectedSegmentKey = "left-arm";
let userPopoverOpen = false;
let girthAnnotationListenerBound = false;
let lastRenderedReport = activeTab;
const compositionScoreHistory = [68, 71, 73, 75, 79, 80];

const tabContent = document.querySelector("#tabContent");
const reportTabs = document.querySelector("#reportTabs");
const modal = document.querySelector("#metricModal");
const phoneShell = document.querySelector(".phone-shell");
const SHELL_DESIGN_WIDTH = 430;
const SHELL_DESIGN_HEIGHT = 765;

function syncShellScale() {
  const root = document.documentElement;
  const viewportWidth = window.innerWidth || SHELL_DESIGN_WIDTH;
  const viewportHeight = window.innerHeight || SHELL_DESIGN_HEIGHT;
  const isPortraitViewport = viewportHeight > viewportWidth;
  const shouldFitViewport = window.matchMedia("(pointer: coarse)").matches || (isPortraitViewport && viewportWidth <= 1200);
  const scale = shouldFitViewport
    ? Math.min(viewportWidth / SHELL_DESIGN_WIDTH, viewportHeight / SHELL_DESIGN_HEIGHT)
    : 1;

  root.style.setProperty("--shell-scale", `${Math.max(scale, 0.72).toFixed(4)}`);
}

function syncOverlayFrames() {
  if (!phoneShell) return;
  const shellRect = phoneShell.getBoundingClientRect();
  const root = document.documentElement;
  root.style.setProperty("--shell-top", `${shellRect.top}px`);
  root.style.setProperty("--shell-left", `${shellRect.left}px`);
  root.style.setProperty("--shell-width", `${shellRect.width}px`);
  root.style.setProperty("--shell-height", `${shellRect.height}px`);

  const tabsRect = reportTabs?.getBoundingClientRect();
  if (tabsRect) {
    root.style.setProperty("--report-menu-top", `${tabsRect.bottom + 6}px`);
    root.style.setProperty("--report-menu-top-local", `${tabsRect.bottom - shellRect.top + 6}px`);
  }
}

syncShellScale();
window.addEventListener("resize", () => {
  syncShellScale();
  syncOverlayFrames();
  if (activeTab === "composition") requestAnimationFrame(syncSegmentConnections);
});
window.visualViewport?.addEventListener("resize", () => {
  syncShellScale();
  syncOverlayFrames();
  if (activeTab === "composition") requestAnimationFrame(syncSegmentConnections);
});

function statusClass(type) {
  return `status-${type || "normal"}`;
}

function metricCurrentValue(item) {
  return Number(item.value);
}

function metricChangeText(item, compareIndex = compositionCompareIndex) {
  const currentIndex = item.trend.length - 1;
  const diff = metricCurrentValue(item) - item.trend[compareIndex];
  if (Math.abs(diff) < 0.05) return "↕ 0.0";
  return `${diff > 0 ? "↑" : "↓"} ${Math.abs(diff).toFixed(item.unit === "岁" ? 0 : diff < 1 ? 1 : 1)}`;
}

function metricChangeMeta(item, compareIndex = compositionCompareIndex) {
  const current = metricCurrentValue(item);
  const diff = current - item.trend[compareIndex];
  if (Math.abs(diff) < 0.05) {
    return { icon: compositionIcons.changes.flat, text: "0.0", dir: "flat", glyph: "↕" };
  }
  return {
    icon: diff > 0 ? compositionIcons.changes.up : compositionIcons.changes.down,
    text: `${Math.abs(diff).toFixed(item.unit === "岁" ? 0 : 1)}`,
    dir: diff > 0 ? "up" : "down",
    glyph: diff > 0 ? "↑" : "↓",
  };
}

function segmentStatusProgress(type) {
  if (type === "high") return 0.82;
  if (type === "low") return 0.22;
  return 0.52;
}

function segmentStatusIndex(type) {
  if (type === "low") return 0;
  if (type === "high") return 2;
  return 1;
}

function segmentStatusTextClass(type) {
  if (type === "low") return "segment-status-text--low";
  if (type === "high") return "segment-status-text--high";
  return "segment-status-text--normal";
}

function limbIconSvg(name, type) {
  const tone = compositionStatusColor(type);
  const icons = {
    "左上肢": `<path d="M19 14c-4 3.2-6.8 7.6-7.5 12.6-.6 4.1.2 8.7 2.5 12.2l7.1 10.7c.9 1.3 2.6 1.9 4.2 1.4l3.7-1.2c1.6-.5 2.6-2 2.5-3.6l-.4-8.2c-.1-2.2-.9-4.2-2.2-5.8l-2.2-2.7 2.7-7.3c.7-2-.3-4.2-2.2-5l-4-1.8c-1.4-.6-3-.4-4.2.7Z" />`,
    "右上肢": `<path d="M37 14c4 3.2 6.8 7.6 7.5 12.6.6 4.1-.2 8.7-2.5 12.2l-7.1 10.7c-.9 1.3-2.6 1.9-4.2 1.4l-3.7-1.2c-1.6-.5-2.6-2-2.5-3.6l.4-8.2c.1-2.2.9-4.2 2.2-5.8l2.2-2.7-2.7-7.3c-.7-2 .3-4.2 2.2-5l4-1.8c1.4-.6 3-.4 4.2.7Z" />`,
    "左下肢": `<path d="M19 11h10l2.2 9.8-3 10.4 1.5 18.3c.1 1.7-1.2 3.1-2.9 3.1h-5.6c-1.7 0-3-1.4-2.9-3.1l1.5-18.3-3-10.4L19 11Z" /><path d="M18.2 52.6h13.6" />`,
    "右下肢": `<path d="M19 11h10l2.2 9.8-3 10.4 1.5 18.3c.1 1.7-1.2 3.1-2.9 3.1h-5.6c-1.7 0-3-1.4-2.9-3.1l1.5-18.3-3-10.4L19 11Z" /><path d="M18.2 52.6h13.6" />`,
    "躯干": `<path d="M18.5 12.8c1.4-3.2 4.5-5.4 8-5.4h3c3.5 0 6.6 2.1 8 5.4l2.6 6.2-4 4.3-.6 10.7 3.4 14.4-5.2-2.4-2.8 6.4h-5.7L22.4 46l-5.2 2.4 3.4-14.4-.6-10.7-4-4.3 2.5-6.2Z" /><path d="M24 22.8h8" /><path d="M23.6 30.8h8.8" /><path d="M28 22v14.2" />`,
  };
  return `
    <span class="limb-card-icon ${statusClass(type)}" aria-hidden="true">
      <svg viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="25" stroke="${tone}" stroke-width="1.8" stroke-opacity="0.9"></circle>
        <g stroke="${tone}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${icons[name] || icons["躯干"]}
        </g>
      </svg>
    </span>
  `;
}

function renderLimbLabels(type) {
  const activeIndex = segmentStatusIndex(type);
  return `
    <div class="limb-slider-labels">
      ${["低标准", "标准", "超标准"].map((label, index) => `
        <span class="${index === activeIndex ? "is-active" : ""} ${index === 0 ? "segment-status-text--low" : index === 1 ? "segment-status-text--normal" : "segment-status-text--high"}">${label}</span>
      `).join("")}
    </div>
  `;
}

function limbKeyFromName(name) {
  return {
    "左上肢": "left-arm",
    "右上肢": "right-arm",
    "左下肢": "left-leg",
    "右下肢": "right-leg",
    "躯干": "trunk",
  }[name] || "trunk";
}

function renderSegmentedProgress({
  value = 0,
  markerColor = REPORT_PALETTE.statusHigh,
  segments = [],
  className = "",
  showLabels = false,
  activeSegmentIndex = -1,
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  const labels = showLabels
    ? `<div class="segmented-progress-labels">
        ${segments.map((segment, index) => `<span class="${index === 0 ? "segment-status-text--low" : index === 1 ? "segment-status-text--normal" : "segment-status-text--high"}">${segment.label || ""}</span>`).join("")}
      </div>`
    : "";

  return `
    <div class="segmented-progress ${className}" style="--progress-value:${safeValue}; --marker-fill:${markerColor};" aria-hidden="true">
      ${labels}
      <div class="segmented-progress-track">
        ${segments.map((segment) => `
          <span
            class="segmented-progress-segment ${segments.indexOf(segment) === activeSegmentIndex ? "is-active" : ""}"
            style="--segment-grow:${segment.ratio ?? 1}; --segment-color:${segment.color};"
            data-label="${segment.label || ""}"
          ></span>
        `).join("")}
        <i class="segmented-progress-marker"></i>
      </div>
    </div>
  `;
}

function renderSegmentedSlider({
  value = 0,
  thumbColor = REPORT_PALETTE.statusHigh,
  className = "",
  segments = [],
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  return `
    <div class="segmented-slider ${className}" style="--slider-value:${safeValue}; --slider-thumb:${thumbColor};" aria-hidden="true">
      <div class="segmented-slider-track">
        ${segments.map((segment) => `
          <span
            class="segmented-slider-segment"
            style="--segment-grow:${segment.ratio ?? 1}; --segment-color:${segment.color};"
          ></span>
        `).join("")}
        <i class="segmented-slider-thumb"></i>
      </div>
    </div>
  `;
}

function metricCard(item, index, source = "metrics") {
  const techGlassClass = source === "metrics" && index === 0 ? " tech-glass-card" : "";
  const changeMeta = metricChangeMeta(item);
  const obesityMarkerColor = item.statusType === "normal"
    ? compositionStatusColor("normal")
    : item.statusType === "low"
      ? compositionStatusColor("low")
      : compositionStatusColor("high");
  const bar = source === "obesity"
    ? renderSegmentedProgress({
        value: item.pointer,
        markerColor: obesityMarkerColor,
        className: `segmented-progress--obesity status-${item.statusType}`,
        activeSegmentIndex: item.statusType === "low" ? 0 : item.statusType === "high" ? 2 : 1,
        segments: [
          { color: compositionStatusColor("low"), ratio: 1, label: "低标准" },
          { color: compositionStatusColor("normal"), ratio: 1, label: "标准" },
          { color: compositionStatusColor("high"), ratio: 1, label: "超标准" },
        ],
      })
    : "";
  return `
    <button class="metric-card${techGlassClass}" type="button" data-card-source="${source}" data-card-index="${index}">
      <span class="metric-head"><span>${item.name}</span><i><img src="${compositionIcons.cardArrow}" alt="" /></i></span>
      <span class="metric-value"><strong>${item.value}</strong><span>${item.unit}</span></span>
      <span class="metric-change metric-change--${changeMeta.dir} ${item.change ? "" : "is-empty"}"><span class="metric-change-icon" aria-hidden="true">${changeMeta.glyph}</span><em>${changeMeta.text}</em></span>
      ${item.status && source !== "obesity" ? `<span class="metric-status ${statusClass(item.statusType)}">${item.status}</span>` : ""}
      ${bar}
    </button>
  `;
}

function sectionTitle(icon, text) {
  const iconSrc = compositionIcons.titles[text];
  return `<h2 class="section-title"><span>${iconSrc ? `<img class="title-icon title-icon--blue" src="${iconSrc}" alt="" />` : `<span class="glyph">${icon}</span>`}${text}</span></h2>`;
}

function renderComposition() {
  const suggestionCards = [
    {
      title: "体重",
      unit: "kg",
      diff: -10.1,
      status: "过量",
      statusType: "high",
      measured: 70.7,
      ideal: 60.6,
      min: 55,
      max: 75,
      measuredLabel: "测量值",
      idealLabel: "理想值",
      measuredColor: REPORT_PALETTE.statusHigh,
      idealColor: REPORT_PALETTE.brandBlue,
    },
    {
      title: "体脂肪",
      unit: "kg",
      diff: 0.3,
      status: "标准",
      statusType: "normal",
      measured: 13.2,
      ideal: 13.5,
      min: 10,
      max: 16,
      measuredLabel: "测量值",
      idealLabel: "理想值",
      measuredColor: REPORT_PALETTE.statusNormal,
      idealColor: REPORT_PALETTE.brandIce,
    },
    {
      title: "肌肉量",
      unit: "kg",
      diff: 6.2,
      status: "不足",
      statusType: "tip",
      measured: 36.1,
      ideal: 42.3,
      min: 30,
      max: 48,
      measuredLabel: "测量值",
      idealLabel: "理想值",
      measuredColor: REPORT_PALETTE.brandPurple,
      idealColor: REPORT_PALETTE.brandIce,
    },
  ];
  const segmentCopy = compositionSegmentMode === "fat"
    ? {
        tabs: ["节段脂肪", "节段肌肉"],
        limbs: [
          ["左上肢", "8.5", "kg", "超标准", "high"],
          ["左下肢", "4.2", "kg", "标准", "normal"],
          ["右上肢", "3.4", "kg", "低标准", "low"],
          ["右下肢", "4.0", "kg", "标准", "normal"],
          ["躯干", "13.6", "kg", "超标准", "high"],
        ],
      }
    : {
        tabs: ["节段脂肪", "节段肌肉"],
        limbs: [
          ["左上肢", "2.9", "kg", "标准", "normal"],
          ["左下肢", "8.8", "kg", "标准", "normal"],
          ["右上肢", "3.1", "kg", "标准", "normal"],
          ["右下肢", "8.6", "kg", "低标准", "low"],
          ["躯干", "22.4", "kg", "低标准", "low"],
        ],
      };
  tabContent.innerHTML = `
    ${sectionTitle("†", "人体成分概览")}
    <div class="card-grid">${metrics.slice(0, 8).map((item, index) => metricCard(item, index)).join("")}</div>

    ${sectionTitle("⌁", "肥胖分析")}
    <div class="card-grid card-grid-obesity">${obesityCards.map((item, index) => metricCard(item, index, "obesity")).join("")}</div>

    ${sectionTitle("♣", "身体参数")}
    <div class="card-grid card-grid-params">${metrics.slice(8).map((item, index) => metricCard(item, index + 8)).join("")}</div>

    ${sectionTitle("✣", "节段分析")}
    <div class="segment-panel">
      <div class="segment-toggle">
        <button class="${compositionSegmentMode === "fat" ? "is-active" : ""}" type="button" data-segment-mode="fat">${segmentCopy.tabs[0]}</button>
        <button class="${compositionSegmentMode === "muscle" ? "is-active" : ""}" type="button" data-segment-mode="muscle">${segmentCopy.tabs[1]}</button>
      </div>
      <svg class="segment-connection-layer" data-segment-connections aria-hidden="true"></svg>
      <div class="body-map">
        <div class="limb-list">
          ${limbCard(...segmentCopy.limbs[0])}
          ${limbCard(...segmentCopy.limbs[1])}
        </div>
        <div class="human" aria-label="人体节段示意">
          <img class="segment-figure" src="${compositionIcons.segmentFigure}" alt="节段人物插图" />
          <i class="limb-dot dot-left-arm ${statusClass(segmentCopy.limbs[0][4])} ${compositionSelectedSegmentKey === "left-arm" ? "is-active" : ""}" data-segment-dot="left-arm"></i>
          <i class="limb-dot dot-right-arm ${statusClass(segmentCopy.limbs[2][4])} ${compositionSelectedSegmentKey === "right-arm" ? "is-active" : ""}" data-segment-dot="right-arm"></i>
          <i class="limb-dot dot-trunk ${statusClass(segmentCopy.limbs[4][4])} ${compositionSelectedSegmentKey === "trunk" ? "is-active" : ""}" data-segment-dot="trunk"></i>
          <i class="limb-dot dot-left-leg ${statusClass(segmentCopy.limbs[1][4])} ${compositionSelectedSegmentKey === "left-leg" ? "is-active" : ""}" data-segment-dot="left-leg"></i>
          <i class="limb-dot dot-right-leg ${statusClass(segmentCopy.limbs[3][4])} ${compositionSelectedSegmentKey === "right-leg" ? "is-active" : ""}" data-segment-dot="right-leg"></i>
        </div>
        <div class="limb-list">
          ${limbCard(...segmentCopy.limbs[2])}
          ${limbCard(...segmentCopy.limbs[3])}
        </div>
      </div>
      <div class="segment-center-card">${limbCard(...segmentCopy.limbs[4])}</div>
    </div>

    ${sectionTitle("☯", "调节建议")}
    <div class="suggest-grid">
      ${suggestionCards.map((item) => suggestCard(item)).join("")}
    </div>
  `;
  requestAnimationFrame(syncSegmentConnections);
}

function syncSegmentConnections() {
  const panel = tabContent.querySelector(".segment-panel");
  const layer = panel?.querySelector("[data-segment-connections]");
  if (!panel || !layer) return;

  const panelRect = panel.getBoundingClientRect();
  const limbs = [
    { key: "left-arm", type: "high", side: "left" },
    { key: "left-leg", type: "normal", side: "left" },
    { key: "right-arm", type: "low", side: "right" },
    { key: "right-leg", type: "normal", side: "right" },
    { key: "trunk", type: "high", side: "center" },
  ];

  layer.setAttribute("viewBox", `0 0 ${panelRect.width} ${panelRect.height}`);
  layer.innerHTML = limbs.map(({ key, side }) => {
    const card = panel.querySelector(`[data-segment-focus="${key}"]`);
    const dot = panel.querySelector(`[data-segment-dot="${key}"]`);
    if (!card || !dot) return "";
    const type = dot.classList.contains("status-low")
      ? "low"
      : dot.classList.contains("status-high")
        ? "high"
        : "normal";

    const cardRect = card.getBoundingClientRect();
    const dotRect = dot.getBoundingClientRect();
    const isActive = compositionSelectedSegmentKey === key;
    const dotX = dotRect.left - panelRect.left + dotRect.width / 2;
    const dotY = dotRect.top - panelRect.top + dotRect.height / 2;

    if (side === "center") {
      const startX = cardRect.left - panelRect.left + cardRect.width / 2;
      const startY = cardRect.top - panelRect.top;
      const midY = startY - 12;
      return `
        <path class="segment-connection ${statusClass(type)} ${isActive ? "is-active" : ""}" d="M ${startX} ${startY} L ${startX} ${midY} L ${dotX} ${midY} L ${dotX} ${dotY}"></path>
      `;
    }

    const startX = side === "left"
      ? cardRect.right - panelRect.left
      : cardRect.left - panelRect.left;
    const startY = dotY;
    const elbowX = side === "left" ? dotX - 14 : dotX + 14;
    return `
      <path class="segment-connection ${statusClass(type)} ${isActive ? "is-active" : ""}" d="M ${startX} ${startY} L ${elbowX} ${startY} L ${dotX} ${dotY}"></path>
    `;
  }).join("");
}

function limbCard(name, value, unit, status, type) {
  const tone = compositionStatusColor(type);
  const activeIndex = segmentStatusIndex(type);
  const limbKey = limbKeyFromName(name);
  const sliderSegments = [
    { color: withAlpha(compositionStatusColor("low"), activeIndex === 0 ? 0.95 : 0.24), ratio: 1 },
    { color: withAlpha(compositionStatusColor("normal"), activeIndex === 1 ? 0.95 : 0.24), ratio: 1 },
    { color: withAlpha(compositionStatusColor("high"), activeIndex === 2 ? 0.95 : 0.24), ratio: 1 },
  ];
  return `
    <button class="limb-card ${compositionSelectedSegmentKey === limbKey ? "is-active" : ""}" type="button" data-segment-focus="${limbKey}">
      <div class="limb-card-head">
        <div class="limb-card-title">
          <span>${name}</span>
          <strong><span class="limb-card-value">${value}</span><em>${unit}</em><span class="metric-status ${statusClass(type)} ${segmentStatusTextClass(type)}">${status}</span></strong>
        </div>
      </div>
      ${renderSegmentedSlider({
        value: segmentStatusProgress(type) * 100,
        thumbColor: tone,
        className: `segmented-slider--limb status-${type}`,
        segments: sliderSegments,
      })}
    </button>
  `;
}

function suggestChartMeta({ measured, ideal, min, max }) {
  const chart = {
    width: 244,
    height: 96,
    plotTop: 18,
    plotHeight: 52,
    measuredX: 62,
    idealX: 182,
  };
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const range = Math.max(safeMax - safeMin, 0.0001);
  const clamp = (value) => Math.max(safeMin, Math.min(safeMax, value));
  const valueToY = (value) => {
    const ratio = (clamp(value) - safeMin) / range;
    return chart.plotTop + chart.plotHeight - ratio * chart.plotHeight;
  };

  return {
    ...chart,
    measuredY: valueToY(measured),
    idealY: valueToY(ideal),
    gridLines: [0.04, 0.5, 0.96].map((ratio) => chart.plotTop + chart.plotHeight * ratio),
  };
}

function formatSignedValue(value) {
  return `${value > 0 ? "+" : value < 0 ? "-" : ""}${Math.abs(value).toFixed(1)}`;
}

function suggestLabelMarkup(x, y, title, value, color, placement) {
  const titleY = placement === "upper" ? y - 34 : y + 24;
  const valueY = placement === "upper" ? y - 14 : y + 48;
  return `
    <g class="indicator-text-group indicator-text-group--${placement}">
      <text class="indicator-text-title" x="${x}" y="${titleY}" text-anchor="middle">${title}</text>
      <text class="indicator-text-value" x="${x}" y="${valueY}" text-anchor="middle" fill="${color}">${value}</text>
    </g>
  `;
}

function suggestCard(item) {
  const chart = suggestChartMeta(item);
  const gradientId = `suggest-gradient-${Math.abs([...item.title].reduce((sum, char) => sum + char.charCodeAt(0), 0))}`;
  const measuredLabelClass = chart.measuredY < chart.idealY ? "upper" : "lower";
  const idealLabelClass = chart.idealY < chart.measuredY ? "upper" : "lower";
  return `
    <article class="suggest-card indicator-card">
      <div class="indicator-card-header">
        <h4>${item.title}</h4>
        <span class="indicator-badge ${statusClass(item.statusType)}">${item.status}</span>
      </div>
      <strong class="indicator-diff"><span>${formatSignedValue(item.diff)}</span><em>${item.unit}</em></strong>
      <div class="indicator-chart">
        <svg viewBox="0 0 ${chart.width} ${chart.height}" aria-hidden="true">
          <defs>
            <linearGradient id="${gradientId}" x1="${chart.measuredX}" y1="${chart.measuredY}" x2="${chart.idealX}" y2="${chart.idealY}" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="${item.measuredColor}" />
              <stop offset="100%" stop-color="${item.idealColor}" />
            </linearGradient>
          </defs>
          ${chart.gridLines.map((y) => `<line class="indicator-grid-line" x1="18" y1="${y}" x2="${chart.width - 18}" y2="${y}"></line>`).join("")}
          <line class="indicator-link-line" x1="${chart.measuredX}" y1="${chart.measuredY}" x2="${chart.idealX}" y2="${chart.idealY}" stroke="url(#${gradientId})"></line>
          <circle class="indicator-point-ring" cx="${chart.measuredX}" cy="${chart.measuredY}" r="5.6"></circle>
          <circle class="indicator-point-fill" cx="${chart.measuredX}" cy="${chart.measuredY}" r="5.1" fill="${item.measuredColor}"></circle>
          <circle class="indicator-point-ring" cx="${chart.idealX}" cy="${chart.idealY}" r="5.6"></circle>
          <circle class="indicator-point-fill" cx="${chart.idealX}" cy="${chart.idealY}" r="5.1" fill="${item.idealColor}"></circle>
          ${suggestLabelMarkup(chart.measuredX, chart.measuredY, item.measuredLabel, `${item.measured}${item.unit}`, item.measuredColor, measuredLabelClass)}
          ${suggestLabelMarkup(chart.idealX, chart.idealY, item.idealLabel, `${item.ideal}${item.unit}`, item.idealColor, idealLabelClass)}
        </svg>
      </div>
    </article>
  `;
}

function modalRangeState(pointer = 0) {
  if (pointer < 33.34) return "low";
  if (pointer < 66.67) return "normal";
  return "high";
}

function renderPlaceholder(tabId) {
  const copy = {
    posture: ["体态评估", "这里保留与身体成分一致的设备端深色样式，顶部 Tab 可切换。"],
    girth: ["身体围度", "围度数据页面已接入 Tab 交互，可继续补充卡片与趋势内容。"],
    shoulder: ["肩部功能", "肩部功能页保持当前配色与卡片体系，便于后续扩展。"],
    report1: ["报告1", "这是用于演示超过四个报告时的扩展报告页面。"],
    report2: ["报告2", "从下拉列表选择后，顶部导航会自动定位到当前报告。"],
    report3: ["报告3", "选中的报告会出现在导航可视区域的中间位置。"],
  }[tabId];

  tabContent.innerHTML = `
    <section class="placeholder-panel">
      <div>
        <h3>${copy[0]}</h3>
        <p>${copy[1]}</p>
      </div>
    </section>
  `;
}

function getVisibleTabs() {
  const visibleCount = 4;
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const maxStart = Math.max(tabs.length - visibleCount, 0);
  const start = Math.min(Math.max(Math.round(activeIndex - (visibleCount - 1) / 2), 0), maxStart);
  return tabs.slice(start, start + visibleCount);
}

function renderReportTabs() {
  const visibleTabs = getVisibleTabs();
  reportTabs.innerHTML = `
    <div class="tab-track">
      ${visibleTabs.map((tab) => `
        <button class="tab ${tab.id === activeTab ? "is-active" : ""}" type="button" data-visible-report="${tab.id}">${tab.label}</button>
      `).join("")}
    </div>
    <button class="tab-more ${reportMenuOpen ? "is-open" : ""}" type="button" data-report-menu aria-expanded="${reportMenuOpen}" aria-label="选择报告"></button>
    ${reportMenuOpen ? renderReportMenu() : ""}
  `;
}

function syncUserPopover() {
  const popover = document.querySelector("[data-user-popover]");
  const trigger = document.querySelector("[data-user-toggle]");
  if (!popover || !trigger) return;
  popover.hidden = !userPopoverOpen;
  trigger.classList.toggle("is-open", userPopoverOpen);
}

function renderReportMenu() {
  return `
    <div class="report-menu-scrim" data-report-menu-close></div>
    <section class="report-menu" aria-label="全部报告">
      <header>
        <strong>全部</strong>
        <button type="button" data-report-menu aria-label="收起报告列表"></button>
      </header>
      <div class="report-menu-list">
        ${tabs.map((tab) => `
          <button class="${tab.id === activeTab ? "is-active" : ""}" type="button" data-report-option="${tab.id}">
            <span>${tab.label}</span>
            ${tab.id === activeTab ? "<i>✓</i>" : ""}
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function postureIcon(name, variant = "abnormal") {
  const src = postureAnnotationMap[name]?.illustrations?.[variant];
  return src
    ? `<span class="posture-thumb has-image" aria-hidden="true"><img src="${src}" alt="" /></span>`
    : `<span class="posture-thumb posture-${name}" aria-hidden="true"><i></i><b></b></span>`;
}

function postureIllustrationVariant(item) {
  return item.severity === "normal" ? "normal" : "abnormal";
}

function postureCardTag(item) {
  return item.status;
}

function postureLabelClass(item) {
  if (item.severity === "normal") return "status-normal";
  if (item.severity === "abnormal") return "status-high";
  return "status-warn";
}

function postureSeverityWeight(item) {
  if (item.severity === "abnormal") return 0;
  if (item.severity === "mild") return 1;
  return 2;
}

function postureBodyOrder(item) {
  return postureOrderMap.get(item.id) ?? 999;
}

function postureCardToneClass(item) {
  return postureLabelClass(item);
}

function postureLegRow(source, fallbackLabel, unit) {
  const raw = `${source ?? ""}`.trim();
  const compact = raw.replace(unit, "").trim();
  const match = compact.match(/^(\S+)\s+(.+)$/);
  return {
    label: match?.[1] || fallbackLabel,
    value: match?.[2] || compact || "--",
  };
}

function postureValueMagnitude(item) {
  const source = typeof item.value === "string" ? item.value : `${item.value}`;
  const numeric = Number.parseFloat(source);
  return Number.isFinite(numeric) ? Math.abs(numeric) : 0;
}

function getSortedPostureIssues(items = postureIssues) {
  return items
    .slice()
    .sort((a, b) => postureSeverityWeight(a) - postureSeverityWeight(b) || postureBodyOrder(a) - postureBodyOrder(b));
}

function postureViews(item) {
  return Array.isArray(item?.views) && item.views.length ? item.views : [item?.view].filter(Boolean);
}

function postureSupportsView(item, view) {
  return postureViews(item).includes(view);
}

function getVisiblePostureIssues(filter = postureFilter) {
  return getSortedPostureIssues(filter === "all" ? postureIssues : postureIssues.filter((item) => postureSupportsView(item, filter)));
}

function resolvePostureFocusView(item, currentView = postureView) {
  if (!item) return currentView || "front";
  const views = postureViews(item);
  if (views.includes(currentView)) return currentView;
  return item.view || views[0] || "front";
}

function getPostureAnnotationState(visibleIssues = getVisiblePostureIssues(), selected = postureIssues[selectedPostureIndex]) {
  return {
    selectedId: selected?.id || null,
    visibleIds: visibleIssues.map((item) => item.id),
  };
}

function ensureSelectedPostureMatchesView() {
  const selected = postureIssues[selectedPostureIndex];
  if (postureSupportsView(selected, postureView)) return;
  const firstVisible = getVisiblePostureIssues(postureView)[0];
  if (firstVisible) selectedPostureIndex = postureIssues.indexOf(firstVisible);
}

function syncPostureViewerState() {
  window.syncPostureModelViewer?.({
    view: postureView,
    previousView: postureTransitionFromView,
    annotations: getPostureAnnotationState(getVisiblePostureIssues(), postureIssues[selectedPostureIndex]),
  });
  postureTransitionFromView = null;
}

function triggerPostureArrowFlash(step) {
  postureArrowFlash = step < 0 ? "left" : "right";
  const flashValue = postureArrowFlash;
  const buttons = Array.from(document.querySelectorAll(
    flashValue === "left" ? "[data-view-step='-1']" : "[data-view-step='1']"
  ));
  buttons.forEach((button) => button.classList.add("is-flash"));
  window.setTimeout(() => {
    if (postureArrowFlash === flashValue) postureArrowFlash = null;
    buttons.forEach((button) => button.classList.remove("is-flash"));
  }, 100);
}

function setPostureView(nextView, options = {}) {
  const { flash = false } = options;
  if (!nextView || nextView === postureView) return;
  const currentView = postureView;
  postureTransitionFromView = currentView;
  postureView = nextView;
  if (postureFilter !== "all") {
    postureFilter = postureView;
    const firstVisible = getVisiblePostureIssues(postureFilter)[0];
    if (firstVisible) selectedPostureIndex = postureIssues.indexOf(firstVisible);
  } else {
    ensureSelectedPostureMatchesView();
  }
  if (flash) {
    const views = ["front", "right", "back", "left"];
    const currentIndex = views.indexOf(currentView);
    const nextIndex = views.indexOf(nextView);
    if (currentIndex >= 0 && nextIndex >= 0) {
      const delta = (nextIndex - currentIndex + views.length) % views.length;
      triggerPostureArrowFlash(delta === 1 || delta === 3 ? (delta === 1 ? 1 : -1) : 1);
    }
  }
}

function advancePostureView(step) {
  const views = ["front", "right", "back", "left"];
  const current = views.indexOf(postureView);
  triggerPostureArrowFlash(step);
  setPostureView(views[(current + step + views.length) % views.length]);
}

function postureDetailStatus(item) {
  return item.status;
}

function postureDetailDescription(item) {
  return item.severity === "normal" ? "此项评估项目无异常" : item.riskText;
}

function postureDefinitionMeta(item) {
  return {
    text: item.definitionText || "评估该部位与标准姿态之间的偏移程度",
    range: item.normalRange || "见标准参考区间",
  };
}

function postureDetailPagerState(item) {
  const visibleIssues = getVisiblePostureIssues();
  const currentVisibleIndex = visibleIssues.findIndex((issue) => issue.id === item.id);
  return {
    index: currentVisibleIndex >= 0 ? currentVisibleIndex + 1 : 1,
    total: visibleIssues.length || 1,
  };
}

function postureCompareCaption(item, variant) {
  if (variant === "normal") return "标准姿态参考示意";
  if (item.severity === "normal") return "当前检测处于正常范围";
  return item.resultText;
}

function renderPostureDetailMetric(item, currentStatusClass) {
  if (item.name === "腿型") {
    const leftLeg = postureLegRow(item.value, "左腿", item.unit);
    const rightLeg = postureLegRow(item.subValue, "右腿", item.unit);
    return `
      <div class="posture-detail-leg-reading posture-detail-leg-reading--summary">
        <div class="posture-detail-leg-row">
          <div class="posture-detail-leg-reading-main">
            <span>${leftLeg.label}</span>
            <strong>${leftLeg.value}<em>${item.unit}</em></strong>
          </div>
          <b class="${currentStatusClass}">${postureDetailStatus(item)}</b>
        </div>
        <div class="posture-detail-leg-row">
          <div class="posture-detail-leg-reading-main">
            <span>${rightLeg.label}</span>
            <strong>${rightLeg.value}<em>${item.unit}</em></strong>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="posture-detail-hero-reading">
      <strong>${item.value}<em>${item.unit}</em></strong>
      <b class="${currentStatusClass}">${postureDetailStatus(item)}</b>
    </div>
  `;
}

function renderPostureDefinition(item) {
  const meta = postureDefinitionMeta(item);
  return `
    <div class="posture-definition">
      <div class="posture-definition-toggle" data-posture-definition-toggle>
        <span>定义说明</span>
      </div>
      <div class="posture-definition-body posture-definition-body--full">
        <div class="posture-definition-copy">
          <h4>定义</h4>
          <p>${meta.text}</p>
          <h4>正常范围</h4>
          <p>${meta.range}</p>
        </div>
      </div>
    </div>
  `;
}

function postureImpactItems(item) {
  if (item.name.includes("头")) return ["颈部紧张", "肩颈疼痛", "头痛", "体态失衡"];
  if (item.name.includes("肩")) return ["肩颈酸痛", "肩部紧张", "手臂代偿", "体态失衡"];
  if (item.name.includes("骨盆")) return ["腰背疲劳", "骨盆不稳", "步态受限", "体态失衡"];
  return ["下肢负担", "步态异常", "关节代偿", "体态失衡"];
}

function renderModelTechBackground() {
  return `
    <div class="tech-bg" aria-hidden="true">
      <div class="back-glow"></div>
      <div class="perspective-grid"></div>
      <div class="scan-platform">
        <div class="ring ring-1"></div>
        <div class="ring ring-2"></div>
        <div class="ring ring-3"></div>
      </div>
    </div>
  `;
}

function renderPostureIssueListMarkup(visibleIssues = getVisiblePostureIssues()) {
  return visibleIssues
    .map((item) => postureIssueCard(item, postureIssues.indexOf(item), postureIssues.indexOf(item) === selectedPostureIndex))
    .join("");
}

function updatePostureStageAria() {
  const stage = tabContent.querySelector("[data-posture-3d-stage]");
  if (!stage) return;
  const viewLabel = { front: "正视图", right: "右视图", back: "后视图", left: "左视图" }[postureView];
  stage.setAttribute("aria-label", `${viewLabel}人体模型 3D 视图`);
}

function refreshPostureListSelection(options = {}) {
  const { alignList = false } = options;
  const list = tabContent.querySelector(".posture-issue-list");
  if (!list) return;
  list.innerHTML = renderPostureIssueListMarkup();
  if (alignList) {
    const activeCard = list.querySelector(".posture-issue-card.is-active");
    if (activeCard) {
      const safety = 10;
      const listRect = list.getBoundingClientRect();
      const cardRect = activeCard.getBoundingClientRect();
      const topOverflow = cardRect.top - (listRect.top + safety);
      const bottomOverflow = cardRect.bottom - (listRect.bottom - safety);
      if (topOverflow < 0) {
        list.scrollBy({ top: topOverflow, behavior: "auto" });
      } else if (bottomOverflow > 0) {
        list.scrollBy({ top: bottomOverflow, behavior: "auto" });
      }
    }
  }
}

function refreshPostureSelection(options = {}) {
  const { alignList = false } = options;
  refreshPostureListSelection({ alignList });
  updatePostureStageAria();
  syncPostureViewerState();
}

function renderPosture() {
  const selected = postureIssues[selectedPostureIndex];
  const viewLabel = { front: "正视图", right: "右视图", back: "后视图", left: "左视图" }[postureView];
  const visibleIssues = getVisiblePostureIssues();

  tabContent.innerHTML = `
    <div class="posture-layout">
      <section class="posture-score score-card score-summary-card">
        <div class="score-ring posture-ring" aria-label="体态评估 80 分">
          <svg viewBox="0 0 120 72" role="img">
            <defs>
              <linearGradient id="postureScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="${REPORT_PALETTE.brandBlue}"></stop>
                <stop offset="100%" stop-color="${REPORT_PALETTE.brandPurple}"></stop>
              </linearGradient>
            </defs>
            <path class="ring-bg" pathLength="100" d="M 14 58 A 46 46 0 0 1 106 58"></path>
            <path class="ring-progress posture-ring-progress" pathLength="100" d="M 14 58 A 46 46 0 0 1 106 58"></path>
          </svg>
          <div><strong>80</strong><span>分</span></div>
        </div>
        <div class="posture-score-meta score-copy score-copy-static">
          <time class="score-datetime posture-score-datetime" datetime="2025-01-21T15:16">检测时间：2025-01-21 15:16</time>
          <p class="posture-update-note">*体态评估分数规则已于 {date} 更新!</p>
        </div>
      </section>

      <div class="section-switch-tabs section-switch-tabs--five posture-page-tabs">
        ${[
          ["all", "全部"],
          ["front", "正视图"],
          ["left", "左视图"],
          ["right", "右视图"],
          ["back", "后视图"],
        ].map(([view, label]) => `<button class="${postureFilter === view ? "is-active" : ""}" type="button" data-posture-filter="${view}">${label}</button>`).join("")}
      </div>

      <div class="posture-content-grid">
        <section class="posture-list-panel">
          <div class="posture-issue-list">
            ${renderPostureIssueListMarkup(visibleIssues)}
          </div>
        </section>

        <div class="posture-model-stack">
          <section class="posture-viewer">
            <button class="viewer-arrow left ${postureArrowFlash === "left" ? "is-flash" : ""}" type="button" data-view-step="-1" aria-label="上一个视角"><img src="${modelSwitchIcons.left}" alt="" /></button>
            <button class="viewer-arrow right ${postureArrowFlash === "right" ? "is-flash" : ""}" type="button" data-view-step="1" aria-label="下一个视角"><img src="${modelSwitchIcons.right}" alt="" /></button>
            <div class="viewer-stage model-stage" data-posture-3d-stage aria-label="${viewLabel}人体模型 3D 视图">
              ${renderModelTechBackground()}
              <div class="posture-model-canvas model-3d" data-posture-3d-canvas></div>
            </div>
            ${postureDetailOpen ? renderPostureDetailOverlay(selected) : ""}
          </section>
        </div>
      </div>
    </div>
  `;
  requestAnimationFrame(() => {
    syncPostureViewerState();
    if (postureListNeedsAlign) {
      refreshPostureListSelection({ alignList: true });
      postureListNeedsAlign = false;
    }
  });
}

function renderPostureDetailOverlay(selected) {
  const currentStatusClass = postureLabelClass(selected);
  const meta = postureDefinitionMeta(selected);
  return `
    <div class="posture-detail-overlay">
      <section class="posture-detail-sheet posture-detail-sheet--overlay">
        <button class="posture-detail-close" type="button" data-close-posture-detail aria-label="关闭详情">×</button>
        <h2 class="posture-detail-title">${selected.name}</h2>
        <div class="posture-detail-body">
          <section class="posture-detail-summary ${selected.name === "腿型" ? "is-leg" : ""}">
            ${renderPostureDetailMetric(selected, currentStatusClass)}
            <p class="posture-detail-result">${selected.resultText}</p>
            <div class="posture-detail-meta-stack">
              <div class="posture-detail-meta-row">
                <strong>定义：</strong>
                <span>${meta.text}</span>
              </div>
              <div class="posture-detail-meta-row">
                <strong>正常范围：</strong>
                <span>${meta.range}</span>
              </div>
            </div>
          </section>

          <div class="posture-detail-compare-grid ${selected.severity === "normal" ? "is-single" : ""}">
            <div class="posture-compare-visual is-normal">
              ${postureIcon(selected.name, "normal")}
              <span class="posture-compare-caption">正常</span>
            </div>
            ${selected.severity === "normal" ? "" : `<div class="posture-compare-visual is-abnormal">
              ${postureIcon(selected.name, "abnormal")}
              <span class="posture-compare-caption">异常</span>
            </div>`}
          </div>
        </div>

        <div class="girth-trend-popup-actions posture-detail-actions">
          <button type="button" data-posture-detail-step="-1">上一项</button>
          <button type="button" data-posture-detail-step="1">下一项</button>
        </div>
      </section>
    </div>
  `;
}

function splitDateTimeParts(value = "") {
  const [date = "--", time = "--"] = `${value}`.trim().split(/\s+/);
  return { date, time };
}

function renderGirthVsHeader() {
  const currentMeasurementTime = "2025-01-21 15:16";
  const { date: currentDate, time: currentClock } = splitDateTimeParts(currentMeasurementTime);
  const { date: compareDate, time: compareClock } = splitDateTimeParts(girthHistoryDates[girthCompareIndex]);
  return `
    <section class="girth-top-meta-panel girth-top-meta-panel--overview">
      <div class="girth-comparison-card">
        <div class="girth-comparison-note">
          <span class="girth-comparison-note-text">身体围度算法已于 {date} 更新！</span>
        </div>
        <div class="girth-comparison-main">
          <div class="girth-time-panel girth-time-panel--current">
            <span class="girth-calendar-orb" aria-hidden="true"><span class="girth-calendar-icon"></span></span>
            <div class="girth-time-block girth-time-block--current">
              <span class="girth-time-label">当前检测</span>
              <span class="girth-time-reading"><span class="girth-time-date">${currentDate}</span><span class="girth-time-clock">${currentClock}</span></span>
            </div>
          </div>
          <div class="girth-vs-divider" aria-hidden="true">
            <span>VS</span>
          </div>
          <div class="girth-time-panel girth-time-panel--history">
            <button type="button" class="girth-time-block girth-time-block--history" data-girth-date-toggle aria-label="选择历史对比日期">
              <span class="girth-time-label girth-time-label--history">历史对比</span>
              <span class="girth-history-date-row">
                <span class="girth-time-date">${compareDate}</span>
                <span class="girth-time-clock">${compareClock}</span>
                <i class="girth-history-caret" aria-hidden="true"></i>
              </span>
            </button>
            ${renderGirthDateMenu("is-overview")}
          </div>
        </div>
        <div class="girth-comparison-footer">
          <button class="girth-inline-compare ${girthScreen === "compare" ? "is-open" : ""}" type="button" data-girth-compare>${girthScreen === "compare" ? "收起模型对比" : "展开模型对比"} <i>›</i></button>
        </div>
      </div>
    </section>
  `;
}

function renderGirth() {
  const selected = girthItems[selectedGirthIndex];
  const filteredItems = girthSegment === "all" ? girthItems : girthItems.filter((item) => item.segment === girthSegment);
  tabContent.innerHTML = `
    <section class="girth-overview-shell">
      ${renderGirthVsHeader()}
      <div class="girth-main-area">
      ${girthScreen === "overview" ? `<div class="section-switch-tabs section-switch-tabs--four girth-view-filter">
        <button class="${girthSegment === "all" ? "is-active" : ""}" type="button" data-girth-segment="all">全部</button>
        <button class="${girthSegment === "upper" ? "is-active" : ""}" type="button" data-girth-segment="upper">上半身</button>
        <button class="${girthSegment === "waist" ? "is-active" : ""}" type="button" data-girth-segment="waist">腰腹</button>
        <button class="${girthSegment === "lower" ? "is-active" : ""}" type="button" data-girth-segment="lower">下半身</button>
      </div>
      <section class="girth-main-panel girth-main-panel--compact">
        <div class="girth-list">
        <div class="girth-cards">
          ${filteredItems.map((item) => girthDataCard(item, girthItems.indexOf(item))).join("")}
        </div>
        </div>

        <div class="girth-model-card">
          <button class="viewer-arrow left ${girthArrowFlash === "left" ? "is-flash" : ""}" type="button" data-girth-view-step="-1" aria-label="上一个视角"><img src="${modelSwitchIcons.left}" alt="" /></button>
          <button class="viewer-arrow right ${girthArrowFlash === "right" ? "is-flash" : ""}" type="button" data-girth-view-step="1" aria-label="下一个视角"><img src="${modelSwitchIcons.right}" alt="" /></button>
          <div class="girth-model-stage model-stage" data-girth-3d-stage aria-label="身体围度人体模型 3D 视图">
            ${renderModelTechBackground()}
            <div class="girth-model-canvas model-3d" data-girth-3d-canvas></div>
          </div>
          ${girthTrendOverlayOpen ? renderGirthTrendOverlay() : ""}
        </div>
      </section>` : `
      <section class="girth-subpage girth-subpage--compare-panel">
        ${renderGirthCompareInline()}
      </section>`}
      </div>
    </section>
  `;
  requestAnimationFrame(() => {
    syncVisibleGirthViewers();
  });
}


function getGirthAnnotationState(visibleItems = girthItems, selected = girthItems[selectedGirthIndex], forceFrontAll = false) {
  return {
    selectedId: selected?.id || null,
    visibleIds: visibleItems.map((item) => item.id),
    values: Object.fromEntries(girthItems.map((item) => [item.id, girthCurrentValue(item)])),
    showLabels: false,
    forceFrontAll,
  };
}

function getVisibleGirthItems() {
  return girthSegment === "all" ? girthItems : girthItems.filter((item) => item.segment === girthSegment);
}

function preferredGirthView(index) {
  const item = girthItems[index];
  return circumferenceAnnotationMap[item?.id]?.view || item?.view || "front";
}

function currentGirthViewState() {
  return girthScreen === "compare" ? girthCompareView : girthView;
}

function resolveGirthFocusView(index, currentView = currentGirthViewState()) {
  const targetView = preferredGirthView(index);
  if (currentView === "left" && targetView === "right") return "right";
  if (currentView === "right" && targetView === "left") return "left";
  return currentView || targetView || "front";
}

function syncCurrentGirthViewers() {
  const visibleItems = getVisibleGirthItems();
  window.syncGirthModelViewers?.({
    view: girthView,
    previousView: girthTransitionFromView,
    annotations: getGirthAnnotationState(visibleItems, girthItems[selectedGirthIndex], girthSegment === "all"),
  });
  girthTransitionFromView = null;
}

function syncVisibleGirthViewers() {
  if (girthScreen === "overview") {
    const visibleItems = getVisibleGirthItems();
    window.syncGirthModelViewers?.({
      view: girthView,
      previousView: girthTransitionFromView,
      annotations: getGirthAnnotationState(visibleItems, girthItems[selectedGirthIndex], girthSegment === "all"),
    });
  } else {
    window.syncGirthModelViewers?.({
      view: girthCompareView,
      previousView: girthTransitionFromView,
      annotations: getGirthAnnotationState(girthItems, girthItems[selectedGirthIndex], true),
    });
  }
  girthTransitionFromView = null;
}

function refreshGirthOverviewSelection() {
  const cards = Array.from(tabContent.querySelectorAll(".girth-data-card"));
  cards.forEach((card) => {
    const trigger = card.querySelector("[data-girth-index]");
    const active = Number(trigger?.dataset.girthIndex) === selectedGirthIndex;
    card.classList.toggle("is-active", active);
  });
  syncCurrentGirthViewers();
}

function refreshGirthCompareSelection() {
  const selected = girthItems[selectedGirthIndex];
  const compareValue = girthCompareValue(selected);
  const currentValue = girthCurrentValue(selected);

  const compareName = tabContent.querySelector("[data-girth-compare-name]");
  if (compareName) compareName.textContent = selected.name;

  const compareDelta = tabContent.querySelector("[data-girth-compare-delta]");
  if (compareDelta) compareDelta.textContent = girthDeltaText(selected);

  const previousValue = tabContent.querySelector("[data-girth-compare-value='previous']");
  if (previousValue) previousValue.textContent = `${compareValue.toFixed(1)} cm`;

  const latestValue = tabContent.querySelector("[data-girth-compare-value='current']");
  if (latestValue) latestValue.textContent = `${currentValue.toFixed(1)} cm`;

  syncVisibleGirthViewers();
}

function refreshGirthTrendOverlay() {
  const overlay = tabContent.querySelector(".girth-trend-overlay");
  if (!overlay) return;
  overlay.outerHTML = renderGirthTrendOverlay();
}

function triggerGirthArrowFlash(step) {
  girthArrowFlash = step < 0 ? "left" : "right";
  const flashValue = girthArrowFlash;
  const buttons = Array.from(document.querySelectorAll(
    flashValue === "left" ? "[data-girth-view-step='-1']" : "[data-girth-view-step='1']"
  ));
  buttons.forEach((button) => button.classList.add("is-flash"));
  window.setTimeout(() => {
    if (girthArrowFlash === flashValue) girthArrowFlash = null;
    buttons.forEach((button) => button.classList.remove("is-flash"));
  }, 100);
}

function openGirthTrend(index) {
  if (girthTrendOverlayOpen && selectedGirthIndex === index) {
    girthTrendOverlayOpen = false;
    renderGirth();
    return;
  }
  selectedGirthIndex = index;
  girthTrendOverlayOpen = true;
  if (girthScreen === "compare") {
    girthCompareView = resolveGirthFocusView(selectedGirthIndex, girthCompareView);
  } else {
    girthView = resolveGirthFocusView(selectedGirthIndex, girthView);
  }
  renderGirth();
}

function bindGirthAnnotationSelection() {
  if (girthAnnotationListenerBound) return;
  girthAnnotationListenerBound = true;
  window.addEventListener("girth-annotation-select", (event) => {
    const id = event.detail?.id;
    const nextIndex = girthItems.findIndex((item) => item.id === id);
    if (nextIndex < 0) return;
    selectedGirthIndex = nextIndex;
    if (document.body.dataset.activeReport === "girth" && girthScreen === "overview") {
      girthView = resolveGirthFocusView(nextIndex, girthView);
      refreshGirthOverviewSelection();
    } else if (document.body.dataset.activeReport === "girth") {
      girthCompareView = resolveGirthFocusView(nextIndex, girthCompareView);
      refreshGirthCompareSelection();
    }
  });
}

bindGirthAnnotationSelection();

function advanceGirthView(step) {
  const views = ["front", "right", "back", "left"];
  const current = views.indexOf(currentGirthViewState());
  triggerGirthArrowFlash(step);
  setGirthView(views[(current + step + views.length) % views.length]);
}

function setGirthView(nextView) {
  const currentView = currentGirthViewState();
  if (!nextView || nextView === currentView) return;
  girthTransitionFromView = currentView;
  if (girthScreen === "compare") {
    girthCompareView = nextView;
    syncVisibleGirthViewers();
  } else {
    girthView = nextView;
    syncCurrentGirthViewers();
  }
}

window.addEventListener("girth-view-swipe", (event) => {
  if (document.body.dataset.activeReport !== "girth") return;
  const step = Number(event.detail?.step || 0);
  if (!step) return;
  advanceGirthView(step);
});

const girthIconByName = Object.fromEntries(
  [
    "颈围",
    "左上臂围",
    "右上臂围",
    "胸围",
    "高腰围",
    "中腰围",
    "低腰围",
    "臀围",
    "左大腿围",
    "左大腿最小围",
    "右大腿围",
    "右大腿最小围",
    "左小腿围",
    "右小腿围",
  ].map((name) => [name, `/assets/girth-icons/${name}.png`])
);

function girthDataCard(item, index, options = {}) {
  const currentValue = girthCurrentValue(item);
  const value = girthUnit === "cm" ? currentValue : currentValue / 2.54;
  const unit = girthUnit === "cm" ? "cm" : "inch";
  const active = index === selectedGirthIndex;
  const iconSrc = girthIconByName[item.name];
  const trendOpen = girthTrendOverlayOpen && active;
  return `
    <article class="girth-data-card ${active ? "is-active" : ""} ${options.rank ? "is-top-ranked" : ""}">
      <button class="girth-data-main" type="button" data-girth-index="${index}">
        <span class="girth-card-title"><span class="girth-card-title-text">${iconSrc ? `<img class="girth-card-icon" src="${iconSrc}" alt="" aria-hidden="true" />` : ""}<span>${item.name}</span></span></span>
        <span class="girth-card-value"><strong>${value.toFixed(1)}</strong><em>${unit}</em><b>${girthDeltaText(item, false)}</b></span>
      </button>
      <button class="girth-card-hitarea ${trendOpen ? "is-open" : ""}" type="button" data-girth-trend-open="${index}" aria-label="${trendOpen ? "收起" : "查看"}${item.name}趋势">
        <span class="girth-card-hitarea-icon" aria-hidden="true"><svg viewBox="0 0 18 18" focusable="false"><path d="M2.5 12.5h13"></path><path d="M4 11l3-3 2.4 2.4 4.6-5"></path><circle cx="4" cy="11" r="1"></circle><circle cx="7" cy="8" r="1"></circle><circle cx="9.4" cy="10.4" r="1"></circle><circle cx="14" cy="5.4" r="1"></circle></svg></span>
      </button>
    </article>
  `;
}

function renderGirthTrendOverlay() {
  const selected = girthItems[selectedGirthIndex];
  const visibleItems = getVisibleGirthItems();
  const visibleIndex = Math.max(0, visibleItems.findIndex((item) => item.id === selected.id));
  const prevItem = visibleItems[(visibleIndex - 1 + visibleItems.length) % visibleItems.length] || selected;
  const nextItem = visibleItems[(visibleIndex + 1) % visibleItems.length] || selected;
  return `
    <div class="girth-trend-overlay">
      <section class="girth-trend-popup" role="dialog" aria-modal="false" aria-labelledby="girthTrendTitle">
        <header class="girth-trend-popup-header">
          <h3 id="girthTrendTitle">${selected.name}趋势</h3>
          <button type="button" data-girth-trend-close aria-label="关闭围度趋势">×</button>
        </header>
        <div class="girth-trend-popup-chart">
          <div class="girth-trend-chart girth-trend-chart--popup" data-girth-trend-chart>
            <svg viewBox="0 0 320 170" preserveAspectRatio="xMidYMid meet">
              ${girthTrendSvg(selected.trend, girthHistoryDates)}
            </svg>
          </div>
        </div>
        <div class="girth-trend-popup-actions">
          <button type="button" data-girth-trend-step="${girthItems.indexOf(prevItem)}">上一项</button>
          <button type="button" data-girth-trend-step="${girthItems.indexOf(nextItem)}">下一项</button>
        </div>
      </section>
    </div>
  `;
}

function renderGirthCompareInline() {
  return `
      <section class="girth-subpage girth-subpage--inline">
      ${renderGirthCompareModelView()}
    </section>
  `;
}

function renderGirthCompareModelView() {
  const selected = girthItems[selectedGirthIndex];
  const currentValue = girthCurrentValue(selected);
  const compareValue = girthCompareValue(selected);
  const { date: currentDate, time: currentClock } = splitDateTimeParts("2025-01-21 15:16");
  const { date: compareDate, time: compareClock } = splitDateTimeParts(girthHistoryDates[girthCompareIndex]);
  return `
      <section class="girth-compare-panel">
        <div class="girth-compare-viewport">
          <div class="girth-compare-head compare-side-current">
            <span class="girth-compare-chip">当前</span>
            <b class="girth-compare-datetime">
              <span class="girth-compare-date">${currentDate}</span>
              <span class="girth-compare-time">${currentClock}</span>
            </b>
            <strong class="girth-compare-reading" data-girth-compare-value="current">${currentValue.toFixed(1)}<em>cm</em></strong>
          </div>
          <div class="girth-compare-head compare-side-compare">
            <span class="girth-compare-chip">历史</span>
            <b class="girth-compare-datetime">
              <span class="girth-compare-date">${compareDate}</span>
              <span class="girth-compare-time">${compareClock}</span>
            </b>
            <strong class="girth-compare-reading" data-girth-compare-value="previous">${compareValue.toFixed(1)}<em>cm</em></strong>
          </div>
          <div class="girth-compare-center-stack">
            <button class="girth-compare-focus-step up" type="button" data-girth-compare-step="-1" aria-label="上一个围度线">˄</button>
            <i class="girth-compare-vs">VS</i>
            <div class="girth-focus-copy girth-focus-copy--floating">
              <span data-girth-compare-name>${selected.name}</span>
              <em data-girth-compare-delta>${girthDeltaText(selected)}</em>
            </div>
            <button class="girth-compare-focus-step down" type="button" data-girth-compare-step="1" aria-label="下一个围度线">˅</button>
          </div>
          ${renderGirthModelCompare()}
        </div>
      </section>
  `;
}

function renderGirthModelCompare() {
  return `
    <div class="girth-compare-viewport">
      <button class="girth-compare-view-step left ${girthArrowFlash === "left" ? "is-flash" : ""}" type="button" data-girth-view-step="-1" aria-label="上一个视角"><img src="${modelSwitchIcons.left}" alt="" /></button>
      <div class="girth-compare-models">
        <figure class="girth-model-stage model-stage model-stage--compare is-current" data-girth-3d-stage aria-label="本次身体围度模型 3D 视图">
          ${renderModelTechBackground()}
          <div class="girth-model-canvas girth-model-canvas--compare model-3d" data-girth-3d-canvas></div>
        </figure>
        <figure class="girth-model-stage model-stage model-stage--compare is-history" data-girth-3d-stage aria-label="对比日期身体围度模型 3D 视图">
          ${renderModelTechBackground()}
          <div class="girth-model-canvas girth-model-canvas--compare model-3d" data-girth-3d-canvas></div>
        </figure>
      </div>
      <button class="girth-compare-view-step right ${girthArrowFlash === "right" ? "is-flash" : ""}" type="button" data-girth-view-step="1" aria-label="下一个视角"><img src="${modelSwitchIcons.right}" alt="" /></button>
    </div>
  `;
}

function girthTrendSvg(values, dates = []) {
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const plot = { left: 42, right: 302, top: 20, bottom: 132 };
  const xStep = (plot.right - plot.left) / Math.max(values.length - 1, 1);
  const points = values.map((value, index) => {
    const x = plot.left + index * xStep;
    const y = plot.top + ((max - value) / (max - min)) * (plot.bottom - plot.top);
    return { x, y, value };
  });
  const d = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map((ratio) => plot.top + (plot.bottom - plot.top) * ratio)
    .map((y) => `<line class="trend-grid-line" x1="${plot.left}" y1="${y}" x2="${plot.right}" y2="${y}"></line>`)
    .join("");
  const xLabels = dates
    .map((date, index) => {
      const [year, month, day] = date.split(" ")[0].split("-");
      const x = plot.left + index * xStep;
      return `<text class="trend-axis-label trend-axis-label--x" x="${x}" y="152" text-anchor="middle">${month}-${day}</text><text class="trend-axis-label trend-axis-label--year" x="${x}" y="164" text-anchor="middle">${year}</text>`;
    })
    .join("");
  return `${grid}<line class="trend-axis" x1="${plot.left}" y1="${plot.top}" x2="${plot.left}" y2="${plot.bottom}"></line><line class="trend-axis" x1="${plot.left}" y1="${plot.bottom}" x2="${plot.right}" y2="${plot.bottom}"></line><text class="trend-axis-title" x="18" y="${plot.top + 2}">cm</text><path class="trend-fill" d="${d} L ${points.at(-1).x} ${plot.bottom} L ${points[0].x} ${plot.bottom} Z"></path><path class="trend-line" d="${d}"></path>${points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4"></circle><text x="${point.x - 12}" y="${point.y - 10}">${point.value.toFixed(1)}</text>`).join("")}${xLabels}`;
}


function girthCurrentValue(item) {
  return item.trend[item.trend.length - 1];
}

function girthCompareValue(item) {
  return item.trend[girthCompareIndex];
}

function girthChangeValue(item) {
  return girthCurrentValue(item) - girthCompareValue(item);
}

function girthDeltaText(item, withUnit = true) {
  const delta = girthChangeValue(item);
  if (delta === 0) return "—";
  const arrow = delta > 0 ? "↑" : "↓";
  return `${arrow} ${Math.abs(delta).toFixed(1)}${withUnit ? " cm" : ""}`;
}

function renderGirthDateMenu(extraClass = "") {
  return `
    <div class="date-menu girth-date-menu ${extraClass}" data-girth-date-menu>
      ${girthHistoryDates.slice(0, -1).reverse().map((date) => `<button class="${girthHistoryDates[girthCompareIndex] === date ? "is-selected" : ""}" type="button" data-girth-date-value="${date}">${date}</button>`).join("")}
    </div>
  `;
}

function compositionCompareDateLabel() {
  return girthHistoryDates[compositionCompareIndex];
}

function compositionScoreChangeText() {
  const currentIndex = compositionScoreHistory.length - 1;
  const diff = compositionScoreHistory[currentIndex] - compositionScoreHistory[compositionCompareIndex];
  return `${diff >= 0 ? "↑" : "↓"} ${Math.abs(diff)}`;
}

function getGirthTopChangeIndexes() {
  return girthItems
    .map((item, index) => ({ index, delta: Math.abs(girthChangeValue(item)) }))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3)
    .map((item) => item.index);
}

function renderShoulder() {
  tabContent.innerHTML = `
    <section class="shoulder-page">
      <p class="report-datetime">检测时间：2025-01-21 15:16</p>
      <section class="shoulder-overview-card shoulder-overview-card--summary">
        <div class="shoulder-composite-card">
          <div class="shoulder-composite-main">
            <div class="shoulder-card-title-row shoulder-card-title-row--summary">
              <h3>肩部综合评估</h3>
            </div>
            <div class="shoulder-composite-copy">
              <p>${buildShoulderCompositeSummary()}</p>
            </div>
          </div>
          <div class="shoulder-composite-figure">
            <img src="${shoulderSummaryFigure}" alt="肩部综合评估示意图" />
          </div>
        </div>
      </section>

      <div class="shoulder-measurements-block">
        <div class="shoulder-card-title-row shoulder-card-title-row--measurements">
          <h3>测量结果</h3>
        </div>
        ${renderShoulderMeasureSection("abduction")}
        ${renderShoulderMeasureSection("flexion")}
      </div>

      <section class="shoulder-summary-block">
        <div class="shoulder-card-title-row shoulder-card-title-row--summary-card">
          <h3>评估结论</h3>
        </div>
        <div class="shoulder-summary-card">
          <div class="shoulder-summary-groups">
            ${["abduction", "flexion"].map((mode) => renderShoulderConclusionGroup(mode)).join("")}
          </div>
          <p class="shoulder-suggestion"><span>建议：</span>具体原因请找专业人士做进一步筛查。</p>
        </div>
      </section>
      ${shoulderRangeOverlayMode ? renderShoulderRangeOverlay(shoulderRangeOverlayMode) : ""}
    </section>
  `;
}

function renderShoulderMeasureSection(mode) {
  const test = shoulderTests[mode];
  return `
    <section class="shoulder-measure-card shoulder-measure-card--flat shoulder-measure-card--group">
      <div class="shoulder-section-head shoulder-section-head--split">
        <div class="shoulder-section-head-main">
          <h2>${test.label}</h2>
        </div>
        <button class="shoulder-range-trigger" type="button" data-shoulder-range-open="${mode}">动作示意图</button>
      </div>
      <div class="shoulder-side-grid shoulder-measure-grid">
        ${renderShoulderMeasureDetailCard(mode, test.left, "left")}
        ${renderShoulderMeasureDetailCard(mode, test.right, "right")}
      </div>
    </section>
  `;
}

function renderShoulderMeasureDetailCard(mode, side, key) {
  const marker = shoulderScalePosition(side.value, shoulderTests[mode]);
  const trendArrow = side.change >= 0 ? "↑" : "↓";
  const test = shoulderTests[mode];
  const activeBand = shoulderStatusKey(side.statusType);
  return `
    <article class="shoulder-measure-detail ${side.statusType}">
      <div class="shoulder-measure-detail-top">
        <div class="shoulder-measure-side-main">
          <strong>${key === "left" ? "左肩" : "右肩"}</strong>
          <div class="shoulder-measure-reading">
            <em>${side.value.toFixed(1)}°</em>
            <span class="shoulder-measure-delta">${trendArrow} ${Math.abs(side.change).toFixed(1)}°</span>
          </div>
          <b class="shoulder-measure-status ${statusClass(side.statusType)}">${shoulderStatusBadge(side.statusType)}</b>
        </div>
        <img
          class="shoulder-measure-figure"
          src="${shoulderFigureSource(mode, key, side.statusType)}"
          alt=""
          aria-hidden="true"
        />
      </div>
      <div class="shoulder-scale">
        <div class="shoulder-scale-labels">
          <span class="limited ${activeBand === "limited" ? "is-active" : ""}">受限</span>
          <span class="normal ${activeBand === "normal" ? "is-active" : ""}">正常</span>
          <span class="excess ${activeBand === "excess" ? "is-active" : ""}">过大</span>
        </div>
        <div class="shoulder-scale-bar">
          <i class="limited ${activeBand === "limited" ? "is-active" : ""}"></i>
          <i class="normal ${activeBand === "normal" ? "is-active" : ""}"></i>
          <i class="excess ${activeBand === "excess" ? "is-active" : ""}"></i>
          <span class="shoulder-scale-marker ${activeBand}" style="left:${marker}%"></span>
        </div>
        ${renderShoulderScaleThresholds(test)}
      </div>
    </article>
  `;
}

function renderShoulderRangeFigure(mode) {
  const test = shoulderTests[mode];
  const shoulderIllustration = mode === "abduction"
    ? "assets/shoulder/abduction.svg"
    : "assets/shoulder/flexion.svg";
  return `
    <div class="shoulder-range-figure">
      <h4>${test.label}</h4>
      <div class="shoulder-hero-card shoulder-hero-card-image ${mode === "flexion" ? "is-flexion" : ""}">
        <div class="grid-floor"></div>
        <img class="shoulder-hero-illustration" src="${shoulderIllustration}" alt="${test.label}活动度范围示意图" />
      </div>
    </div>
  `;
}

function renderShoulderRangeOverlay(mode) {
  const test = shoulderTests[mode];
  const shoulderIllustration = mode === "abduction"
    ? "assets/shoulder/abduction.svg"
    : "assets/shoulder/flexion.svg";
  return `
    <div class="shoulder-range-overlay" data-shoulder-range-close>
      <section class="girth-trend-popup shoulder-range-popup" role="dialog" aria-modal="false" aria-labelledby="shoulderRangeTitle">
        <header class="girth-trend-popup-header shoulder-range-popup-header">
          <h3 id="shoulderRangeTitle">${test.label}动作示意图</h3>
          <button type="button" data-shoulder-range-close aria-label="关闭动作示意图">×</button>
        </header>
        <div class="shoulder-range-popup-body">
          <img src="${shoulderIllustration}" alt="${test.label}动作示意图" />
        </div>
      </section>
    </div>
  `;
}

function renderShoulderConclusionGroup(mode) {
  const test = shoulderTests[mode];
  return `
    <section class="shoulder-summary-group">
      <h4>${test.label}</h4>
      <div class="shoulder-summary-list">
        ${buildShoulderConclusionItems(test).map((item) => shoulderConclusionItem(item.title, item.status, item.statusType, item.analysis)).join("")}
      </div>
    </section>
  `;
}

function shoulderStatusKey(type) {
  if (type === "normal") return "normal";
  if (type === "high") return "excess";
  return "limited";
}

function shoulderFigureSource(mode, side, type) {
  return shoulderStateFigures[mode][side][shoulderStatusKey(type)];
}

function shoulderScaleMarkers(test) {
  const leftPosition = shoulderScalePosition(test.left.value);
  const rightPosition = shoulderScalePosition(test.right.value);
  const overlap = Math.abs(leftPosition - rightPosition) < 6;
  const leftOffset = overlap ? -7 : 0;
  const rightOffset = overlap ? 7 : 0;
  return `
    <span class="shoulder-overview-marker left" style="left:calc(${leftPosition}% + ${leftOffset}px)"></span>
    <span class="shoulder-overview-marker right" style="left:calc(${rightPosition}% + ${rightOffset}px)"></span>
  `;
}

function buildShoulderConclusionItems(test) {
  const sides = [
    { side: "左肩", ...test.left },
    { side: "右肩", ...test.right },
  ].filter((item) => item.statusType !== "normal");

  if (!sides.length) {
    return [{
      title: "左肩、右肩肩关节正常",
      status: "正常",
      statusType: "normal",
      analysis: "双侧肩关节活动度均处于正常参考范围，可继续保持当前活动习惯和训练状态。",
    }];
  }

  const groups = new Map();
  sides.forEach((item) => {
    const key = `${item.statusType}|${item.status}`;
    if (!groups.has(key)) {
      groups.set(key, {
        status: item.status,
        statusType: item.statusType,
        sides: [],
        analysis: item.statusType === "high"
          ? "肩关节活动度过大，多由韧带松弛导致（女性多见），如经常肩部柔韧性训练，也会出现活动过大的现象。"
          : "肩关节活动受限，多由肌肉紧张，锁骨肩胛骨活动度不足，头颈肩胛不在中立位等原因引起。会影响正常运动模式（导致运动损伤），以及引起相关病理问题（如肩周炎、含胸驼背、颈椎酸痛等现象），长期忽视易导致各类肩关节疾病的发生。",
      });
    }
    groups.get(key).sides.push(item.side);
  });

  return Array.from(groups.values()).map((item) => ({
    title: `${item.sides.length > 1 ? item.sides.join("、") : item.sides[0]}肩关节${item.status}`,
    status: item.status,
    statusType: item.statusType,
    analysis: item.analysis,
  }));
}

function shoulderSideCard(side, key) {
  const arrow = side.change >= 0 ? "↑" : "↓";
  return `
    <button class="shoulder-side-card ${key} ${side.statusType} ${selectedShoulderSide === key ? "is-active" : ""}" type="button" data-shoulder-side="${key}">
      <span class="side-name">${side.label}</span>
      <span class="side-status ${statusClass(side.statusType)}">${side.status}</span>
      <strong>${side.value.toFixed(1)}°</strong>
      <em>${arrow} ${Math.abs(side.change).toFixed(1)}°</em>
      <small>正常参考：${shoulderTests[shoulderMode].reference}</small>
      <span class="shoulder-mini-figure ${key} ${side.statusType}"></span>
    </button>
  `;
}

function renderShoulderHistory(test) {
  return `
    <section class="shoulder-history">
      <button type="button" data-shoulder-history-close aria-label="关闭历史">×</button>
      <h3>${test.label}历史对比</h3>
      <div class="history-bars">
        <span><b style="height:${Math.min(test.left.value / 2.1, 92)}%"></b><em>左手<br />${test.left.value.toFixed(1)}°</em></span>
        <span><b style="height:${Math.min(test.right.value / 2.1, 92)}%"></b><em>右手<br />${test.right.value.toFixed(1)}°</em></span>
        <span><b style="height:86%"></b><em>上次<br />173.0°</em></span>
      </div>
    </section>
  `;
}

function shoulderOverviewCard(side, key) {
  return `
    <button class="shoulder-overview-item ${side.statusType} ${selectedShoulderSide === key ? "is-active" : ""}" type="button" data-shoulder-side="${key}">
      <div class="shoulder-overview-copy">
        <div class="shoulder-overview-head">
          <strong>${key === "left" ? "左手" : "右手"}</strong>
          <b class="${statusClass(side.statusType)}">${side.status}</b>
        </div>
        <p>${side.statusType === "normal" ? "在正常范围内" : side.statusType === "high" ? "高于正常范围" : "低于正常范围"}</p>
      </div>
      <span class="shoulder-overview-figure ${key} ${side.statusType}"></span>
    </button>
  `;
}

function shoulderDetailCard(side, key) {
  const trendArrow = side.change >= 0 ? "↑" : "↓";
  const marker = shoulderScalePosition(side.value, shoulderTests[shoulderMode]);
  const test = shoulderTests[shoulderMode];
  return `
    <button class="shoulder-detail-card ${side.statusType} ${selectedShoulderSide === key ? "is-active" : ""}" type="button" data-shoulder-side="${key}">
      <div class="shoulder-detail-head">
        <span>${side.label}</span>
        <b class="${statusClass(side.statusType)}">${side.status}</b>
      </div>
      <div class="shoulder-detail-value">
        <strong>${side.value.toFixed(1)}°</strong>
        <em>${trendArrow} ${Math.abs(side.change).toFixed(1)}°</em>
      </div>
      <div class="shoulder-scale">
        <div class="shoulder-scale-labels">
          <span class="limited">受限<br />${test.limited}</span>
          <span class="normal">正常<br />${test.normal}</span>
          <span class="excess">过大<br />${test.excess}</span>
        </div>
        <div class="shoulder-scale-bar">
          <i class="limited"></i>
          <i class="normal"></i>
          <i class="excess"></i>
          <span class="shoulder-scale-marker" style="left:${marker}%"></span>
        </div>
        <p class="shoulder-scale-value ${side.statusType}">${side.value.toFixed(1)}°</p>
      </div>
    </button>
  `;
}

function shoulderScalePosition(value, test) {
  const normalText = String(test?.normal || "");
  const [lowerText = "150", upperText = "180"] = normalText.split("-");
  const lower = Number.parseFloat(lowerText);
  const upper = Number.parseFloat(upperText);
  const min = Math.min(90, lower - 30);
  const max = Math.max(210, upper + 30);
  const limitedEnd = 31.25;
  const normalEnd = 68.75;
  const clamped = Math.max(min, Math.min(max, value));

  if (clamped <= lower) {
    const ratio = lower === min ? 1 : (clamped - min) / (lower - min);
    return ratio * limitedEnd;
  }

  if (clamped <= upper) {
    const ratio = upper === lower ? 1 : (clamped - lower) / (upper - lower);
    return limitedEnd + ratio * (normalEnd - limitedEnd);
  }

  const ratio = max === upper ? 1 : (clamped - upper) / (max - upper);
  return normalEnd + ratio * (100 - normalEnd);
}

function shoulderStatusBadge(type) {
  if (type === "normal") return "正常";
  if (type === "high") return "过大";
  return "受限";
}

function renderShoulderScaleThresholds(test) {
  const [lower = "", upper = ""] = String(test.normal).split("-");
  return `
    <div class="shoulder-scale-thresholds" aria-hidden="true">
      <span class="threshold-start">${lower}</span>
      <span class="threshold-end">${upper}</span>
    </div>
  `;
}

function buildShoulderCompositeSummary() {
  return ["abduction", "flexion"].map((mode) => {
    const test = shoulderTests[mode];
    const abnormalSides = [
      { label: "左肩", ...test.left },
      { label: "右肩", ...test.right },
    ].filter((item) => item.statusType !== "normal");

    if (!abnormalSides.length) {
      return `${test.label}-左右肩正常`;
    }

    const grouped = new Map();
    abnormalSides.forEach((item) => {
      if (!grouped.has(item.statusType)) grouped.set(item.statusType, []);
      grouped.get(item.statusType).push(item.label);
    });

    return Array.from(grouped.entries()).map(([type, labels]) => {
      const sideText = labels.length === 2 ? "左右肩" : labels[0];
      return `${test.label}-${sideText}${shoulderStatusBadge(type)}`;
    }).join("、");
  }).join("<br />");
}

function shoulderConclusionItem(title, status, type, analysis) {
  return `
    <article class="shoulder-summary-item ${type}">
      <div class="shoulder-summary-head">
        <h4>${title}</h4>
      </div>
      <p><span>分析：</span>${analysis}</p>
    </article>
  `;
}

function postureHotspots(view) {
  return "";
}

function postureIssueCard(item, index, active) {
  const isLegCard = item.name === "腿型";
  const toneClass = postureCardToneClass(item);
  const leftLeg = postureLegRow(`左腿 ${item.value}`, "左腿", item.unit);
  const rightLeg = postureLegRow(item.subValue, "右腿", item.unit);
  return `
    <article class="posture-issue-card ${toneClass} ${isLegCard ? "is-leg-card" : ""} ${active ? "is-active" : ""}">
      <button class="posture-issue-main" type="button" data-posture-index="${index}">
        <span class="issue-main ${isLegCard ? "issue-main--leg" : ""}">
          <span class="issue-head">
            <span class="issue-title">${item.name}</span>
            <span class="issue-head-actions">
              <span class="posture-card-info posture-card-arrow" aria-hidden="true"><img src="${compositionIcons.cardArrow}" alt="" /></span>
            </span>
          </span>
          ${isLegCard
            ? `
              <span class="issue-leg-grid">
                <span class="issue-leg-row">
                  <span class="issue-leg-name">${leftLeg.label}</span>
                  <strong>${leftLeg.value}<em>${item.unit}</em></strong>
                </span>
                <span class="issue-leg-row">
                  <span class="issue-leg-name">${rightLeg.label}</span>
                  <strong>${rightLeg.value}<em>${item.unit}</em></strong>
                </span>
                <b class="issue-chip issue-chip--leg ${toneClass}">${postureCardTag(item)}</b>
              </span>
            `
            : `
              <span class="issue-value-row">
                <strong>${item.value}<em>${item.unit}</em></strong>
                <b class="issue-chip ${toneClass}">${postureCardTag(item)}</b>
              </span>
            `}
        </span>
      </button>
      <button class="posture-card-hitarea" type="button" data-posture-info="${index}" aria-label="查看${item.name}详情"></button>
    </article>
  `;
}

function renderTab() {
  if (activeTab === "girth" && lastRenderedReport !== "girth") {
    girthScreen = "overview";
  }
  document.body.dataset.activeReport = activeTab;
  renderReportTabs();

  if (activeTab === "composition") {
    renderComposition();
  } else if (activeTab === "posture") {
    renderPosture();
  } else if (activeTab === "girth") {
    renderGirth();
  } else if (activeTab === "shoulder") {
    renderShoulder();
  } else {
    renderPlaceholder(activeTab);
  }

  syncStaticScoreCard();
  syncUserPopover();
  syncOverlayFrames();
  lastRenderedReport = activeTab;
}

function getModalItem(source, index) {
  modalItems = source === "obesity" ? obesityCards : metrics;
  activeMetricIndex = Number(index);
  return modalItems[activeMetricIndex];
}

function openModal(source, index) {
  const item = getModalItem(source, index);
  updateModal(item);
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

const compositionCardDescriptions = {
  "体重": "体重是身体水分、蛋白质、无机盐和体脂肪的总和。",
  "去脂体重": "去脂体重是体重扣除脂肪的部分。",
  "肌肉量": "肌肉量是人体的瘦组织群，包括了骨骼肌、平滑肌和心肌。",
  "总水分": "身体水分在人体成分中占的含量最多，占体重的50%~70%，身体水分分布于人体细胞和体液中，其中大部分存在于肌肉细胞中。",
  "体脂肪": "体脂肪是皮下脂肪、内脏脂肪和肌肉之间脂肪的总和。",
  "无机盐": "人体是由有机物、无机物和水组成的，人体里的无机物叫无机盐，无机盐大约占人体重量的5%。",
  "蛋白质": "蛋白质是含氮的固态物质，存在于人体所有细胞内，参与细胞构成。是肌肉量的主要成分。",
  "骨骼肌": "骨骼肌又称横纹肌，附着在骨骼上的肌肉，肌肉中的一种，此处计算的是骨骼肌的含量。",
  "体脂率": "体脂肪率是指体脂肪占体重的比率。",
  "BMI": "BMI主要用于评估外观肥胖度，国际上常作为衡量人体胖瘦程度的标准。",
  "腰臀比": "腰臀比是腰围和臀围的比值，是判定中心性肥胖的重要指标。",
  "基础代谢": "基础代谢指人体在清醒而安静的状况下，不受运动、食物、神经紧张、外界温度变化等影响时一天消耗的总能量。",
  "代谢年龄": "代谢年龄是指身体及其健康相关的代谢功能的表现。",
  "细胞内液": "*细胞内/外液数据是判断健康状态的重要指标，当细胞外液超标准或细胞内液低标准时说明存在健康风险，需向专家咨询。",
  "细胞外液": "*细胞内/外液数据是判断健康状态的重要指标，当细胞外液超标准或细胞内液低标准时说明存在健康风险，需向专家咨询。",
};

function updateModal(item) {
  const modalStatus = document.querySelector("[data-modal-status]");
  const modalPointer = document.querySelector("[data-modal-pointer]");
  document.querySelector("[data-modal-name]").textContent = item.name;
  document.querySelector("[data-modal-value]").textContent = item.value;
  document.querySelector("[data-modal-unit]").textContent = item.unit;
  document.querySelector("[data-modal-change]").textContent = item.change || "↑ 0.0";
  modalStatus.textContent = item.status || "标准";
  modalStatus.className = `modal-status ${statusClass(item.statusType)}`;
  document.querySelector("[data-low-limit]").textContent = item.limits[0];
  document.querySelector("[data-high-limit]").textContent = item.limits[1];
  modalPointer.style.left = `${item.pointer}%`;
  const activeRange = modalRangeState(item.pointer);
  const rangeBar = document.querySelector("[data-modal-range]");
  rangeBar.dataset.active = activeRange;
  rangeBar.querySelectorAll("[data-range-segment]").forEach((segment) => {
    segment.classList.toggle("is-active", segment.dataset.rangeSegment === activeRange);
  });
  modalPointer.dataset.tone = activeRange;
  document.querySelector("[data-modal-desc]").textContent = compositionCardDescriptions[item.name] || `${item.name}：暂无说明。`;
  drawTrend(item.trend);
}

function drawTrend(values) {
  const width = 640;
  const height = 220;
  const padX = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const points = values.map((value, index) => {
    const x = padX + (index * (width - padX * 2)) / (values.length - 1);
    const y = 28 + ((max - value) / range) * 130;
    return { x, y, value };
  });
  const line = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const area = `${line} L ${points.at(-1).x} ${height} L ${points[0].x} ${height} Z`;
  document.querySelector("[data-chart-line]").setAttribute("d", line);
  document.querySelector("[data-chart-area]").setAttribute("d", area);
  document.querySelector("[data-chart-points]").innerHTML = points
    .map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4"></circle><text x="${point.x - 18}" y="${point.y - 14}">${point.value}</text>`)
    .join("");
}

function handleReportTabsClick(event) {
  const menuButton = event.target.closest(".tab-more, .report-menu header [data-report-menu]");
  if (menuButton) {
    event.preventDefault();
    event.stopPropagation();
    reportMenuOpen = !reportMenuOpen;
    renderReportTabs();
    return;
  }

  if (event.target.closest("[data-report-menu-close]")) {
    event.preventDefault();
    event.stopPropagation();
    reportMenuOpen = false;
    renderReportTabs();
    return;
  }

  const option = event.target.closest("[data-report-option]");
  if (option) {
    event.preventDefault();
    event.stopPropagation();
    activeTab = option.dataset.reportOption;
    reportMenuOpen = false;
    renderTab();
    return;
  }

  const button = event.target.closest("[data-visible-report]");
  if (button) {
    event.preventDefault();
    event.stopPropagation();
    activeTab = button.dataset.visibleReport;
    reportMenuOpen = false;
    renderTab();
  }
}

document.addEventListener("click", handleReportTabsClick, true);

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-user-toggle]")) {
    userPopoverOpen = !userPopoverOpen;
    syncUserPopover();
    return;
  }

  if (event.target.closest("[data-user-close]")) {
    userPopoverOpen = false;
    syncUserPopover();
    return;
  }

  if (userPopoverOpen && !event.target.closest("[data-user-popover]")) {
    userPopoverOpen = false;
    syncUserPopover();
  }
});

tabContent.addEventListener("click", (event) => {
  const card = event.target.closest("[data-card-index]");
  if (card) {
    openModal(card.dataset.cardSource, card.dataset.cardIndex);
    return;
  }

  const segmentModeButton = event.target.closest("[data-segment-mode]");
  if (segmentModeButton) {
    compositionSegmentMode = segmentModeButton.dataset.segmentMode;
    compositionSelectedSegmentKey = "left-arm";
    renderComposition();
    return;
  }

  const segmentFocusCard = event.target.closest("[data-segment-focus]");
  if (segmentFocusCard) {
    compositionSelectedSegmentKey = segmentFocusCard.dataset.segmentFocus;
    renderComposition();
    return;
  }

  const postureInfo = event.target.closest("[data-posture-info]");
  if (postureInfo) {
    selectedPostureIndex = Number(postureInfo.dataset.postureInfo);
    setPostureView(resolvePostureFocusView(postureIssues[selectedPostureIndex]));
    postureDetailOpen = true;
    postureDetailTab = "overview";
    postureDefinitionOpen = false;
    postureListNeedsAlign = true;
    renderPosture();
    return;
  }

  const issue = event.target.closest("[data-posture-index]");
  if (issue) {
    selectedPostureIndex = Number(issue.dataset.postureIndex);
    setPostureView(resolvePostureFocusView(postureIssues[selectedPostureIndex]));
    const wasDetailOpen = postureDetailOpen;
    postureDetailOpen = false;
    postureListNeedsAlign = true;
    if (wasDetailOpen) {
      renderPosture();
    } else {
      refreshPostureSelection({ alignList: true });
      postureListNeedsAlign = false;
    }
    return;
  }

  const postureViewButton = event.target.closest("[data-posture-view]");
  if (postureViewButton) {
    setPostureView(postureViewButton.dataset.postureView);
    postureFilter = postureView;
    const firstVisible = postureIssues.findIndex((item) => postureSupportsView(item, postureView));
    if (firstVisible >= 0) selectedPostureIndex = firstVisible;
    postureDetailOpen = false;
    postureListNeedsAlign = true;
    tabContent.querySelectorAll("[data-posture-view], [data-posture-filter]").forEach((button) => {
      const value = button.dataset.postureView || button.dataset.postureFilter;
      button.classList.toggle("is-active", value === postureFilter);
    });
    refreshPostureSelection({ alignList: true });
    return;
  }

  const postureFilterButton = event.target.closest("[data-posture-filter]");
  if (postureFilterButton) {
    postureFilter = postureFilterButton.dataset.postureFilter;
    if (postureFilter === "all") {
      setPostureView("front");
    } else {
      setPostureView(postureFilter);
      const firstVisible = getVisiblePostureIssues(postureFilter)[0];
      if (firstVisible) selectedPostureIndex = postureIssues.indexOf(firstVisible);
    }
    postureDetailOpen = false;
    postureListNeedsAlign = true;
    tabContent.querySelectorAll("[data-posture-filter]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.postureFilter === postureFilter);
    });
    refreshPostureSelection({ alignList: true });
    return;
  }

  const viewStep = event.target.closest("[data-view-step]");
  if (viewStep) {
    advancePostureView(Number(viewStep.dataset.viewStep));
    if (postureFilter !== "all") {
      postureFilter = postureView;
      const firstVisible = getVisiblePostureIssues(postureFilter)[0];
      if (firstVisible) selectedPostureIndex = postureIssues.indexOf(firstVisible);
      refreshPostureListSelection({ alignList: true });
      tabContent.querySelectorAll("[data-posture-filter]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.postureFilter === postureFilter);
      });
    }
    updatePostureStageAria();
    syncPostureViewerState();
    return;
  }

  if (event.target.closest("[data-toggle-posture-list]")) {
    postureListOpen = !postureListOpen;
    renderPosture();
    return;
  }

  const openGirthDateMenu = tabContent.querySelector("[data-girth-date-menu].is-open");
  if (openGirthDateMenu && !event.target.closest("[data-girth-date-menu]") && !event.target.closest("[data-girth-date-toggle]")) {
    openGirthDateMenu.classList.remove("is-open");
  }

  if (event.target.closest("[data-hotspot]")) {
    selectedPostureIndex = (selectedPostureIndex + 1) % postureIssues.length;
    renderPosture();
    return;
  }

  if (event.target.closest("[data-close-posture-detail]")) {
    postureDetailOpen = false;
    renderPosture();
    return;
  }

  if (event.target.closest("[data-posture-definition-toggle]")) {
    const button = tabContent.querySelector("[data-posture-definition-toggle]");
    button?.classList.add("is-pressed");
    setTimeout(() => button?.classList.remove("is-pressed"), 180);
    return;
  }

  const postureDetailStep = event.target.closest("[data-posture-detail-step]");
  if (postureDetailStep) {
    const visibleIssues = getVisiblePostureIssues();
    const currentVisibleIndex = visibleIssues.findIndex((item) => item.id === postureIssues[selectedPostureIndex]?.id);
    const nextVisibleIndex = currentVisibleIndex >= 0
      ? (currentVisibleIndex + Number(postureDetailStep.dataset.postureDetailStep) + visibleIssues.length) % visibleIssues.length
      : 0;
    selectedPostureIndex = postureIssues.indexOf(visibleIssues[nextVisibleIndex]);
    setPostureView(resolvePostureFocusView(postureIssues[selectedPostureIndex]));
    postureDetailOpen = true;
    postureDefinitionOpen = false;
    postureListNeedsAlign = true;
    renderPosture();
    return;
  }

  const girthIndex = event.target.closest("[data-girth-index], [data-girth-line]");
  if (girthIndex) {
    selectedGirthIndex = Number(girthIndex.dataset.girthIndex ?? girthIndex.dataset.girthLine);
    if (girthScreen === "overview" && !girthTrendOverlayOpen) {
      girthView = resolveGirthFocusView(selectedGirthIndex, girthView);
      refreshGirthOverviewSelection();
    } else {
      girthCompareView = resolveGirthFocusView(selectedGirthIndex, girthCompareView);
      renderGirth();
    }
    return;
  }

  const girthTrendOpen = event.target.closest("[data-girth-trend-open]");
  if (girthTrendOpen) {
    openGirthTrend(Number(girthTrendOpen.dataset.girthTrendOpen));
    return;
  }

  if (event.target.closest("[data-girth-trend-close]")) {
    girthTrendOverlayOpen = false;
    renderGirth();
    return;
  }

  const girthTrendStep = event.target.closest("[data-girth-trend-step]");
  if (girthTrendStep) {
    selectedGirthIndex = Number(girthTrendStep.dataset.girthTrendStep);
    girthTrendOverlayOpen = true;
    if (girthScreen === "compare") {
      girthCompareView = resolveGirthFocusView(selectedGirthIndex, girthCompareView);
    } else {
      girthView = resolveGirthFocusView(selectedGirthIndex, girthView);
    }
    renderGirth();
    return;
  }

  const girthViewStep = event.target.closest("[data-girth-view-step]");
  if (girthViewStep) {
    advanceGirthView(Number(girthViewStep.dataset.girthViewStep));
    return;
  }

  const girthViewButton = event.target.closest("[data-girth-view]");
  if (girthViewButton) {
    setGirthView(girthViewButton.dataset.girthView);
    return;
  }

  if (event.target.closest("[data-girth-compare]")) {
    girthTrendOverlayOpen = false;
    girthScreen = girthScreen === "compare" ? "overview" : "compare";
    renderGirth();
    return;
  }

  const girthSegmentButton = event.target.closest("[data-girth-segment]");
  if (girthSegmentButton) {
    girthSegment = girthSegmentButton.dataset.girthSegment;
    if (girthScreen === "overview" && !girthTrendOverlayOpen) {
      const filteredItems = getVisibleGirthItems();
      if (!filteredItems.some((item) => girthItems.indexOf(item) === selectedGirthIndex)) {
        selectedGirthIndex = girthItems.indexOf(filteredItems[0] || girthItems[0]);
      }
      girthView = resolveGirthFocusView(selectedGirthIndex, girthView);
      tabContent.querySelectorAll("[data-girth-segment]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.girthSegment === girthSegment);
      });
      const cards = tabContent.querySelector(".girth-cards");
      if (cards) {
        cards.innerHTML = filteredItems.map((item) => girthDataCard(item, girthItems.indexOf(item))).join("");
      }
      refreshGirthOverviewSelection();
    } else {
      const filteredItems = getVisibleGirthItems();
      if (!filteredItems.some((item) => girthItems.indexOf(item) === selectedGirthIndex)) {
        selectedGirthIndex = girthItems.indexOf(filteredItems[0] || girthItems[0]);
      }
      girthCompareView = resolveGirthFocusView(selectedGirthIndex, girthCompareView);
      renderGirth();
    }
    return;
  }

  if (event.target.closest("[data-girth-date-toggle]")) {
    const menu = tabContent.querySelector("[data-girth-date-menu]");
    if (menu) menu.classList.toggle("is-open");
    return;
  }

  const girthDateOption = event.target.closest("[data-girth-date-value]");
  if (girthDateOption) {
    girthCompareIndex = girthHistoryDates.indexOf(girthDateOption.dataset.girthDateValue);
    renderGirth();
    return;
  }

  const girthCompareStep = event.target.closest("[data-girth-compare-step]");
  if (girthCompareStep) {
    const visibleItems = girthItems;
    const currentIndex = Math.max(0, visibleItems.findIndex((item) => item.id === girthItems[selectedGirthIndex].id));
    const step = Number(girthCompareStep.dataset.girthCompareStep || 0);
    const nextIndex = (currentIndex + step + visibleItems.length) % visibleItems.length;
    selectedGirthIndex = girthItems.indexOf(visibleItems[nextIndex]);
    refreshGirthCompareSelection();
    return;
  }

  const shoulderModeButton = event.target.closest("[data-shoulder-mode]");
  if (shoulderModeButton) {
    shoulderMode = shoulderModeButton.dataset.shoulderMode;
    selectedShoulderSide = "left";
    renderShoulder();
    return;
  }

  const shoulderSideButton = event.target.closest("[data-shoulder-side]");
  if (shoulderSideButton) {
    selectedShoulderSide = shoulderSideButton.dataset.shoulderSide;
    renderShoulder();
    return;
  }

  if (event.target.closest("[data-shoulder-history]")) {
    shoulderHistoryOpen = !shoulderHistoryOpen;
    renderShoulder();
    return;
  }

  if (event.target.closest("[data-shoulder-history-close]")) {
    shoulderHistoryOpen = false;
    renderShoulder();
    return;
  }

  if (event.target.closest("[data-shoulder-collapse]")) {
    shoulderConclusionOpen = !shoulderConclusionOpen;
    renderShoulder();
    return;
  }

  const shoulderRangeOpenButton = event.target.closest("[data-shoulder-range-open]");
  if (shoulderRangeOpenButton) {
    shoulderRangeOverlayMode = shoulderRangeOpenButton.dataset.shoulderRangeOpen;
    renderShoulder();
    return;
  }

  if (event.target.matches("[data-shoulder-range-close]") || event.target.closest("[data-shoulder-range-close]")) {
    shoulderRangeOverlayMode = null;
    renderShoulder();
    return;
  }

});

function syncStaticScoreCard() {
  const staticScoreCard = document.querySelector(".score-card");
  if (!staticScoreCard) return;
  staticScoreCard.hidden = activeTab !== "composition";
  const dateToggle = staticScoreCard.querySelector("[data-composition-date-toggle]");
  const changeNode = staticScoreCard.querySelector("[data-composition-score-change]");
  if (dateToggle) dateToggle.textContent = `${compositionCompareDateLabel().replace(/-/g, ".").replace(" ", " ")}⌄`;
  if (changeNode) changeNode.textContent = compositionScoreChangeText();
  staticScoreCard.querySelectorAll("[data-composition-date-value]").forEach((button) => {
    button.classList.toggle("is-selected", Number(button.dataset.compositionDateValue) === compositionCompareIndex);
  });
}

document.querySelectorAll("[data-close-modal]").forEach((node) => {
  node.addEventListener("click", () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  });
});

document.querySelector("[data-prev-card]").addEventListener("click", () => {
  activeMetricIndex = (activeMetricIndex - 1 + modalItems.length) % modalItems.length;
  updateModal(modalItems[activeMetricIndex]);
});

document.querySelector("[data-next-card]").addEventListener("click", () => {
  activeMetricIndex = (activeMetricIndex + 1) % modalItems.length;
  updateModal(modalItems[activeMetricIndex]);
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-composition-date-toggle]")) {
    document.querySelector("[data-composition-date-menu]")?.classList.toggle("is-open");
    return;
  }

  const compositionDateOption = event.target.closest("[data-composition-date-value]");
  if (compositionDateOption) {
    compositionCompareIndex = Number(compositionDateOption.dataset.compositionDateValue);
    document.querySelector("[data-composition-date-menu]")?.classList.remove("is-open");
    syncStaticScoreCard();
    if (activeTab === "composition") renderComposition();
    return;
  }

  const openCompositionDateMenu = document.querySelector("[data-composition-date-menu].is-open");
  if (openCompositionDateMenu && !event.target.closest("[data-composition-date-menu]")) {
    openCompositionDateMenu.classList.remove("is-open");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    reportMenuOpen = false;
    renderReportTabs();
    userPopoverOpen = false;
    syncUserPopover();
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }
});

document.addEventListener("click", (event) => {
  if (!reportMenuOpen || event.target.closest("#reportTabs")) return;
  reportMenuOpen = false;
  renderReportTabs();
});

window.addEventListener("resize", syncOverlayFrames);
window.addEventListener("scroll", syncOverlayFrames, { passive: true });

renderTab();
syncStaticScoreCard();
syncOverlayFrames();
