const barDb = {
  "#3": 9.5,
  "#4": 12.7,
  "#5": 15.9,
  "#6": 19.1,
  "#7": 22.2,
  "#8": 25.4,
  "#9": 28.7,
  "#10": 32.3,
  "#11": 35.8
};

const barColors = {
  "#3": "#1f8f5f",
  "#4": "#2368a6",
  "#5": "#b87508",
  "#6": "#6650a4",
  "#7": "#7b5d39",
  "#8": "#c93434",
  "#9": "#0f766e",
  "#10": "#32485d",
  "#11": "#111827"
};

const standardA1 = {
  "#3": 15,
  "#4": 20,
  "#5": 25,
  "#6": 30,
  "#7": 35,
  "#8": 40,
  "#9": 50,
  "#10": 55,
  "#11": 60
};

const defaults = {
  component: "beam",
  theme: "light",
  params: {
    fc: 28,
    fy: 420,
    rounding: 5,
    topFactor: 1.3,
    ldFactor: 38,
    classBFactor: 1.3,
    spliceMode: "each",
    floorWarning: 5,
    formula: {
      alpha: 1.3,
      beta: 1.0,
      gamma: 1.0,
      lambda: 1.0,
      ldhMultiplier: 0.24,
      weightFormula: "0.006165 * d^2"
    },
    activeLapProfile: "default",
    lapProfiles: {
      default: { name: "系統預設 (規範公式)", data: {} }
    }
  },
  beam: {
    code: "B1",
    span: 620,
    width: 35,
    depth: 70,
    cover: 4,
    barNo: "#8",
    topBarsLeft: 5,
    topBarsMid: 3,
    topBarsRight: 5,
    topExtraCutoffRatio: 0.3,
    bottomBars: 4,
    stirrupNo: "#4",
    stirrupSpacingDense: 10,
    stirrupSpacingNormal: 20,
    lapClass: "B",
    lapRatio: 0.5
  },
  column: {
    code: "C1",
    storyHeight: 360,
    width: 70,
    depth: 70,
    cover: 4,
    barNo: "#8",
    mainBars: 12,
    tieNo: "#4",
    tieSpacing: 15,
    lapClass: "B",
    lapRatio: 0.5,
    offset: 8
  },
  wall: {
    code: "W1/S1",
    length: 520,
    height: 320,
    thickness: 20,
    cover: 3,
    barNo: "#5",
    spacing: 15,
    direction: "X",
    lapClass: "A",
    lapRatio: 0.42,
    openingWidth: 110,
    openingHeight: 90
  },
  beamBench: {
    sequence: ["C1", "B2", "C2"],
    selectedBeamId: "B2",
    columns: {
      C1: { id: "C1", width: 70, depth: 70 },
      C2: { id: "C2", width: 70, depth: 70 }
    },
    beams: {
      B2: {
        id: "B2",
        span: 940,
        width: 60,
        depth: 80,
        cover: 4,
        lapClass: "B",
        connectionMode: "lap",
        lapPointRatio: 0.5,
        topLapPointRatio: 0.5,
        topLayers: [
          { barNo: "#10", left: 5, mid: 3, right: 5, leftCutoff: 285, rightCutoff: 285 },
          { barNo: "#10", left: 2, mid: 0, right: 2, leftCutoff: 200, rightCutoff: 200 },
          { barNo: "#10", left: 0, mid: 0, right: 0, leftCutoff: 0, rightCutoff: 0 }
        ],
        bottomLayers: [
          { barNo: "#10", left: 4, mid: 4, right: 4, leftCutoff: 0, rightCutoff: 0 },
          { barNo: "#10", left: 1, mid: 0, right: 1, leftCutoff: 250, rightCutoff: 250 },
          { barNo: "#10", left: 0, mid: 0, right: 0, leftCutoff: 0, rightCutoff: 0 }
        ],
        stirrups: {
          barNo: "#4",
          leftSpacing: 10,
          leftCount: 20,
          leftRange: 200,
          midSpacing: 20,
          midCount: 0,
          rightSpacing: 10,
          rightCount: 20,
          rightRange: 200
        },
        skin: {
          enabled: false,
          barNo: "#4",
          perSide: 4,
          quantityText: "4*2"
        }
      }
    }
  },
  log: []
};

let state = clone(defaults);
let calculation = null;
let drag3d = null;
let drag2dHandles = [];

