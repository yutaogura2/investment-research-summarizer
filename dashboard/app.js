const catalog = [
  { id: "financials", name: "財務諸表・開示資料", use: "売上、利益、キャッシュフロー、資本効率、財務安全性を検証する。", metrics: ["売上高・利益・EPS", "営業CF・FCF", "ROIC・負債・自己資本比率"] },
  { id: "market", name: "株価・流動性・テクニカル需給", use: "投資可能性、ポジションサイズ、売買コスト、需給の歪みを判断する。", metrics: ["時価総額・浮動株", "売買代金・スプレッド", "相対リターン・ボラティリティ"] },
  { id: "valuation", name: "バリュエーション", use: "価格に織り込まれた成長・利益率・資本コストを推定する。", metrics: ["PER・EV/EBITDA・PBR", "FCF利回り", "DCF・SOTP・同業比較"] },
  { id: "estimates", name: "業績予想・コンセンサス", use: "市場期待、上方修正・下方修正余地、決算サプライズ確率を把握する。", metrics: ["会社計画との差", "EPS予想修正", "目標株価・レーティング分布"] },
  { id: "ownership_flows", name: "保有・資金フロー", use: "誰が買っているか、混雑しているか、売り圧力・買い圧力が残るかを見る。", metrics: ["主要株主・13F", "ETF・指数イベント", "空売り・信用・インサイダー"] },
  { id: "macro_rates_fx", name: "マクロ・金利・為替", use: "業績・倍率・資金フローに影響する外部環境を把握する。", metrics: ["政策金利・国債利回り", "為替感応度", "PMI・雇用・商品価格"] },
  { id: "sector_competition", name: "業界・競争環境", use: "個社要因と業界サイクルを分離し、競争優位を評価する。", metrics: ["市場成長率・シェア", "競合マージン", "価格・在庫・稼働率"] },
  { id: "capital_allocation", name: "資本政策・M&A", use: "経営陣が資本を高リターンで配分しているか判断する。", metrics: ["ROIC vs WACC", "配当・自社株買い", "M&A価格・希薄化"] },
  { id: "governance_legal", name: "ガバナンス・法務", use: "少数株主保護、経営の質、重大な法務・規制リスクを評価する。", metrics: ["取締役独立性", "報酬KPI", "訴訟・規制・監査"] },
  { id: "events_catalysts", name: "イベント・カタリスト", use: "株価が動く時期と要因を整理し、時間軸を決める。", metrics: ["決算日・説明会", "製品・承認・規制", "指数入替・ロックアップ"] },
  { id: "risk_scenarios", name: "リスク・シナリオ", use: "ベース、ブル、ベアの期待値と損失許容度を明確にする。", metrics: ["反証条件", "最大損失・期待値", "相関・流動性ストレス"] }
];

const sampleData = {
  schema_version: "1.1",
  company: { ticker: "EXM", name: "Example Manufacturing Inc.", market: "US", sector: "Industrials", currency: "USD", as_of: "2026-06-26" },
  thesis: "産業自動化向け部品の需要回復と価格改定により利益率が改善する、という仮説を検証する。",
  evidence: [
    { category: "financials", item: "売上成長", value: "直近期売上は前年比 +8.2%", interpretation: "数量回復に加え、価格改定が寄与。M&A寄与は小さいためオーガニック成長として評価しやすい。", source: "FY2025 Form 10-K", source_url: "https://www.sec.gov/search-filings", date: "2026-02-15", confidence: "high", direction: "positive", materiality: "high", source_type: "primary_filing" },
    { category: "financials", item: "営業利益率", value: "営業利益率は 12.4% から 14.1% に改善", interpretation: "値上げと原材料価格の落ち着きが寄与。固定費削減は一部一過性の可能性がある。", source: "Company earnings release", source_url: "", date: "2026-02-15", confidence: "medium", direction: "positive", materiality: "high", source_type: "company_ir" },
    { category: "valuation", item: "相対バリュエーション", value: "EV/EBITDA は同業中央値 11.0x に対して 8.7x", interpretation: "成長率が同業並みなら割安。ただし小型株ディスカウントと流動性の低さを考慮する必要がある。", source: "Manual peer model", source_url: "", date: "2026-06-20", confidence: "medium", direction: "positive", materiality: "high", source_type: "manual_model" },
    { category: "estimates", item: "コンセンサス修正", value: "直近90日で来期EPS予想は -3.5%", interpretation: "短期的には受注回復の遅れが織り込まれ始めている。次回決算で受注残の確認が必要。", source: "Manual consensus snapshot", source_url: "", date: "2026-06-18", confidence: "medium", direction: "negative", materiality: "high", source_type: "consensus" },
    { category: "market", item: "流動性", value: "20日平均売買代金は約 18百万ドル", interpretation: "個人投資家には十分だが、大型ファンドではポジション構築に数日を要する可能性がある。", source: "Exchange price history", source_url: "", date: "2026-06-25", confidence: "medium", direction: "neutral", materiality: "medium", source_type: "market_data" },
    { category: "macro_rates_fx", item: "原材料感応度", value: "銅価格 10% 上昇で営業利益率に約 -40bp の影響", interpretation: "価格転嫁に時間差があるため、銅価格上昇局面では短期マージンに逆風。", source: "Management sensitivity disclosure", source_url: "", date: "2026-03-10", confidence: "medium", direction: "negative", materiality: "medium", source_type: "company_ir" },
    { category: "sector_competition", item: "競争環境", value: "主要競合2社が設備投資を抑制", interpretation: "供給過剰リスクは低下しているが、需要回復が遅い場合は価格競争再燃の可能性がある。", source: "Competitor filings", source_url: "https://www.sec.gov/search-filings", date: "2026-05-30", confidence: "low", direction: "positive", materiality: "medium", source_type: "primary_filing" },
    { category: "events_catalysts", item: "次回決算", value: "次回決算で受注残、価格改定の継続性、在庫水準を確認", interpretation: "投資仮説の短期検証点。受注残が横ばい以下ならベースシナリオを引き下げる。", source: "Internal research calendar", source_url: "", date: "2026-06-26", confidence: "high", direction: "neutral", materiality: "medium", source_type: "internal" },
    { category: "risk_scenarios", item: "反証条件", value: "受注残が2四半期連続で前年比マイナス、または営業利益率が13%未満に低下", interpretation: "需要回復と価格転嫁の仮説が崩れるため、ポジション縮小を検討する条件。", source: "Internal scenario model", source_url: "", date: "2026-06-26", confidence: "medium", direction: "negative", materiality: "high", source_type: "internal" }
  ],
  financials: {
    kpis: [
      { fy: 2023, revenue: 1120000000, revenue_growth: null, operating_margin: 0.124, fcf: 84000000, fcf_margin: 0.075, roe: 0.11, liability_ratio: 0.424 },
      { fy: 2024, revenue: 1198000000, revenue_growth: 0.0696, operating_margin: 0.13, fcf: 95000000, fcf_margin: 0.079, roe: 0.115, liability_ratio: 0.421 },
      { fy: 2025, revenue: 1296000000, revenue_growth: 0.0818, operating_margin: 0.141, fcf: 114000000, fcf_margin: 0.088, roe: 0.13, liability_ratio: 0.411 }
    ]
  },
  valuation: {
    currency: "USD",
    shares_outstanding: 50000000,
    net_debt: 220000000,
    current_price: 22.5,
    scenarios: [
      { name: "Bear", probability: 0.25, revenue: 1240000000, ebitda_margin: 0.15, ev_ebitda: 7.0 },
      { name: "Base", probability: 0.5, revenue: 1380000000, ebitda_margin: 0.18, ev_ebitda: 8.7 },
      { name: "Bull", probability: 0.25, revenue: 1490000000, ebitda_margin: 0.2, ev_ebitda: 10.5 }
    ]
  },
  portfolio: {
    portfolio_value: 10000000,
    current_weight: 0,
    proposed_weight: 0.01,
    sector_weight: 0.08,
    max_position_weight: 0.04,
    max_sector_weight: 0.25,
    tags: ["Industrials", "Cyclical", "USD"]
  }
};

const confidenceWeight = { high: 1.25, medium: 1, low: 0.65 };
const directionWeight = { positive: 1, negative: -1, neutral: 0, mixed: 0, unknown: 0 };
const materialityWeight = { high: 1.35, medium: 1, low: 0.7 };
const sourceQualityWeight = { primary_filing: 1.35, exchange: 1.25, regulator: 1.25, company_ir: 1.15, market_data: 1.05, consensus: 1, sell_side: 0.95, manual_model: 0.85, news: 0.8, internal: 0.75, unknown: 0.55 };

const storageKeys = {
  watchlist: "irs_watchlist_v2",
  decisionLog: "irs_decision_log_v2",
  reviews: "irs_reviews_v2",
  settings: "irs_settings_v2"
};

const defaultSettings = {
  minCoveragePct: 85,
  minPrimaryRatioPct: 40,
  minExpectedReturnPct: 10,
  minRiskReward: 1,
  maxBearLossPct: -35,
  maxPositionPct: 4,
  maxSectorPct: 25,
  staleDays: {
    financials: 120,
    market: 30,
    valuation: 30,
    estimates: 21,
    ownership_flows: 30,
    macro_rates_fx: 45,
    sector_competition: 90,
    capital_allocation: 180,
    governance_legal: 180,
    events_catalysts: 30,
    risk_scenarios: 45
  }
};

const jsonInput = document.querySelector("#jsonInput");
const summaryOutput = document.querySelector("#summaryOutput");
const errorBox = document.querySelector("#errorBox");
const scoreBox = document.querySelector("#scoreBox");
const asOfLabel = document.querySelector("#asOfLabel");
const coverageLabel = document.querySelector("#coverageLabel");
const catalogGrid = document.querySelector("#catalogGrid");
const auditStrip = document.querySelector("#auditStrip");
const evidenceForm = document.querySelector("#evidenceForm");
const watchlistSelect = document.querySelector("#watchlistSelect");
const storageStatus = document.querySelector("#storageStatus");
const reviewNote = document.querySelector("#reviewNote");
const settingsFields = {
  coverage: document.querySelector("#settingCoverage"),
  primaryRatio: document.querySelector("#settingPrimaryRatio"),
  expectedReturn: document.querySelector("#settingExpectedReturn"),
  bearLoss: document.querySelector("#settingBearLoss"),
  riskReward: document.querySelector("#settingRiskReward"),
  maxPosition: document.querySelector("#settingMaxPosition"),
  maxSector: document.querySelector("#settingMaxSector")
};

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function pct(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return `${(Number(value) * 100).toFixed(digits)}%`;
}

