const normalColor = "normal";
const abnormalColor = "abnormal";
const midlineColor = "midline";
const SIDE_MIDLINE_X = { left: 0.6, right: 0.4 };

const surfacePoint = (region, yBand = 0.1, extra = {}) => ({ region, yBand, ...extra });
const surfaceLocator = (region, yBand, locator, extra = {}) => surfacePoint(region, yBand, { locator, ...extra });
const pointRef = (point, extra = {}) => ({ point, ...extra });
const line3d = (id, from, to, colorType, dashed = false) => ({ id, from, to, colorType, dashed });

export const postureAnnotations = [
  {
    id: "head-forward",
    name: "头前引",
    value: "0.4",
    unit: "cm",
    status: "轻度",
    severity: "mild",
    view: "right",
    resultText: "存在头前引倾向",
    riskText: "头前引常与久坐、低头看屏幕相关，容易让颈肩区域长期紧张。",
    advice: ["下巴回收训练", "胸椎伸展", "屏幕抬高至视线平齐"],
    definitionText: "耳朵与人体重力线之间的垂直距离",
    normalRange: "≤ 0.2 cm",
    sourceRows: [2, 3, 4],
    viewRule: "侧视图展示。单侧取值时显示该侧；双侧取平均时，同值取右侧，不同值取与最终结果一致的一侧，若两侧与最终结果都一致则取右侧。",
    illustrations: {
      normal: "./assets/posture/体态配图/头前引-正常.svg",
      abnormal: "./assets/posture/体态配图/头前引-异常.svg",
    },
    points: [
      { id: "ear", name: "右耳耳窝", definition: "右耳耳窝位置", x: 38, y: 21, colorType: normalColor },
    ],
    lines: [
      { id: "ear-offset", from: "ear", toCoord: { x: 55, y: 21 }, colorType: abnormalColor },
    ],
    dashedLines: [
      { id: "gravity-line", fromCoord: { x: 55, y: 9 }, toCoord: { x: 55, y: 92 }, colorType: midlineColor },
    ],
    labels: [
      { id: "result", text: "头前引", x: 60, y: 25, tone: "abnormal", align: "left" },
    ],
    posture3d: {
      points: {
        ear: surfaceLocator(
          { x: [0.34, 0.56], z: [0.08, 0.3] },
          0.05,
          { strategy: "extrema", topN: 84, prefer: [["projectedY", "asc"], ["projectedX", "asc"]] }
        ),
        "gravity-ankle": surfacePoint({ x: [0.34, 0.68], z: [0, 0.62] }, 0.08, {
          hidden: true,
          target: { x: 42, y: 86 },
        }),
      },
      lines: [
        line3d(
          "ear-offset",
          pointRef("ear"),
          pointRef("gravity-ankle", { xRatio: SIDE_MIDLINE_X.right, zOffset: -0.04, matchYOf: "ear" }),
          abnormalColor,
          true
        ),
        line3d(
          "gravity-line",
          pointRef("gravity-ankle", { xRatio: SIDE_MIDLINE_X.right, zOffset: -0.04, yRatio: 0.9 }),
          pointRef("gravity-ankle", { xRatio: SIDE_MIDLINE_X.right, zOffset: -0.04, yRatio: 0.08 }),
          midlineColor,
          false
        ),
      ],
      labelAnchor: { type: "point", point: "ear", zOffset: -0.15, align: "left", placement: "side", gutter: 22 },
    },
  },
  {
    id: "head-tilt",
    name: "头侧歪",
    value: "-0.5",
    unit: "°",
    status: "异常",
    severity: "abnormal",
    view: "front",
    resultText: "存在明显头侧歪倾向（偏左）",
    riskText: "头侧歪可能引发单侧颈部不适，以及神经压迫的手臂发麻无力等症状。",
    advice: ["颈部拉伸训练", "加强深层颈部肌肉平衡", "避免长时间低头姿势"],
    definitionText: "左右耳朵的连线与水平线之间的角度",
    normalRange: "[-0.1°, 0.1°]",
    sourceRows: [5, 6, 7, 8, 9],
    viewRule: "正视图展示左右耳朵点及耳朵连线。",
    illustrations: {
      normal: "./assets/posture/体态配图/头侧歪-正常.svg",
      abnormal: "./assets/posture/体态配图/头侧歪-偏左.svg",
    },
    points: [
      { id: "left-ear", name: "左耳耳窝", definition: "左耳耳窝位置", x: 39, y: 18, colorType: normalColor },
      { id: "right-ear", name: "右耳耳窝", definition: "右耳耳窝位置", x: 61, y: 18, colorType: normalColor },
    ],
    lines: [
      { id: "ear-line", from: "left-ear", to: "right-ear", colorType: abnormalColor },
    ],
    dashedLines: [],
    labels: [
      { id: "result", text: "头侧歪", x: 67, y: 20.5, tone: "abnormal", align: "left" },
    ],
    posture3d: {
      points: {
        "left-ear": surfaceLocator(
          { x: [0.23, 0.41], z: [0.74, 1] },
          0.05,
          { strategy: "extrema", topN: 96, prefer: [["projectedX", "asc"], ["projectedY", "asc"]] }
        ),
        "right-ear": surfaceLocator(
          { x: [0.59, 0.77], z: [0.74, 1] },
          0.05,
          { strategy: "extrema", topN: 96, prefer: [["projectedX", "desc"], ["projectedY", "asc"]] }
        ),
      },
      lines: [
        line3d("ear-line", pointRef("left-ear"), pointRef("right-ear"), abnormalColor, true),
      ],
      labelAnchor: { type: "point", point: "right-ear", xOffset: 0.06, align: "left" },
    },
  },
  {
    id: "shoulder-level",
    name: "高低肩",
    value: "0.4",
    unit: "°",
    status: "正常",
    severity: "normal",
    view: "back",
    resultText: "正常",
    riskText: "此项评估项目无异常",
    advice: ["保持双肩放松", "训练后进行肩颈拉伸", "定期复测观察趋势"],
    definitionText: "两侧颈根与肩峰连线的差值",
    normalRange: "[-0.5°, 0.5°]",
    sourceRows: [10, 11, 12, 13, 14],
    viewRule: "正视图、顶视图、后视图均可打点；模型画线以背面展示左右颈根到肩峰连线。",
    illustrations: {
      normal: "./assets/posture/体态配图/高低肩-正常.svg",
      abnormal: "./assets/posture/体态配图/高低肩-左高.svg",
    },
    points: [
      { id: "left-neck-root", name: "左颈根", definition: "颈部下方曲率最大的点", x: 45, y: 24, colorType: normalColor },
      { id: "right-neck-root", name: "右颈根", definition: "颈部下方曲率最大的点", x: 55, y: 24, colorType: normalColor },
      { id: "left-acromion", name: "左肩峰", definition: "肩部最外缘、弯曲最大的点", x: 35, y: 30, colorType: normalColor },
      { id: "right-acromion", name: "右肩峰", definition: "肩部最外缘、弯曲最大的点", x: 65, y: 30, colorType: normalColor },
    ],
    lines: [
      { id: "left-neck-to-shoulder", from: "left-neck-root", to: "left-acromion", colorType: normalColor },
      { id: "right-neck-to-shoulder", from: "right-neck-root", to: "right-acromion", colorType: normalColor },
    ],
    dashedLines: [
      { id: "shoulder-reference", fromCoord: { x: 35, y: 30 }, toCoord: { x: 65, y: 30 }, colorType: normalColor },
    ],
    labels: [
      { id: "result", text: "高低肩正常", x: 50, y: 20, tone: "normal", align: "center" },
    ],
    posture3d: {
      points: {
        "left-neck-root": surfaceLocator(
          { x: [0.39, 0.48], z: [0.04, 0.22] },
          0.05,
          { strategy: "extrema", topN: 84, prefer: [["projectedX", "asc"], ["projectedY", "asc"]] }
        ),
        "right-neck-root": surfaceLocator(
          { x: [0.52, 0.61], z: [0.04, 0.22] },
          0.05,
          { strategy: "extrema", topN: 84, prefer: [["projectedX", "desc"], ["projectedY", "asc"]] }
        ),
        "left-acromion": surfaceLocator(
          { x: [0.11, 0.3], z: [0.04, 0.28] },
          0.05,
          { strategy: "extrema", topN: 96, prefer: [["projectedX", "asc"], ["projectedY", "asc"]] }
        ),
        "right-acromion": surfaceLocator(
          { x: [0.7, 0.89], z: [0.04, 0.28] },
          0.05,
          { strategy: "extrema", topN: 96, prefer: [["projectedX", "desc"], ["projectedY", "asc"]] }
        ),
      },
      lines: [
        line3d("left-neck-to-shoulder", pointRef("left-neck-root"), pointRef("left-acromion"), normalColor, true),
        line3d("right-neck-to-shoulder", pointRef("right-neck-root"), pointRef("right-acromion"), normalColor, true),
        line3d("shoulder-reference", pointRef("left-acromion"), pointRef("right-acromion"), normalColor, false),
      ],
      labelAnchor: { type: "midpoint", from: "left-neck-root", to: "right-neck-root", xOffset: 0.08, yOffset: -0.02, align: "left", placement: "side", gutter: 22 },
    },
  },
  {
    id: "left-rounded-shoulder",
    name: "左圆肩",
    value: "0.9",
    unit: "cm",
    status: "异常",
    severity: "abnormal",
    view: "left",
    resultText: "存在明显左圆肩倾向",
    riskText: "圆肩会改变肩胛位置，影响肩颈稳定和上肢发力效率。",
    advice: ["胸小肌放松", "肩胛后缩训练", "减少单侧背包负重"],
    definitionText: "左肩峰位置与重力线的垂直距离",
    normalRange: "≤ 0.2 cm",
    sourceRows: [15, 16, 17],
    viewRule: "左视图展示左肩峰与左侧重力线之间的垂线，并显示左侧重力线。",
    illustrations: {
      normal: "./assets/posture/体态配图/左圆肩-正常.svg",
      abnormal: "./assets/posture/体态配图/左圆肩-异常.svg",
    },
    points: [
      { id: "acromion", name: "左肩峰", definition: "左肩膀最高峰位置", x: 51, y: 30, colorType: normalColor },
    ],
    lines: [
      { id: "left-shoulder-offset", from: "acromion", toCoord: { x: 58, y: 30 }, colorType: abnormalColor },
    ],
    dashedLines: [
      { id: "left-gravity-reference", fromCoord: { x: 58, y: 8 }, toCoord: { x: 58, y: 92 }, colorType: midlineColor },
    ],
    labels: [
      { id: "result", text: "左圆肩", x: 62, y: 25, tone: "abnormal", align: "left" },
    ],
    posture3d: {
      points: {
        acromion: surfaceLocator(
          { x: [0.14, 0.32], z: [0.72, 1] },
          0.05,
          { strategy: "extrema", topN: 84, prefer: [["projectedY", "asc"], ["projectedX", "asc"]] }
        ),
        "gravity-ankle": surfacePoint({ x: [0.34, 0.7], z: [0.38, 1] }, 0.08, {
          hidden: true,
          target: { x: 58, y: 86 },
        }),
      },
      lines: [
        line3d(
          "left-shoulder-offset",
          pointRef("acromion"),
          pointRef("gravity-ankle", { xRatio: SIDE_MIDLINE_X.left, zOffset: 0.04, matchYOf: "acromion" }),
          abnormalColor,
          true
        ),
        line3d(
          "left-gravity-reference",
          pointRef("gravity-ankle", { xRatio: SIDE_MIDLINE_X.left, zOffset: 0.04, yRatio: 0.92 }),
          pointRef("gravity-ankle", { xRatio: SIDE_MIDLINE_X.left, zOffset: 0.04, yRatio: 0.08 }),
          midlineColor,
          false
        ),
      ],
      labelAnchor: { type: "point", point: "acromion", zOffset: 0.18, align: "left" },
    },
  },
  {
    id: "right-rounded-shoulder",
    name: "右圆肩",
    value: "0.9",
    unit: "cm",
    status: "异常",
    severity: "abnormal",
    view: "right",
    resultText: "存在明显右圆肩倾向",
    riskText: "右圆肩提示肩部前移较明显，可能影响肩关节活动范围。",
    advice: ["肩外旋训练", "背部肌群激活", "调整办公坐姿"],
    definitionText: "右肩峰位置与重力线的垂直距离",
    normalRange: "≤ 0.2 cm",
    sourceRows: [18, 19, 20],
    viewRule: "右视图展示右肩峰与右侧重力线之间的垂线，并显示右侧重力线。",
    illustrations: {
      normal: "./assets/posture/体态配图/右圆肩-正常.svg",
      abnormal: "./assets/posture/体态配图/右圆肩-异常.svg",
    },
    points: [
      { id: "acromion", name: "右肩峰", definition: "右肩膀最高峰位置", x: 49, y: 30, colorType: normalColor },
    ],
    lines: [
      { id: "right-shoulder-offset", from: "acromion", toCoord: { x: 42, y: 30 }, colorType: abnormalColor },
    ],
    dashedLines: [
      { id: "right-gravity-reference", fromCoord: { x: 42, y: 8 }, toCoord: { x: 42, y: 92 }, colorType: midlineColor },
    ],
    labels: [
      { id: "result", text: "右圆肩", x: 38, y: 25, tone: "abnormal", align: "right" },
    ],
    posture3d: {
      points: {
        acromion: surfaceLocator(
          { x: [0.68, 0.86], z: [0, 0.28] },
          0.05,
          { strategy: "extrema", topN: 84, prefer: [["projectedY", "asc"], ["projectedX", "desc"]] }
        ),
        "gravity-ankle": surfacePoint({ x: [0.3, 0.66], z: [0, 0.62] }, 0.08, {
          hidden: true,
          target: { x: 42, y: 86 },
        }),
      },
      lines: [
        line3d(
          "right-shoulder-offset",
          pointRef("acromion"),
          pointRef("gravity-ankle", { xRatio: SIDE_MIDLINE_X.right, zOffset: -0.04, matchYOf: "acromion" }),
          abnormalColor,
          true
        ),
        line3d(
          "right-gravity-reference",
          pointRef("gravity-ankle", { xRatio: SIDE_MIDLINE_X.right, zOffset: -0.04, yRatio: 0.92 }),
          pointRef("gravity-ankle", { xRatio: SIDE_MIDLINE_X.right, zOffset: -0.04, yRatio: 0.08 }),
          midlineColor,
          false
        ),
      ],
      labelAnchor: { type: "point", point: "acromion", zOffset: -0.18, align: "right" },
    },
  },
  {
    id: "pelvic-shift",
    name: "骨盆前移",
    value: "4.3",
    unit: "cm",
    status: "轻度",
    severity: "mild",
    view: "left",
    resultText: "存在骨盆前移倾向",
    riskText: "骨盆前移会改变躯干重心，可能增加腰背压力。",
    advice: ["髋屈肌拉伸", "臀桥训练", "站立时保持骨盆中立位"],
    definitionText: "髋关节与人体重力线之间的垂直距离",
    normalRange: "≤ 4 cm",
    sourceRows: [21, 22, 23],
    viewRule: "侧视图展示。两侧平均取值；同值取右侧，不同值取与最终结果一致的一侧，若都一致则取右侧。",
    illustrations: {
      normal: "./assets/posture/体态配图/骨盆前移-正常.svg",
      abnormal: "./assets/posture/体态配图/骨盆前移-异常.svg",
    },
    points: [
      { id: "hip", name: "左髋关节", definition: "左髋关节位置", x: 46, y: 56, colorType: normalColor },
      { id: "ankle", name: "踝关节点", definition: "外踝和内踝之间的中间点", x: 58, y: 85, colorType: normalColor },
    ],
    lines: [
      { id: "pelvis-offset", from: "hip", toCoord: { x: 58, y: 56 }, colorType: abnormalColor },
    ],
    dashedLines: [
      { id: "gravity-line", fromCoord: { x: 58, y: 10 }, toCoord: { x: 58, y: 92 }, colorType: midlineColor },
      { id: "lower-limb-axis", from: "hip", to: "ankle", colorType: abnormalColor },
    ],
    labels: [
      { id: "result", text: "骨盆前移", x: 60, y: 51, tone: "abnormal", align: "left" },
    ],
    posture3d: {
      points: {
        hip: surfaceLocator(
          { x: [0.36, 0.52], z: [0.62, 0.96] },
          0.08,
          { strategy: "extrema", topN: 84, prefer: [["projectedX", "asc"], ["projectedY", "asc"]] }
        ),
        ankle: surfacePoint({ x: [0.42, 0.7], z: [0.46, 1] }, 0.08, { hidden: true }),
      },
      lines: [
        line3d(
          "pelvis-offset",
          pointRef("hip"),
          pointRef("ankle", { xRatio: SIDE_MIDLINE_X.left, zOffset: 0.04, matchYOf: "hip" }),
          abnormalColor,
          true
        ),
        line3d(
          "gravity-line",
          pointRef("ankle", { xRatio: SIDE_MIDLINE_X.left, zOffset: 0.04, yRatio: 0.9 }),
          pointRef("ankle", { xRatio: SIDE_MIDLINE_X.left, zOffset: 0.04, yRatio: 0.08 }),
          midlineColor,
          false
        ),
        line3d("lower-limb-axis", pointRef("hip"), pointRef("ankle"), abnormalColor, true),
      ],
      labelAnchor: { type: "point", point: "hip", zOffset: 0.2, align: "left" },
    },
  },
  {
    id: "left-knee-evaluation",
    name: "左膝评估",
    value: "185",
    unit: "°",
    status: "轻度",
    severity: "mild",
    view: "left",
    resultText: "存在左膝超伸倾向",
    riskText: "膝超伸会让膝关节后侧压力增加，运动时需要注意控制关节锁死。",
    advice: ["股四头肌控制训练", "小腿后侧放松", "站立时微屈膝"],
    definitionText: "矢状面上，左髋关节、左膝关节与左踝关节中点形成的夹角关系",
    normalRange: "[175°, 183°]",
    sourceRows: [48, 49, 50, 51, 52],
    viewRule: "左视图展示左髋关节、左膝关节、左踝关节中点及两条连线。",
    illustrations: {
      normal: "./assets/posture/体态配图/左膝评估-正常.svg",
      abnormal: "./assets/posture/体态配图/左膝评估-超伸.svg",
    },
    points: [
      { id: "hip", name: "左髋关节", definition: "左髋关节位置", x: 47, y: 56, colorType: normalColor },
      { id: "knee-below", name: "左膝关节", definition: "左膝关节位置", x: 51, y: 74, colorType: normalColor },
      { id: "ankle", name: "左踝关节中点", definition: "左外脚踝和内脚踝的中点", x: 54, y: 86, colorType: normalColor },
    ],
    lines: [
      { id: "hip-to-knee", from: "hip", to: "knee-below", colorType: abnormalColor },
      { id: "knee-to-ankle", from: "knee-below", to: "ankle", colorType: abnormalColor },
    ],
    dashedLines: [],
    labels: [
      { id: "result", text: "左膝超伸", x: 60, y: 71, tone: "abnormal", align: "left" },
    ],
    posture3d: {
      points: {
        hip: surfaceLocator(
          { x: [0.34, 0.48], z: [0.72, 1] },
          0.07,
          { strategy: "extrema", topN: 84, prefer: [["projectedX", "asc"], ["projectedY", "asc"]] }
        ),
        "knee-below": surfaceLocator(
          { x: [0.4, 0.54], z: [0.72, 1] },
          0.07,
          { strategy: "extrema", topN: 72, prefer: [["projectedX", "asc"], ["projectedY", "asc"]] }
        ),
        ankle: surfaceLocator(
          { x: [0.46, 0.62], z: [0.76, 1] },
          0.06,
          { strategy: "extrema", topN: 72, prefer: [["projectedY", "desc"], ["projectedX", "asc"]] }
        ),
      },
      lines: [
        line3d("hip-to-knee", pointRef("hip"), pointRef("knee-below"), abnormalColor, true),
        line3d("knee-to-ankle", pointRef("knee-below"), pointRef("ankle"), abnormalColor, true),
      ],
      labelAnchor: { type: "point", point: "knee-below", zOffset: 0.16, align: "left" },
    },
  },
  {
    id: "right-knee-evaluation",
    name: "右膝评估",
    value: "174",
    unit: "°",
    status: "异常",
    severity: "abnormal",
    view: "right",
    resultText: "存在明显右膝前屈倾向",
    riskText: "右膝前屈可能与下肢力量分布和髋膝踝对线有关。",
    advice: ["靠墙静蹲", "髋膝踝对线训练", "避免长时间单侧支撑"],
    definitionText: "矢状面上，右髋关节、右膝关节与右踝关节中点形成的夹角关系",
    normalRange: "[175°, 183°]",
    sourceRows: [43, 44, 45, 46, 47],
    viewRule: "右视图展示右髋关节、右膝关节、右踝关节中点及两条连线。",
    illustrations: {
      normal: "./assets/posture/体态配图/右膝评估-正常.svg",
      abnormal: "./assets/posture/体态配图/右膝评估-前屈.svg",
    },
    points: [
      { id: "hip", name: "右髋关节", definition: "右髋关节位置", x: 53, y: 56, colorType: normalColor },
      { id: "knee-below", name: "右膝关节", definition: "右膝关节位置", x: 49, y: 74, colorType: normalColor },
      { id: "ankle", name: "右踝关节中点", definition: "右外脚踝和内脚踝的中点", x: 46, y: 86, colorType: normalColor },
    ],
    lines: [
      { id: "hip-to-knee", from: "hip", to: "knee-below", colorType: abnormalColor },
      { id: "knee-to-ankle", from: "knee-below", to: "ankle", colorType: abnormalColor },
    ],
    dashedLines: [],
    labels: [
      { id: "result", text: "右膝前屈", x: 40, y: 71, tone: "abnormal", align: "right" },
    ],
    posture3d: {
      points: {
        hip: surfaceLocator(
          { x: [0.52, 0.66], z: [0, 0.28] },
          0.07,
          { strategy: "extrema", topN: 84, prefer: [["projectedX", "desc"], ["projectedY", "asc"]] }
        ),
        "knee-below": surfaceLocator(
          { x: [0.46, 0.6], z: [0, 0.28] },
          0.07,
          { strategy: "extrema", topN: 72, prefer: [["projectedX", "desc"], ["projectedY", "asc"]] }
        ),
        ankle: surfaceLocator(
          { x: [0.38, 0.54], z: [0, 0.24] },
          0.06,
          { strategy: "extrema", topN: 72, prefer: [["projectedY", "desc"], ["projectedX", "desc"]] }
        ),
      },
      lines: [
        line3d("hip-to-knee", pointRef("hip"), pointRef("knee-below"), abnormalColor, true),
        line3d("knee-to-ankle", pointRef("knee-below"), pointRef("ankle"), abnormalColor, true),
      ],
      labelAnchor: { type: "point", point: "knee-below", zOffset: -0.16, align: "right" },
    },
  },
  {
    id: "leg-shape",
    name: "腿型",
    value: "181.5",
    unit: "°",
    subValue: "右腿 181.6°",
    status: "异常",
    severity: "abnormal",
    view: "front",
    resultText: "存在明显O型腿倾向",
    riskText: "腿型偏差会影响下肢力线，长期可能增加膝踝负担。",
    advice: ["臀中肌训练", "足弓稳定训练", "避免膝盖外翻或内扣"],
    definitionText: "冠状面上，左右髋关节、膝关节以及踝关节之间的夹角组合结果",
    normalRange: "左右两侧均处于正常区间",
    sourceRows: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
    viewRule: "正视图展示左右髋关节、膝关节、踝关节及双侧下肢力线；最终腿型由左右腿型组合规则决定。",
    illustrations: {
      normal: "./assets/posture/体态配图/腿型-正常.svg",
      abnormal: "./assets/posture/体态配图/腿型-O型腿.svg",
    },
    points: [
      { id: "left-hip", name: "左髋关节", definition: "左髋关节位置", x: 41, y: 57, colorType: normalColor },
      { id: "left-knee", name: "左膝关节", definition: "左膝关节位置", x: 39.5, y: 74, colorType: normalColor },
      { id: "left-ankle", name: "左踝关节中点", definition: "左外脚踝和内脚踝的中点", x: 36.5, y: 88, colorType: normalColor },
      { id: "right-hip", name: "右髋关节", definition: "右髋关节位置", x: 59, y: 57, colorType: normalColor },
      { id: "right-knee", name: "右膝关节", definition: "右膝关节位置", x: 60.5, y: 74, colorType: normalColor },
      { id: "right-ankle", name: "右踝关节中点", definition: "右外脚踝和内脚踝的中点", x: 63.5, y: 88, colorType: normalColor },
    ],
    lines: [
      { id: "left-hip-to-knee", from: "left-hip", to: "left-knee", colorType: abnormalColor },
      { id: "left-knee-to-ankle", from: "left-knee", to: "left-ankle", colorType: abnormalColor },
      { id: "right-hip-to-knee", from: "right-hip", to: "right-knee", colorType: abnormalColor },
      { id: "right-knee-to-ankle", from: "right-knee", to: "right-ankle", colorType: abnormalColor },
    ],
    dashedLines: [],
    labels: [
      { id: "left-angle", text: "左腿 181.5°", x: 30, y: 79, tone: "normal", align: "right" },
      { id: "right-angle", text: "右腿 181.6°", x: 70, y: 79, tone: "normal", align: "left" },
      { id: "result", text: "腿型", x: 50, y: 92, tone: "abnormal", align: "center" },
    ],
    posture3d: {
      points: {
        "left-hip": surfaceLocator(
          { x: [0.34, 0.45], z: [0.7, 1] },
          0.07,
          { strategy: "extrema", topN: 72, prefer: [["projectedX", "asc"], ["projectedY", "asc"]] }
        ),
        "left-knee": surfaceLocator(
          { x: [0.31, 0.43], z: [0.68, 1] },
          0.07,
          { strategy: "extrema", topN: 72, prefer: [["projectedX", "asc"], ["projectedY", "asc"]] }
        ),
        "left-ankle": surfaceLocator(
          { x: [0.28, 0.41], z: [0.64, 1] },
          0.06,
          { strategy: "extrema", topN: 72, prefer: [["projectedY", "desc"], ["projectedX", "asc"]] }
        ),
        "right-hip": surfaceLocator(
          { x: [0.55, 0.67], z: [0.7, 1] },
          0.07,
          { strategy: "extrema", topN: 72, prefer: [["projectedX", "desc"], ["projectedY", "asc"]] }
        ),
        "right-knee": surfaceLocator(
          { x: [0.57, 0.69], z: [0.68, 1] },
          0.07,
          { strategy: "extrema", topN: 72, prefer: [["projectedX", "desc"], ["projectedY", "asc"]] }
        ),
        "right-ankle": surfaceLocator(
          { x: [0.59, 0.72], z: [0.64, 1] },
          0.06,
          { strategy: "extrema", topN: 72, prefer: [["projectedY", "desc"], ["projectedX", "desc"]] }
        ),
      },
      lines: [
        line3d("left-hip-to-knee", pointRef("left-hip"), pointRef("left-knee"), abnormalColor, true),
        line3d("left-knee-to-ankle", pointRef("left-knee"), pointRef("left-ankle"), abnormalColor, true),
        line3d("right-hip-to-knee", pointRef("right-hip"), pointRef("right-knee"), abnormalColor, true),
        line3d("right-knee-to-ankle", pointRef("right-knee"), pointRef("right-ankle"), abnormalColor, true),
      ],
      labelAnchor: { type: "midpoint", from: "left-ankle", to: "right-ankle", xOffset: 0.1, yOffset: -0.02, align: "left", placement: "side", gutter: 22 },
    },
  },
];

export const postureAnnotationMap = Object.fromEntries(postureAnnotations.map((item) => [item.name, item]));