const els = {
  componentForm: document.querySelector("#componentForm"),
  componentCode: document.querySelector("#componentCode"),
  syncState: document.querySelector("#syncState"),
  ldValue: document.querySelector("#ldValue"),
  lsValue: document.querySelector("#lsValue"),
  totalLength: document.querySelector("#totalLength"),
  totalWeight: document.querySelector("#totalWeight"),
  checkState: document.querySelector("#checkState"),
  barList: document.querySelector("#barList"),
  changeLog: document.querySelector("#changeLog"),
  c2d: document.querySelector("#drawing2d"),
  c3d: document.querySelector("#drawing3d"),
  lapDialog: document.querySelector("#lapTableDialog"),
  lapTable: document.querySelector("#lapTable"),
  formulaDialog: document.querySelector("#formulaConfigDialog"),
  openFormulaConfig: document.querySelector("#openFormulaConfig"),
  themeToggle: document.querySelector("#themeToggle"),
  benchAddType: document.querySelector("#benchAddType"),
  benchComponentSelect: document.querySelector("#benchComponentSelect"),
  appendBenchItem: document.querySelector("#appendBenchItem"),
  quickAddColumn: document.querySelector("#quickAddColumn"),
  quickAddBeam: document.querySelector("#quickAddBeam"),
  removeBenchLast: document.querySelector("#removeBenchLast"),
  beamBenchSequence: document.querySelector("#beamBenchSequence"),
  beamBenchStatus: document.querySelector("#beamBenchStatus"),
  benchColumnEditor: document.querySelector("#benchColumnEditor"),
  benchBeamSelect: document.querySelector("#benchBeamSelect"),
  benchBeamEditor: document.querySelector("#benchBeamEditor"),
  beamBenchList: document.querySelector("#beamBenchList"),
  beamBenchSummary: document.querySelector("#beamBenchSummary")
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeProject(raw) {
  const next = clone(defaults);
  if (!raw || typeof raw !== "object") return next;
  Object.assign(next, raw);
  next.params = { ...clone(defaults.params), ...(raw.params || {}) };
  next.params.formula = { ...clone(defaults.params.formula), ...((raw.params || {}).formula || {}) };
  next.params.activeLapProfile = (raw.params && raw.params.activeLapProfile) || "default";
  next.params.lapProfiles = (raw.params && raw.params.lapProfiles) || {
    default: { name: "系統預設 (規範公式)", data: {} }
  };
  if (raw.params && raw.params.lapOverrides && !raw.params.lapProfiles) {
    const migrated = {};
    Object.entries(raw.params.lapOverrides).forEach(([key, value]) => {
      const [barNo, lapClass] = key.split("-");
      if (barNo && lapClass) {
        migrated[`${barNo}-${lapClass}-normal`] = value;
        migrated[`${barNo}-${lapClass}-top`] = value;
      }
    });
    next.params.lapProfiles.default.data = migrated;
  }
  if (!next.params.lapProfiles[next.params.activeLapProfile]) {
    next.params.activeLapProfile = "default";
  }
  delete next.params.lapOverrides;
  next.beam = { ...clone(defaults.beam), ...(raw.beam || {}) };
  next.column = { ...clone(defaults.column), ...(raw.column || {}) };
  next.wall = { ...clone(defaults.wall), ...(raw.wall || {}) };
  next.beamBench = normalizeBeamBench(raw.beamBench);
  if (raw.beam && raw.beam.topBars !== undefined) {
    next.beam.topBarsLeft = number(raw.beam.topBars, defaults.beam.topBarsLeft);
    next.beam.topBarsMid = number(raw.beam.topBars, defaults.beam.topBarsMid);
    next.beam.topBarsRight = number(raw.beam.topBars, defaults.beam.topBarsRight);
  }
  delete next.beam.topBars;
  next.log = Array.isArray(raw.log) ? raw.log : [];
  return next;
}

function normalizeBeamBench(rawBench) {
  const bench = clone(defaults.beamBench);
  if (!rawBench || typeof rawBench !== "object") return bench;
  bench.sequence = Array.isArray(rawBench.sequence) ? rawBench.sequence : bench.sequence;
  bench.selectedBeamId = rawBench.selectedBeamId || bench.selectedBeamId;
  bench.columns = { ...bench.columns, ...(rawBench.columns || {}) };
  bench.beams = { ...bench.beams, ...(rawBench.beams || {}) };
  Object.values(bench.beams).forEach((beam) => normalizeBenchBeam(beam));
  if (!bench.beams[bench.selectedBeamId]) {
    bench.selectedBeamId = Object.keys(bench.beams)[0] || "G1";
  }
  return bench;
}

function normalizeBenchBeam(beam) {
  const sample = clone(defaults.beamBench.beams.B2);
  beam.id = beam.id || sample.id;
  beam.span = number(beam.span, sample.span);
  beam.width = number(beam.width, sample.width);
  beam.depth = number(beam.depth, sample.depth);
  beam.cover = number(beam.cover, sample.cover);
  beam.lapClass = beam.lapClass || sample.lapClass;
  beam.connectionMode = beam.connectionMode || sample.connectionMode;
  beam.lapPointRatio = number(beam.lapPointRatio, sample.lapPointRatio);
  beam.topLayers = normalizeLayers(beam.topLayers, sample.topLayers);
  beam.bottomLayers = normalizeLayers(beam.bottomLayers, sample.bottomLayers);
  const h = number(beam.depth, sample.depth);
  const l = Math.max(1, number(beam.span, sample.span));
  const bottomFirst = beam.bottomLayers[0] || sample.bottomLayers[0];
  const bottomLapHalf = beam.connectionMode === "lap"
    ? calcLap(bottomFirst.barNo || sample.bottomLayers[0].barNo, beam.lapClass, false) / 2
    : 0;
  const twoHRatio = Math.min(0.45, ((2 * h) + bottomLapHalf + 10) / l);
  const hasBottomLap = beam.bottomLapPointRatio !== undefined
    && beam.bottomLapPointRatio !== null
    && String(beam.bottomLapPointRatio).trim() !== "";
  beam.topLapPointRatio = number(beam.topLapPointRatio, 0.5);
  beam.bottomLapPointRatio = hasBottomLap ? number(beam.bottomLapPointRatio, twoHRatio) : twoHRatio;
  beam.stirrups = { ...sample.stirrups, ...(beam.stirrups || {}) };
  beam.skin = { ...sample.skin, ...(beam.skin || {}) };
  return beam;
}

function normalizeLayers(layers, sample) {
  const source = Array.isArray(layers) ? layers : [];
  return [0, 1, 2].map((index) => ({ ...sample[index], ...(source[index] || {}) }));
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundUpCm(valueCm) {
  const unit = Math.max(1, number(state.params.rounding, 5));
  return Math.ceil(valueCm / unit) * unit;
}

function dbCm(barNo) {
  return (barDb[barNo] || 25.4) / 10;
}

function unitWeightKgM(barNo) {
  const d = barDb[barNo] || 25.4;
  return evaluateWeightFormula(d);
}

function calcDevelopment(barNo, isTop) {
  const p = state.params;
  const f = p.formula || defaults.params.formula;
  const db = dbCm(barNo);
  const fy = number(p.fy, 420);
  const fc = Math.max(14, number(p.fc, 28));
  const lambda = Math.max(0.1, number(f.lambda, 1));
  const topFactor = isTop ? number(f.alpha, 1.3) : 1;
  const sizeFactor = (barDb[barNo] || 25.4) <= 19.1 ? 0.8 : number(f.gamma, 1);
  const raw = (fy / (1.1 * lambda * Math.sqrt(fc))) * topFactor * number(f.beta, 1) * sizeFactor * db;
  return roundUpCm(Math.max(30, raw));
}

function calcHookDevelopment(barNo, isTop = false) {
  const p = state.params;
  const f = p.formula || defaults.params.formula;
  const db = dbCm(barNo);
  const fy = number(p.fy, 420);
  const fc = Math.max(14, number(p.fc, 28));
  const ldh = (number(f.ldhMultiplier, 0.24) * fy / Math.sqrt(fc)) * db;
  const topFactor = isTop ? number(p.topFactor, number(f.alpha, 1.3)) : 1;
  return roundUpCm(Math.max(15, 8 * db, ldh * topFactor));
}

function evaluateWeightFormula(d) {
  const expression = String(state.params.formula?.weightFormula || defaults.params.formula.weightFormula)
    .replaceAll("^", "**")
    .trim();
  if (!/^[0-9dD+\-*/().\s*]+$/.test(expression)) return 0.006165 * d * d;
  try {
    const value = Function("d", `"use strict"; return (${expression});`)(d);
    return Number.isFinite(value) && value > 0 ? value : 0.006165 * d * d;
  } catch {
    return 0.006165 * d * d;
  }
}

function getFormulaLap(barNo, lapClass, isTop) {
  const ld = calcDevelopment(barNo, isTop);
  return roundUpCm(ld * (lapClass === "B" ? number(state.params.classBFactor, 1.3) : 1));
}

function calcLap(barNo, lapClass, isTop) {
  const profileId = state.params.activeLapProfile || "default";
  const profileData = state.params.lapProfiles?.[profileId]?.data || {};
  const key = `${barNo}-${lapClass}-${isTop ? "top" : "normal"}`;
  const override = number(profileData[key], 0);
  if (override > 0) return override;
  return getFormulaLap(barNo, lapClass, isTop);
}

function legalZone(component, data) {
  if (component === "column") {
    const h = number(data.storyHeight, 360);
    return { start: h * 0.25, end: h * 0.75, label: "?望楊擃葉憭?1/2 ??蝥?" };
  }
  if (component === "beam") {
    const l = number(data.span, 620);
    const h = number(data.depth, 70);
    return {
      topStart: l * 0.25,
      topEnd: l * 0.75,
      bottomStart: 2 * h,
      bottomEnd: l - 2 * h,
      label: "銝惜蝑葉憭?L/2嚗?撅斤??輸??梢? 2h"
    };
  }
  const l = number(data.length, 520);
  return { start: l * 0.3, end: l * 0.7, label: "???蝑遣霅唬漱?舀?亙葆" };
}

function splicePosition(component, data) {
  const base = component === "column" ? number(data.storyHeight, 360) : component === "wall" ? number(data.length, 520) : number(data.span, 620);
  return base * Math.min(0.92, Math.max(0.08, number(data.lapRatio, 0.5)));
}

function checkCompliance(component, data, ls) {
  const pos = splicePosition(component, data);
  const warnings = [];
  let ok = true;

  if (component === "column") {
    const zone = legalZone(component, data);
    if (pos < zone.start || pos > zone.end) {
      ok = false;
      warnings.push("柱筋續接點不在柱淨高中間 1/2 區域");
    }
    const floorWarning = number(state.params.floorWarning, 5);
    if (pos <= floorWarning || number(data.storyHeight, 360) - pos <= floorWarning) {
      ok = false;
      warnings.push(`蝥?剛?璅??Ｗ???${floorWarning}cm`);
    }
    if (number(data.offset, 0) > number(data.storyHeight, 360) / 6) {
      ok = false;
      warnings.push("縮柱偏折斜率超過 1:6，建議改收頭錨定");
    }
  }

  if (component === "beam") {
    const zone = legalZone(component, data);
    const maxBarsInRow = Math.max(
      number(data.topBarsLeft, number(data.topBarsMid, 3)),
      number(data.topBarsMid, 3),
      number(data.topBarsRight, number(data.topBarsMid, 3)),
      number(data.bottomBars, 4)
    );
    const availableWidth = number(data.width, 35) - 2 * number(data.cover, 4) - 2 * dbCm(data.stirrupNo);
    const clearSpacing = maxBarsInRow > 1
      ? (availableWidth - maxBarsInRow * dbCm(data.barNo)) / (maxBarsInRow - 1)
      : availableWidth - dbCm(data.barNo);
    const minClearSpacing = Math.max(2.5, dbCm(data.barNo));
    if (pos < zone.topStart || pos > zone.topEnd) {
      ok = false;
      warnings.push("上層筋搭接點不在梁中央 L/2 可搭接區");
    }
    if (number(data.span, 620) < ls + 4 * number(data.depth, 70)) {
      warnings.push("頝刻??嚗?撅斤??剜撌脣??箇?甇Ｗ?");
    }
    if (clearSpacing < minClearSpacing) {
      ok = false;
      warnings.push(`????琿 ${maxBarsInRow} ?荔?瘛券?頝?${clearSpacing.toFixed(1)}cm 撠 ${minClearSpacing.toFixed(1)}cm`);
    }
  }

  if (component === "wall") {
    const zone = legalZone(component, data);
    if (pos < zone.start || pos > zone.end) {
      ok = false;
      warnings.push("?剜雿蔭?芾?典遣霅唬漱?舀?亙葆");
    }
  }

  return { ok, warnings };
}

function calculate() {
  const component = state.component;
  const data = state[component];
  const isTop = component === "beam";
  const ld = calcDevelopment(data.barNo, isTop);
  const ls = calcLap(data.barNo, data.lapClass, isTop);
  const bars = [];

  if (component === "beam") {
    const span = number(data.span, 620);
    const hook = anchorLength(data, null, data.barNo, isTop);
    const mainLen = roundUpCm(span + hook * 2 + ls);
    const topThroughCount = number(data.topBarsMid, 3);
    const topLeftExtraCount = Math.max(0, number(data.topBarsLeft, topThroughCount) - topThroughCount);
    const topRightExtraCount = Math.max(0, number(data.topBarsRight, topThroughCount) - topThroughCount);
    const extension = roundUpCm(span * number(data.topExtraCutoffRatio, 0.33));
    const extraLen = roundUpCm(hook + extension);
    const stirrupLen = calcStirrupLength(number(data.width, 35), number(data.depth, 70), number(data.cover, 4), data.stirrupNo);
    const denseCount = Math.ceil((2 * number(data.depth, 70) * 2) / number(data.stirrupSpacingDense, 10));
    const normalCount = Math.ceil(Math.max(0, span - 4 * number(data.depth, 70)) / number(data.stirrupSpacingNormal, 20));
    bars.push(row("B-T1", `${topThroughCount}-上層貫通筋`, data.barNo, topThroughCount, mainLen, "上層貫通筋"));
    if (topLeftExtraCount > 0) {
      bars.push(row("B-TL", `${topLeftExtraCount}-上層左端加伸筋`, data.barNo, topLeftExtraCount, extraLen, `左端延伸 ${extension}cm`));
    }
    if (topRightExtraCount > 0) {
      bars.push(row("B-TR", `${topRightExtraCount}-上層右端加伸筋`, data.barNo, topRightExtraCount, extraLen, `右端延伸 ${extension}cm`));
    }
    bars.push(row("B-B1", `${data.bottomBars}-下層筋`, data.barNo, number(data.bottomBars, 4), roundUpCm(span + hook * 2), "下層筋"));
    bars.push(row("B-S1", `箍筋@${data.stirrupSpacingDense}/${data.stirrupSpacingNormal}`, data.stirrupNo, denseCount + normalCount, stirrupLen, "箍筋"));
  }

  if (component === "column") {
    const h = number(data.storyHeight, 360);
    const mainLen = roundUpCm(h + ls);
    const tieLen = roundUpCm((number(data.width, 70) + number(data.depth, 70)) * 2 - number(data.cover, 4) * 8 + 18);
    const tieCount = Math.ceil(h / number(data.tieSpacing, 15));
    bars.push(row("C-M1", `${data.mainBars}-柱主筋`, data.barNo, number(data.mainBars, 12), mainLen, "柱主筋"));
    bars.push(row("C-T1", `柱箍筋@${data.tieSpacing}`, data.tieNo, tieCount, tieLen, "箍筋"));
  }

  if (component === "wall") {
    const length = number(data.length, 520);
    const height = number(data.height, 320);
    const verticalCount = Math.ceil(length / number(data.spacing, 15)) + 1;
    const horizontalCount = Math.ceil(height / number(data.spacing, 15)) + 1;
    bars.push(row("W-V1", `垂直筋@${data.spacing}`, data.barNo, verticalCount, roundUpCm(height + ls), "垂直筋"));
    bars.push(row("W-H1", `水平筋@${data.spacing}`, data.barNo, horizontalCount, roundUpCm(length + ls), "水平筋"));
    bars.push(row("W-R1", "開口補強筋", data.barNo, 8, roundUpCm((number(data.openingWidth, 110) + number(data.openingHeight, 90)) / 2 + 60), "開口補強筋"));
  }

  const totalLength = bars.reduce((sum, item) => sum + item.totalLength, 0);
  const totalWeight = bars.reduce((sum, item) => sum + item.weight, 0);
  const compliance = checkCompliance(component, data, ls);
  calculation = { component, data, ld, ls, bars, totalLength, totalWeight, compliance };
  return calculation;
}

function row(id, mark, barNo, count, lengthCm, note) {
  const totalLength = count * lengthCm / 100;
  const weight = totalLength * unitWeightKgM(barNo);
  return { id, mark, barNo, count, lengthCm, totalLength, weight, note };
}

function layerForFace(beam, face, layerIndex) {
  const layers = face === "T" ? beam.topLayers : beam.bottomLayers;
  return layers?.[layerIndex] || null;
}

function layerSideCount(layer, side) {
  return Math.max(0, number(layer?.[side], 0));
}

function layerCutoffLength(layer, side, fallback) {
  const key = side === "left" ? "leftCutoff" : "rightCutoff";
  return number(layer?.[key], fallback);
}

function continuityAt(context, face, layerIndex, side) {
  const spans = context?.spans || [];
  const spanIndex = number(context?.spanIndex, 0);
  const currentLayer = layerForFace(context?.beam, face, layerIndex);
  const currentSide = side === "left" ? "left" : "right";
  const neighborSide = side === "left" ? "right" : "left";
  const neighbor = side === "left" ? spans[spanIndex - 1] : spans[spanIndex + 1];
  const column = side === "left" ? context?.leftColumn : context?.rightColumn;
  const currentCount = layerSideCount(currentLayer, currentSide);
  const columnWidth = number(column?.width, 70);

  if (!neighbor || !currentLayer) {
    return { hasNeighbor: false, sameBar: false, currentCount, neighborCount: 0, commonCount: 0, columnWidth, neighborLayer: null, neighborSpan: 0 };
  }

  const neighborLayer = layerForFace(neighbor.beam, face, layerIndex);
  const sameBar = Boolean(currentLayer.barNo && neighborLayer?.barNo && currentLayer.barNo === neighborLayer.barNo);
  const neighborCount = sameBar ? layerSideCount(neighborLayer, neighborSide) : 0;
  const commonCount = sameBar ? Math.min(currentCount, neighborCount) : 0;
  return {
    hasNeighbor: true,
    sameBar,
    currentCount,
    neighborCount,
    commonCount,
    columnWidth,
    neighborLayer,
    neighborSpan: number(neighbor.beam?.span, 0)
  };
}

function continuedExtraCount(extraCount, throughCount, info) {
  return Math.min(extraCount, Math.max(0, number(info?.commonCount, 0) - throughCount));
}

function stampBenchRow(item, beam, orderIndex) {
  item.beamId = beam.id;
  item.benchOrder = `L${Math.ceil(orderIndex / 2)}`;
  return item;
}

function calculateBeamBench() {
  const bench = state.beamBench;
  const validation = validateBenchSequence(bench.sequence);
  const bars = [];
  const warnings = [...validation.warnings];

  if (!validation.ok) {
    return { bars, warnings, ok: false, totalLength: 0, totalWeight: 0 };
  }

  const spans = [];
  for (let i = 1; i < bench.sequence.length; i += 2) {
    const beamId = bench.sequence[i];
    const leftColumn = bench.columns[bench.sequence[i - 1]];
    const rightColumn = bench.columns[bench.sequence[i + 1]];
    const beam = bench.beams[beamId];
    if (!beam) {
      warnings.push(`梁段 ${beamId} 找不到資料`);
      continue;
    }
    normalizeBenchBeam(beam);
    const beamCheck = validateBenchBeam(beam);
    warnings.push(...beamCheck.warnings.map((text) => `${beamId}: ${text}`));
    const topFirst = beam.topLayers[0];
    const bottomFirst = beam.bottomLayers[0];
    const fatalDataMissing = !topFirst?.barNo
      || !bottomFirst?.barNo
      || number(beam.width, 0) <= 0
      || number(beam.depth, 0) <= 0
      || number(beam.span, 0) <= 0;
    if (fatalDataMissing) continue;
    spans.push({
      beamId,
      beam,
      leftColumn,
      rightColumn,
      leftColumnId: bench.sequence[i - 1],
      rightColumnId: bench.sequence[i + 1],
      orderIndex: i
    });
  }
  spans.forEach((context, spanIndex) => {
    context.spanIndex = spanIndex;
    context.spans = spans;
  });
  spans.forEach((context) => {
    bars.push(...calculateBenchBeamBars(context));
  });

  const totalLength = bars.reduce((sum, item) => sum + item.totalLength, 0);
  const totalWeight = bars.reduce((sum, item) => sum + item.weight, 0);
  return { bars, warnings, ok: warnings.length === 0, totalLength, totalWeight };
}

function calculateBenchBeamBars(context) {
  const { beam, leftColumn, rightColumn, orderIndex } = context;
  const bars = [];
  const span = number(beam.span, 620);

  beam.topLayers.forEach((layer, index) => {
    bars.push(...calculateLayerBars(context, layer, index, "T", span, leftColumn, rightColumn, orderIndex));
  });

  beam.bottomLayers.forEach((layer, index) => {
    bars.push(...calculateLayerBars(context, layer, index, "B", span, leftColumn, rightColumn, orderIndex));
  });

  bars.push(calculateStirrupRow(beam, orderIndex));
  if (beam.skin.enabled) {
    const skinQty = parseSkinQuantity(beam.skin.quantityText || `${beam.skin.perSide || 0}*2`);
    const count = skinQty.total;
    const skinLap = beam.connectionMode === "lap" ? calcLap(beam.skin.barNo, beam.lapClass, false) : 0;
    const skinLen = roundUpCm(span + skinLap);
    if (count > 0) {
      const item = row(`${beam.id}-SK`, `腰筋 ${skinQty.label}`, beam.skin.barNo, count, skinLen, beam.connectionMode === "lap" ? "腰筋含搭接長度" : "腰筋不含搭接");
      item.beamId = beam.id;
      item.benchOrder = `L${Math.ceil(orderIndex / 2)}`;
      bars.push(item);
    }
  }
  return bars;
}

function parseSkinQuantity(text) {
  const clean = String(text || "").replace(/\s/g, "").toLowerCase();
  const match = clean.match(/^(\d+)(?:[*x](\d+))?$/);
  if (!match) return { perSide: 0, sides: 2, total: 0, label: clean || "0*2" };
  const perSide = number(match[1], 0);
  const sides = number(match[2], 2);
  return { perSide, sides, total: perSide * sides, label: `${perSide}*${sides}` };
}

function calculateLayerBars(context, layer, layerIndex, face, span, leftColumn, rightColumn, orderIndex) {
  const beam = context.beam;
  const layerNo = layerIndex + 1;
  const left = Math.max(0, number(layer.left, 0));
  const mid = Math.max(0, number(layer.mid, 0));
  const right = Math.max(0, number(layer.right, 0));
  const isTop = face === "T";
  const ls = beam.connectionMode === "lap" ? calcLap(layer.barNo, beam.lapClass, isTop) : 0;
  const leftAnchor = anchorLength(beam, leftColumn, layer.barNo, isTop);
  const rightAnchor = anchorLength(beam, rightColumn, layer.barNo, isTop);
  const throughCount = mid;
  const leftExtra = Math.max(0, left - throughCount);
  const rightExtra = Math.max(0, right - throughCount);
  const leftInfo = continuityAt(context, face, layerIndex, "left");
  const rightInfo = continuityAt(context, face, layerIndex, "right");
  const leftThroughAnchor = leftInfo.commonCount >= throughCount ? 0 : leftAnchor;
  const rightThroughAnchor = rightInfo.commonCount >= throughCount ? 0 : rightAnchor;
  const rightThroughPass = rightInfo.commonCount >= throughCount ? rightInfo.columnWidth : 0;
  const leftContinuedExtra = continuedExtraCount(leftExtra, throughCount, leftInfo);
  const rightContinuedExtra = continuedExtraCount(rightExtra, throughCount, rightInfo);
  const leftAnchoredExtra = Math.max(0, leftExtra - leftContinuedExtra);
  const rightAnchoredExtra = Math.max(0, rightExtra - rightContinuedExtra);
  const faceText = face === "T" ? "上層" : "下層";
  const bars = [];

  if (throughCount > 0) {
    if (beam.connectionMode === "lap") {
      const ratio = number(isTop ? beam.topLapPointRatio : beam.bottomLapPointRatio, 0.5);
      const leftLen = roundUpCm(span * ratio + leftThroughAnchor + ls / 2);
      const rightLen = roundUpCm(span * (1 - ratio) + rightThroughAnchor + rightThroughPass + ls / 2);
      const leftNote = leftThroughAnchor > 0 ? `錨定(Ldh+A1) ${leftThroughAnchor}cm` : "內柱連續通過，不另加錨定";
      const rightNote = rightThroughAnchor > 0
        ? `錨定(Ldh+A1) ${rightThroughAnchor}cm`
        : `內柱連續通過${rightThroughPass > 0 ? `，含柱寬 ${rightThroughPass}cm` : ""}`;
      [
        row(`${beam.id}-${face}${layerNo}L`, `${faceText}第${layerNo}排左段搭接筋`, layer.barNo, throughCount, leftLen, `${leftNote} + ${isTop ? "頂層" : "一般"}搭接半長 ${ls / 2}cm`),
        row(`${beam.id}-${face}${layerNo}R`, `${faceText}第${layerNo}排右段搭接筋`, layer.barNo, throughCount, rightLen, `${rightNote} + ${isTop ? "頂層" : "一般"}搭接半長 ${ls / 2}cm`)
      ].forEach((item) => {
        bars.push(stampBenchRow(item, beam, orderIndex));
      });
    } else {
      const throughLen = roundUpCm(span + leftThroughAnchor + rightThroughAnchor + rightThroughPass);
      const note = `左${leftThroughAnchor > 0 ? `錨定 ${leftThroughAnchor}cm` : "連續"} / 右${rightThroughAnchor > 0 ? `錨定 ${rightThroughAnchor}cm` : "連續"}${rightThroughPass > 0 ? `，含柱寬 ${rightThroughPass}cm` : ""}`;
      bars.push(stampBenchRow(row(`${beam.id}-${face}${layerNo}`, `${faceText}第${layerNo}排續接筋`, layer.barNo, throughCount, throughLen, note), beam, orderIndex));
    }
  }
  if (leftAnchoredExtra > 0) {
    const len = roundUpCm(leftAnchor + number(layer.leftCutoff, span / 3));
    const diffNote = leftInfo.hasNeighbor && leftInfo.sameBar
      ? `內柱左右支數差額 ${leftAnchoredExtra} 支需收頭`
      : `錨定(Ldh+A1) ${leftAnchor}cm`;
    bars.push(stampBenchRow(row(`${beam.id}-${face}L${layerNo}`, `${faceText}第${layerNo}排左端加伸筋`, layer.barNo, leftAnchoredExtra, len, `${diffNote} + 自左柱邊延伸 ${number(layer.leftCutoff, span / 3)}cm`), beam, orderIndex));
  }
  if (rightContinuedExtra > 0) {
    const currentCutoff = layerCutoffLength(layer, "right", span / 3);
    const nextCutoff = layerCutoffLength(rightInfo.neighborLayer, "left", number(rightInfo.neighborSpan, span) / 3);
    const len = roundUpCm(currentCutoff + rightInfo.columnWidth + nextCutoff);
    bars.push(stampBenchRow(row(`${beam.id}-${face}RC${layerNo}`, `${faceText}第${layerNo}排右端連續加伸筋`, layer.barNo, rightContinuedExtra, len, `穿過${rightInfo.columnWidth}cm內柱，左右延伸 ${currentCutoff}/${nextCutoff}cm`), beam, orderIndex));
  }
  if (rightAnchoredExtra > 0) {
    const len = roundUpCm(rightAnchor + number(layer.rightCutoff, span / 3));
    const diffNote = rightInfo.hasNeighbor && rightInfo.sameBar
      ? `內柱左右支數差額 ${rightAnchoredExtra} 支需收頭`
      : `錨定(Ldh+A1) ${rightAnchor}cm`;
    bars.push(stampBenchRow(row(`${beam.id}-${face}R${layerNo}`, `${faceText}第${layerNo}排右端加伸筋`, layer.barNo, rightAnchoredExtra, len, `${diffNote} + 自右柱邊延伸 ${number(layer.rightCutoff, span / 3)}cm`), beam, orderIndex));
  }
  return bars;
}

function calculateStirrupRow(beam, orderIndex) {
  const s = beam.stirrups;
  const leftCount = stirrupCount(s.leftCount, s.leftRange, s.leftSpacing);
  const rightCount = stirrupCount(s.rightCount, s.rightRange, s.rightSpacing);
  const denseRange = number(s.leftRange, 0) + number(s.rightRange, 0);
  const midRange = Math.max(0, number(beam.span, 620) - denseRange);
  const midCount = stirrupCount(s.midCount, midRange, s.midSpacing);
  const count = leftCount + midCount + rightCount;
  const len = calcStirrupLength(number(beam.width, 35), number(beam.depth, 70), number(beam.cover, 4), s.barNo);
  const item = row(`${beam.id}-ST`, `箍筋 左@${s.leftSpacing}/中@${s.midSpacing}/右@${s.rightSpacing}`, s.barNo, count, len, `左${leftCount}只 中${midCount}只 右${rightCount}只`);
  item.beamId = beam.id;
  item.benchOrder = `L${Math.ceil(orderIndex / 2)}`;
  return item;
}

function stirrupCount(count, range, spacing) {
  const direct = number(count, 0);
  if (direct > 0) return Math.ceil(direct);
  return Math.ceil(number(range, 0) / Math.max(1, number(spacing, 20))) + 1;
}

function calcStirrupLength(width, depth, cover, barNo) {
  const db = dbCm(barNo);
  const hookLen = Math.max(7.5, 6 * db);
  const clearW = Math.max(0, width - 2 * cover);
  const clearH = Math.max(0, depth - 2 * cover);
  return roundUpCm(clearW * 2 + clearH * 2 + hookLen * 2);
}

function hookA1Length(barNo) {
  return standardA1[barNo] || roundUpCm(17 * dbCm(barNo));
}

function anchorLength(beam, column, barNo, isTop = false) {
  const ldh = calcHookDevelopment(barNo, isTop);
  const a1 = hookA1Length(barNo);
  return ldh + a1;
}

function validateBenchSequence(sequence) {
  const warnings = [];
  if (!Array.isArray(sequence) || sequence.length < 3) {
    return { ok: false, warnings: ["梁台至少需要柱-梁-柱"] };
  }
  if (sequence.length % 2 === 0) warnings.push("璇銝脫敹?隞交?嗅偏");
  sequence.forEach((id, index) => {
    const shouldBeColumn = index % 2 === 0;
    if (shouldBeColumn && !state.beamBench.columns[id]) warnings.push(`雿蔭 ${index + 1} 敹??箸瑽辣`);
    if (!shouldBeColumn && !state.beamBench.beams[id]) warnings.push(`雿蔭 ${index + 1} 敹??箸?瑽辣`);
    if (shouldBeColumn && state.beamBench.columns[id]) {
      const column = state.beamBench.columns[id];
      if (number(column.width, 0) <= 0 || number(column.depth, 0) <= 0) {
        warnings.push(`${id} ?頛詨?琿撠箏站 b x h`);
      }
    }
  });
  return { ok: warnings.length === 0, warnings };
}

function validateBenchBeam(beam) {
  const warnings = [];
  const topFirst = beam.topLayers[0];
  const bottomFirst = beam.bottomLayers[0];
  if (!topFirst.barNo || number(topFirst.left, 0) <= 0 || number(topFirst.mid, 0) <= 0 || number(topFirst.right, 0) <= 0) {
    warnings.push("上層主筋資料未填寫完整");
  }
  if (!bottomFirst.barNo || number(bottomFirst.left, 0) <= 0 || number(bottomFirst.mid, 0) <= 0 || number(bottomFirst.right, 0) <= 0) {
    warnings.push("下層主筋資料未填寫完整");
  }
  if (number(beam.width, 0) <= 0 || number(beam.depth, 0) <= 0 || number(beam.span, 0) <= 0) {
    warnings.push("梁斷面尺寸或跨度不得為零");
  }
  if (beam.connectionMode === "lap") {
    const h = number(beam.depth, 70);
    const l = number(beam.span, 620);
    const bottomLapCenter = l * number(beam.bottomLapPointRatio, 0.25);
    const lapHalfLength = calcLap(bottomFirst.barNo, beam.lapClass, false) / 2;
    if (bottomLapCenter - lapHalfLength < 2 * h || bottomLapCenter + lapHalfLength > l - 2 * h) {
      warnings.push(`下層筋搭接侵入柱邊 2h(${2 * h}cm) 塑性鉸禁區`);
    }
    if (l < 4 * h + lapHalfLength * 2) {
      warnings.push("短梁不具備搭接空間，建議改採續接器或一貫到底");
    }
  }
  return { ok: warnings.length === 0, warnings };
}

function field(label, key, type = "number", options = null) {
  return { label, key, type, options };
}

function componentFields(component) {
  const barOptions = Object.keys(barDb).map((key) => [key, key]);
  const lapOptions = [["A", "甲級搭接"], ["B", "乙級搭接"]];
  if (component === "beam") {
    return [
      field("梁號", "code", "text"),
      field("梁跨長度 (cm)", "span"),
      field("梁寬 (cm)", "width"),
      field("梁深 h (cm)", "depth"),
      field("保護層 (cm)", "cover"),
      field("主筋號數", "barNo", "select", barOptions),
      field("上層左端支數", "topBarsLeft"),
      field("上層中央支數", "topBarsMid"),
      field("上層右端支數", "topBarsRight"),
      field("端部延伸係數", "topExtraCutoffRatio"),
      field("下層筋支數", "bottomBars"),
      field("箍筋號數", "stirrupNo", "select", barOptions),
      field("加密區間距 (cm)", "stirrupSpacingDense"),
      field("中央區間距 (cm)", "stirrupSpacingNormal"),
      field("搭接等級", "lapClass", "select", lapOptions),
      field("搭接位置比例", "lapRatio")
    ];
  }
  if (component === "column") {
    return [
      field("柱號", "code", "text"),
      field("樓層淨高 (cm)", "storyHeight"),
      field("柱寬 (cm)", "width"),
      field("柱深 (cm)", "depth"),
      field("保護層 (cm)", "cover"),
      field("主筋號數", "barNo", "select", barOptions),
      field("主筋支數", "mainBars"),
      field("箍筋號數", "tieNo", "select", barOptions),
      field("箍筋間距 (cm)", "tieSpacing"),
      field("搭接等級", "lapClass", "select", lapOptions),
      field("續接位置比例", "lapRatio"),
      field("縮柱偏移 (cm)", "offset")
    ];
  }
  return [
    field("牆板號", "code", "text"),
    field("長度 (cm)", "length"),
    field("高度/短向 (cm)", "height"),
    field("厚度 (cm)", "thickness"),
    field("保護層 (cm)", "cover"),
    field("鋼筋號數", "barNo", "select", barOptions),
    field("間距 (cm)", "spacing"),
    field("受力方向", "direction", "select", [["X", "X 向"], ["Y", "Y 向"]]),
    field("搭接等級", "lapClass", "select", lapOptions),
    field("搭接位置比例", "lapRatio"),
    field("開口寬 (cm)", "openingWidth"),
    field("開口高 (cm)", "openingHeight")
  ];
}

function renderForm() {
  const component = state.component;
  els.componentCode.textContent = state[component].code;
  els.componentForm.innerHTML = "";

  componentFields(component).forEach((item) => {
    const label = document.createElement("label");
    label.textContent = item.label;
    const control = item.type === "select" ? document.createElement("select") : document.createElement("input");
    control.dataset.scope = component;
    control.dataset.key = item.key;
    if (item.type !== "select") control.type = item.type || "number";
    if (item.options) {
      item.options.forEach(([value, text]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        control.append(option);
      });
    }
    control.value = state[component][item.key];
    control.addEventListener("input", onControlInput);
    control.addEventListener("change", onControlInput);
    label.append(control);
    els.componentForm.append(label);
  });
}

function renderBeamBench() {
  if (!els.beamBenchSequence) return;
  const bench = state.beamBench;
  els.beamBenchSequence.innerHTML = "";
  bench.sequence.forEach((id, index) => {
    const chip = document.createElement("span");
    chip.className = `sequence-chip ${index % 2 === 0 ? "column" : "beam"}`;
    chip.textContent = id;
    els.beamBenchSequence.append(chip);
  });
  renderBenchOptions();
  renderBenchColumnEditor();
  renderBenchBeamEditor();
  renderBenchStatus(calculateBeamBench());
}

function renderBenchColumnEditor() {
  if (!els.benchColumnEditor) return;
  els.benchColumnEditor.innerHTML = "";
  const controls = [];
  Object.values(state.beamBench.columns).forEach((column) => {
    controls.push(benchInput(`${column.id} 寬 b (cm)`, "column", `${column.id}.width`, column.width));
    controls.push(benchInput(`${column.id} 深 h (cm)`, "column", `${column.id}.depth`, column.depth));
  });
  els.benchColumnEditor.append(makeBenchBlock("柱資料", controls, "form-grid"));
}

function renderBenchOptions() {
  const type = els.benchAddType.value || "column";
  const source = type === "column" ? state.beamBench.columns : state.beamBench.beams;
  els.benchComponentSelect.innerHTML = "";
  Object.keys(source).forEach((id) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = id;
    els.benchComponentSelect.append(option);
  });

  els.benchBeamSelect.innerHTML = "";
  Object.keys(state.beamBench.beams).forEach((id) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = id;
    els.benchBeamSelect.append(option);
  });
  els.benchBeamSelect.value = state.beamBench.selectedBeamId;
}