function compactNumber(value, currency = "") {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  const sign = number < 0 ? "-" : "";
  const abs = Math.abs(number);
  const units = [
    [1_000_000_000_000, "T"],
    [1_000_000_000, "B"],
    [1_000_000, "M"],
    [1_000, "K"]
  ];
  for (const [divisor, suffix] of units) {
    if (abs >= divisor) return `${sign}${currency}${(abs / divisor).toFixed(2)}${suffix}`;
  }
  return `${sign}${currency}${abs.toFixed(abs >= 10 ? 0 : 2)}`;
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function currentTicker(data) {
  return String(data?.company?.ticker || data?.company?.name || "research").trim() || "research";
}

function statusMessage(message) {
  if (storageStatus) storageStatus.textContent = `保存状態: ${message}`;
}

function loadSettings() {
  const saved = readStorage(storageKeys.settings, {});
  return {
    ...defaultSettings,
    ...saved,
    staleDays: { ...defaultSettings.staleDays, ...(saved.staleDays || {}) }
  };
}

function saveSettingsFromForm() {
  const settings = loadSettings();
  settings.minCoveragePct = Number(settingsFields.coverage.value || defaultSettings.minCoveragePct);
  settings.minPrimaryRatioPct = Number(settingsFields.primaryRatio.value || defaultSettings.minPrimaryRatioPct);
  settings.minExpectedReturnPct = Number(settingsFields.expectedReturn.value || defaultSettings.minExpectedReturnPct);
  settings.maxBearLossPct = Number(settingsFields.bearLoss.value || defaultSettings.maxBearLossPct);
  settings.minRiskReward = Number(settingsFields.riskReward.value || defaultSettings.minRiskReward);
  settings.maxPositionPct = Number(settingsFields.maxPosition.value || defaultSettings.maxPositionPct);
  settings.maxSectorPct = Number(settingsFields.maxSector.value || defaultSettings.maxSectorPct);
  writeStorage(storageKeys.settings, settings);
  statusMessage("しきい値を保存しました");
  summarizeFromInput();
}

function populateSettingsForm() {
  const settings = loadSettings();
  settingsFields.coverage.value = settings.minCoveragePct;
  settingsFields.primaryRatio.value = settings.minPrimaryRatioPct;
  settingsFields.expectedReturn.value = settings.minExpectedReturnPct;
  settingsFields.bearLoss.value = settings.maxBearLossPct;
  settingsFields.riskReward.value = settings.minRiskReward;
  settingsFields.maxPosition.value = settings.maxPositionPct;
  settingsFields.maxSector.value = settings.maxSectorPct;
}

function resetSettings() {
  writeStorage(storageKeys.settings, defaultSettings);
  populateSettingsForm();
  statusMessage("しきい値を初期化しました");
  summarizeFromInput();
}

function parseData() {
  return parseResearchInput().primary;
}

function researchItemsFromParsed(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.companies)) return parsed.companies;
  if (Array.isArray(parsed?.research)) return parsed.research;
  return [parsed];
}

function assertResearchShape(data, index = 0) {
  const prefix = index ? `companies[${index}]` : "root";
  if (!data || typeof data !== "object") throw new Error(`${prefix} はオブジェクトで入力してください。`);
  if (!data.company || typeof data.company !== "object") throw new Error(`${prefix}.company オブジェクトが必要です。`);
  if (!Array.isArray(data.evidence)) throw new Error(`${prefix}.evidence は配列で入力してください。`);
}

function parseResearchInput() {
  const parsed = JSON.parse(jsonInput.value);
  const items = researchItemsFromParsed(parsed);
  if (!items.length) throw new Error("比較対象がありません。");
  items.forEach(assertResearchShape);
  return { parsed, items, primary: items[0] };
}

function inferSourceType(row) {
  const explicit = normalize(row.source_type);
  if (explicit in sourceQualityWeight) return explicit;
  const source = `${row.source || ""} ${row.source_url || ""}`.toLowerCase();
  if (source.includes("sec.gov") || source.includes("edinet") || source.includes("10-k") || source.includes("10-q")) return "primary_filing";
  if (source.includes("jpx") || source.includes("tdnet") || source.includes("exchange")) return "exchange";
  if (source.includes("fred") || source.includes("finra") || source.includes("cftc") || source.includes("boj")) return "regulator";
  if (source.includes("ir") || source.includes("company")) return "company_ir";
  if (source.includes("consensus") || source.includes("factset") || source.includes("visible alpha")) return "consensus";
  if (source.includes("manual") || source.includes("model")) return "manual_model";
  if (source.includes("internal")) return "internal";
  return "unknown";
}

function recencyWeight(dateText, asOfText) {
  const date = Date.parse(dateText || "");
  const asOf = Date.parse(asOfText || new Date().toISOString().slice(0, 10));
  if (!Number.isFinite(date) || !Number.isFinite(asOf)) return 0.45;
  const ageDays = Math.max(0, (asOf - date) / 86400000);
  if (ageDays <= 120) return 1.15;
  if (ageDays <= 365) return 1;
  if (ageDays <= 730) return 0.78;
  if (ageDays <= 1095) return 0.6;
  return 0.45;
}

function evidenceWeight(row, asOfText) {
  const confidence = normalize(row.confidence) || "medium";
  const materiality = normalize(row.materiality) || "medium";
  const sourceType = inferSourceType(row);
  const direction = normalize(row.direction) || "unknown";
  const weight = (confidenceWeight[confidence] ?? 0.8) * (materialityWeight[materiality] ?? 1) * (sourceQualityWeight[sourceType] ?? 0.55) * recencyWeight(row.date, asOfText);
  return { weight, sourceType, confidence, materiality, directionValue: directionWeight[direction] ?? 0 };
}

function validateData(data) {
  const issues = [];
  const categories = new Set(catalog.map((item) => item.id));
  const company = data.company || {};
  ["ticker", "name", "market", "currency", "as_of"].forEach((field) => {
    if (!String(company[field] || "").trim()) issues.push({ severity: "warning", path: `company.${field}`, message: `${field} が未入力です。` });
  });
  (data.evidence || []).forEach((row, index) => {
    const path = `evidence[${index}]`;
    ["category", "item", "value", "date", "confidence", "direction"].forEach((field) => {
      if (!String(row[field] || "").trim()) issues.push({ severity: "error", path: `${path}.${field}`, message: `${field} が未入力です。` });
    });
    if (row.category && !categories.has(normalize(row.category))) issues.push({ severity: "error", path: `${path}.category`, message: `未登録カテゴリです: ${row.category}` });
    if (row.date && !Number.isFinite(Date.parse(row.date))) issues.push({ severity: "error", path: `${path}.date`, message: "date は YYYY-MM-DD 形式にしてください。" });
    if (!row.source_url && ["primary_filing", "exchange", "regulator", "company_ir"].includes(inferSourceType(row))) issues.push({ severity: "warning", path: `${path}.source_url`, message: "一次情報・公的情報はURLを入れてください。" });
    if (recencyWeight(row.date, company.as_of) <= 0.6) issues.push({ severity: "warning", path: `${path}.date`, message: "データが古い可能性があります。" });
  });
  return issues;
}

function scoreEvidence(evidence, asOfText) {
  let total = 0;
  let totalAbs = 0;
  let weightedPositive = 0;
  let weightedNegative = 0;
  const counts = { positive: 0, negative: 0, neutral: 0, mixed: 0, unknown: 0 };
  evidence.forEach((row) => {
    const direction = normalize(row.direction) || "unknown";
    const scored = evidenceWeight(row, asOfText);
    const signed = scored.directionValue * scored.weight;
    total += signed;
    if (scored.directionValue > 0) {
      totalAbs += scored.weight;
      weightedPositive += scored.weight;
    } else if (scored.directionValue < 0) {
      totalAbs += scored.weight;
      weightedNegative += scored.weight;
    }
    counts[direction in counts ? direction : "unknown"] += 1;
  });
  const score = totalAbs === 0 ? 0 : Math.round((total / totalAbs) * 100);
  let stance = "中立または情報不足。現時点では優位性を判断しにくい。";
  if (score >= 45) stance = "強めにポジティブ。ただし未充足データと反証条件の確認が必要。";
  else if (score >= 15) stance = "ややポジティブ。追加データで確信度を上げる段階。";
  else if (score <= -45) stance = "ネガティブ材料が優勢。投資仮説の再検証が必要。";
  else if (score <= -15) stance = "ややネガティブ。下振れ要因の確認を優先。";
  return { score, stance, counts, weightedPositive, weightedNegative };
}

function coverage(evidence) {
  const categoryIds = catalog.map((item) => item.id);
  const covered = Array.from(new Set(evidence.map((row) => normalize(row.category)).filter(Boolean)));
  const coveredKnown = covered.filter((id) => categoryIds.includes(id));
  const missing = categoryIds.filter((id) => !coveredKnown.includes(id));
  return { pct: Math.round((coveredKnown.length / categoryIds.length) * 100), covered: coveredKnown, missing };
}

const missingPriorityConfig = {
  valuation: {
    priority: 100,
    reason: "期待リターンと下落余地が未確認だと投資候補化できない。",
    action: "現在価格を含むブル・ベース・ベアのシナリオを入力する。"
  },
  risk_scenarios: {
    priority: 98,
    reason: "反証条件と最大損失がないと、失敗時の撤退判断が遅れる。",
    action: "反証条件、ベアケース、損失許容度を明文化する。"
  },
  market: {
    priority: 92,
    reason: "流動性と売買コストが不明だとポジションサイズを決められない。",
    action: "時価総額、売買代金、スプレッド、ボラティリティを確認する。"
  },
  estimates: {
    priority: 88,
    reason: "市場期待との差が不明だと決算サプライズを評価しにくい。",
    action: "会社計画、コンセンサス、修正方向を確認する。"
  },
  ownership_flows: {
    priority: 84,
    reason: "需給の混雑や売り圧力が残ると、良いファンダメンタルでも株価が動きにくい。",
    action: "保有・需給・空売り・指数イベントを確認する。"
  },
  capital_allocation: {
    priority: 78,
    reason: "資本政策が悪いと、利益成長が株主価値に変わりにくい。",
    action: "自社株買い、配当、M&A、希薄化、ROIC/WACCを確認する。"
  },
  governance_legal: {
    priority: 76,
    reason: "ガバナンス・法務リスクは突然バリュエーションを壊す。",
    action: "ガバナンス、訴訟、規制、会計リスクを確認する。"
  },
  events_catalysts: {
    priority: 72,
    reason: "株価が動く時期が不明だと資金効率と監視頻度を決めにくい。",
    action: "決算、説明会、承認、指数入替などのイベント日程を確認する。"
  },
  financials: {
    priority: 68,
    reason: "一次財務データがないと投資仮説の土台が弱い。",
    action: "売上、利益率、FCF、資本効率、財務安全性を一次資料で確認する。"
  },
  sector_competition: {
    priority: 58,
    reason: "個社要因と業界サイクルを分けないと持続性を見誤る。",
    action: "市場成長率、競合マージン、価格・在庫・稼働率を確認する。"
  },
  macro_rates_fx: {
    priority: 48,
    reason: "外部環境の感応度が不明だとシナリオの前提が荒くなる。",
    action: "金利、為替、商品価格、PMIなどの感応度を確認する。"
  }
};

