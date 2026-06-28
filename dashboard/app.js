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
  }
};

const confidenceWeight = { high: 1.25, medium: 1, low: 0.65 };
const directionWeight = { positive: 1, negative: -1, neutral: 0, mixed: 0, unknown: 0 };
const materialityWeight = { high: 1.35, medium: 1, low: 0.7 };
const sourceQualityWeight = { primary_filing: 1.35, exchange: 1.25, regulator: 1.25, company_ir: 1.15, market_data: 1.05, consensus: 1, sell_side: 0.95, manual_model: 0.85, news: 0.8, internal: 0.75, unknown: 0.55 };

const jsonInput = document.querySelector("#jsonInput");
const summaryOutput = document.querySelector("#summaryOutput");
const errorBox = document.querySelector("#errorBox");
const scoreBox = document.querySelector("#scoreBox");
const asOfLabel = document.querySelector("#asOfLabel");
const coverageLabel = document.querySelector("#coverageLabel");
const catalogGrid = document.querySelector("#catalogGrid");
const auditStrip = document.querySelector("#auditStrip");
const evidenceForm = document.querySelector("#evidenceForm");

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

function parseData() {
  const parsed = JSON.parse(jsonInput.value);
  if (!parsed.company || typeof parsed.company !== "object") throw new Error("company オブジェクトが必要です。");
  if (!Array.isArray(parsed.evidence)) throw new Error("evidence は配列で入力してください。");
  return parsed;
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
  if (primaryRatio < 0.4) investScore -= (0.4 - primaryRatio) * 20;
  if (cov.pct < 85) investScore -= (85 - cov.pct) * 0.3;
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
  if (primaryRatio < 0.4) warnings.push("一次情報・取引所・規制当局データの比率が低く、検証可能性が不足しています。");
  if (cov.pct < 85) warnings.push("情報カバレッジが85%未満です。投資候補化するには未充足カテゴリを埋めてください。");
  if (expectedReturn !== null && expectedReturn < 0.1) warnings.push("期待リターンが低く、リスクに対する余地が薄い可能性があります。");
  if (bearReturn !== null && bearReturn < -0.35) warnings.push("ベアケース下落余地が大きく、ポジションサイズ制約が必要です。");
  if (riskReward !== null && riskReward < 1) warnings.push("期待リターンがベアケース損失を十分に上回っていません。");
  if (cov.pct < 75) nextActions.push("不足カテゴリを埋め、情報カバレッジを75%以上に上げる。");
  if (!categories.has("ownership_flows")) nextActions.push("保有・需給・空売り・指数イベントを確認する。");
  if (!categories.has("governance_legal")) nextActions.push("ガバナンス、訴訟、規制、会計リスクを確認する。");
  if (!categories.has("capital_allocation")) nextActions.push("自社株買い、配当、M&A、希薄化、ROIC/WACCを確認する。");
  if (!nextActions.length) nextActions.push("主要反証条件を次回決算・イベントで再検証する。");

  let readiness = "見送り寄り";
  if (blockers.length) readiness = "調査未完了";
  else if (investScore >= 78 && warnings.length === 0) readiness = "投資候補";
  else if (investScore >= 68) readiness = "監視候補";
  else if (investScore >= 50) readiness = "追加調査";

  return { score: investScore, readiness, institutionalRatio, primaryRatio, expectedReturn, bearReturn, bullReturn, riskReward, blockers, warnings, nextActions };
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

function renderSummary(data) {
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
    <section class="summary-block"><h3>データ品質監査</h3><ul class="summary-list">${issueHtml}</ul></section>
    <section class="summary-block"><h3>強材料</h3><ul class="summary-list">${renderBullets(grouped.positive, "明確な強材料は未入力です。", asOf)}</ul></section>
    <section class="summary-block"><h3>弱材料・反証条件</h3><ul class="summary-list">${renderBullets(grouped.negative, "明確な弱材料は未入力です。", asOf)}</ul></section>
    <section class="summary-block"><h3>中立・確認待ち材料</h3><ul class="summary-list">${renderBullets(neutralRows, "中立・確認待ち材料は未入力です。", asOf)}</ul></section>
    <section class="summary-block"><h3>未充足データ</h3><ul class="summary-list">${missingHtml}</ul></section>
    ${kpiHtml}
    ${valuationHtml}
    <section class="summary-block">
      <h3>エビデンス台帳</h3>
      <table class="evidence-table">
        <thead><tr><th>カテゴリ</th><th>項目</th><th>値</th><th>出所</th><th>方向</th><th>重み</th></tr></thead>
        <tbody>${tableRows || '<tr><td colspan="6">エビデンスがありません。</td></tr>'}</tbody>
      </table>
    </section>
  `;
}

function buildMarkdown(data) {
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
    const data = parseData();
    renderSummary(data);
    return data;
  } catch (error) {
    errorBox.textContent = error.message;
    throw error;
  }
}

function updateJson(data) {
  jsonInput.value = JSON.stringify(data, null, 2);
  renderSummary(data);
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
document.querySelector("#formatButton").addEventListener("click", () => updateJson(summarizeFromInput()));
document.querySelector("#summarizeButton").addEventListener("click", summarizeFromInput);
document.querySelector("#downloadButton").addEventListener("click", () => {
  const data = summarizeFromInput();
  const ticker = data.company?.ticker || "research";
  downloadText(`${ticker}_research_summary.md`, buildMarkdown(data));
});
document.querySelector("#copyButton").addEventListener("click", async () => {
  const data = summarizeFromInput();
  await navigator.clipboard.writeText(buildMarkdown(data));
});
document.querySelector("#fileInput").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  jsonInput.value = await file.text();
  summarizeFromInput();
});

populateForm();
jsonInput.value = JSON.stringify(sampleData, null, 2);
renderCatalog([]);
summarizeFromInput();