function renderBenchStatus(result) {
  if (!els.beamBenchStatus) return;
  const validation = result || calculateBeamBench();
  els.beamBenchStatus.textContent = validation.ok ? "C-G-C 合格" : "需修正";
  els.beamBenchStatus.className = validation.ok ? "status-pill ok" : "status-pill bad";
}

function renderBenchBeamEditor() {
  const beam = state.beamBench.beams[state.beamBench.selectedBeamId];
  if (!beam || !els.benchBeamEditor) return;
  normalizeBenchBeam(beam);
  els.benchBeamEditor.innerHTML = "";

  els.benchBeamEditor.append(
    makeBenchBlock("梁基本資料", [
      benchInput("梁號", "beam", "id", beam.id, "text"),
      benchInput("跨長 (cm)", "beam", "span", beam.span),
      benchInput("梁寬 b (cm)", "beam", "width", beam.width),
      benchInput("梁深 h (cm)", "beam", "depth", beam.depth),
      benchInput("保護層 (cm)", "beam", "cover", beam.cover),
      benchSelect("續接/搭接", "beam", "connectionMode", beam.connectionMode, [["lap", "搭接"], ["splice", "續接"]]),
      benchSelect("搭接等級", "beam", "lapClass", beam.lapClass, [["A", "甲級"], ["B", "乙級"]])
    ], "layer-grid")
  );

  els.benchBeamEditor.append(makeLayerBlock("上層主筋", "topLayers", beam.topLayers));
  els.benchBeamEditor.append(makeLayerBlock("下層主筋", "bottomLayers", beam.bottomLayers));
  els.benchBeamEditor.append(makeStirrupBlock(beam));
  els.benchBeamEditor.append(makeSkinBlock(beam));
}