function prioritizeMissingData(missingIds = []) {
  return missingIds
    .map((id) => {
      const item = catalog.find((entry) => entry.id === id);
      const config = missingPriorityConfig[id] || {
        priority: 40,
        reason: "投資判断の抜け漏れを減らすため確認が必要。",
        action: `${item?.name || id}の一次情報と投資判断上の意味を確認する。`
      };
      return { id, name: item?.name || id, ...config };
    })
    .sort((a, b) => b.priority - a.priority);
}

function groupEvidence(evidence) {
  return evidence.reduce(
    (acc, row) => {
      const key = normalize(row.direction) || "unknown";
      const bucket = key in acc ? key : "unknown";
      acc[bucket].push(row);
      return acc;
    },
    { positive: [], negative: [], neutral: [], mixed: [], unknown: [] }
  );
}

function renderBullets(rows, fallback, asOfText) {
  if (!rows.length) return `<li>${escapeHtml(fallback)}</li>`;
  return rows
    .slice()
    .sort((a, b) => evidenceWeight(b, asOfText).weight - evidenceWeight(a, asOfText).weight)
    .slice(0, 5)
    .map((row) => {
      const scored = evidenceWeight(row, asOfText);
      const source = [row.source, row.date, row.confidence, row.materiality || "medium", scored.sourceType, `w=${scored.weight.toFixed(2)}`].filter(Boolean).join(" / ");
      return `<li><strong>${escapeHtml(row.item)}:</strong> ${escapeHtml(row.value)}. ${escapeHtml(row.interpretation)} <span class="muted">(${escapeHtml(source)})</span></li>`;
    })
    .join("");
}

function renderCatalog(coveredIds = []) {
  catalogGrid.innerHTML = catalog
    .map((item) => {
      const covered = coveredIds.includes(item.id);
      return `
        <article class="catalog-item">
          <div class="catalog-title-line">
            <h3>${escapeHtml(item.name)}</h3>
            <span class="tag ${covered ? "positive" : "neutral"}">${covered ? "入力あり" : "未入力"}</span>
          </div>
          <p>${escapeHtml(item.use)}</p>
          <ul>${item.metrics.map((metric) => `<li>${escapeHtml(metric)}</li>`).join("")}</ul>
        </article>
      `;
    })
    .join("");
}

function calculateValuation(valuation) {
  if (!valuation || !Array.isArray(valuation.scenarios)) return null;
  const shares = Number(valuation.shares_outstanding || 0);
  const netDebt = Number(valuation.net_debt || 0);
  const currentPrice = Number(valuation.current_price || 0);
  if (!shares) return null;
  let expectedPrice = 0;
  let probabilityTotal = 0;
  const rows = valuation.scenarios
    .map((row) => {
      const probability = Number(row.probability || 0);
      const revenue = Number(row.revenue || 0);
      const ebitdaMargin = Number(row.ebitda_margin || 0);
      const evEbitda = Number(row.ev_ebitda || 0);
      const ebitda = revenue * ebitdaMargin;
      const enterpriseValue = ebitda * evEbitda;
      const equityValue = enterpriseValue - netDebt;
      const price = equityValue / shares;
      expectedPrice += probability * price;
      probabilityTotal += probability;
      return { name: row.name || "", probability, revenue, ebitdaMargin, evEbitda, price };
    })
    .filter((row) => row.name);
  if (probabilityTotal && Math.abs(probabilityTotal - 1) > 0.01) expectedPrice = expectedPrice / probabilityTotal;
  return { currency: valuation.currency || "", currentPrice, expectedPrice, expectedReturn: currentPrice ? expectedPrice / currentPrice - 1 : null, rows };
}

function latestFinancialKpi(data) {
  const kpis = data.financials?.kpis;
  if (!Array.isArray(kpis) || !kpis.length) return null;
  return kpis.slice().sort((a, b) => Number(a.fy || 0) - Number(b.fy || 0)).at(-1);
}

function evaluateInvestability(data, score, cov, issues, valuation) {
  const settings = loadSettings();
  const minPrimaryRatio = settings.minPrimaryRatioPct / 100;
  const minCoverage = settings.minCoveragePct;
  const minExpectedReturn = settings.minExpectedReturnPct / 100;
  const maxBearLoss = settings.maxBearLossPct / 100;
  const evidence = data.evidence || [];
  const categories = new Set(evidence.map((row) => normalize(row.category)).filter(Boolean));
  const sourceTypes = evidence.map(inferSourceType);
  const institutionalSources = new Set(["primary_filing", "exchange", "regulator", "company_ir", "market_data", "consensus", "sell_side"]);
  const institutionalRatio = sourceTypes.length ? sourceTypes.filter((source) => institutionalSources.has(source)).length / sourceTypes.length : 0;
  const primaryRatio = sourceTypes.length ? sourceTypes.filter((source) => ["primary_filing", "exchange", "regulator"].includes(source)).length / sourceTypes.length : 0;
  const coreCategories = ["financials", "valuation", "estimates", "market", "events_catalysts", "risk_scenarios"];
  const missingCore = coreCategories.filter((category) => !categories.has(category));
  const institutionalRequired = ["ownership_flows", "capital_allocation", "governance_legal"];
  const missingInstitutional = institutionalRequired.filter((category) => !categories.has(category));
  const missingPriority = prioritizeMissingData(cov.missing);
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const currentPrice = valuation?.currentPrice || 0;
  const scenarioPrices = valuation?.rows?.map((row) => row.price).filter((price) => Number.isFinite(price)) || [];
  const bearPrice = scenarioPrices.length && currentPrice ? Math.min(...scenarioPrices) : null;
  const bullPrice = scenarioPrices.length && currentPrice ? Math.max(...scenarioPrices) : null;
  const expectedReturn = valuation?.expectedReturn ?? null;
  const bearReturn = bearPrice === null ? null : bearPrice / currentPrice - 1;
  const bullReturn = bullPrice === null ? null : bullPrice / currentPrice - 1;
  const riskReward = expectedReturn !== null && bearReturn !== null && bearReturn < 0 ? expectedReturn / Math.abs(bearReturn) : null;
  const latestKpi = latestFinancialKpi(data);

  let investScore = 0;
  investScore += Math.max(0, 18 - errorCount * 8 - warningCount * 1.5);
  investScore += Math.min(16, cov.pct * 0.16);
  investScore += Math.min(10, institutionalRatio * 10);
  investScore += Math.min(8, primaryRatio * 8);
  investScore += categories.has("risk_scenarios") ? 8 : 0;
  investScore += score.counts.negative > 0 ? 5 : 0;
  investScore += categories.has("events_catalysts") ? 4 : 0;
  investScore += categories.has("estimates") ? 4 : 0;
  investScore += latestKpi ? 5 : 0;
  investScore += latestKpi?.fcf_margin > 0 ? 3 : 0;
  investScore += latestKpi?.operating_margin > 0 ? 3 : 0;
  investScore += latestKpi?.revenue_growth > 0 ? 2 : 0;

  let valuationPoints = 0;
  if (valuation?.rows?.length && currentPrice) {
    valuationPoints += 5;
    if (expectedReturn >= 0.25) valuationPoints += 10;
    else if (expectedReturn >= 0.15) valuationPoints += 7;
    else if (expectedReturn >= 0.05) valuationPoints += 3;
    if (bearReturn !== null) {
      if (bearReturn > -0.15) valuationPoints += 6;
      else if (bearReturn > -0.3) valuationPoints += 4;
      else if (bearReturn > -0.45) valuationPoints += 1;
    }
    if (riskReward >= 1.5) valuationPoints += 5;
    else if (riskReward >= 1) valuationPoints += 3;
  }
  investScore += Math.min(24, valuationPoints);
  investScore -= missingInstitutional.length * 4;
  if (primaryRatio < minPrimaryRatio) investScore -= (minPrimaryRatio - primaryRatio) * 20;
  if (cov.pct < minCoverage) investScore -= (minCoverage - cov.pct) * 0.3;
  investScore = Math.round(Math.max(0, Math.min(100, investScore)));

  const blockers = [];
  const warnings = [];
  const nextActions = [];
  if (errorCount) blockers.push("入力データにエラーがあります。");
  if (!valuation?.rows?.length || !currentPrice) blockers.push("現在価格を含むバリュエーション・シナリオが未整備です。");
  if (!categories.has("risk_scenarios")) blockers.push("反証条件・下方シナリオが未整備です。");
  if (missingCore.length) warnings.push(`コアカテゴリ不足: ${missingCore.join("、")}`);
  if (missingInstitutional.length) warnings.push(`機関投資家目線の重要カテゴリ不足: ${missingInstitutional.join("、")}`);
  if (score.counts.negative === 0) warnings.push("弱材料・反証材料が不足しています。");
  if (institutionalRatio < 0.6) warnings.push("一次情報・市場データ・コンセンサス等の比率が低い状態です。");
  if (primaryRatio < minPrimaryRatio) warnings.push(`一次情報・取引所・規制当局データ比率がしきい値 ${settings.minPrimaryRatioPct}% を下回っています。`);
  if (cov.pct < minCoverage) warnings.push(`情報カバレッジがしきい値 ${settings.minCoveragePct}% を下回っています。`);
  if (expectedReturn !== null && expectedReturn < minExpectedReturn) warnings.push(`期待リターンがしきい値 ${settings.minExpectedReturnPct}% を下回っています。`);
  if (bearReturn !== null && bearReturn < maxBearLoss) warnings.push(`ベアケース下落率が許容しきい値 ${settings.maxBearLossPct}% を超えています。`);
  if (riskReward !== null && riskReward < settings.minRiskReward) warnings.push(`期待リターン/ベア損失がしきい値 ${settings.minRiskReward.toFixed(1)}x を下回っています。`);
  if (cov.pct < 75) nextActions.push("不足カテゴリを埋め、情報カバレッジを75%以上に上げる。");
  missingPriority.slice(0, 3).forEach((item) => nextActions.push(item.action));
  if (!nextActions.length) nextActions.push("主要反証条件を次回決算・イベントで再検証する。");

  let readiness = "見送り寄り";
  if (blockers.length) readiness = "調査未完了";
  else if (investScore >= 78 && warnings.length === 0) readiness = "投資候補";
  else if (investScore >= 68) readiness = "監視候補";
  else if (investScore >= 50) readiness = "追加調査";

  return { score: investScore, readiness, institutionalRatio, primaryRatio, expectedReturn, bearReturn, bullReturn, riskReward, missingPriority, blockers, warnings, nextActions };
}

