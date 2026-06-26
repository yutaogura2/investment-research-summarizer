const catalog = [
  {
    id: "financials",
    name: "財務諸表・開示資料",
    use: "売上、利益、キャッシュフロー、資本効率、財務安全性を検証する。",
    metrics: ["売上高・利益・EPS", "営業CF・FCF", "ROIC・負債・自己資本比率"]
  },
  {
    id: "market",
    name: "株価・流動性・テクニカル需給",
    use: "投資可能性、ポジションサイズ、売買コスト、需給の歪みを判断する。",
    metrics: ["時価総額・浮動株", "売買代金・スプレッド", "相対リターン・ボラティリティ"]
  },
  {
    id: "valuation",
    name: "バリュエーション",
    use: "価格に織り込まれた成長・利益率・資本コストを推定する。",
    metrics: ["PER・EV/EBITDA・PBR", "FCF利回り", "DCF・SOTP・同業比較"]
  },
  {
    id: "estimates",
    name: "業績予想・コンセンサス",
    use: "市場期待、上方修正・下方修正余地、決算サプライズ確率を把握する。",
    metrics: ["会社計画との差", "EPS予想修正", "目標株価・レーティング分布"]
  },
  {
    id: "ownership_flows",
    name: "保有・資金フロー",
    use: "誰が買っているか、混雑しているか、売り圧力・買い圧力が残るかを見る。",
    metrics: ["主要株主・13F", "ETF・指数イベント", "空売り・信用・インサイダー"]
  },
  {
    id: "macro_rates_fx",
    name: "マクロ・金利・為替",
    use: "業績・倍率・資金フローに影響する外部環境を把握する。",
    metrics: ["政策金利・国債利回り", "為替感応度", "PMI・雇用・商品価格"]
  },
  {
    id: "sector_competition",
    name: "業界・競争環境",
    use: "個社要因と業界サイクルを分離し、競争優位を評価する。",
    metrics: ["市場成長率・シェア", "競合マージン", "価格・在庫・稼働率"]
  },
  {
    id: "capital_allocation",
    name: "資本政策・M&A",
    use: "経営陣が資本を高リターンで配分しているか判断する。",
    metrics: ["ROIC vs WACC", "配当・自社株買い", "M&A価格・希薄化"]
  },
  {
    id: "governance_legal",
    name: "ガバナンス・法務",
    use: "少数株主保護、経営の質、重大な法務・規制リスクを評価する。",
    metrics: ["取締役独立性", "報酬KPI", "訴訟・規制・監査"]
  },
  {
    id: "events_catalysts",
    name: "イベント・カタリスト",
    use: "株価が動く時期と要因を整理し、時間軸を決める。",
    metrics: ["決算日・説明会", "製品・承認・規制", "指数入替・ロックアップ"]
  },
  {
    id: "risk_scenarios",
    name: "リスク・シナリオ",
    use: "ベース、ブル、ベアの期待値と損失許容度を明確にする。",
    metrics: ["反証条件", "最大損失・期待値", "相関・流動性ストレス"]
  }
];