function makeBenchBlock(title, controls, className = "form-grid") {
  const block = document.createElement("div");
  block.className = "bench-block";
  const h = document.createElement("h3");
  h.textContent = title;
  const grid = document.createElement("div");
  grid.className = className;
  controls.forEach((control) => grid.append(control));
  block.append(h, grid);
  return block;
}

function makeLayerBlock(title, key, layers) {
  const controls = [];
  layers.forEach((layer, index) => {
    controls.push(benchSelect(`${title} 第${index + 1}排號數`, key, `${index}.barNo`, layer.barNo, Object.keys(barDb).map((id) => [id, id])));
    controls.push(benchInput("左端支數", key, `${index}.left`, layer.left));
    controls.push(benchInput("中央支數", key, `${index}.mid`, layer.mid));
    controls.push(benchInput("右端支數", key, `${index}.right`, layer.right));
    controls.push(benchInput("左加鐵距離 (cm)", key, `${index}.leftCutoff`, layer.leftCutoff, "number", "wide"));
    controls.push(benchInput("右加鐵距離 (cm)", key, `${index}.rightCutoff`, layer.rightCutoff, "number", "wide"));
  });
  return makeBenchBlock(title, controls, "layer-grid");
}

function makeStirrupBlock(beam) {
  const s = beam.stirrups;
  return makeBenchBlock("箍筋配置", [
    benchSelect("箍筋號數", "stirrups", "barNo", s.barNo, Object.keys(barDb).map((id) => [id, id])),
    benchInput("左間距 (cm)", "stirrups", "leftSpacing", s.leftSpacing),
    benchInput("左數量", "stirrups", "leftCount", s.leftCount),
    benchInput("左範圍 (cm)", "stirrups", "leftRange", s.leftRange),
    benchInput("中間距 (cm)", "stirrups", "midSpacing", s.midSpacing),
    benchInput("中數量", "stirrups", "midCount", s.midCount),
    benchInput("右間距 (cm)", "stirrups", "rightSpacing", s.rightSpacing),
    benchInput("右數量", "stirrups", "rightCount", s.rightCount),
    benchInput("右範圍 (cm)", "stirrups", "rightRange", s.rightRange)
  ], "stirrup-grid");
}

function makeSkinBlock(beam) {
  const block = makeBenchBlock("腰筋", [
    benchSelect("腰筋號數", "skin", "barNo", beam.skin.barNo, Object.keys(barDb).map((id) => [id, id])),
    benchInput("腰筋數量 (例 4*2)", "skin", "quantityText", beam.skin.quantityText || `${beam.skin.perSide || 0}*2`, "text")
  ], "form-grid");
  const check = document.createElement("label");
  check.className = "check-line";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = Boolean(beam.skin.enabled);
  input.addEventListener("change", () => {
    beam.skin.enabled = input.checked;
    logChange("梁台腰筋", `${beam.id} 腰筋 ${input.checked ? "啟用" : "停用"}`);
    update();
  });
  check.append(input, document.createTextNode("啟用腰筋"));
  block.insertBefore(check, block.children[1]);
  return block;
}

function benchInput(labelText, scope, key, value, type = "number", extraClass = "") {
  const label = document.createElement("label");
  if (extraClass) label.className = extraClass;
  label.textContent = labelText;
  const input = document.createElement("input");
  input.type = type;
  input.value = value;
  input.addEventListener("change", () => updateBenchValue(scope, key, input.value, type));
  label.append(input);
  return label;
}

function benchSelect(labelText, scope, key, value, options) {
  const label = document.createElement("label");
  label.textContent = labelText;
  const select = document.createElement("select");
  options.forEach(([optionValue, text]) => {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = text;
    select.append(option);
  });
  select.value = value;
  select.addEventListener("change", () => updateBenchValue(scope, key, select.value, "text"));
  label.append(select);
  return label;
}

function updateBenchValue(scope, key, value, type) {
  const bench = state.beamBench;
  const beam = bench.beams[bench.selectedBeamId];
  const parsed = type === "number" ? number(value, 0) : value;
  if (scope === "beam") {
    if (key === "id") {
      renameBenchBeam(beam.id, String(parsed).trim() || beam.id);
    } else {
      beam[key] = parsed;
    }
  } else if (scope === "column") {
    const [columnId, prop] = key.split(".");
    state.beamBench.columns[columnId][prop] = number(parsed, 0);
  } else if (scope === "topLayers" || scope === "bottomLayers") {
    const [indexText, prop] = key.split(".");
    beam[scope][Number(indexText)][prop] = prop === "barNo" ? parsed : number(parsed, 0);
  } else if (scope === "skin" && key === "quantityText") {
    beam.skin.quantityText = String(parsed);
    beam.skin.perSide = parseSkinQuantity(String(parsed)).perSide;
  } else {
    beam[scope][key] = type === "number" ? number(parsed, 0) : parsed;
  }
  logChange("梁台資料更新", `${beam.id} ${scope}.${key} = ${parsed}`);
  update();
}

function renameBenchBeam(oldId, newId) {
  if (oldId === newId || state.beamBench.beams[newId]) return;
  const beam = state.beamBench.beams[oldId];
  delete state.beamBench.beams[oldId];
  beam.id = newId;
  state.beamBench.beams[newId] = beam;
  state.beamBench.sequence = state.beamBench.sequence.map((id) => id === oldId ? newId : id);
  state.beamBench.selectedBeamId = newId;
}

function addBenchItem() {
  const type = els.benchAddType.value;
  const id = els.benchComponentSelect.value;
  if (!id) return;
  const lastIndex = state.beamBench.sequence.length - 1;
  const nextShouldBeColumn = lastIndex < 0 || lastIndex % 2 === 1;
  if ((type === "column") !== nextShouldBeColumn) {
    logChange("梁台順序錯誤", nextShouldBeColumn ? "下一個需要柱構件" : "下一個需要梁構件");
    renderBeamBench();
    return;
  }
  state.beamBench.sequence.push(id);
  logChange("梁台串接", `加入 ${id}`);
  update();
}

function quickAddColumn() {
  const next = nextId("C", state.beamBench.columns);
  state.beamBench.columns[next] = { id: next, width: 70, depth: 70 };
  els.benchAddType.value = "column";
  logChange("快速新增柱", `${next} 已建立，請確認斷面尺寸`);
  update();
}