function decisionBrief(investability) {
  const blockers = investability.blockers || [];
  const warnings = investability.warnings || [];
  const nextAction = investability.nextActions?.[0] || "主要反証条件を次回決算・イベントで再検証する。";
  let statusClass = "neutral";
  let handling = "追加調査";
  let humanDecision = "不足している判断材料を埋めるか、いったん見送るかを決める。";

  if (blockers.length) {
    statusClass = "negative";
    handling = "調査未完了";
    humanDecision = "ブロッカーを解消するまで投資候補として扱わない。";
  } else if (investability.readiness === "投資候補") {
    statusClass = "positive";
    handling = "投資候補として人間レビューへ";
    humanDecision = "ポジションサイズ、許容損失、注文条件を人間が最終判断する。";
  } else if (investability.readiness === "監視候補") {
    statusClass = "warn";
    handling = "監視候補";
    humanDecision = "ウォッチリストに残し、未充足カテゴリを埋めて再判定する。";
  } else if (investability.readiness === "見送り寄り") {
    statusClass = "negative";
    handling = "見送り寄り";
    humanDecision = "投資仮説を再設計するか、調査対象から外すかを決める。";
  }

  const reason = blockers[0] || warnings[0] || "警告なし。残る論点はポートフォリオ制約と売買条件です。";
  const completionCriteria = blockers.length
    ? "ブロッカー0件、現在価格を含むシナリオ、反証条件を揃える。"
    : warnings.length
      ? "重要カテゴリ不足、一次情報比率、カバレッジ警告を解消する。"
      : "人間がリスク許容度、資金配分、執行条件を確認する。";

  return { statusClass, handling, humanDecision, reason, nextAction, completionCriteria };
}

function estimatePositionSize(investability, cov) {
  const settings = loadSettings();
  const minPrimaryRatio = settings.minPrimaryRatioPct / 100;
  const minExpectedReturn = settings.minExpectedReturnPct / 100;
  const maxBearLoss = settings.maxBearLossPct / 100;
  const constraints = [];
  if (investability.blockers?.length) {
    return {
      label: "投資不可",
      maxInitialWeight: "0%",
      rationale: "調査ブロッカーが残っているため、投資候補として扱わない。",
      constraints: investability.blockers.slice(0, 3)
    };
  }
  if (cov.pct < settings.minCoveragePct) constraints.push(`情報カバレッジ${settings.minCoveragePct}%未満`);
  if (investability.primaryRatio < minPrimaryRatio) constraints.push(`一次情報・取引所・規制当局ソース比率${settings.minPrimaryRatioPct}%未満`);
  if (investability.expectedReturn !== null && investability.expectedReturn < minExpectedReturn) constraints.push(`期待リターン${settings.minExpectedReturnPct}%未満`);
  if (investability.bearReturn !== null && investability.bearReturn < maxBearLoss) constraints.push(`ベアケース下落${Math.abs(settings.maxBearLossPct)}%超`);
  if (investability.riskReward !== null && investability.riskReward < settings.minRiskReward) constraints.push(`期待リターン/ベア損失が${settings.minRiskReward.toFixed(1)}x未満`);

  if (investability.readiness === "投資候補" && investability.score >= 85 && !constraints.length) {
    return {
      label: "標準候補",
      maxInitialWeight: "2-4%",
      rationale: "警告がなく、期待値と下方リスクの釣り合いが取れている。",
      constraints: ["流動性、税務、既存ポートフォリオ相関は別途確認する。"]
    };
  }
  if (investability.readiness === "投資候補") {
    return {
      label: "小さく開始",
      maxInitialWeight: "1-2%",
      rationale: "投資候補だが、制約条件を残したまま大きく取る段階ではない。",
      constraints: constraints.length ? constraints : ["決算後レビューまで増額しない。"]
    };
  }
  if (investability.readiness === "監視候補") {
    return {
      label: "打診・監視",
      maxInitialWeight: "0-1%",
      rationale: "投資仮説は残るが、未充足データまたは警告がある。",
      constraints: constraints.length ? constraints : ["次の確認事項が完了するまで増額しない。"]
    };
  }
  return {
    label: "監視のみ",
    maxInitialWeight: "0%",
    rationale: "追加調査または見送り寄りのため、資金投入より調査更新を優先する。",
    constraints: constraints.length ? constraints : ["判断ブリーフの完了条件を満たすまで再判定する。"]
  };
}

function refutationPlan(data, valuation, investability) {
  const evidence = data.evidence || [];
  const candidates = evidence.filter((row) => {
    const text = `${row.category || ""} ${row.item || ""} ${row.value || ""} ${row.interpretation || ""}`;
    return normalize(row.category) === "risk_scenarios" || normalize(row.direction) === "negative" || text.includes("反証");
  });
  const conditions = candidates.slice(0, 6).map((row) => `${row.item || "未設定"}: ${row.value || ""}. ${row.interpretation || ""}`.trim());
  if (!conditions.length) conditions.push("反証条件が未入力です。投資判断前に、仮説が崩れる条件を明文化してください。");
  if (investability.bearReturn !== null) conditions.push(`ベアケース下落率 ${pct(investability.bearReturn)} を許容できない場合は投資候補から外す。`);

  const reviewTriggers = evidence
    .filter((row) => normalize(row.category) === "events_catalysts")
    .slice(0, 4)
    .map((row) => `${row.item || "イベント"}: ${row.value || ""}`.trim());
  if (!reviewTriggers.length) reviewTriggers.push("次回決算、会社説明会、業績修正、主要ニュース発生時に再判定する。");

  const postReview = [
    "投資前の仮説、期待リターン、反証条件を決算後の実績と比較する。",
    "売上成長、営業利益率、FCF、受注・在庫など主要KPIのズレを記録する。",
    "判断ブリーフの扱いを、投資候補、監視候補、追加調査、見送りのいずれかに更新する。"
  ];
  if (!valuation?.rows?.length) postReview.unshift("現在価格を含むシナリオを作成してから、決算後レビューを実施する。");

  return { conditions, reviewTriggers, postReview };
}

function ageDays(dateText, asOfText) {
  const date = Date.parse(dateText || "");
  const asOf = Date.parse(asOfText || new Date().toISOString().slice(0, 10));
  if (!Number.isFinite(date) || !Number.isFinite(asOf)) return null;
  return Math.max(0, Math.round((asOf - date) / 86400000));
}

function dataFreshness(data, settings = loadSettings()) {
  const evidence = Array.isArray(data.evidence) ? data.evidence : [];
  const asOf = data.company?.as_of || new Date().toISOString().slice(0, 10);
  const rows = catalog.map((category) => {
    const categoryRows = evidence.filter((row) => normalize(row.category) === category.id);
    const latest = categoryRows
      .map((row) => row.date)
      .filter(Boolean)
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
    const age = latest ? ageDays(latest, asOf) : null;
    const limit = Number(settings.staleDays?.[category.id] ?? 90);
    let status = "未入力";
    if (age !== null) status = age > limit ? "古い" : "OK";
    return { id: category.id, name: category.name, latest, age, limit, status, count: categoryRows.length };
  });
  return {
    asOf,
    rows,
    staleCount: rows.filter((row) => row.status === "古い").length,
    missingCount: rows.filter((row) => row.status === "未入力").length
  };
}

function valuationSensitivity(data, valuation) {
  if (!valuation?.rows?.length || !data.valuation) return [];
  const base =
    valuation.rows.find((row) => normalize(row.name).includes("base")) ||
    valuation.rows[Math.floor(valuation.rows.length / 2)] ||
    valuation.rows[0];
  const shares = Number(data.valuation.shares_outstanding || 0);
  const netDebt = Number(data.valuation.net_debt || 0);
  const currentPrice = Number(data.valuation.current_price || 0);
  if (!shares || !base) return [];
  const shocks = [
    { label: "Downside", revenueDelta: -0.1, marginDelta: -0.02, multipleDelta: -1 },
    { label: "Revenue -10%", revenueDelta: -0.1, marginDelta: 0, multipleDelta: 0 },
    { label: "Margin -2pt", revenueDelta: 0, marginDelta: -0.02, multipleDelta: 0 },
    { label: "Multiple -1x", revenueDelta: 0, marginDelta: 0, multipleDelta: -1 },
    { label: "Base", revenueDelta: 0, marginDelta: 0, multipleDelta: 0 },
    { label: "Multiple +1x", revenueDelta: 0, marginDelta: 0, multipleDelta: 1 },
    { label: "Margin +2pt", revenueDelta: 0, marginDelta: 0.02, multipleDelta: 0 },
    { label: "Revenue +10%", revenueDelta: 0.1, marginDelta: 0, multipleDelta: 0 },
    { label: "Upside", revenueDelta: 0.1, marginDelta: 0.02, multipleDelta: 1 }
  ];
  return shocks.map((shock) => {
    const revenue = base.revenue * (1 + shock.revenueDelta);
    const ebitdaMargin = Math.max(0, base.ebitdaMargin + shock.marginDelta);
    const evEbitda = Math.max(0, base.evEbitda + shock.multipleDelta);
    const price = ((revenue * ebitdaMargin * evEbitda) - netDebt) / shares;
    const returnPct = currentPrice > 0 ? price / currentPrice - 1 : null;
    return { ...shock, revenue, ebitdaMargin, evEbitda, price, returnPct };
  });
}

function portfolioImpact(data, investability, position, settings = loadSettings()) {
  const portfolio = data.portfolio || {};
  const portfolioValue = Number(portfolio.portfolio_value || portfolio.portfolioValue || 0);
  const currentWeight = Number(portfolio.current_weight ?? 0);
  const proposedWeight = Number(portfolio.proposed_weight ?? settings.maxPositionPct / 100);
  const sectorWeight = Number(portfolio.sector_weight ?? 0);
  const maxPositionWeight = Number(portfolio.max_position_weight ?? settings.maxPositionPct / 100);
  const maxSectorWeight = Number(portfolio.max_sector_weight ?? settings.maxSectorPct / 100);
  const totalWeight = currentWeight + proposedWeight;
  const sectorAfter = sectorWeight + proposedWeight;
  const downsideContribution = investability.bearReturn === null ? null : proposedWeight * Math.abs(investability.bearReturn);
  const constraints = [];
  if (totalWeight > maxPositionWeight) constraints.push(`1銘柄上限${pct(maxPositionWeight)}を超過`);
  if (sectorAfter > maxSectorWeight) constraints.push(`セクター上限${pct(maxSectorWeight)}を超過`);
  if (position.maxInitialWeight === "0%") constraints.push("投資判断ゲート上は新規投資不可");
  if (investability.blockers?.length) constraints.push("未解消ブロッカーあり");
  return {
    portfolioValue,
    currentWeight,
    proposedWeight,
    proposedValue: portfolioValue ? portfolioValue * proposedWeight : null,
    sectorWeight,
    totalWeight,
    sectorAfter,
    maxPositionWeight,
    maxSectorWeight,
    downsideContribution,
    tags: Array.isArray(portfolio.tags) ? portfolio.tags : [],
    constraints
  };
}