const sampleData = {
  schema_version: "1.0",
  company: {
    ticker: "EXM",
    name: "Example Manufacturing Inc.",
    market: "US",
    sector: "Industrials",
    currency: "USD",
    as_of: "2026-06-26"
  },
  thesis: "産業自動化向け部品の需要回復と価格改定により利益率が改善する、という仮説を検証する。",
  evidence: [
    {
      category: "financials",
      item: "売上成長",
      value: "直近期売上は前年比 +8.2%",
      interpretation: "数量回復に加え、価格改定が寄与。M&A寄与は小さいためオーガニック成長として評価しやすい。",
      source: "FY2025 Form 10-K",
      source_url: "https://www.sec.gov/search-filings",
      date: "2026-02-15",
      confidence: "high",
      direction: "positive"
    },
    {
      category: "financials",
      item: "営業利益率",
      value: "営業利益率は 12.4% から 14.1% に改善",
      interpretation: "値上げと原材料価格の落ち着きが寄与。固定費削減は一部一過性の可能性がある。",
      source: "Company earnings release",
      source_url: "",
      date: "2026-02-15",
      confidence: "medium",
      direction: "positive"
    },
    {
      category: "valuation",
      item: "相対バリュエーション",
      value: "EV/EBITDA は同業中央値 11.0x に対して 8.7x",
      interpretation: "成長率が同業並みなら割安。ただし小型株ディスカウントと流動性の低さを考慮する必要がある。",
      source: "Manual peer model",
      source_url: "",
      date: "2026-06-20",
      confidence: "medium",
      direction: "positive"
    },
    {
      category: "estimates",
      item: "コンセンサス修正",
      value: "直近90日で来期EPS予想は -3.5%",
      interpretation: "短期的には受注回復の遅れが織り込まれ始めている。次回決算で受注残の確認が必要。",
      source: "Manual consensus snapshot",
      source_url: "",
      date: "2026-06-18",
      confidence: "medium",
      direction: "negative"
    },
    {
      category: "market",
      item: "流動性",
      value: "20日平均売買代金は約 18百万ドル",
      interpretation: "個人投資家には十分だが、大型ファンドではポジション構築に数日を要する可能性がある。",
      source: "Exchange price history",
      source_url: "",
      date: "2026-06-25",
      confidence: "medium",
      direction: "neutral"
    },
    {
      category: "macro_rates_fx",
      item: "原材料感応度",
      value: "銅価格 10% 上昇で営業利益率に約 -40bp の影響",
      interpretation: "価格転嫁に時間差があるため、銅価格上昇局面では短期マージンに逆風。",
      source: "Management sensitivity disclosure",
      source_url: "",
      date: "2026-03-10",
      confidence: "medium",
      direction: "negative"
    },
    {
      category: "sector_competition",
      item: "競争環境",
      value: "主要競合2社が設備投資を抑制",
      interpretation: "供給過剰リスクは低下しているが、需要回復が遅い場合は価格競争再燃の可能性がある。",
      source: "Competitor filings",
      source_url: "https://www.sec.gov/search-filings",
      date: "2026-05-30",
      confidence: "low",
      direction: "positive"
    },
    {
      category: "events_catalysts",
      item: "次回決算",
      value: "次回決算で受注残、価格改定の継続性、在庫水準を確認",
      interpretation: "投資仮説の短期検証点。受注残が横ばい以下ならベースシナリオを引き下げる。",
      source: "Internal research calendar",
      source_url: "",
      date: "2026-06-26",
      confidence: "high",
      direction: "neutral"
    },
    {
      category: "risk_scenarios",
      item: "反証条件",
      value: "受注残が2四半期連続で前年比マイナス、または営業利益率が13%未満に低下",
      interpretation: "需要回復と価格転嫁の仮説が崩れるため、ポジション縮小を検討する条件。",
      source: "Internal scenario model",
      source_url: "",
      date: "2026-06-26",
      confidence: "medium",
      direction: "negative"
    }
  ]
};

const confidenceWeight = { high: 1.25, medium: 1, low: 0.6 };
const directionWeight = { positive: 1, negative: -1, neutral: 0, mixed: 0, unknown: 0 };

const jsonInput = document.querySelector("#jsonInput");
const summaryOutput = document.querySelector("#summaryOutput");
const errorBox = document.querySelector("#errorBox");
const scoreBox = document.querySelector("#scoreBox");
const asOfLabel = document.querySelector("#asOfLabel");
const coverageLabel = document.querySelector("#coverageLabel");
const catalogGrid = document.querySelector("#catalogGrid");

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

function parseData() {
  const parsed = JSON.parse(jsonInput.value);
  if (!parsed.company || typeof parsed.company !== "object") {
    throw new Error("company オブジェクトが必要です。");
  }
  if (!Array.isArray(parsed.evidence)) {
    throw new Error("evidence は配列で入力してください。");
  }
  return parsed;
}