function quickAddBeam() {
  const next = nextId("B", state.beamBench.beams);
  const beam = clone(defaults.beamBench.beams.B2);
  beam.id = next;
  state.beamBench.beams[next] = beam;
  state.beamBench.selectedBeamId = next;
  els.benchAddType.value = "beam";
  logChange("快速新增梁", `${next} 已建立，請補齊主筋與箍筋資料`);
  update();
}

function nextId(prefix, collection) {
  let index = 1;
  while (collection[`${prefix}${index}`]) index += 1;
  return `${prefix}${index}`;
}

function bindStaticControls() {
  document.querySelectorAll("[data-component]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-component]").forEach((el) => el.classList.remove("active"));
      button.classList.add("active");
      state.component = button.dataset.component;
      logChange("切換構件", `目前構件：${state[state.component].code}`);
      renderForm();
      update();
    });
  });

  ["fc", "fy", "rounding", "topFactor", "ldFactor", "classBFactor", "spliceMode", "floorWarning"].forEach((key) => {
    const el = document.querySelector(`#${key}`);
    el.value = state.params[key];
    el.addEventListener("input", () => {
      state.params[key] = el.tagName === "SELECT" ? el.value : number(el.value, state.params[key]);
      logChange("參數更新", `${labelForParam(key)} = ${el.value}`);
      update();
    });
  });

  document.querySelector("#resetParams").addEventListener("click", () => {
    state.params = clone(defaults.params);
    syncParamControls();
    renderFormulaConfig();
    renderLapTable();
    logChange("重設參數", "計算參數已恢復預設值");
    update();
  });

  document.querySelector("#openLapTable").addEventListener("click", () => {
    renderLapTable();
    els.lapDialog.showModal();
  });
  document.querySelector("#addLapProfile")?.addEventListener("click", () => {
    const name = prompt("請輸入新專案搭接表的名稱 (例如：A建案標準圖):", "新專案");
    if (!name) return;
    ensureLapProfiles();
    const id = `proj_${Date.now()}`;
    state.params.lapProfiles[id] = { name, data: {} };
    state.params.activeLapProfile = id;
    renderLapTable();
    update();
    logChange("搭接表", `新增並切換至：${name}`);
  });
  document.querySelector("#lapProfileSelect")?.addEventListener("change", (event) => {
    ensureLapProfiles();
    state.params.activeLapProfile = event.target.value;
    renderLapTable();
    update();
    logChange("搭接表", `切換至：${state.params.lapProfiles[state.params.activeLapProfile].name}`);
  });
  els.openFormulaConfig?.addEventListener("click", () => {
    renderFormulaConfig();
    els.formulaDialog.showModal();
  });
  els.themeToggle?.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
    logChange("介面主題", state.theme === "dark" ? "深色模式" : "亮色模式");
    update();
  });
  document.querySelector("#saveProject").addEventListener("click", saveProject);
  document.querySelector("#loadProject").addEventListener("click", loadProject);
  document.querySelector("#exportCsv").addEventListener("click", exportCsv);
  document.querySelector("#printDrawings").addEventListener("click", () => window.print());
  document.querySelector("#clearLog").addEventListener("click", () => {
    state.log = [];
    renderLog();
  });
  els.benchAddType.addEventListener("change", renderBenchOptions);
  els.appendBenchItem.addEventListener("click", addBenchItem);
  els.quickAddColumn.addEventListener("click", quickAddColumn);
  els.quickAddBeam.addEventListener("click", quickAddBeam);
  els.removeBenchLast.addEventListener("click", () => {
    const removed = state.beamBench.sequence.pop();
    logChange("梁台串接", `移除 ${removed || "最後一項"}`);
    update();
  });
  els.benchBeamSelect.addEventListener("change", () => {
    state.beamBench.selectedBeamId = els.benchBeamSelect.value;
    logChange("梁台選取", `目前梁：${state.beamBench.selectedBeamId}`);
    update();
  });
  document.querySelectorAll("[data-view-toggle]").forEach((button) => {
    button.addEventListener("click", () => switchDrawingView(button.dataset.viewToggle));
  });
  bind2dDrag();
  bind3dDrag();
}

function switchDrawingView(view) {
  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.viewPanel === view);
  });
  document.querySelectorAll("[data-view-toggle]").forEach((button) => {
    button.classList.toggle("active", button.dataset.viewToggle === view);
  });
  requestAnimationFrame(update);
}

function applyTheme() {
  document.body.dataset.theme = state.theme === "dark" ? "dark" : "light";
  if (els.themeToggle) {
    els.themeToggle.textContent = state.theme === "dark" ? "亮色" : "深色";
  }
}

function labelForParam(key) {
  const labels = {
    fc: "f'c",
    fy: "fy",
    rounding: "長度歸整",
    topFactor: "頂層筋係數",
    ldFactor: "Ld 係數",
    classBFactor: "乙級搭接係數",
    spliceMode: "續接方式",
    floorWarning: "樓版警示距離"
  };
  return labels[key] || key;
}

function syncParamControls() {
  Object.keys(state.params).forEach((key) => {
    const el = document.querySelector(`#${key}`);
    if (el) el.value = state.params[key];
  });
}

function onControlInput(event) {
  const { scope, key } = event.target.dataset;
  const oldValue = state[scope][key];
  const value = event.target.type === "number" ? number(event.target.value, oldValue) : event.target.value;
  state[scope][key] = value;
  if (key === "code") els.componentCode.textContent = value;
  logChange("構件資料更新", `${componentName(scope)} ${key}: ${oldValue} -> ${value}`);
  update();
}

function componentName(component) {
  return { beam: "梁", column: "柱", wall: "牆板" }[component] || component;
}

function update() {
  els.syncState.textContent = "同步中";
  els.syncState.className = "status-pill warn";
  requestAnimationFrame(() => {
    const calc = calculate();
    renderSummary(calc);
    renderTable(calc);
    renderBeamBench();
    renderBeamBenchTable();
    render2d(calc);
    render3d(calc);
    renderLog();
    els.syncState.textContent = "已同步";
    els.syncState.className = "status-pill ok";
  });
}

function renderSummary(calc) {
  els.ldValue.textContent = `${calc.ld.toFixed(0)} cm`;
  els.lsValue.textContent = `${calc.ls.toFixed(0)} cm`;
  els.totalLength.textContent = `${calc.totalLength.toFixed(2)} m`;
  els.totalWeight.textContent = `${calc.totalWeight.toFixed(1)} kg`;
  const hasWarnings = calc.compliance.warnings.length > 0;
  els.checkState.textContent = calc.compliance.ok ? (hasWarnings ? "提醒" : "合格") : "違規";
  els.checkState.className = calc.compliance.ok ? (hasWarnings ? "state-warn" : "state-ok") : "state-bad";
}

function renderTable(calc) {
  els.barList.innerHTML = "";
  calc.bars.forEach((item) => {
    const tr = document.createElement("tr");
    const tag = calc.compliance.ok ? "tag-ok" : "tag-bad";
    const label = calc.compliance.ok ? "合格" : "需修正";
    tr.innerHTML = `
      <td>${item.id}</td>
      <td>${item.mark}</td>
      <td style="color:${barColors[item.barNo]}"><strong>${item.barNo}</strong></td>
      <td>${item.count}</td>
      <td>${item.lengthCm.toFixed(0)} cm</td>
      <td>${item.totalLength.toFixed(2)} m</td>
      <td>${item.weight.toFixed(1)} kg</td>
      <td><span class="${tag}">${label}</span></td>
    `;
    els.barList.append(tr);
  });
}

function renderBeamBenchTable() {
  const result = calculateBeamBench();
  if (!els.beamBenchList) return;
  els.beamBenchList.innerHTML = "";
  result.bars.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.benchOrder}</td>
      <td>${item.beamId}</td>
      <td>${item.mark}</td>
      <td style="color:${barColors[item.barNo]}"><strong>${item.barNo}</strong></td>
      <td>${item.count}</td>
      <td>${item.lengthCm.toFixed(0)} cm</td>
      <td>${item.totalLength.toFixed(2)} m</td>
      <td>${item.weight.toFixed(1)} kg</td>
      <td>${item.note}</td>
    `;
    els.beamBenchList.append(tr);
  });
  if (els.beamBenchSummary) {
    els.beamBenchSummary.textContent = result.ok
      ? `共 ${result.bars.length} 筆，${result.totalLength.toFixed(2)} m，${result.totalWeight.toFixed(1)} kg`
      : result.warnings.join("；");
  }
  renderBeamBenchMetrics(result);
  renderBenchStatus(result);
}

function renderBeamBenchMetrics(result) {
  const beam = state.beamBench.beams[state.beamBench.selectedBeamId];
  if (!beam) return;
  const topBar = beam.topLayers[0].barNo;
  const bottomBar = beam.bottomLayers[0].barNo;
  const topLap = beam.connectionMode === "lap" ? calcLap(topBar, beam.lapClass, true) : 0;
  const bottomLap = beam.connectionMode === "lap" ? calcLap(bottomBar, beam.lapClass, false) : 0;
  els.ldValue.textContent = beam.connectionMode === "lap" ? `上層 ${topLap} cm` : "續接";
  els.lsValue.textContent = beam.connectionMode === "lap" ? `下層 ${bottomLap} cm` : "不搭接";
  els.totalLength.textContent = `${result.totalLength.toFixed(2)} m`;
  els.totalWeight.textContent = `${result.totalWeight.toFixed(1)} kg`;
  els.checkState.textContent = result.ok ? "合格" : "需修正";
  els.checkState.className = result.ok ? "state-ok" : "state-bad";
}

function renderLog() {
  els.changeLog.innerHTML = "";
  state.log.slice(0, 60).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.time}｜${item.source}｜${item.detail}`;
    els.changeLog.append(li);
  });
}

function render2d(calc) {
  const ctx = setupCanvas(els.c2d);
  drag2dHandles = [];
  clear(ctx, els.c2d);
  if (calc.component === "beam") {
    drawBeam2d(ctx, calc);
  } else {
    drawTitle(ctx, `${componentName(calc.component)}施工圖：${calc.data.code}`, 34, 42);
  }
  if (calc.component === "column") drawColumn2d(ctx, calc);
  if (calc.component === "wall") drawWall2d(ctx, calc);
  if (calc.component !== "beam") drawWarnings(ctx, calc);
}

function render3d(calc) {
  const ctx = setupCanvas(els.c3d);
  clear(ctx, els.c3d);
  const beamId = state.beamBench?.selectedBeamId || calc.data.code;
  drawTitle(ctx, `局部 3D：${calc.component === "beam" ? beamId : calc.data.code}`, 30, 42);
  draw3dAxes(ctx);
  if (calc.component === "beam") drawBeam3d(ctx, calc);
  if (calc.component === "column") drawColumn3d(ctx, calc);
  if (calc.component === "wall") drawWall3d(ctx, calc);
  ctx.fillStyle = "#66737c";
  ctx.font = "24px Microsoft JhengHei";
  ctx.fillText("拖曳搭接點可同步更新 2D 圖與料單", 30, 590);
}

function setupCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const logical = logicalSize(canvas);
  const nextWidth = Math.max(1, Math.round(rect.width * ratio));
  const nextHeight = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform((rect.width / logical.width) * ratio, 0, 0, (rect.height / logical.height) * ratio, 0, 0);
  return ctx;
}

function clear(ctx, canvas) {
  const logical = logicalSize(canvas);
  ctx.clearRect(0, 0, logical.width, logical.height);
}

function logicalSize(canvas) {
  return canvas.id === "drawing2d" ? { width: 1200, height: 620 } : { width: 720, height: 620 };
}

function drawTitle(ctx, text, x, y) {
  ctx.fillStyle = "#182026";
  ctx.font = "700 34px Microsoft JhengHei";
  ctx.fillText(text, x, y);
}