function storedDecisions(ticker) {
  return readStorage(storageKeys.decisionLog, [])
    .filter((row) => row.ticker === ticker)
    .slice(-5)
    .reverse();
}

function storedReviews(ticker) {
  return readStorage(storageKeys.reviews, [])
    .filter((row) => row.ticker === ticker)
    .slice(-5)
    .reverse();
}

function renderFreshness(freshness) {
  const rows = freshness.rows
    .map((row) => `
      <tr>
        <td>${escapeHtml(row.name)}</td>
        <td><span class="tag ${row.status === "OK" ? "positive" : row.status === "古い" ? "negative" : "neutral"}">${escapeHtml(row.status)}</span></td>
        <td>${escapeHtml(row.latest || "-")}</td>
        <td>${row.age === null ? "-" : `${row.age}日`}</td>
        <td>${row.limit}日</td>
        <td>${row.count}</td>
      </tr>
    `)
    .join("");
  return `
    <section class="summary-block">
      <h3>データ鮮度ダッシュボード</h3>
      <div class="metrics">
        <div class="metric"><span>基準日</span><strong>${escapeHtml(freshness.asOf)}</strong></div>
        <div class="metric"><span>期限超過</span><strong>${freshness.staleCount}</strong></div>
        <div class="metric"><span>未入力</span><strong>${freshness.missingCount}</strong></div>
      </div>
      <div class="table-scroll">
        <table class="kpi-table freshness-table">
          <thead><tr><th>カテゴリ</th><th>状態</th><th>最新日</th><th>経過</th><th>基準</th><th>件数</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderSensitivity(sensitivity, currency) {
  if (!sensitivity.length) return "";
  return `
    <section class="summary-block">
      <h3>バリュエーション感応度</h3>
      <div class="table-scroll">
        <table class="kpi-table sensitivity-table">
          <thead><tr><th>ケース</th><th>売上</th><th>EBITDA率</th><th>倍率</th><th>株価</th><th>現値比</th></tr></thead>
          <tbody>${sensitivity.map((row) => `<tr><td>${escapeHtml(row.label)}</td><td>${compactNumber(row.revenue, currency)}</td><td>${pct(row.ebitdaMargin)}</td><td>${row.evEbitda.toFixed(1)}x</td><td>${escapeHtml(currency)}${row.price.toFixed(2)}</td><td>${pct(row.returnPct)}</td></tr>`).join("")}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderPortfolio(impact, company) {
  const sector = company.sector || "sector";
  return `
    <section class="summary-block">
      <h3>ポートフォリオ影響チェック</h3>
      <div class="metrics">
        <div class="metric"><span>追加比率</span><strong>${pct(impact.proposedWeight)}</strong></div>
        <div class="metric"><span>銘柄合計</span><strong>${pct(impact.totalWeight)}</strong></div>
        <div class="metric"><span>${escapeHtml(sector)}合計</span><strong>${pct(impact.sectorAfter)}</strong></div>
      </div>
      <ul class="summary-list">
        <li>想定投資額: ${impact.proposedValue === null ? "-" : compactNumber(impact.proposedValue, dataCurrency(company))}</li>
        <li>ベアケースのポートフォリオ寄与損失: ${impact.downsideContribution === null ? "-" : pct(impact.downsideContribution)}</li>
        <li>制約: ${(impact.constraints.length ? impact.constraints : ["上限超過なし"]).map(escapeHtml).join(" / ")}</li>
        ${impact.tags.length ? `<li>タグ: ${impact.tags.map(escapeHtml).join(" / ")}</li>` : ""}
      </ul>
    </section>
  `;
}

function renderStoredHistory(ticker) {
  const decisions = storedDecisions(ticker);
  const reviews = storedReviews(ticker);
  if (!decisions.length && !reviews.length) return "";
  const decisionRows = decisions.map((row) => `<li><strong>${escapeHtml(row.date)}</strong>: ${escapeHtml(row.readiness)} / score ${escapeHtml(row.score)} / ${escapeHtml(row.position)} <span class="muted">${escapeHtml(row.nextAction || "")}</span></li>`).join("");
  const reviewRows = reviews.map((row) => `<li><strong>${escapeHtml(row.date)}</strong>: ${escapeHtml(row.note)}</li>`).join("");
  return `
    <section class="summary-block">
      <h3>保存済み判断ログ・レビュー</h3>
      ${decisions.length ? `<h3>判断ログ</h3><ul class="summary-list">${decisionRows}</ul>` : ""}
      ${reviews.length ? `<h3>決算後レビュー</h3><ul class="summary-list">${reviewRows}</ul>` : ""}
    </section>
  `;
}

function dataCurrency(company) {
  if (!company?.currency) return "";
  return company.currency === "USD" ? "$" : `${company.currency} `;
}

function analysisSnapshot(data) {
  const evidence = data.evidence || [];
  const asOf = data.company?.as_of;
  const score = scoreEvidence(evidence, asOf);
  const cov = coverage(evidence);
  const issues = validateData(data);
  const valuation = calculateValuation(data.valuation);
  const investability = evaluateInvestability(data, score, cov, issues, valuation);
  const position = estimatePositionSize(investability, cov);
  const label = [data.company?.ticker, data.company?.name].filter(Boolean).join(" / ") || "未設定";
  return { data, label, score, cov, issues, valuation, investability, position };
}

function renderComparison(items = []) {
  if (items.length < 2) return "";
  const snapshots = items
    .map(analysisSnapshot)
    .sort((a, b) => b.investability.score - a.investability.score || b.cov.pct - a.cov.pct);
  const rows = snapshots
    .map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.label)}</td>
        <td>${escapeHtml(item.investability.readiness)}</td>
        <td>${item.investability.score}</td>
        <td>${item.score.score}</td>
        <td>${item.cov.pct}%</td>
        <td>${pct(item.investability.expectedReturn)}</td>
        <td>${pct(item.investability.bearReturn)}</td>
        <td>${item.investability.riskReward === null ? "-" : `${item.investability.riskReward.toFixed(2)}x`}</td>
        <td>${escapeHtml(item.position.label)}</td>
        <td>${escapeHtml(item.investability.nextActions[0] || "-")}</td>
      </tr>
    `)
    .join("");
  return `
    <section class="summary-block">
      <h3>銘柄比較・優先順位</h3>
      <div class="table-scroll">
        <table class="comparison-table">
          <thead><tr><th>#</th><th>銘柄</th><th>客観ゲート</th><th>投資可能性</th><th>証拠</th><th>カバレッジ</th><th>期待</th><th>ベア</th><th>R/R</th><th>サイズ</th><th>次の一手</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderAuditStrip(score, cov, issues, investability) {
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  auditStrip.innerHTML = `
    <div class="audit-chip"><span>客観ゲート</span><strong>${escapeHtml(investability.readiness)}</strong></div>
    <div class="audit-chip"><span>投資可能性</span><strong>${investability.score}</strong></div>
    <div class="audit-chip"><span>カバレッジ</span><strong>${cov.pct}%</strong></div>
    <div class="audit-chip"><span>監査エラー</span><strong>${errorCount}</strong></div>
    <div class="audit-chip"><span>監査警告</span><strong>${warningCount}</strong></div>
  `;
}