function scoreEvidence(evidence) {
  let total = 0;
  let totalAbs = 0;
  const counts = { positive: 0, negative: 0, neutral: 0, mixed: 0, unknown: 0 };
  evidence.forEach((row) => {
    const direction = normalize(row.direction) || "unknown";
    const confidence = normalize(row.confidence) || "medium";
    const directionValue = directionWeight[direction] ?? 0;
    const weight = confidenceWeight[confidence] ?? 0.8;
    total += directionValue * weight;
    if (directionValue !== 0) totalAbs += weight;
    counts[direction in counts ? direction : "unknown"] += 1;
  });
  const score = totalAbs === 0 ? 0 : Math.round((total / totalAbs) * 100);
  let stance = "中立または情報不足。現時点では優位性を判断しにくい。";
  if (score >= 45) stance = "強めにポジティブ。ただし未充足データと反証条件の確認が必要。";
  else if (score >= 15) stance = "ややポジティブ。追加データで確信度を上げる段階。";
  else if (score <= -45) stance = "ネガティブ材料が優勢。投資仮説の再検証が必要。";
  else if (score <= -15) stance = "ややネガティブ。下振れ要因の確認を優先。";
  return { score, stance, counts };
}

function coverage(evidence) {
  const categoryIds = catalog.map((item) => item.id);
  const covered = Array.from(new Set(evidence.map((row) => normalize(row.category)).filter(Boolean)));
  const coveredKnown = covered.filter((id) => categoryIds.includes(id));
  const missing = categoryIds.filter((id) => !coveredKnown.includes(id));
  return {
    pct: Math.round((coveredKnown.length / categoryIds.length) * 100),
    covered: coveredKnown,
    missing
  };
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

function rowRank(row) {
  const confidence = confidenceWeight[normalize(row.confidence)] ?? 0.8;
  return confidence * 100000000 + Date.parse(row.date || "1970-01-01") / 100000000;
}

function renderBullets(rows, fallback) {
  if (!rows.length) return `<li>${escapeHtml(fallback)}</li>`;
  return rows
    .slice()
    .sort((a, b) => rowRank(b) - rowRank(a))
    .slice(0, 5)
    .map((row) => {
      const source = [row.source, row.date, row.confidence ? `confidence=${row.confidence}` : ""].filter(Boolean).join(" / ");
      const suffix = source ? ` <span class="muted">(${escapeHtml(source)})</span>` : "";
      return `<li><strong>${escapeHtml(row.item)}:</strong> ${escapeHtml(row.value)}. ${escapeHtml(row.interpretation)}${suffix}</li>`;
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

function renderSummary(data) {
  const evidence = data.evidence || [];
  const score = scoreEvidence(evidence);
  const cov = coverage(evidence);
  const grouped = groupEvidence(evidence);
  const company = data.company || {};
  const label = [company.ticker, company.name].filter(Boolean).join(" / ") || "未設定";
  const neutralRows = grouped.neutral.concat(grouped.mixed, grouped.unknown);

  scoreBox.textContent = score.score;
  asOfLabel.textContent = `基準日: ${company.as_of || "-"}`;
  coverageLabel.textContent = `カバレッジ: ${cov.pct}%`;
  renderCatalog(cov.covered);

  const missingHtml = cov.missing.length
    ? cov.missing
        .map((id) => {
          const item = catalog.find((entry) => entry.id === id);
          return `<li><strong>${escapeHtml(item?.name || id)}</strong>: ${escapeHtml((item?.metrics || []).join("、"))}</li>`;
        })
        .join("")
    : "<li>全カテゴリに少なくとも1件の証拠があります。次は数値の鮮度、一次資料比率、反証条件の精度を確認してください。</li>";

  const tableRows = evidence
    .map((row) => {
      const category = catalog.find((item) => item.id === normalize(row.category));
      const direction = normalize(row.direction) || "unknown";
      const source = row.source_url
        ? `<a href="${escapeHtml(row.source_url)}" target="_blank" rel="noreferrer">${escapeHtml(row.source || row.source_url)}</a>`
        : escapeHtml(row.source || "");
      return `
        <tr>
          <td>${escapeHtml(category?.name || row.category)}</td>
          <td>${escapeHtml(row.item)}</td>
          <td>${escapeHtml(row.value)}</td>
          <td>${source}</td>
          <td><span class="tag ${direction}">${escapeHtml(direction)}</span></td>
        </tr>
      `;
    })
    .join("");

  summaryOutput.innerHTML = `
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
    <section class="summary-block">
      <h3>強材料</h3>
      <ul class="summary-list">${renderBullets(grouped.positive, "明確な強材料は未入力です。")}</ul>
    </section>
    <section class="summary-block">
      <h3>弱材料・反証条件</h3>
      <ul class="summary-list">${renderBullets(grouped.negative, "明確な弱材料は未入力です。")}</ul>
    </section>
    <section class="summary-block">
      <h3>中立・確認待ち材料</h3>
      <ul class="summary-list">${renderBullets(neutralRows, "中立・確認待ち材料は未入力です。")}</ul>
    </section>
    <section class="summary-block">
      <h3>未充足データ</h3>
      <ul class="summary-list">${missingHtml}</ul>
    </section>
    <section class="summary-block">
      <h3>エビデンス台帳</h3>
      <table class="evidence-table">
        <thead><tr><th>カテゴリ</th><th>項目</th><th>値</th><th>出所</th><th>方向</th></tr></thead>
        <tbody>${tableRows || '<tr><td colspan="5">エビデンスがありません。</td></tr>'}</tbody>
      </table>
    </section>
  `;
}

function buildMarkdown(data) {
  const evidence = data.evidence || [];
  const score = scoreEvidence(evidence);
  const cov = coverage(evidence);
  const grouped = groupEvidence(evidence);
  const company = data.company || {};
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
    "## 結論サマリ",
    "",
    `- 証拠スコア: ${score.score} / 100`,
    `- 調査スタンス: ${score.stance}`,
    `- 情報カバレッジ: ${cov.pct}%`,
    `- ポジティブ ${score.counts.positive}件 / ネガティブ ${score.counts.negative}件 / 中立・混在 ${score.counts.neutral + score.counts.mixed + score.counts.unknown}件`,
    "",
    "## 強材料",
    ""
  ];
  const addRows = (rows, fallback) => {
    if (!rows.length) {
      lines.push(`- ${fallback}`);
      return;
    }
    rows
      .slice()
      .sort((a, b) => rowRank(b) - rowRank(a))
      .slice(0, 5)
      .forEach((row) => {
        lines.push(`- ${row.item}: ${row.value}. ${row.interpretation} (${[row.source, row.date, row.confidence].filter(Boolean).join(" / ")})`);
      });
  };
  addRows(grouped.positive, "明確な強材料は未入力です。");
  lines.push("", "## 弱材料・反証条件", "");
  addRows(grouped.negative, "明確な弱材料は未入力です。");
  lines.push("", "## 中立・確認待ち材料", "");
  addRows(grouped.neutral.concat(grouped.mixed, grouped.unknown), "中立・確認待ち材料は未入力です。");
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
  lines.push("|カテゴリ|項目|値|解釈|出所|日付|確信度|方向|");
  lines.push("|---|---|---|---|---|---|---|---|");
  evidence.forEach((row) => {
    const category = catalog.find((item) => item.id === normalize(row.category));
    lines.push(
      `|${category?.name || row.category || ""}|${row.item || ""}|${row.value || ""}|${row.interpretation || ""}|${row.source || ""}|${row.date || ""}|${row.confidence || ""}|${row.direction || ""}|`
    );
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

document.querySelector("#loadSampleButton").addEventListener("click", () => {
  jsonInput.value = JSON.stringify(sampleData, null, 2);
  summarizeFromInput();
});

document.querySelector("#formatButton").addEventListener("click", () => {
  const data = summarizeFromInput();
  jsonInput.value = JSON.stringify(data, null, 2);
});

document.querySelector("#summarizeButton").addEventListener("click", () => {
  summarizeFromInput();
});

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

jsonInput.value = JSON.stringify(sampleData, null, 2);
renderCatalog([]);
summarizeFromInput();