function drawBeam2d(ctx, calc) {
  const bench = state.beamBench;
  const spans = bench.sequence
    .map((id, index) => index % 2 === 1 ? { id, beam: bench.beams[id], leftColumn: bench.columns[bench.sequence[index - 1]], rightColumn: bench.columns[bench.sequence[index + 1]], leftColumnId: bench.sequence[index - 1], rightColumnId: bench.sequence[index + 1] } : null)
    .filter(Boolean)
    .filter((item) => item.beam)
    .map((item) => ({ ...item, beam: normalizeBenchBeam(item.beam) }));
  if (!spans.length) return;

  const columnIds = bench.sequence.filter((_, index) => index % 2 === 0);
  const totalColumnWidth = columnIds.reduce((sum, id) => sum + number(bench.columns[id]?.width, 70), 0);
  const totalSpan = spans.reduce((sum, item) => sum + number(item.beam.span, 0), 0) + totalColumnWidth;
  const xStart = 90;
  const xEnd = 1080;
  const yTop = 132;
  const yBottom = 392;
  const scale = (xEnd - xStart) / Math.max(1, totalSpan);
  const selected = bench.beams[bench.selectedBeamId] || spans[0].beam;
  const topLap = selected.connectionMode === "lap" ? calcLap(selected.topLayers[0].barNo, selected.lapClass, true) : 0;
  const bottomLap = selected.connectionMode === "lap" ? calcLap(selected.bottomLayers[0].barNo, selected.lapClass, false) : 0;
  spans.forEach((item, index) => {
    item.spanIndex = index;
    item.spans = spans;
  });

  drawDetailFrame(ctx);
  detailText(ctx, `${selected.connectionMode === "lap" ? "搭接" : "續接"} / ${selected.lapClass === "B" ? "乙級" : "甲級"}`, 95, 76, 18, "#2368a6");
  detailText(ctx, `上層搭接 ${topLap || "-"}cm / 下層搭接 ${bottomLap || "-"}cm`, 260, 76, 18, "#566879");

  let cursor = xStart;
  drawColumnZone(ctx, cursor, number(bench.columns[columnIds[0]]?.width, 70) * scale, 86, 505, columnIds[0] || "C1", number(bench.columns[columnIds[0]]?.width, 70));
  cursor += number(bench.columns[columnIds[0]]?.width, 70) * scale;
  spans.forEach((item, spanIndex) => {
    const beam = item.beam;
    const span = number(beam.span, 0);
    const x0 = cursor;
    const x1 = cursor + span * scale;
    const rightColumnWidth = number(item.rightColumn?.width, 70);
    const rightColumnDrawW = rightColumnWidth * scale;
    const rightColumnStart = x1;
    const depth = number(beam.depth, 80);
    const noLap = roundUpCm(2 * depth);

    drawBeamBodyLine(ctx, x0, x1, yTop, yBottom, beam);
    fillRect(ctx, x0, yBottom + 34, Math.min(noLap, span / 2) * scale, 34, "rgba(201,52,52,0.16)");
    fillRect(ctx, x1 - Math.min(noLap, span / 2) * scale, yBottom + 34, Math.min(noLap, span / 2) * scale, 34, "rgba(201,52,52,0.16)");
    fillRect(ctx, x0 + span * 0.25 * scale, 88, span * 0.5 * scale, 28, "rgba(31,143,95,0.15)");
    detailText(ctx, `${beam.id}(${beam.width}x${beam.depth})`, x0 + (x1 - x0) / 2 - 58, 302, 22, "#182026");
    detailText(ctx, `下層筋端部 2h 禁止搭接 = ${noLap}cm`, x0 + 6, yBottom + 58, 14, "#c93434");
    dimension(ctx, x0, 528, x1, 528, `${span}cm`);

    drawLayerGroup(ctx, beam, "topLayers", "T", x0, x1, yTop, scale, spanIndex, spans.length, number(item.leftColumn?.width, 70) * scale, rightColumnDrawW, item.leftColumn, item.rightColumn, item);
    drawLayerGroup(ctx, beam, "bottomLayers", "B", x0, x1, yBottom, scale, spanIndex, spans.length, number(item.leftColumn?.width, 70) * scale, rightColumnDrawW, item.leftColumn, item.rightColumn, item);
    drawStirrupNotes(ctx, beam, x0, x1, yBottom + 114, scale);

    drawColumnZone(ctx, rightColumnStart, rightColumnDrawW, 86, 505, columnIds[spanIndex + 1] || `C${spanIndex + 2}`, rightColumnWidth);
    cursor = x1 + rightColumnDrawW;
  });
}

function drawDetailFrame(ctx) {
  rect(ctx, 22, 18, 1156, 584, "rgba(255,255,255,0.75)", "#182026", 2);
  rect(ctx, 34, 30, 1132, 540, "transparent", "#182026", 1);
}