function renderSummary(data, comparisonItems = [data]) {
  const evidence = data.evidence || [];
  const asOf = data.company?.as_of;
  const score = scoreEvidence(evidence, asOf);
  const cov = coverage(evidence);
  const issues = validateData(data);
  const grouped = groupEvidence(evidence);
  const company = data.company || {};
  const label = [company.ticker, company.name].filter(Boolean).join(" / ") || "未設定";
  const neutralRows = grouped.neutral.concat(grouped.mixed, grouped.unknown);
  const valuation = calculateValuation(data.valuation);
  const investability = evaluateInvestability(data, score, cov, issues, valuation);
  const brief = decisionBrief(investability);
  const position = estimatePositionSize(investability, cov);
  const refutation = refutationPlan(data, valuation, investability);
  const freshness = dataFreshness(data);
  const sensitivity = valuationSensitivity(data, valuation);
  const portfolio = portfolioImpact(data, investability, position);
  const comparisonHtml = renderComparison(comparisonItems);
  const historyHtml = renderStoredHistory(currentTicker(data));

  scoreBox.textContent = score.score;
  asOfLabel.textContent = `基準日: ${company.as_of || "-"}`;
  coverageLabel.textContent = `カバレッジ: ${cov.pct}%`;
  renderAuditStrip(score, cov, issues, investability);
  renderCatalog(cov.covered);

  const issueHtml = issues.length
    ? issues.slice(0, 8).map((issue) => `<li><strong>[${escapeHtml(issue.severity)}]</strong> <code>${escapeHtml(issue.path)}</code>: ${escapeHtml(issue.message)}</li>`).join("")
    : "<li>入力検証で重大な問題は見つかりませんでした。</li>";

  const missingHtml = cov.missing.length
    ? cov.missing.map((id) => {
        const item = catalog.find((entry) => entry.id === id);
        return `<li><strong>${escapeHtml(item?.name || id)}</strong>: ${escapeHtml((item?.metrics || []).join("、"))}</li>`;
      }).join("")
    : "<li>全カテゴリに少なくとも1件の証拠があります。次は数値の鮮度、一次資料比率、反証条件の精度を確認してください。</li>";

  const missingPriorityHtml = investability.missingPriority.length
    ? investability.missingPriority
        .slice(0, 6)
        .map((item) => `<li><strong>${escapeHtml(item.name)}</strong> <span class="muted">P${escapeHtml(item.priority)}</span>: ${escapeHtml(item.reason)} <span class="muted">${escapeHtml(item.action)}</span></li>`)
        .join("")
    : "<li>未充足カテゴリはありません。次はデータ鮮度と一次情報比率を点検してください。</li>";

  const investabilityHtml = `
    <section class="summary-block">
      <h3>投資可能性ゲート</h3>
      <div class="metrics">
        <div class="metric"><span>投資可能性</span><strong>${investability.score}/100</strong></div>
        <div class="metric"><span>客観ゲート</span><strong>${escapeHtml(investability.readiness)}</strong></div>
        <div class="metric"><span>期待/ベア損失</span><strong>${investability.riskReward === null ? "-" : `${investability.riskReward.toFixed(2)}x`}</strong></div>
      </div>
      <ul class="summary-list">
        <li>一次・機関品質ソース比率: ${pct(investability.institutionalRatio)}</li>
        <li>一次情報・取引所・規制当局ソース比率: ${pct(investability.primaryRatio)}</li>
        <li>期待リターン: ${pct(investability.expectedReturn)} / ベアケース: ${pct(investability.bearReturn)} / ブルケース: ${pct(investability.bullReturn)}</li>
      </ul>
      <h3>ブロッカー</h3>
      <ul class="summary-list">${(investability.blockers.length ? investability.blockers : ["重大なブロッカーは未検出です。"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <h3>警告</h3>
      <ul class="summary-list">${(investability.warnings.length ? investability.warnings : ["主要な警告は未検出です。"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <h3>次の確認事項</h3>
      <ul class="summary-list">${investability.nextActions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </section>
  `;

  const positionHtml = `
    <section class="summary-block">
      <h3>ポジションサイズ・制約</h3>
      <div class="metrics">
        <div class="metric"><span>扱い</span><strong>${escapeHtml(position.label)}</strong></div>
        <div class="metric"><span>調査上の初期上限</span><strong>${escapeHtml(position.maxInitialWeight)}</strong></div>
        <div class="metric"><span>客観ゲート</span><strong>${escapeHtml(investability.readiness)}</strong></div>
      </div>
      <ul class="summary-list">
        <li>${escapeHtml(position.rationale)}</li>
        ${position.constraints.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </section>
  `;

  const refutationHtml = `
    <section class="summary-block">
      <h3>反証条件・決算後レビュー</h3>
      <h3>撤回条件</h3>
      <ul class="summary-list">${refutation.conditions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <h3>再判定トリガー</h3>
      <ul class="summary-list">${refutation.reviewTriggers.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <h3>レビュー記録</h3>
      <ul class="summary-list">${refutation.postReview.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </section>
  `;

  const kpiHtml = data.financials?.kpis?.length
    ? `
      <section class="summary-block">
        <h3>財務KPI時系列</h3>
        <table class="kpi-table">
          <thead><tr><th>FY</th><th>売上</th><th>成長</th><th>営業利益率</th><th>FCF</th><th>FCF率</th><th>ROE</th><th>負債/資産</th></tr></thead>
          <tbody>${data.financials.kpis.map((row) => `<tr><td>${escapeHtml(row.fy)}</td><td>${compactNumber(row.revenue, "$")}</td><td>${pct(row.revenue_growth)}</td><td>${pct(row.operating_margin)}</td><td>${compactNumber(row.fcf, "$")}</td><td>${pct(row.fcf_margin)}</td><td>${pct(row.roe)}</td><td>${pct(row.liability_ratio)}</td></tr>`).join("")}</tbody>
        </table>
      </section>
    `
    : "";

  const valuationHtml = valuation?.rows?.length
    ? `
      <section class="summary-block">
        <h3>バリュエーション・シナリオ</h3>
        <ul class="summary-list">
          <li>期待株価: ${escapeHtml(valuation.currency)}${valuation.expectedPrice.toFixed(2)}</li>
          <li>現在価格比の期待リターン: ${pct(valuation.expectedReturn)}</li>
        </ul>
        <table class="kpi-table">
          <thead><tr><th>シナリオ</th><th>確率</th><th>売上</th><th>EBITDA率</th><th>倍率</th><th>株価</th></tr></thead>
          <tbody>${valuation.rows.map((row) => `<tr><td>${escapeHtml(row.name)}</td><td>${pct(row.probability, 0)}</td><td>${compactNumber(row.revenue, valuation.currency)}</td><td>${pct(row.ebitdaMargin)}</td><td>${row.evEbitda.toFixed(1)}x</td><td>${escapeHtml(valuation.currency)}${row.price.toFixed(2)}</td></tr>`).join("")}</tbody>
        </table>
      </section>
    `
    : "";
  const freshnessHtml = renderFreshness(freshness);
  const sensitivityHtml = renderSensitivity(sensitivity, valuation?.currency || company.currency || "");
  const portfolioHtml = renderPortfolio(portfolio, company);

  const tableRows = evidence.map((row) => {
    const category = catalog.find((item) => item.id === normalize(row.category));
    const direction = normalize(row.direction) || "unknown";
    const scored = evidenceWeight(row, asOf);
    const source = row.source_url ? `<a href="${escapeHtml(row.source_url)}" target="_blank" rel="noreferrer">${escapeHtml(row.source || row.source_url)}</a>` : escapeHtml(row.source || "");
    return `
      <tr>
        <td>${escapeHtml(category?.name || row.category)}</td>
        <td>${escapeHtml(row.item)}</td>
        <td>${escapeHtml(row.value)}</td>
        <td>${source}</td>
        <td><span class="tag ${direction}">${escapeHtml(direction)}</span></td>
        <td class="weight-cell">${scored.weight.toFixed(2)}</td>
      </tr>
    `;
  }).join("");

  summaryOutput.innerHTML = `
    <section class="decision-brief ${brief.statusClass}">
      <div class="decision-head">
        <span class="decision-label">判断ブリーフ</span>
        <strong>${escapeHtml(brief.handling)}</strong>
        <span class="decision-score">投資可能性 ${investability.score}/100</span>
      </div>
      <div class="brief-grid">
        <div>
          <span>今日の人間判断</span>
          <p>${escapeHtml(brief.humanDecision)}</p>
        </div>
        <div>
          <span>理由</span>
          <p>${escapeHtml(brief.reason)}</p>
        </div>
        <div>
          <span>次の一手</span>
          <p>${escapeHtml(brief.nextAction)}</p>
        </div>
        <div>
          <span>完了条件</span>
          <p>${escapeHtml(brief.completionCriteria)}</p>
        </div>
      </div>
    </section>
    <p class="notice">この出力は投資調査メモであり、売買推奨ではありません。一次情報、価格、リスク許容度を別途確認してください。</p>
    ${comparisonHtml}
    ${historyHtml}
    <div class="metrics">
      <div class="metric"><span>対象</span><strong>${escapeHtml(label)}</strong></div>
      <div class="metric"><span>証拠スコア</span><strong>${score.score}/100</strong></div>
      <div class="metric"><span>情報カバレッジ</span><strong>${cov.pct}%</strong></div>
    </div>
    <section class="summary-block">
      <h3>結論サマリ</h3>
      <ul class="summary-list">
        <li>${escapeHtml(score.stance)}</li>
        <li>投資仮説: ${escapeHtml(data.thesis || "未入力")}</li>
        <li>ポジティブ ${score.counts.positive}件 / ネガティブ ${score.counts.negative}件 / 中立・混在 ${score.counts.neutral + score.counts.mixed + score.counts.unknown}件</li>
      </ul>
    </section>
    ${investabilityHtml}
    ${positionHtml}
    ${portfolioHtml}
    <section class="summary-block"><h3>データ品質監査</h3><ul class="summary-list">${issueHtml}</ul></section>
    ${freshnessHtml}
    <section class="summary-block"><h3>強材料</h3><ul class="summary-list">${renderBullets(grouped.positive, "明確な強材料は未入力です。", asOf)}</ul></section>
    <section class="summary-block"><h3>弱材料・反証条件</h3><ul class="summary-list">${renderBullets(grouped.negative, "明確な弱材料は未入力です。", asOf)}</ul></section>
    ${refutationHtml}
    <section class="summary-block"><h3>中立・確認待ち材料</h3><ul class="summary-list">${renderBullets(neutralRows, "中立・確認待ち材料は未入力です。", asOf)}</ul></section>
    <section class="summary-block"><h3>未充足データ</h3><ul class="summary-list">${missingHtml}</ul></section>
    <section class="summary-block"><h3>未充足データ優先度</h3><ul class="summary-list">${missingPriorityHtml}</ul></section>
    ${kpiHtml}
    ${valuationHtml}
    ${sensitivityHtml}
    <section class="summary-block">
      <h3>エビデンス台帳</h3>
      <table class="evidence-table">
        <thead><tr><th>カテゴリ</th><th>項目</th><th>値</th><th>出所</th><th>方向</th><th>重み</th></tr></thead>
        <tbody>${tableRows || '<tr><td colspan="6">エビデンスがありません。</td></tr>'}</tbody>
      </table>
    </section>
  `;
}

function comparisonMarkdown(items = []) {
  if (items.length < 2) return [];
  const lines = ["", "## 銘柄比較・優先順位", "", "|順位|銘柄|客観ゲート|投資可能性|証拠|カバレッジ|期待|ベア|R/R|サイズ|次の一手|", "|---:|---|---|---:|---:|---:|---:|---:|---:|---|---|"];
  items
    .map(analysisSnapshot)
    .sort((a, b) => b.investability.score - a.investability.score || b.cov.pct - a.cov.pct)
    .forEach((item, index) => {
      lines.push(`|${index + 1}|${item.label}|${item.investability.readiness}|${item.investability.score}|${item.score.score}|${item.cov.pct}%|${pct(item.investability.expectedReturn)}|${pct(item.investability.bearReturn)}|${item.investability.riskReward === null ? "-" : `${item.investability.riskReward.toFixed(2)}x`}|${item.position.label}|${item.investability.nextActions[0] || "-"}|`);
    });
  return lines;
}

