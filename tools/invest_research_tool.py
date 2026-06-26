#!/usr/bin/env python3
"""
Institutional-style investment research summarizer.

The tool intentionally produces evidence-backed research notes, not buy/sell
recommendations. It can work fully offline from JSON input. SEC fetching is
optional and uses only Python standard-library modules.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import sys
import textwrap
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "information_catalog.json"

CONFIDENCE_WEIGHT = {
    "high": 1.25,
    "medium": 1.0,
    "low": 0.6,
}

DIRECTION_WEIGHT = {
    "positive": 1.0,
    "negative": -1.0,
    "neutral": 0.0,
    "mixed": 0.0,
    "unknown": 0.0,
}


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_text(path: Path | None, text: str) -> None:
    if path is None:
        print(text)
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def today_iso() -> str:
    return dt.date.today().isoformat()


def normalize_id(text: str) -> str:
    return text.strip().lower().replace(" ", "_")


def catalog_by_id(catalog: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {category["id"]: category for category in catalog.get("categories", [])}


def format_catalog_markdown(catalog: dict[str, Any]) -> str:
    lines = [
        "# 機関投資家向け情報カタログ",
        "",
        f"- 作成・更新日: {catalog.get('as_of', 'unknown')}",
        f"- 目的: {catalog.get('purpose', '')}",
        f"- 注意: {catalog.get('decision_note', '')}",
        "",
    ]
    for category in catalog.get("categories", []):
        lines.extend(
            [
                f"## {category['name']} (`{category['id']}`)",
                "",
                f"用途: {category.get('institutional_use', '')}",
                "",
                "主要質問:",
            ]
        )
        lines.extend([f"- {q}" for q in category.get("key_questions", [])])
        lines.extend(["", "主要指標:"])
        lines.extend([f"- {metric}" for metric in category.get("required_metrics", [])])
        lines.extend(["", "公開データ源:"])
        for source in category.get("public_sources", []):
            region = source.get("region", "")
            suffix = f" ({region})" if region else ""
            lines.append(f"- [{source.get('name', '')}]({source.get('url', '')}){suffix}")
        manual_sources = category.get("paid_or_manual_sources", [])
        if manual_sources:
            lines.extend(["", "有料・手入力データ:"])
            lines.extend([f"- {source}" for source in manual_sources])
        lines.extend(["", "品質チェック:"])
        lines.extend([f"- {check}" for check in category.get("quality_checks", [])])
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def empty_template(catalog: dict[str, Any]) -> dict[str, Any]:
    return {
        "schema_version": "1.0",
        "company": {
            "ticker": "",
            "name": "",
            "market": "US/JP/Other",
            "sector": "",
            "currency": "",
            "as_of": today_iso(),
        },
        "thesis": "",
        "evidence": [
            {
                "category": category["id"],
                "item": "",
                "value": "",
                "interpretation": "",
                "source": "",
                "source_url": "",
                "date": today_iso(),
                "confidence": "medium",
                "direction": "neutral",
            }
            for category in catalog.get("categories", [])
        ],
    }


def evidence_score(evidence: list[dict[str, Any]]) -> dict[str, Any]:
    total_abs = 0.0
    total = 0.0
    counts = {"positive": 0, "negative": 0, "neutral": 0, "mixed": 0, "unknown": 0}
    for row in evidence:
        direction = normalize_id(str(row.get("direction", "unknown")))
        confidence = normalize_id(str(row.get("confidence", "medium")))
        direction_value = DIRECTION_WEIGHT.get(direction, 0.0)
        weight = CONFIDENCE_WEIGHT.get(confidence, 0.8)
        total += direction_value * weight
        if direction_value != 0:
            total_abs += weight
        counts[direction if direction in counts else "unknown"] += 1
    normalized = 0 if total_abs == 0 else int(round((total / total_abs) * 100))
    if normalized >= 45:
        stance = "強めにポジティブ。ただし未充足データと反証条件の確認が必要。"
    elif normalized >= 15:
        stance = "ややポジティブ。追加データで確信度を上げる段階。"
    elif normalized <= -45:
        stance = "ネガティブ材料が優勢。投資仮説の再検証が必要。"
    elif normalized <= -15:
        stance = "ややネガティブ。下振れ要因の確認を優先。"
    else:
        stance = "中立または情報不足。現時点では優位性を判断しにくい。"
    return {
        "score": normalized,
        "stance": stance,
        "counts": counts,
    }


def coverage_report(
    evidence: list[dict[str, Any]],
    catalog: dict[str, Any],
) -> dict[str, Any]:
    category_ids = [category["id"] for category in catalog.get("categories", [])]
    covered = sorted(
        {
            normalize_id(str(row.get("category", "")))
            for row in evidence
            if normalize_id(str(row.get("category", "")))
        }
    )
    covered_known = [category_id for category_id in covered if category_id in category_ids]
    missing = [category_id for category_id in category_ids if category_id not in covered_known]
    coverage = 0 if not category_ids else round(len(covered_known) / len(category_ids) * 100)
    return {
        "coverage_pct": coverage,
        "covered": covered_known,
        "missing": missing,
    }


def split_evidence(evidence: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    result = {"positive": [], "negative": [], "neutral": [], "mixed": [], "unknown": []}
    for row in evidence:
        direction = normalize_id(str(row.get("direction", "unknown")))
        bucket = direction if direction in result else "unknown"
        result[bucket].append(row)
    return result


def top_rows(rows: list[dict[str, Any]], limit: int = 5) -> list[dict[str, Any]]:
    def rank(row: dict[str, Any]) -> tuple[float, str]:
        confidence = normalize_id(str(row.get("confidence", "medium")))
        return (CONFIDENCE_WEIGHT.get(confidence, 0.8), str(row.get("date", "")))

    return sorted(rows, key=rank, reverse=True)[:limit]


def md_escape(text: Any) -> str:
    return str(text if text is not None else "").replace("\n", " ").strip()


def format_row_bullets(rows: list[dict[str, Any]], fallback: str) -> list[str]:
    if not rows:
        return [f"- {fallback}"]
    bullets = []
    for row in top_rows(rows):
        source = md_escape(row.get("source", ""))
        date = md_escape(row.get("date", ""))
        confidence = md_escape(row.get("confidence", ""))
        suffix_parts = [part for part in [source, date, f"confidence={confidence}" if confidence else ""] if part]
        suffix = f" ({' / '.join(suffix_parts)})" if suffix_parts else ""
        bullets.append(
            f"- {md_escape(row.get('item'))}: {md_escape(row.get('value'))}. "
            f"{md_escape(row.get('interpretation'))}{suffix}"
        )
    return bullets


def build_summary(data: dict[str, Any], catalog: dict[str, Any], include_catalog: bool) -> str:
    company = data.get("company", {})
    evidence = data.get("evidence", [])
    if not isinstance(evidence, list):
        raise ValueError("'evidence' must be a list.")
    by_category = catalog_by_id(catalog)
    score = evidence_score(evidence)
    coverage = coverage_report(evidence, catalog)
    buckets = split_evidence(evidence)
    unknown_categories = sorted(
        {
            normalize_id(str(row.get("category", "")))
            for row in evidence
            if normalize_id(str(row.get("category", ""))) not in by_category
        }
    )

    title = "投資判断用リサーチサマリ"
    ticker = md_escape(company.get("ticker", ""))
    name = md_escape(company.get("name", ""))
    company_label = " / ".join([part for part in [ticker, name] if part]) or "未設定"

    lines = [
        f"# {title}: {company_label}",
        "",
        "> この出力は投資調査メモであり、売買推奨ではありません。一次情報、価格、リスク許容度を別途確認してください。",
        "",
        "## 1. 基本情報",
        "",
        f"- 市場: {md_escape(company.get('market', ''))}",
        f"- セクター: {md_escape(company.get('sector', ''))}",
        f"- 通貨: {md_escape(company.get('currency', ''))}",
        f"- データ基準日: {md_escape(company.get('as_of', today_iso()))}",
        f"- 投資仮説: {md_escape(data.get('thesis', '')) or '未入力'}",
        "",
        "## 2. 結論サマリ",
        "",
        f"- 証拠スコア: {score['score']} / 100",
        f"- 調査スタンス: {score['stance']}",
        f"- 情報カバレッジ: {coverage['coverage_pct']}% ({len(coverage['covered'])}/{len(catalog.get('categories', []))}カテゴリ)",
        f"- ポジティブ証拠: {score['counts']['positive']}件 / ネガティブ証拠: {score['counts']['negative']}件 / 中立・混在: {score['counts']['neutral'] + score['counts']['mixed'] + score['counts']['unknown']}件",
        "",
        "## 3. 強材料",
        "",
    ]
    lines.extend(format_row_bullets(buckets["positive"], "明確な強材料は未入力です。"))
    lines.extend(["", "## 4. 弱材料・反証条件", ""])
    lines.extend(format_row_bullets(buckets["negative"], "明確な弱材料は未入力です。"))
    lines.extend(["", "## 5. 中立・確認待ち材料", ""])
    neutral_rows = buckets["neutral"] + buckets["mixed"] + buckets["unknown"]
    lines.extend(format_row_bullets(neutral_rows, "中立・確認待ち材料は未入力です。"))

    lines.extend(["", "## 6. 未充足データと次の取得優先度", ""])
    if coverage["missing"]:
        for category_id in coverage["missing"]:
            category = by_category[category_id]
            metrics = "、".join(category.get("required_metrics", [])[:3])
            lines.append(f"- {category['name']} (`{category_id}`): {metrics}")
    else:
        lines.append("- 全カテゴリに少なくとも1件の証拠があります。次は数値の鮮度、一次資料比率、反証条件の精度を確認してください。")

    if unknown_categories:
        lines.extend(["", "未登録カテゴリ:", ""])
        lines.extend([f"- `{category}`" for category in unknown_categories])

    lines.extend(["", "## 7. エビデンス台帳", ""])
    lines.append("|カテゴリ|項目|値|解釈|出所|日付|確信度|方向|")
    lines.append("|---|---|---|---|---|---|---|---|")
    for row in evidence:
        category_id = normalize_id(str(row.get("category", "")))
        category_name = by_category.get(category_id, {}).get("name", category_id)
        source_url = md_escape(row.get("source_url", ""))
        source_label = md_escape(row.get("source", ""))
        if source_url and source_label:
            source = f"[{source_label}]({source_url})"
        else:
            source = source_label or source_url
        lines.append(
            "|"
            + "|".join(
                [
                    md_escape(category_name),
                    md_escape(row.get("item", "")),
                    md_escape(row.get("value", "")),
                    md_escape(row.get("interpretation", "")),
                    source,
                    md_escape(row.get("date", "")),
                    md_escape(row.get("confidence", "")),
                    md_escape(row.get("direction", "")),
                ]
            )
            + "|"
        )

    if include_catalog:
        lines.extend(["", "---", "", format_catalog_markdown(catalog)])

    return "\n".join(lines).rstrip() + "\n"


def sec_request(url: str, user_agent: str, sleep_seconds: float = 0.12) -> Any:
    time.sleep(max(0, sleep_seconds))
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": user_agent,
            "Accept-Encoding": "identity",
            "Host": urllib.parse.urlparse(url).netloc,
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"SEC request failed: HTTP {exc.code} {url}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"SEC request failed: {exc.reason} {url}") from exc


def cik_from_ticker(ticker: str, user_agent: str) -> str:
    tickers = sec_request("https://www.sec.gov/files/company_tickers.json", user_agent)
    ticker_upper = ticker.upper()
    for row in tickers.values():
        if str(row.get("ticker", "")).upper() == ticker_upper:
            return str(row["cik_str"]).zfill(10)
    raise ValueError(f"Ticker not found in SEC company_tickers.json: {ticker}")


def choose_latest_fact(
    facts: dict[str, Any],
    concepts: list[str],
    units: list[str],
    forms: tuple[str, ...] = ("10-K", "10-Q"),
) -> dict[str, Any] | None:
    us_gaap = facts.get("facts", {}).get("us-gaap", {})
    candidates: list[dict[str, Any]] = []
    for concept in concepts:
        concept_data = us_gaap.get(concept)
        if not concept_data:
            continue
        unit_data = concept_data.get("units", {})
        for unit in units:
            for row in unit_data.get(unit, []):
                if row.get("form") in forms and "val" in row and row.get("end"):
                    enriched = dict(row)
                    enriched["concept"] = concept
                    enriched["unit"] = unit
                    candidates.append(enriched)
    if not candidates:
        return None
    candidates.sort(key=lambda row: (str(row.get("end", "")), str(row.get("filed", ""))), reverse=True)
    return candidates[0]


def compact_number(value: Any, currency: str = "") -> str:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return str(value)
    sign = "-" if number < 0 else ""
    number = abs(number)
    units = [
        (1_000_000_000_000, "T"),
        (1_000_000_000, "B"),
        (1_000_000, "M"),
        (1_000, "K"),
    ]
    for divisor, suffix in units:
        if number >= divisor:
            return f"{sign}{currency}{number / divisor:.2f}{suffix}"
    if math.isclose(number, round(number)):
        return f"{sign}{currency}{int(number)}"
    return f"{sign}{currency}{number:.2f}"


def sec_fact_evidence(
    facts: dict[str, Any],
    item: str,
    concepts: list[str],
    interpretation: str,
    direction: str,
) -> dict[str, Any] | None:
    fact = choose_latest_fact(facts, concepts, ["USD", "shares", "USD/shares"])
    if not fact:
        return None
    unit = fact.get("unit", "")
    currency = "$" if unit == "USD" else ""
    return {
        "category": "financials",
        "item": item,
        "value": f"{compact_number(fact.get('val'), currency)} ({fact.get('fy', '')} {fact.get('fp', '')}, {fact.get('form', '')})",
        "interpretation": interpretation,
        "source": f"SEC companyfacts {fact.get('concept', '')}",
        "source_url": "",
        "date": fact.get("filed", ""),
        "confidence": "high",
        "direction": direction,
    }


def fetch_sec_company(ticker: str, user_agent: str) -> dict[str, Any]:
    cik = cik_from_ticker(ticker, user_agent)
    submissions = sec_request(f"https://data.sec.gov/submissions/CIK{cik}.json", user_agent)
    facts = sec_request(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json", user_agent)
    recent_filings = submissions.get("filings", {}).get("recent", {})
    filing_rows = []
    for idx, form in enumerate(recent_filings.get("form", [])[:20]):
        filing_rows.append(
            {
                "form": form,
                "filing_date": recent_filings.get("filingDate", [""])[idx],
                "report_date": recent_filings.get("reportDate", [""])[idx],
                "accession": recent_filings.get("accessionNumber", [""])[idx],
            }
        )

    evidence: list[dict[str, Any]] = []
    fact_specs = [
        (
            "売上高",
            ["Revenues", "SalesRevenueNet", "RevenueFromContractWithCustomerExcludingAssessedTax"],
            "直近開示の売上規模。前年比・セグメント別内訳は別途確認が必要。",
            "neutral",
        ),
        (
            "純利益",
            ["NetIncomeLoss", "ProfitLoss"],
            "利益水準の一次情報。営業外・一過性項目の有無は10-K/10-Q本文で確認する。",
            "neutral",
        ),
        (
            "営業キャッシュフロー",
            ["NetCashProvidedByUsedInOperatingActivities"],
            "利益の現金化を確認する入口。運転資本要因の分解が必要。",
            "neutral",
        ),
        (
            "総資産",
            ["Assets"],
            "貸借対照表の規模。資本効率の計算に使用する。",
            "neutral",
        ),
        (
            "総負債",
            ["Liabilities"],
            "財務レバレッジの入口。現金、有利子負債、リース負債の分解が必要。",
            "neutral",
        ),
        (
            "希薄化後EPS",
            ["EarningsPerShareDiluted"],
            "1株利益の一次情報。Non-GAAP EPSやコンセンサスとは区別する。",
            "neutral",
        ),
    ]
    for spec in fact_specs:
        row = sec_fact_evidence(facts, *spec)
        if row:
            evidence.append(row)

    for filing in filing_rows[:8]:
        evidence.append(
            {
                "category": "events_catalysts",
                "item": f"SEC filing {filing['form']}",
                "value": f"filed={filing['filing_date']}, report={filing['report_date']}",
                "interpretation": "最新開示の本文、リスク要因、MD&A、注記を確認する。",
                "source": "SEC submissions",
                "source_url": f"https://data.sec.gov/submissions/CIK{cik}.json",
                "date": filing["filing_date"],
                "confidence": "high",
                "direction": "neutral",
            }
        )

    return {
        "schema_version": "1.0",
        "company": {
            "ticker": ticker.upper(),
            "name": submissions.get("name", ""),
            "market": "US",
            "sector": submissions.get("sicDescription", ""),
            "currency": "USD",
            "as_of": today_iso(),
            "cik": cik,
        },
        "thesis": "SEC一次情報から作成した初期調査メモ。投資仮説、価格、バリュエーション、コンセンサス、競争環境は追加入力が必要。",
        "evidence": evidence,
        "raw": {
            "sec_recent_filings": filing_rows,
        },
    }


def run_catalog(args: argparse.Namespace) -> None:
    catalog = load_json(CATALOG_PATH)
    if args.format == "json":
        text = json.dumps(catalog, ensure_ascii=False, indent=2)
    else:
        text = format_catalog_markdown(catalog)
    write_text(args.output, text)


def run_template(args: argparse.Namespace) -> None:
    catalog = load_json(CATALOG_PATH)
    text = json.dumps(empty_template(catalog), ensure_ascii=False, indent=2)
    write_text(args.output, text + "\n")


def run_summary(args: argparse.Namespace) -> None:
    catalog = load_json(CATALOG_PATH)
    data = load_json(args.input)
    text = build_summary(data, catalog, args.include_catalog)
    write_text(args.output, text)


def run_fetch_sec(args: argparse.Namespace) -> None:
    if "@" not in args.user_agent:
        raise SystemExit("SEC access requires a descriptive --user-agent including an email address.")
    data = fetch_sec_company(args.ticker, args.user_agent)
    text = json.dumps(data, ensure_ascii=False, indent=2)
    write_text(args.output, text + "\n")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="機関投資家型の情報カタログとエビデンス台帳から投資調査サマリを生成します。",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent(
            """
            Examples:
              python tools/invest_research_tool.py catalog --output outputs/catalog.md
              python tools/invest_research_tool.py template --output examples/my_company.json
              python tools/invest_research_tool.py summary --input examples/sample_company.json --output outputs/sample_summary.md
              python tools/invest_research_tool.py fetch-sec --ticker AAPL --user-agent "Your Name your@email.com" --output data/AAPL_sec.json
            """
        ).strip(),
    )
    sub = parser.add_subparsers(dest="command", required=True)

    catalog = sub.add_parser("catalog", help="情報カタログをMarkdownまたはJSONで出力します。")
    catalog.add_argument("--format", choices=["markdown", "json"], default="markdown")
    catalog.add_argument("--output", type=Path)
    catalog.set_defaults(func=run_catalog)

    template = sub.add_parser("template", help="手入力用JSONテンプレートを生成します。")
    template.add_argument("--output", type=Path)
    template.set_defaults(func=run_template)

    summary = sub.add_parser("summary", help="会社別JSONから投資調査サマリを生成します。")
    summary.add_argument("--input", type=Path, required=True)
    summary.add_argument("--output", type=Path)
    summary.add_argument("--include-catalog", action="store_true", help="サマリ末尾に情報カタログを含めます。")
    summary.set_defaults(func=run_summary)

    sec = sub.add_parser("fetch-sec", help="SEC EDGAR APIから米国企業の初期JSONを作成します。")
    sec.add_argument("--ticker", required=True)
    sec.add_argument("--user-agent", required=True, help='例: "Your Name your@email.com"')
    sec.add_argument("--output", type=Path)
    sec.set_defaults(func=run_fetch_sec)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        args.func(args)
        return 0
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