function drawColumnLine(ctx, x, y1, y2, id) {
  ctx.save();
  ctx.strokeStyle = "#182026";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([7, 7]);
  ctx.beginPath();
  ctx.moveTo(x, y1);
  ctx.lineTo(x, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  detailText(ctx, id, x - 20, y2 + 28, 18, "#182026");
  ctx.restore();
}

function drawColumnZone(ctx, x, width, y1, y2, id, widthCm) {
  fillRect(ctx, x, y1, width, y2 - y1, "rgba(86,104,121,0.08)");
  rect(ctx, x, y1, width, y2 - y1, "transparent", "#566879", 1.2);
  line(ctx, x, y1, x, y2, "#182026", 1.5);
  line(ctx, x + width, y1, x + width, y2, "#182026", 1.5);
  detailText(ctx, id, x + width / 2 - 14, y2 + 28, 18, "#182026");
  detailText(ctx, `${widthCm}cm`, x + width / 2 - 22, y2 + 52, 17, "#566879");
}

function drawBeamBodyLine(ctx, x0, x1, yTop, yBottom, beam) {
  line(ctx, x0, yTop + 70, x1, yTop + 70, "#cfd8dd", 1);
  line(ctx, x0, yBottom - 70, x1, yBottom - 70, "#cfd8dd", 1);
  detailText(ctx, "上層可搭接區 L/2", x0 + (x1 - x0) / 2 - 62, 109, 14, "#1f8f5f");
}

function drawLayerGroup(ctx, beam, key, face, x0, x1, yBase, scale, spanIndex, spanCount, leftColumnW, rightColumnW, leftColumn, rightColumn, spanContext = null) {
  const isTop = face === "T";
  const layers = beam[key];
  layers.forEach((layer, index) => {
    const left = number(layer.left, 0);
    const mid = number(layer.mid, 0);
    const right = number(layer.right, 0);
    if (left <= 0 && mid <= 0 && right <= 0) return;
    const y = yBase + (isTop ? index * 27 : -index * 27);
    const color = layerColor(index, isTop);
    const hookDir = isTop ? 1 : -1;
    const labelDy = isTop ? -11 - index * 3 : 23 + index * 4;
    const leftAnchor = anchorLength(beam, leftColumn, layer.barNo, isTop);
    const rightAnchor = anchorLength(beam, rightColumn, layer.barNo, isTop);
    const a1 = hookA1Length(layer.barNo);
    const context = spanContext || { beam, leftColumn, rightColumn, spanIndex, spans: [] };
    const leftInfo = continuityAt(context, face, index, "left");
    const rightInfo = continuityAt(context, face, index, "right");
    const leftThroughHook = leftInfo.commonCount < mid;
    const rightThroughHook = rightInfo.commonCount < mid;
    const leftThroughAnchor = leftThroughHook ? leftAnchor : 0;
    const rightThroughAnchor = rightThroughHook ? rightAnchor : 0;
    const rightThroughPass = rightThroughHook ? 0 : rightInfo.columnWidth;
    if (mid > 0) {
      const lap = beam.connectionMode === "lap" ? calcLap(layer.barNo, beam.lapClass, isTop) : 0;
      if (beam.connectionMode === "lap") {
        const ratioKey = isTop ? "topLapPointRatio" : "bottomLapPointRatio";
        const lapRatio = number(beam[ratioKey], 0.5);
        const lapCenterX = x0 + lapRatio * (x1 - x0);
        const lapStartX = lapCenterX - (lap * scale) / 2;
        const lapEndX = lapCenterX + (lap * scale) / 2;
        const rightEndX = x1 + rightThroughPass * scale;
        drawAnchoredBar(ctx, x0, lapEndX, y, hookDir, color, 4, leftThroughHook, false, leftColumnW, 0);
        drawAnchoredBar(ctx, lapStartX, rightEndX, y + hookDir * 11, hookDir, color, 4, false, rightThroughHook, 0, rightColumnW);
        drawLapHandle(ctx, beam, lapCenterX, y + hookDir * 6, lap, isTop, ratioKey);
        const leftLen = roundUpCm(number(beam.span, 0) * lapRatio + leftThroughAnchor + lap / 2);
        const rightLen = roundUpCm(number(beam.span, 0) * (1 - lapRatio) + rightThroughAnchor + rightThroughPass + lap / 2);
        labelBox(ctx, `${layer.barNo} 左${leftLen}cmx${mid}`, x0 + 12, y + labelDy, color, isTop);
        labelBox(ctx, `${layer.barNo} 右${rightLen}cmx${mid}`, Math.max(lapEndX + 18, x1 - 178), y + labelDy + hookDir * 11, color, isTop);
        if (index === 0 && leftThroughHook) labelBox(ctx, `A1=${a1}cm`, x0 - Math.max(20, leftColumnW * 0.65) + 4, y + hookDir * 58, color, isTop);
        if (index === 0 && rightThroughHook) labelBox(ctx, `A1=${a1}cm`, x1 + Math.max(20, rightColumnW * 0.28), y + hookDir * 58, color, isTop);
      } else {
        drawAnchoredBar(ctx, x0, x1 + rightThroughPass * scale, y, hookDir, color, 4, leftThroughHook, rightThroughHook, leftColumnW, rightColumnW);
        labelBox(ctx, `${layer.barNo} ${roundUpCm(number(beam.span, 0) + leftThroughAnchor + rightThroughAnchor + rightThroughPass)}cmx${mid}`, x0 + 12, y + labelDy, color, isTop);
        detailText(ctx, `蝥x${mid}`, x0 + (x1 - x0) / 2 - 18, y + (isTop ? 20 : -12), 12, "#182026");
      }
    }
    const leftExtra = Math.max(0, left - mid);
    const rightExtra = Math.max(0, right - mid);
    const leftContinuedExtra = continuedExtraCount(leftExtra, mid, leftInfo);
    const rightContinuedExtra = continuedExtraCount(rightExtra, mid, rightInfo);
    const leftAnchoredExtra = Math.max(0, leftExtra - leftContinuedExtra);
    const rightAnchoredExtra = Math.max(0, rightExtra - rightContinuedExtra);
    if (leftAnchoredExtra > 0) {
      const lx = x0 + number(layer.leftCutoff, 0) * scale;
      drawAnchoredBar(ctx, x0, lx, y + hookDir * 20, hookDir, color, 3, true, false, leftColumnW, 0);
      labelBox(ctx, `${layer.barNo} ${roundUpCm(leftAnchor + number(layer.leftCutoff, 0))}cmx${leftAnchoredExtra}`, x0 + 8, y + hookDir * 44, color, isTop);
      if (index === 0 && mid <= 0) labelBox(ctx, `A1=${a1}cm`, x0 - Math.max(20, leftColumnW * 0.65) + 4, y + hookDir * 76, color, isTop);
    }
    if (rightContinuedExtra > 0) {
      const currentCutoff = layerCutoffLength(layer, "right", number(beam.span, 0) / 3);
      const nextCutoff = layerCutoffLength(rightInfo.neighborLayer, "left", number(rightInfo.neighborSpan, number(beam.span, 0)) / 3);
      const rx = x1 - currentCutoff * scale;
      const endX = x1 + rightInfo.columnWidth * scale + nextCutoff * scale;
      drawAnchoredBar(ctx, rx, endX, y + hookDir * 20, hookDir, color, 3, false, false, 0, 0);
      labelBox(ctx, `${layer.barNo} ${roundUpCm(currentCutoff + rightInfo.columnWidth + nextCutoff)}cmx${rightContinuedExtra}`, Math.max(rx + 8, x1 - 152), y + hookDir * 44, color, isTop);
      detailText(ctx, "連續", x1 + 8, y + hookDir * 34, 12, color);
    }
    if (rightAnchoredExtra > 0) {
      const rx = x1 - number(layer.rightCutoff, 0) * scale;
      drawAnchoredBar(ctx, rx, x1, y + hookDir * 20, hookDir, color, 3, false, true, 0, rightColumnW);
      labelBox(ctx, `${layer.barNo} ${roundUpCm(rightAnchor + number(layer.rightCutoff, 0))}cmx${rightAnchoredExtra}`, Math.max(rx + 8, x1 - 152), y + hookDir * 44, color, isTop);
      if (index === 0 && mid <= 0) labelBox(ctx, `A1=${a1}cm`, x1 + Math.max(20, rightColumnW * 0.28), y + hookDir * 76, color, isTop);
    }
  });
}

function drawAnchoredBar(ctx, x0, x1, y, dir, color, width, hookLeft, hookRight, leftColumnW = 0, rightColumnW = 0) {
  const hook = 45 * dir;
  const start = hookLeft ? x0 - Math.max(20, leftColumnW * 0.65) : x0;
  const end = hookRight ? x1 + Math.max(20, rightColumnW * 0.65) : x1;
  if (hookLeft) line(ctx, start, y + hook, start, y, color, width);
  line(ctx, start, y, end, y, color, width);
  if (hookRight) line(ctx, end, y, end, y + hook, color, width);
}

function drawLapHandle(ctx, beam, x, y, lap, isTop, ratioKey) {
  const color = isTop ? "#1f8f5f" : "#b87508";
  line(ctx, x, y - 18, x, y + 18, color, 2);
  dot(ctx, x, y, 7, color);
  labelBox(ctx, `搭接${lap}cm`, x - 38, y + (isTop ? 34 : -24), color);
  if (beam.id === state.beamBench.selectedBeamId) {
    drag2dHandles.push({ x, y, r: 18, beamId: beam.id, ratioKey });
  }
}

function labelBox(ctx, text, x, y, color, isTop = null) {
  ctx.save();
  ctx.font = "700 13px 'Segoe UI', 'Microsoft JhengHei', sans-serif";
  const width = ctx.measureText(text).width + 16;
  if (typeof isTop === "boolean") {
    const leadDir = isTop ? -1 : 1;
    const leadY = y + leadDir * 38;
    const offsetX = 20;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + offsetX / 2, y + leadDir * 20);
    ctx.lineTo(x + offsetX, leadY);
    ctx.lineTo(x + offsetX + 10, leadY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = document.body.dataset.theme === "dark" ? "#2d3a46" : "rgba(255, 255, 255, 0.95)";
    ctx.beginPath();
    ctx.roundRect(x + offsetX + 10, leadY - 14, width, 24, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = document.body.dataset.theme === "dark" ? "#fff" : color;
    ctx.fillText(text, x + offsetX + 18, leadY + 3);
    ctx.restore();
    return;
  }
  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.fillRect(x - 3, y - 16, width, 20);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function layerColor(index, isTop) {
  if (isTop) return ["#111827", "#2368a6", "#6650a4"][index] || "#111827";
  return ["#c93434", "#b87508", "#1f8f5f"][index] || "#c93434";
}

function drawStirrupNotes(ctx, beam, x0, x1, y, scale) {
  const s = beam.stirrups;
  const leftRange = number(s.leftRange, 0);
  const rightRange = number(s.rightRange, 0);
  fillRect(ctx, x0, y - 22, leftRange * scale, 26, "rgba(35,104,166,0.12)");
  fillRect(ctx, x1 - rightRange * scale, y - 22, rightRange * scale, 26, "rgba(35,104,166,0.12)");
  detailText(ctx, `${s.barNo} 左@${s.leftSpacing}cm x ${stirrupCount(s.leftCount, s.leftRange, s.leftSpacing)}只`, x0 + 8, y, 17, "#2368a6");
  detailText(ctx, `中@${s.midSpacing}cm x ${stirrupCount(s.midCount, Math.max(0, beam.span - leftRange - rightRange), s.midSpacing)}只`, x0 + (x1 - x0) / 2 - 74, y, 17, "#2368a6");
  detailText(ctx, `右@${s.rightSpacing}cm x ${stirrupCount(s.rightCount, s.rightRange, s.rightSpacing)}只`, x1 - 188, y, 17, "#2368a6");
}

function drawBeamDetailSection(ctx, x, y, beam) {
  rect(ctx, x, y, 96, 132, "transparent", "#566879", 1.5);
  detailText(ctx, `${beam.width}`, x + 30, y - 12, 16, "#182026");
  detailText(ctx, `${beam.depth}`, x + 104, y + 70, 16, "#182026");
  beam.topLayers.forEach((layer, li) => {
    const count = Math.min(5, Math.max(number(layer.left, 0), number(layer.mid, 0), number(layer.right, 0)));
    for (let i = 0; i < count; i += 1) dot(ctx, x + 18 + i * 15, y + 18 + li * 16, 4, layerColor(li, true));
  });
  beam.bottomLayers.forEach((layer, li) => {
    const count = Math.min(5, Math.max(number(layer.left, 0), number(layer.mid, 0), number(layer.right, 0)));
    for (let i = 0; i < count; i += 1) dot(ctx, x + 18 + i * 15, y + 112 - li * 16, 4, layerColor(li, false));
  });
}

function drawTitleBlock(ctx, beam) {
  rect(ctx, 770, 512, 392, 58, "transparent", "#182026", 1);
  line(ctx, 770, 541, 1162, 541, "#182026", 1);
  line(ctx, 910, 512, 910, 570, "#182026", 1);
  detailText(ctx, "圖名", 790, 533, 16, "#182026");
  detailText(ctx, `梁施工圖 - ${beam.id}`, 930, 533, 16, "#182026");
  detailText(ctx, "備註", 790, 562, 16, "#182026");
  detailText(ctx, "搭接區依標準圖檢核", 930, 562, 15, "#c93434");
}

function detailText(ctx, text, x, y, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px Microsoft JhengHei`;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function cutoffText(ratio) {
  if (Math.abs(ratio - 1 / 3) < 0.02) return "L/3";
  if (Math.abs(ratio - 1 / 4) < 0.02) return "L/4";
  return `${ratio.toFixed(2)}L`;
}

function drawColumn2d(ctx, calc) {
  const d = calc.data;
  const x = 520;
  const top = 92;
  const h = 410;
  const w = 170;
  const story = number(d.storyHeight, 360);
  const scale = h / story;
  const lapY = top + h - splicePosition("column", d) * scale;
  const zone = legalZone("column", d);

  rect(ctx, x, top, w, h, "#f9fafb", "#566879", 2);
  fillRect(ctx, x - 42, top + h - zone.end * scale, w + 84, (zone.end - zone.start) * scale, "rgba(31,143,95,0.18)");
  fillRect(ctx, x - 42, top + h - number(state.params.floorWarning, 5) * scale, w + 84, number(state.params.floorWarning, 5) * scale, "rgba(201,52,52,0.16)");
  fillRect(ctx, x - 42, top, w + 84, number(state.params.floorWarning, 5) * scale, "rgba(201,52,52,0.16)");
  label(ctx, "柱筋續接區：柱淨高中間 1/2", x - 230, top + h / 2, "#1f8f5f");
  label(ctx, "樓版 5cm 內警示", x + w + 52, top + 22, "#c93434");

  for (let i = 0; i < 4; i += 1) {
    const bx = x + 28 + i * 38;
    line(ctx, bx, top + 10, bx, top + h - 10, barColors[d.barNo], 7);
    coupler(ctx, bx, lapY, calc.compliance.ok);
  }
  dimension(ctx, x + w + 80, top, x + w + 80, top + h, `樓層淨高 ${story}cm`);
  dimension(ctx, x - 80, lapY, x - 80, top + h, `續接高度 ${Math.round(splicePosition("column", d))}cm`);
  label(ctx, `C-M1 ${d.mainBars}-${d.barNo}`, x - 145, top + h + 38, "#182026");
  drawColumnSection(ctx, 145, 190, d);
}

function drawWall2d(ctx, calc) {
  const d = calc.data;
  const x = 110;
  const y = 120;
  const w = 900;
  const h = 320;
  const length = number(d.length, 520);
  const scale = w / length;
  const lapX = x + splicePosition("wall", d) * scale;
  const zone = legalZone("wall", d);
  const openingW = number(d.openingWidth, 110) * scale;
  const openingH = Math.min(120, number(d.openingHeight, 90) * (h / number(d.height, 320)));

  rect(ctx, x, y, w, h, "#f9fafb", "#566879", 2);
  fillRect(ctx, x + zone.start * scale, y, (zone.end - zone.start) * scale, h, "rgba(31,143,95,0.15)");
  for (let gx = x + 28; gx < x + w; gx += number(d.spacing, 15) * scale) line(ctx, gx, y + 10, gx, y + h - 10, barColors[d.barNo], 2);
  for (let gy = y + 24; gy < y + h; gy += 32) line(ctx, x + 10, gy, x + w - 10, barColors[d.barNo], 2);
  rect(ctx, x + w / 2 - openingW / 2, y + h / 2 - openingH / 2, openingW, openingH, "#ffffff", "#c93434", 3);
  label(ctx, "開口補強筋 W-R1", x + w / 2 - openingW / 2 - 4, y + h / 2 - openingH / 2 - 12, "#c93434");
  coupler(ctx, lapX, y + h / 2, calc.compliance.ok);
  label(ctx, `受力方向 ${d.direction}，建議搭接區`, x + zone.start * scale + 10, y + 28, "#1f8f5f");
  label(ctx, `W-V1/W-H1 ${d.barNo}@${d.spacing}`, x + 14, y + h + 36, "#182026");
  dimension(ctx, x, y + h + 68, x + w, y + h + 68, `牆長 ${length}cm`);
  arrow(ctx, x + 52, y + 52, d.direction === "X" ? x + 180 : x + 52, d.direction === "X" ? y + 52 : y + 180, "#2368a6");
}

function drawBeamSection(ctx, x, y, d) {
  rect(ctx, x, y, 130, 120, "#ffffff", "#566879", 2);
  label(ctx, "梁剖面", x + 36, y - 12, "#182026");
  const cover = 18;
  rect(ctx, x + cover, y + cover, 130 - cover * 2, 120 - cover * 2, "transparent", "#cfd8dd", 1);
  const topMax = Math.max(number(d.topBarsLeft, 3), number(d.topBarsMid, 3), number(d.topBarsRight, 3));
  for (let i = 0; i < Math.min(5, topMax); i += 1) dot(ctx, x + 22 + i * 21, y + 30, 7, barColors[d.barNo]);
  for (let i = 0; i < Math.min(4, number(d.bottomBars, 4)); i += 1) dot(ctx, x + 30 + i * 23, y + 94, 7, barColors[d.barNo]);
  label(ctx, "T1", x + 104, y + 35, "#6650a4");
  label(ctx, "B1", x + 104, y + 99, "#6650a4");
}

function drawColumnSection(ctx, x, y, d) {
  rect(ctx, x, y, 150, 150, "#ffffff", "#566879", 2);
  label(ctx, "柱斷面示意", x, y - 14, "#182026");
  [[26, 26], [75, 26], [124, 26], [26, 75], [124, 75], [26, 124], [75, 124], [124, 124]].forEach(([dx, dy]) => dot(ctx, x + dx, y + dy, 7, barColors[d.barNo]));
  rect(ctx, x + 17, y + 17, 116, 116, "transparent", "#2368a6", 2);
}

function drawWarnings(ctx, calc) {
  const messages = calc.compliance.warnings.length ? calc.compliance.warnings : ["規範檢核通過"];
  const color = calc.compliance.ok ? (calc.compliance.warnings.length ? "#b87508" : "#1f8f5f") : "#c93434";
  messages.forEach((text, index) => label(ctx, `警示：${text}`, 34, 548 + index * 28, color));
}

function draw3dAxes(ctx) {
  arrow(ctx, 52, 520, 150, 520, "#c93434");
  arrow(ctx, 52, 520, 52, 430, "#1f8f5f");
  arrow(ctx, 52, 520, 118, 468, "#2368a6");
  label(ctx, "X", 160, 525, "#c93434");
  label(ctx, "Y", 48, 420, "#1f8f5f");
  label(ctx, "Z", 126, 465, "#2368a6");
}

function project(x, y, z) {
  return {
    x: 115 + x * 0.9 + z * 0.48,
    y: 500 - y * 0.8 - z * 0.28
  };
}

function drawBeam3d(ctx, calc) {
  const d = calc.data;
  const len = 520;
  const width = 95;
  const depth = 120;
  drawBox(ctx, 80, 50, 0, len, width, depth);
  const lap = 80 + len * number(d.lapRatio, 0.5);
  const zTop = depth - 22;
  const zBottom = 22;
  for (let i = 0; i < 4; i += 1) {
    const yy = 68 + i * 18;
    bar3d(ctx, 95, yy, zTop, 570, yy, zTop, barColors[d.barNo], 6);
    bar3d(ctx, 95, yy, zBottom, 570, yy, zBottom, barColors[d.barNo], 6);
  }
  drawCoupler3d(ctx, lap, 96, zTop, calc.compliance.ok);
}

function drawColumn3d(ctx, calc) {
  const d = calc.data;
  drawBox(ctx, 230, 70, 0, 130, 130, 390);
  const lapZ = 390 * number(d.lapRatio, 0.5);
  [[250, 92], [320, 92], [250, 170], [320, 170]].forEach(([x, y]) => {
    bar3d(ctx, x, y, 12, x, y, 440, barColors[d.barNo], 6);
    drawCoupler3d(ctx, x, y, lapZ, calc.compliance.ok);
  });
}

function drawWall3d(ctx, calc) {
  const d = calc.data;
  drawBox(ctx, 85, 90, 0, 520, 40, 270);
  const lap = 85 + 520 * number(d.lapRatio, 0.42);
  for (let x = 110; x < 590; x += 36) bar3d(ctx, x, 112, 20, x, 112, 250, barColors[d.barNo], 3);
  for (let z = 42; z < 250; z += 36) bar3d(ctx, 95, 115, z, 590, 115, z, barColors[d.barNo], 3);
  drawCoupler3d(ctx, lap, 115, 145, calc.compliance.ok);
}

function drawBox(ctx, x, y, z, w, d, h) {
  const a = project(x, y, z);
  const b = project(x + w, y, z);
  const c = project(x + w, y + d, z);
  const e = project(x, y + d, z);
  const at = project(x, y, z + h);
  const bt = project(x + w, y, z + h);
  const ct = project(x + w, y + d, z + h);
  const et = project(x, y + d, z + h);
  poly(ctx, [a, b, c, e], "rgba(86,104,121,0.08)", "#8fa0aa");
  poly(ctx, [at, bt, ct, et], "rgba(86,104,121,0.06)", "#8fa0aa");
  [[a, at], [b, bt], [c, ct], [e, et]].forEach(([p, q]) => line(ctx, p.x, p.y, q.x, q.y, "#8fa0aa", 1));
}

function bar3d(ctx, x1, y1, z1, x2, y2, z2, color, width) {
  const a = project(x1, y1, z1);
  const b = project(x2, y2, z2);
  line(ctx, a.x, a.y, b.x, b.y, color, width);
}

function drawCoupler3d(ctx, x, y, z, ok) {
  const p = project(x, y, z);
  const color = ok ? "#182026" : "#c93434";
  rect(ctx, p.x - 11, p.y - 11, 22, 22, color, color, 2);
  drag3d = { x: p.x, y: p.y, r: 24 };
}

function rect(ctx, x, y, w, h, fill, stroke, lineWidth) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  if (fill !== "transparent") ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

function fillRect(ctx, x, y, w, h, fill) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function poly(ctx, points, fill, stroke) {
  ctx.save();
  ctx.beginPath();
  points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function dot(ctx, x, y, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function coupler(ctx, x, y, ok) {
  const color = ok ? "#182026" : "#c93434";
  rect(ctx, x - 13, y - 13, 26, 26, color, color, 2);
}

function label(ctx, text, x, y, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "700 23px Microsoft JhengHei";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function arrow(ctx, x1, y1, x2, y2, color) {
  line(ctx, x1, y1, x2, y2, color, 3);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const len = 11;
  line(ctx, x2, y2, x2 - len * Math.cos(angle - 0.45), y2 - len * Math.sin(angle - 0.45), color, 3);
  line(ctx, x2, y2, x2 - len * Math.cos(angle + 0.45), y2 - len * Math.sin(angle + 0.45), color, 3);
}

function dimension(ctx, x1, y1, x2, y2, text) {
  line(ctx, x1, y1, x2, y2, "#566879", 1.5);
  dot(ctx, x1, y1, 3, "#566879");
  dot(ctx, x2, y2, 3, "#566879");
  label(ctx, text, (x1 + x2) / 2 - 45, (y1 + y2) / 2 - 8, "#566879");
}

function bind3dDrag() {
  let dragging = false;
  els.c3d.addEventListener("pointerdown", (event) => {
    if (!drag3d) return;
    const pos = canvasPoint(els.c3d, event);
    const dist = Math.hypot(pos.x - drag3d.x, pos.y - drag3d.y);
    if (dist <= drag3d.r) {
      dragging = true;
      els.c3d.setPointerCapture(event.pointerId);
    }
  });
  els.c3d.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const pos = canvasPoint(els.c3d, event);
    const component = state.component;
    const ratio = component === "column"
      ? Math.max(0.08, Math.min(0.92, (500 - pos.y) / 390))
      : Math.max(0.08, Math.min(0.92, (pos.x - 180) / 470));
    state[component].lapRatio = Number(ratio.toFixed(3));
    const control = document.querySelector(`[data-scope="${component}"][data-key="lapRatio"]`);
    if (control) control.value = state[component].lapRatio;
    update();
  });
  els.c3d.addEventListener("pointerup", (event) => {
    if (!dragging) return;
    dragging = false;
    els.c3d.releasePointerCapture(event.pointerId);
    logChange("3D ??敺株矽", `${componentName(state.component)}蝥雿蔭瘥? = ${state[state.component].lapRatio}`);
  });
}

function bind2dDrag() {
  let dragging = false;
  let activeHandle = null;
  els.c2d.addEventListener("pointerdown", (event) => {
    const pos = canvasPoint(els.c2d, event);
    activeHandle = drag2dHandles.find((handle) => Math.hypot(pos.x - handle.x, pos.y - handle.y) <= handle.r) || null;
    if (activeHandle) {
      dragging = true;
      try {
        els.c2d.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic pointer events used in automated checks may not own capture.
      }
    }
  });
  els.c2d.addEventListener("pointermove", (event) => {
    if (!dragging || !activeHandle) return;
    const pos = canvasPoint(els.c2d, event);
    const beam = state.beamBench.beams[activeHandle.beamId];
    if (!beam) return;
    const beamIndex = state.beamBench.sequence.findIndex((id) => id === activeHandle.beamId);
    const beforeItems = state.beamBench.sequence.slice(0, beamIndex);
    const leftCm = beforeItems.reduce((sum, id, index) => {
      if (index % 2 === 0) return sum + number(state.beamBench.columns[id]?.width, 70);
      return sum + number(state.beamBench.beams[id]?.span, 0);
    }, 0);
    const totalColumnWidth = state.beamBench.sequence
      .filter((_, index) => index % 2 === 0)
      .reduce((sum, id) => sum + number(state.beamBench.columns[id]?.width, 70), 0);
    const totalSpan = state.beamBench.sequence
      .filter((_, index) => index % 2 === 1)
      .reduce((sum, id) => sum + number(state.beamBench.beams[id]?.span, 0), 0) + totalColumnWidth;
    const xStart = 90;
    const xEnd = 1080;
    const scale = (xEnd - xStart) / Math.max(1, totalSpan);
    const beamX0 = xStart + leftCm * scale;
    const ratio = Math.max(0.05, Math.min(0.95, (pos.x - beamX0) / (number(beam.span, 1) * scale)));
    beam[activeHandle.ratioKey || "topLapPointRatio"] = Number(ratio.toFixed(3));
    update();
  });
  els.c2d.addEventListener("pointerup", (event) => {
    if (!dragging) return;
    dragging = false;
    try {
      els.c2d.releasePointerCapture(event.pointerId);
    } catch {
      // See pointerdown capture guard.
    }
    const beam = activeHandle ? state.beamBench.beams[activeHandle.beamId] : null;
    const ratioKey = activeHandle?.ratioKey || "topLapPointRatio";
    if (beam) logChange("2D 搭接點", `${beam.id} ${ratioKey === "bottomLapPointRatio" ? "下層" : "上層"}搭接點比例 = ${beam[ratioKey]}`);
    activeHandle = null;
  });
}

function canvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const logical = logicalSize(canvas);
  return {
    x: (event.clientX - rect.left) * (logical.width / rect.width),
    y: (event.clientY - rect.top) * (logical.height / rect.height)
  };
}

function renderLapTable() {
  ensureLapProfiles();
  const lapTableBody = document.querySelector("#lapTableBody");
  if (!lapTableBody) return;
  lapTableBody.innerHTML = "";
  const profileId = state.params.activeLapProfile;
  const profileData = state.params.lapProfiles[profileId].data;

  Object.keys(barDb).forEach((barNo) => {
    const tr = document.createElement("tr");
    const tdNo = document.createElement("td");
    tdNo.innerHTML = `<strong style="color:${barColors[barNo]}">${barNo}</strong>`;
    tr.append(tdNo);
    [
      { lapClass: "A", isTop: false, key: `${barNo}-A-normal` },
      { lapClass: "B", isTop: false, key: `${barNo}-B-normal` },
      { lapClass: "A", isTop: true, key: `${barNo}-A-top` },
      { lapClass: "B", isTop: true, key: `${barNo}-B-top` }
    ].forEach((variation) => {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      input.className = "lap-input";
      input.placeholder = `${getFormulaLap(barNo, variation.lapClass, variation.isTop)}`;
      input.value = profileData[variation.key] || "";
      if (profileData[variation.key]) input.classList.add("overridden");
      input.addEventListener("change", () => {
        const value = number(input.value, 0);
        if (value > 0) profileData[variation.key] = value;
        else delete profileData[variation.key];
        renderLapTable();
        logChange("專案搭接表更新", `${barNo} ${variation.isTop ? "頂層" : "一般"} ${variation.lapClass}級 = ${value > 0 ? `${value}cm` : "恢復預設"}`);
        update();
      });
      td.append(input);
      tr.append(td);
    });
    lapTableBody.append(tr);
  });

  const select = document.querySelector("#lapProfileSelect");
  if (select) {
    select.innerHTML = "";
    Object.keys(state.params.lapProfiles).forEach((profileKey) => {
      const option = document.createElement("option");
      option.value = profileKey;
      option.textContent = state.params.lapProfiles[profileKey].name;
      select.append(option);
    });
    select.value = profileId;
  }
}

function ensureLapProfiles() {
  if (!state.params.lapProfiles) {
    state.params.lapProfiles = { default: { name: "系統預設 (規範公式)", data: {} } };
  }
  if (!state.params.activeLapProfile || !state.params.lapProfiles[state.params.activeLapProfile]) {
    state.params.activeLapProfile = "default";
  }
  Object.values(state.params.lapProfiles).forEach((profile) => {
    if (!profile.data) profile.data = {};
  });
}

function renderFormulaConfig() {
  const map = {
    cfg_alpha: "alpha",
    cfg_beta: "beta",
    cfg_gamma: "gamma",
    cfg_lambda: "lambda",
    cfg_ldh_mult: "ldhMultiplier",
    cfg_weight: "weightFormula"
  };
  state.params.formula = { ...clone(defaults.params.formula), ...(state.params.formula || {}) };
  Object.entries(map).forEach(([id, key]) => {
    const input = document.querySelector(`#${id}`);
    if (!input) return;
    input.value = state.params.formula[key];
    input.oninput = () => {
      state.params.formula[key] = input.type === "number"
        ? number(input.value, defaults.params.formula[key])
        : input.value;
      logChange("公式設定", `${key} = ${input.value}`);
      update();
    };
  });
}

function saveProject() {
  localStorage.setItem("rebar-smart-project", JSON.stringify(state));
  logChange("專案儲存", "資料已儲存在本機瀏覽器");
  update();
}

function loadProject() {
  const saved = localStorage.getItem("rebar-smart-project");
  if (!saved) {
    logChange("專案載入", "找不到已儲存的資料");
    renderLog();
    return;
  }
  state = normalizeProject(JSON.parse(saved));
  document.querySelectorAll("[data-component]").forEach((button) => {
    button.classList.toggle("active", button.dataset.component === state.component);
  });
  syncParamControls();
  applyTheme();
  renderForm();
  renderFormulaConfig();
  renderLapTable();
  renderBeamBench();
  logChange("專案載入", "資料已載入");
  update();
}

function exportCsv() {
  const calc = calculate();
  const bench = calculateBeamBench();
  const header = ["序號", "梁號", "標記", "號數", "支數", "單支長度(cm)", "總長(m)", "重量(kg)", "備註"];
  const sourceRows = state.component === "beam" && bench.bars.length ? bench.bars : calc.bars;
  const lines = [header, ...sourceRows.map((item) => [
    item.id,
    item.beamId || calc.data.code,
    item.mark,
    item.barNo,
    item.count,
    item.lengthCm.toFixed(0),
    item.totalLength.toFixed(2),
    item.weight.toFixed(1),
    item.note
  ])];
  const csv = "\ufeff" + lines.map((line) => line.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${state.component === "beam" && bench.bars.length ? "梁台" : calc.data.code}-鋼筋料單.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  logChange("料單匯出", `${calc.data.code} CSV 已匯出`);
  update();
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function logChange(source, detail) {
  const time = new Date().toLocaleTimeString("zh-TW", { hour12: false });
  const last = state.log[0];
  if (last && last.source === source && last.detail === detail) return;
  state.log.unshift({ time, source, detail });
  state.log = state.log.slice(0, 80);
}

window.addEventListener("resize", update);

bindStaticControls();
applyTheme();
renderForm();
renderFormulaConfig();
renderLapTable();
renderBeamBench();
logChange("系統啟動", "梁筋撿料資料已初始化");
update();