function buildMarkdown(data, comparisonItems = [data]) {
  const evidence = data.evidence || [];
  const asOf = data.company?.as_of;
  const score = scoreEvidence(evidence, asOf);
  const cov = coverage(evidence);
  const issues = validateData(data);
  const grouped = groupEvidence(evidence);
  const company = data.company || {};
  const valuation = calculateValuation(data.valuation);
  const investability = evaluateInvestability(data, score, cov, issues, valuation);
  const brief = decisionBrief(investability);
  const position = estimatePositionSize(investability, cov);
  const refutation = refutationPlan(data, valuation, investability);
  const freshness = dataFreshness(data);
  const sensitivity = valuationSensitivity(data, valuation);
  const portfolio = portfolioImpact(data, investability, position);
  const label = [company.ticker, company.name].filter(Boolean).join(" / ") || "未設定";
  const lines = [
    `# 投資判断用リサーチサマリ: ${label}`,
    "",
    "> この出力は投資調査メモであり、売買推奨ではありません。一次情報、価格、リスク許容度を別途確認してください。",
    "",
    "## 基本情報",
    "",
    `- 市場: ${company.market || ""}`,
    `- セクター: ${company.sector || ""}`,
    `- 通貨: ${company.currency || ""}`,
    `- データ基準日: ${company.as_of || ""}`,
    `- 投資仮説: ${data.thesis || "未入力"}`,
    "",
    "## 判断ブリーフ",
    "",
    `- 現在の扱い: ${brief.handling}`,
    `- 今日の人間判断: ${brief.humanDecision}`,
    `- 理由: ${brief.reason}`,
    `- 次の一手: ${brief.nextAction}`,
    `- 完了条件: ${brief.completionCriteria}`,
    ...comparisonMarkdown(comparisonItems),
    "",
    "## 結論サマリ",
    "",
    `- 証拠スコア: ${score.score} / 100`,
    `- 調査スタンス: ${score.stance}`,
    `- 情報カバレッジ: ${cov.pct}%`,
    `- 加重ポジティブ: ${score.weightedPositive.toFixed(2)} / 加重ネガティブ: ${score.weightedNegative.toFixed(2)}`,
    `- 投資可能性スコア: ${investability.score} / 100`,
    `- 客観ゲート: ${investability.readiness}`,
    "",
    "## 投資可能性ゲート",
    "",
    `- 一次・機関品質ソース比率: ${pct(investability.institutionalRatio)}`,
    `- 一次情報・取引所・規制当局ソース比率: ${pct(investability.primaryRatio)}`,
    `- 期待リターン: ${pct(investability.expectedReturn)}`,
    `- ベアケース下落率: ${pct(investability.bearReturn)}`,
    `- ブルケース上昇率: ${pct(investability.bullReturn)}`,
    `- 期待リターン/ベア損失: ${investability.riskReward === null ? "-" : `${investability.riskReward.toFixed(2)}x`}`,
    "",
    "ブロッカー:",
    ...(investability.blockers.length ? investability.blockers : ["重大なブロッカーは未検出です。"]).map((item) => `- ${item}`),
    "",
    "警告:",
    ...(investability.warnings.length ? investability.warnings : ["主要な警告は未検出です。"]).map((item) => `- ${item}`),
    "",
    "次の確認事項:",
    ...investability.nextActions.map((item) => `- ${item}`),
    "",
    "## ポジションサイズ・制約",
    "",
    `- 扱い: ${position.label}`,
    `- 調査上の初期上限: ${position.maxInitialWeight}`,
    `- 理由: ${position.rationale}`,
    ...position.constraints.map((item) => `- 制約: ${item}`),
    "",
    "## ポートフォリオ影響チェック",
    "",
    `- 追加比率: ${pct(portfolio.proposedWeight)}`,
    `- 銘柄合計: ${pct(portfolio.totalWeight)} / 上限 ${pct(portfolio.maxPositionWeight)}`,
    `- セクター合計: ${pct(portfolio.sectorAfter)} / 上限 ${pct(portfolio.maxSectorWeight)}`,
    `- 想定投資額: ${portfolio.proposedValue === null ? "-" : compactNumber(portfolio.proposedValue, dataCurrency(company))}`,
    `- ベアケース寄与損失: ${portfolio.downsideContribution === null ? "-" : pct(portfolio.downsideContribution)}`,
    ...(portfolio.constraints.length ? portfolio.constraints.map((item) => `- 制約: ${item}`) : ["- 制約: 上限超過なし"]),
    "",
    "## データ鮮度ダッシュボード",
    "",
    `- 基準日: ${freshness.asOf}`,
    `- 期限超過: ${freshness.staleCount} / 未入力: ${freshness.missingCount}`,
    "|カテゴリ|状態|最新日|経過|基準|件数|",
    "|---|---|---|---:|---:|---:|",
    ...freshness.rows.map((row) => `|${row.name}|${row.status}|${row.latest || "-"}|${row.age === null ? "-" : `${row.age}日`}|${row.limit}日|${row.count}|`),
    "",
    "## 未充足データ優先度",
    "",
    ...(investability.missingPriority.length
      ? investability.missingPriority.slice(0, 8).map((item) => `- P${item.priority} ${item.name}: ${item.reason} / ${item.action}`)
      : ["- 未充足カテゴリはありません。次はデータ鮮度と一次情報比率を点検してください。"]),
    "",
    "## データ品質監査",
    ""
  ];
  if (issues.length) issues.slice(0, 12).forEach((issue) => lines.push(`- [${issue.severity}] ${issue.path}: ${issue.message}`));
  else lines.push("- 入力検証で重大な問題は見つかりませんでした。");
  const addRows = (title, rows, fallback) => {
    lines.push("", `## ${title}`, "");
    if (!rows.length) {
      lines.push(`- ${fallback}`);
      return;
    }
    rows
      .slice()
      .sort((a, b) => evidenceWeight(b, asOf).weight - evidenceWeight(a, asOf).weight)
      .slice(0, 5)
      .forEach((row) => {
        const scored = evidenceWeight(row, asOf);
        lines.push(`- ${row.item}: ${row.value}. ${row.interpretation} (${[row.source, row.date, row.confidence, row.materiality || "medium", scored.sourceType, `w=${scored.weight.toFixed(2)}`].filter(Boolean).join(" / ")})`);
      });
  };
  addRows("強材料", grouped.positive, "明確な強材料は未入力です。");
  addRows("弱材料・反証条件", grouped.negative, "明確な弱材料は未入力です。");
  lines.push("", "## 反証条件・決算後レビュー", "");
  lines.push("撤回条件:");
  refutation.conditions.forEach((item) => lines.push(`- ${item}`));
  lines.push("", "再判定トリガー:");
  refutation.reviewTriggers.forEach((item) => lines.push(`- ${item}`));
  lines.push("", "レビュー記録:");
  refutation.postReview.forEach((item) => lines.push(`- ${item}`));
  addRows("中立・確認待ち材料", grouped.neutral.concat(grouped.mixed, grouped.unknown), "中立・確認待ち材料は未入力です。");
  lines.push("", "## 未充足データ", "");
  if (cov.missing.length) {
    cov.missing.forEach((id) => {
      const item = catalog.find((entry) => entry.id === id);
      lines.push(`- ${item?.name || id}: ${(item?.metrics || []).join("、")}`);
    });
  } else {
    lines.push("- 全カテゴリに少なくとも1件の証拠があります。");
  }
  if (sensitivity.length) {
    lines.push("", "## バリュエーション感応度", "");
    lines.push("|ケース|売上|EBITDA率|倍率|株価|現値比|");
    lines.push("|---|---:|---:|---:|---:|---:|");
    sensitivity.forEach((row) => {
      lines.push(`|${row.label}|${compactNumber(row.revenue, valuation?.currency || company.currency || "")}|${pct(row.ebitdaMargin)}|${row.evEbitda.toFixed(1)}x|${valuation?.currency || company.currency || ""}${row.price.toFixed(2)}|${pct(row.returnPct)}|`);
    });
  }
  lines.push("", "## エビデンス台帳", "");
  lines.push("|カテゴリ|項目|値|解釈|出所|日付|確信度|重要度|出所種別|方向|重み|");
  lines.push("|---|---|---|---|---|---|---|---|---|---|---:|");
  evidence.forEach((row) => {
    const category = catalog.find((item) => item.id === normalize(row.category));
    const scored = evidenceWeight(row, asOf);
    lines.push(`|${category?.name || row.category || ""}|${row.item || ""}|${row.value || ""}|${row.interpretation || ""}|${row.source || ""}|${row.date || ""}|${row.confidence || ""}|${row.materiality || "medium"}|${scored.sourceType}|${row.direction || ""}|${scored.weight.toFixed(2)}|`);
  });
  return `${lines.join("\n")}\n`;
}

function summarizeFromInput() {
  try {
    errorBox.textContent = "";
    const dataset = parseResearchInput();
    renderSummary(dataset.primary, dataset.items);
    return dataset.primary;
  } catch (error) {
    errorBox.textContent = error.message;
    throw error;
  }
}

function updateJson(data) {
  jsonInput.value = JSON.stringify(data, null, 2);
  renderSummary(data);
}

function sampleComparisonData() {
  const first = JSON.parse(JSON.stringify(sampleData));
  const second = JSON.parse(JSON.stringify(sampleData));
  second.company = { ...second.company, ticker: "ALP", name: "Alpha Components Ltd.", sector: "Technology Hardware" };
  second.thesis = "AIサーバー向け部品の増産と高付加価値品比率の改善により、利益率が上がる仮説を検証する。";
  second.valuation.current_price = 31.2;
  second.valuation.scenarios = [
    { name: "Bear", probability: 0.3, revenue: 1320000000, ebitda_margin: 0.14, ev_ebitda: 7.5 },
    { name: "Base", probability: 0.5, revenue: 1520000000, ebitda_margin: 0.19, ev_ebitda: 9.5 },
    { name: "Bull", probability: 0.2, revenue: 1700000000, ebitda_margin: 0.22, ev_ebitda: 11.5 }
  ];
  second.evidence = second.evidence.concat([
    { category: "ownership_flows", item: "空売り残高", value: "浮動株比 4.8%", interpretation: "需給はやや重いが、極端なショートスクイーズ依存ではない。", source: "Exchange short interest", source_url: "", date: "2026-06-24", confidence: "medium", direction: "neutral", materiality: "medium", source_type: "exchange" },
    { category: "capital_allocation", item: "自社株買い", value: "発行済株式の2.0%を上限に取得枠設定", interpretation: "下値では需給支援になるが、成長投資との優先順位を確認する。", source: "Company IR", source_url: "", date: "2026-06-12", confidence: "medium", direction: "positive", materiality: "medium", source_type: "company_ir" },
    { category: "governance_legal", item: "規制リスク", value: "主要輸出先の規制変更を監視", interpretation: "輸出規制が強まる場合、ベースシナリオを引き下げる。", source: "Regulatory review", source_url: "", date: "2026-06-10", confidence: "medium", direction: "negative", materiality: "medium", source_type: "regulator" }
  ]);
  const third = JSON.parse(JSON.stringify(sampleData));
  third.company = { ...third.company, ticker: "BRKX", name: "Breakwater Retail Corp.", sector: "Consumer Discretionary" };
  third.thesis = "在庫調整完了と値引き縮小で利益率が戻る仮説を検証する。";
  third.valuation.current_price = 18.8;
  third.valuation.scenarios = [
    { name: "Bear", probability: 0.35, revenue: 1180000000, ebitda_margin: 0.1, ev_ebitda: 5.8 },
    { name: "Base", probability: 0.45, revenue: 1260000000, ebitda_margin: 0.13, ev_ebitda: 6.5 },
    { name: "Bull", probability: 0.2, revenue: 1340000000, ebitda_margin: 0.15, ev_ebitda: 7.2 }
  ];
  third.evidence = third.evidence.filter((row) => !["valuation", "ownership_flows", "capital_allocation", "governance_legal"].includes(row.category));
  return [first, second, third];
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function populateForm() {
  const categorySelect = document.querySelector("#fieldCategory");
  categorySelect.innerHTML = catalog.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("");
  document.querySelector("#fieldDate").value = new Date().toISOString().slice(0, 10);
}

function clearEvidenceForm() {
  evidenceForm.reset();
  document.querySelector("#fieldDate").value = new Date().toISOString().slice(0, 10);
  document.querySelector("#fieldConfidence").value = "medium";
  document.querySelector("#fieldMateriality").value = "medium";
  document.querySelector("#fieldDirection").value = "neutral";
  document.querySelector("#fieldSourceType").value = "internal";
}

function renderWatchlistOptions() {
  const rows = readStorage(storageKeys.watchlist, []);
  if (!rows.length) {
    watchlistSelect.innerHTML = '<option value="">保存なし</option>';
    return;
  }
  watchlistSelect.innerHTML = rows
    .slice()
    .reverse()
    .map((row) => `<option value="${escapeHtml(row.id)}">${escapeHtml(row.ticker)} ${escapeHtml(row.name || "")} / ${escapeHtml(row.date)}</option>`)
    .join("");
}

function saveWatchlist() {
  const dataset = parseResearchInput();
  const ticker = currentTicker(dataset.primary);
  const id = `${ticker}-${new Date().toISOString()}`;
  const rows = readStorage(storageKeys.watchlist, []);
  rows.push({
    id,
    ticker,
    name: dataset.primary.company?.name || "",
    date: new Date().toISOString().slice(0, 16).replace("T", " "),
    payload: dataset.parsed
  });
  writeStorage(storageKeys.watchlist, rows.slice(-50));
  renderWatchlistOptions();
  watchlistSelect.value = id;
  statusMessage(`${ticker}をウォッチリスト保存`);
}

function loadWatchlist() {
  const id = watchlistSelect.value;
  const rows = readStorage(storageKeys.watchlist, []);
  const row = rows.find((item) => item.id === id);
  if (!row) return;
  jsonInput.value = JSON.stringify(row.payload, null, 2);
  summarizeFromInput();
  statusMessage(`${row.ticker}を読み込み`);
}

function deleteWatchlist() {
  const id = watchlistSelect.value;
  if (!id) return;
  const rows = readStorage(storageKeys.watchlist, []).filter((row) => row.id !== id);
  writeStorage(storageKeys.watchlist, rows);
  renderWatchlistOptions();
  statusMessage("ウォッチリストから削除");
}

function logDecision() {
  const data = summarizeFromInput();
  const snapshot = analysisSnapshot(data);
  const row = {
    ticker: currentTicker(data),
    name: data.company?.name || "",
    date: new Date().toISOString().slice(0, 16).replace("T", " "),
    readiness: snapshot.investability.readiness,
    score: snapshot.investability.score,
    evidenceScore: snapshot.score.score,
    coverage: snapshot.cov.pct,
    position: snapshot.position.label,
    expectedReturn: snapshot.investability.expectedReturn,
    bearReturn: snapshot.investability.bearReturn,
    nextAction: snapshot.investability.nextActions?.[0] || ""
  };
  const rows = readStorage(storageKeys.decisionLog, []);
  rows.push(row);
  writeStorage(storageKeys.decisionLog, rows.slice(-200));
  statusMessage(`${row.ticker}の判断ログを記録`);
  summarizeFromInput();
}

function saveReview() {
  const note = reviewNote.value.trim();
  if (!note) {
    statusMessage("レビュー欄が空です");
    return;
  }
  const data = summarizeFromInput();
  const row = {
    ticker: currentTicker(data),
    name: data.company?.name || "",
    date: new Date().toISOString().slice(0, 16).replace("T", " "),
    note
  };
  const rows = readStorage(storageKeys.reviews, []);
  rows.push(row);
  writeStorage(storageKeys.reviews, rows.slice(-200));
  reviewNote.value = "";
  statusMessage(`${row.ticker}のレビューを保存`);
  summarizeFromInput();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let idx = 0; idx < text.length; idx += 1) {
    const char = text[idx];
    const next = text[idx + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        idx += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  row.push(cell);
  rows.push(row);
  const headers = (rows.shift() || []).map((header) => normalize(String(header || "").replace(/^\uFEFF/, "")));
  return rows
    .filter((values) => values.some((value) => String(value || "").trim()))
    .map((values) => Object.fromEntries(headers.map((header, idx) => [header, String(values[idx] || "").trim()])));
}

function evidenceRowsFromCsv(rows) {
  return rows.map((row) => ({
    category: row.category || "",
    item: row.item || "",
    value: row.value || "",
    interpretation: row.interpretation || "",
    source: row.source || "",
    source_url: row.source_url || "",
    date: row.date || new Date().toISOString().slice(0, 10),
    confidence: row.confidence || "medium",
    direction: row.direction || "neutral",
    materiality: row.materiality || "medium",
    source_type: row.source_type || "unknown"
  }));
}

function applyCsvMetadata(data, rows) {
  const first = rows.find((row) => Object.values(row).some(Boolean)) || {};
  data.company = {
    ...(data.company || {}),
    ticker: first.company_ticker || first.ticker || data.company?.ticker || "",
    name: first.company_name || first.name || data.company?.name || "",
    market: first.market || data.company?.market || "",
    sector: first.sector || data.company?.sector || "",
    currency: first.currency || data.company?.currency || "",
    as_of: first.as_of || data.company?.as_of || new Date().toISOString().slice(0, 10)
  };
  if (first.thesis) data.thesis = first.thesis;
  const portfolioKeys = ["portfolio_value", "current_weight", "proposed_weight", "sector_weight", "max_position_weight", "max_sector_weight"];
  const portfolioPatch = {};
  portfolioKeys.forEach((key) => {
    if (first[key] !== undefined && first[key] !== "") portfolioPatch[key] = Number(first[key]);
  });
  if (Object.keys(portfolioPatch).length) data.portfolio = { ...(data.portfolio || {}), ...portfolioPatch };
  return data;
}

async function importCsvFile(file) {
  const rows = parseCsv(await file.text());
  if (!rows.length) {
    statusMessage("CSVに有効行がありません");
    return;
  }
  const dataset = parseResearchInput();
  const grouped = {};
  let activeTicker = currentTicker(dataset.primary);
  rows.forEach((row) => {
    const explicitTicker = row.company_ticker || row.ticker;
    if (explicitTicker) activeTicker = explicitTicker;
    const ticker = explicitTicker || activeTicker;
    grouped[ticker] = grouped[ticker] || [];
    grouped[ticker].push(row);
  });
  const tickers = Object.keys(grouped);
  if (tickers.length === 1) {
    const data = JSON.parse(JSON.stringify(dataset.primary));
    applyCsvMetadata(data, grouped[tickers[0]]);
    data.evidence = Array.isArray(data.evidence) ? data.evidence : [];
    data.evidence.push(...evidenceRowsFromCsv(grouped[tickers[0]]));
    updateJson(data);
    statusMessage(`CSV ${rows.length}行を取り込み`);
    return;
  }
  const companies = tickers.map((ticker) => {
    const data = JSON.parse(JSON.stringify(dataset.primary));
    data.evidence = [];
    applyCsvMetadata(data, grouped[ticker]);
    data.evidence.push(...evidenceRowsFromCsv(grouped[ticker]));
    return data;
  });
  jsonInput.value = JSON.stringify({ companies }, null, 2);
  renderSummary(companies[0], companies);
  statusMessage(`CSV ${rows.length}行 / ${tickers.length}銘柄を取り込み`);
}

evidenceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = summarizeFromInput();
  const row = {
    category: document.querySelector("#fieldCategory").value,
    item: document.querySelector("#fieldItem").value.trim(),
    value: document.querySelector("#fieldValue").value.trim(),
    interpretation: document.querySelector("#fieldInterpretation").value.trim(),
    source: document.querySelector("#fieldSource").value.trim(),
    source_url: document.querySelector("#fieldSourceUrl").value.trim(),
    date: document.querySelector("#fieldDate").value,
    confidence: document.querySelector("#fieldConfidence").value,
    direction: document.querySelector("#fieldDirection").value,
    materiality: document.querySelector("#fieldMateriality").value,
    source_type: document.querySelector("#fieldSourceType").value
  };
  data.evidence.push(row);
  updateJson(data);
  clearEvidenceForm();
});

document.querySelector("#clearFormButton").addEventListener("click", clearEvidenceForm);
document.querySelector("#loadSampleButton").addEventListener("click", () => updateJson(sampleData));
document.querySelector("#loadComparisonButton").addEventListener("click", () => {
  const items = sampleComparisonData();
  jsonInput.value = JSON.stringify(items, null, 2);
  renderSummary(items[0], items);
});
document.querySelector("#saveWatchButton").addEventListener("click", saveWatchlist);
document.querySelector("#loadWatchButton").addEventListener("click", loadWatchlist);
document.querySelector("#deleteWatchButton").addEventListener("click", deleteWatchlist);
document.querySelector("#logDecisionButton").addEventListener("click", logDecision);
document.querySelector("#saveReviewButton").addEventListener("click", saveReview);
document.querySelector("#saveSettingsButton").addEventListener("click", saveSettingsFromForm);
document.querySelector("#resetSettingsButton").addEventListener("click", resetSettings);
document.querySelector("#formatButton").addEventListener("click", () => {
  try {
    errorBox.textContent = "";
    const dataset = parseResearchInput();
    jsonInput.value = JSON.stringify(dataset.parsed, null, 2);
    renderSummary(dataset.primary, dataset.items);
  } catch (error) {
    errorBox.textContent = error.message;
    throw error;
  }
});
document.querySelector("#summarizeButton").addEventListener("click", summarizeFromInput);
document.querySelector("#downloadButton").addEventListener("click", () => {
  const dataset = parseResearchInput();
  renderSummary(dataset.primary, dataset.items);
  const ticker = dataset.primary.company?.ticker || "research";
  downloadText(`${ticker}_research_summary.md`, buildMarkdown(dataset.primary, dataset.items));
});
document.querySelector("#copyButton").addEventListener("click", async () => {
  const dataset = parseResearchInput();
  renderSummary(dataset.primary, dataset.items);
  await navigator.clipboard.writeText(buildMarkdown(dataset.primary, dataset.items));
});
document.querySelector("#fileInput").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  jsonInput.value = await file.text();
  summarizeFromInput();
});
document.querySelector("#csvInput").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    await importCsvFile(file);
  } finally {
    event.target.value = "";
  }
});

populateForm();
populateSettingsForm();
renderWatchlistOptions();
jsonInput.value = JSON.stringify(sampleData, null, 2);
renderCatalog([]);
summarizeFromInput();
