#!/usr/bin/env python3
"""
Institutional-style investment research summarizer.

This tool produces evidence-backed research notes, not buy/sell
recommendations. It works offline from JSON/CSV input and can optionally fetch
SEC EDGAR data using only Python standard-library modules.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import html
import json
import math
import statistics
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
AGENT_PLAYBOOK_PATH = ROOT / "data" / "agent_playbook.json"

CONFIDENCE_WEIGHT = {"high": 1.25, "medium": 1.0, "low": 0.65}
DIRECTION_WEIGHT = {"positive": 1.0, "negative": -1.0, "neutral": 0.0, "mixed": 0.0, "unknown": 0.0}
MATERIALITY_WEIGHT = {"high": 1.35, "medium": 1.0, "low": 0.7}
SOURCE_QUALITY_WEIGHT = {
    "primary_filing": 1.35,
    "exchange": 1.25,
    "regulator": 1.25,
    "company_ir": 1.15,
    "market_data": 1.05,
    "consensus": 1.0,
    "sell_side": 0.95,
    "manual_model": 0.85,
    "news": 0.8,
    "internal": 0.75,
    "unknown": 0.55,
}

ALLOWED_CONFIDENCE = set(CONFIDENCE_WEIGHT)
ALLOWED_DIRECTION = set(DIRECTION_WEIGHT)
ALLOWED_MATERIALITY = set(MATERIALITY_WEIGHT)
ALLOWED_SOURCE_TYPES = set(SOURCE_QUALITY_WEIGHT)
REQUIRED_EVIDENCE_FIELDS = ["category", "item", "value", "interpretation", "source", "date", "confidence", "direction"]

SEC_FACT_SPECS = {
    "revenue": {
        "label": "売上高",
        "concepts": ["Revenues", "SalesRevenueNet", "RevenueFromContractWithCustomerExcludingAssessedTax"],
        "units": ["USD"],
        "kind": "flow",
    },
    "operating_income": {
        "label": "営業利益",
        "concepts": ["OperatingIncomeLoss", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"],
        "units": ["USD"],
        "kind": "flow",
    },
    "net_income": {
        "label": "純利益",
        "concepts": ["NetIncomeLoss", "ProfitLoss"],
        "units": ["USD"],
        "kind": "flow",
    },
    "operating_cf": {
        "label": "営業キャッシュフロー",
        "concepts": ["NetCashProvidedByUsedInOperatingActivities"],
        "units": ["USD"],
        "kind": "flow",
    },
    "capex": {
        "label": "設備投資",
        "concepts": ["PaymentsToAcquirePropertyPlantAndEquipment", "CapitalExpenditures"],
        "units": ["USD"],
        "kind": "flow",
    },
    "assets": {
        "label": "総資産",
        "concepts": ["Assets"],
        "units": ["USD"],
        "kind": "instant",
    },
    "liabilities": {
        "label": "総負債",
        "concepts": ["Liabilities"],
        "units": ["USD"],
        "kind": "instant",
    },
    "equity": {
        "label": "株主資本",
        "concepts": ["StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"],
        "units": ["USD"],
        "kind": "instant",
    },
    "eps_diluted": {
        "label": "希薄化後EPS",
        "concepts": ["EarningsPerShareDiluted"],
        "units": ["USD/shares"],
        "kind": "per_share",
    },
}

CSV_COLUMNS = [
    "category",
    "item",
    "value",
    "interpretation",
    "source",
    "source_url",
    "date",
    "confidence",
    "direction",
    "materiality",
    "source_type",
]


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


def parse_date(value: Any) -> dt.date | None:
    if not value:
        return None
    try:
        return dt.date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def normalize_id(text: Any) -> str:
    return str(text or "").strip().lower().replace(" ", "_")


def catalog_by_id(catalog: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {category["id"]: category for category in catalog.get("categories", [])}


def safe_pct(value: float | None, digits: int = 1) -> str:
    if value is None:
        return "-"
    return f"{value * 100:.{digits}f}%"


def compact_number(value: Any, currency: str = "") -> str:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return str(value)
    sign = "-" if number < 0 else ""
    number = abs(number)
    units = [(1_000_000_000_000, "T"), (1_000_000_000, "B"), (1_000_000, "M"), (1_000, "K")]
    for divisor, suffix in units:
        if number >= divisor:
            return f"{sign}{currency}{number / divisor:.2f}{suffix}"
    if math.isclose(number, round(number)):
        return f"{sign}{currency}{int(number)}"
    return f"{sign}{currency}{number:.2f}"


def ratio(numerator: Any, denominator: Any) -> float | None:
    try:
        numerator_f = float(numerator)
        denominator_f = float(denominator)
    except (TypeError, ValueError):
        return None
    if denominator_f == 0:
        return None
    return numerator_f / denominator_f


def pct_change(current: Any, previous: Any) -> float | None:
    try:
        current_f = float(current)
        previous_f = float(previous)
    except (TypeError, ValueError):
        return None
    if previous_f == 0:
        return None
    return current_f / previous_f - 1


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
        lines.extend([f"## {category['name']} (`{category['id']}`)", "", f"用途: {category.get('institutional_use', '')}", "", "主要質問:"])
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
        "schema_version": "1.1",
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
                "materiality": "medium",
                "source_type": "unknown",
            }
            for category in catalog.get("categories", [])
        ],
        "valuation": scenario_template()["valuation"],
    }


def scenario_template() -> dict[str, Any]:
    return {
        "valuation": {
            "currency": "USD",
            "shares_outstanding": 100000000,
            "net_debt": 0,
            "current_price": 0,
            "scenarios": [
                {"name": "Bear", "probability": 0.25, "revenue": 0, "ebitda_margin": 0.12, "ev_ebitda": 7.0},
                {"name": "Base", "probability": 0.50, "revenue": 0, "ebitda_margin": 0.16, "ev_ebitda": 9.0},
                {"name": "Bull", "probability": 0.25, "revenue": 0, "ebitda_margin": 0.20, "ev_ebitda": 11.0},
            ],
        }
    }


def infer_source_type(row: dict[str, Any]) -> str:
    explicit = normalize_id(row.get("source_type"))
    if explicit in ALLOWED_SOURCE_TYPES:
        return explicit
    source = f"{row.get('source', '')} {row.get('source_url', '')}".lower()
    if "sec.gov" in source or "edinet" in source or "10-k" in source or "10-q" in source or "有価証券" in source:
        return "primary_filing"
    if "jpx" in source or "tdnet" in source or "exchange" in source:
        return "exchange"
    if "fred" in source or "cftc" in source or "finra" in source or "boj" in source:
        return "regulator"
    if "ir" in source or "company" in source or "earnings release" in source:
        return "company_ir"
    if "price" in source or "market data" in source:
        return "market_data"
    if "consensus" in source or "ibes" in source or "factset" in source or "visible alpha" in source:
        return "consensus"
    if "report" in source or "sell-side" in source or "broker" in source or "証券会社" in source:
        return "sell_side"
    if "manual" in source or "model" in source:
        return "manual_model"
    if "internal" in source:
        return "internal"
    if "news" in source:
        return "news"
    return "unknown"


def recency_weight(date_text: Any, as_of_text: Any | None = None) -> float:
    date = parse_date(date_text)
    as_of = parse_date(as_of_text) or dt.date.today()
    if date is None:
        return 0.45
    age_days = max(0, (as_of - date).days)
    if age_days <= 120:
        return 1.15
    if age_days <= 365:
        return 1.0
    if age_days <= 730:
        return 0.78
    if age_days <= 1095:
        return 0.6
    return 0.45


def evidence_weight(row: dict[str, Any], as_of_text: Any | None = None) -> dict[str, Any]:
    confidence = normalize_id(row.get("confidence")) or "medium"
    materiality = normalize_id(row.get("materiality")) or "medium"
    source_type = infer_source_type(row)
    direction = normalize_id(row.get("direction")) or "unknown"
    weight = (
        CONFIDENCE_WEIGHT.get(confidence, 0.8)
        * MATERIALITY_WEIGHT.get(materiality, 1.0)
        * SOURCE_QUALITY_WEIGHT.get(source_type, 0.55)
        * recency_weight(row.get("date"), as_of_text)
    )
    return {
        "direction_value": DIRECTION_WEIGHT.get(direction, 0.0),
        "weight": weight,
        "confidence": confidence,
        "materiality": materiality,
        "source_type": source_type,
        "recency": recency_weight(row.get("date"), as_of_text),
    }


def audit_issue(severity: str, path: str, message: str) -> dict[str, str]:
    return {"severity": severity, "path": path, "message": message}


def validate_research_data(data: dict[str, Any], catalog: dict[str, Any]) -> list[dict[str, str]]:
    issues: list[dict[str, str]] = []
    by_category = catalog_by_id(catalog)
    company = data.get("company")
    if not isinstance(company, dict):
        issues.append(audit_issue("error", "company", "company オブジェクトが必要です。"))
        company = {}
    for field in ["ticker", "name", "market", "currency", "as_of"]:
        if not str(company.get(field, "")).strip():
            issues.append(audit_issue("warning", f"company.{field}", f"{field} が未入力です。"))
    if company.get("as_of") and parse_date(company.get("as_of")) is None:
        issues.append(audit_issue("error", "company.as_of", "as_of は YYYY-MM-DD 形式にしてください。"))

    evidence = data.get("evidence", [])
    if not isinstance(evidence, list):
        return issues + [audit_issue("error", "evidence", "evidence は配列で入力してください。")]
    if not evidence:
        issues.append(audit_issue("error", "evidence", "エビデンスが1件もありません。"))

    for idx, row in enumerate(evidence):
        path = f"evidence[{idx}]"
        if not isinstance(row, dict):
            issues.append(audit_issue("error", path, "エビデンス行はオブジェクトである必要があります。"))
            continue
        for field in REQUIRED_EVIDENCE_FIELDS:
            if not str(row.get(field, "")).strip():
                severity = "error" if field in ["category", "item", "value", "date", "confidence", "direction"] else "warning"
                issues.append(audit_issue(severity, f"{path}.{field}", f"{field} が未入力です。"))
        category = normalize_id(row.get("category"))
        if category and category not in by_category:
            issues.append(audit_issue("error", f"{path}.category", f"未登録カテゴリです: {category}"))
        confidence = normalize_id(row.get("confidence"))
        if confidence and confidence not in ALLOWED_CONFIDENCE:
            issues.append(audit_issue("error", f"{path}.confidence", f"confidence は {sorted(ALLOWED_CONFIDENCE)} から選んでください。"))
        direction = normalize_id(row.get("direction"))
        if direction and direction not in ALLOWED_DIRECTION:
            issues.append(audit_issue("error", f"{path}.direction", f"direction は {sorted(ALLOWED_DIRECTION)} から選んでください。"))
        materiality = normalize_id(row.get("materiality")) or "medium"
        if materiality not in ALLOWED_MATERIALITY:
            issues.append(audit_issue("error", f"{path}.materiality", f"materiality は {sorted(ALLOWED_MATERIALITY)} から選んでください。"))
        source_type = normalize_id(row.get("source_type"))
        if source_type and source_type not in ALLOWED_SOURCE_TYPES:
            issues.append(audit_issue("error", f"{path}.source_type", f"source_type は {sorted(ALLOWED_SOURCE_TYPES)} から選んでください。"))
        if row.get("date") and parse_date(row.get("date")) is None:
            issues.append(audit_issue("error", f"{path}.date", "date は YYYY-MM-DD 形式にしてください。"))
        if row.get("source_url"):
            parsed = urllib.parse.urlparse(str(row["source_url"]))
            if parsed.scheme not in {"http", "https"}:
                issues.append(audit_issue("warning", f"{path}.source_url", "source_url は http/https URL を推奨します。"))
        if not row.get("source_url") and infer_source_type(row) in {"primary_filing", "exchange", "regulator", "company_ir"}:
            issues.append(audit_issue("warning", f"{path}.source_url", "一次情報・公的情報は source_url を入れてください。"))
        if recency_weight(row.get("date"), company.get("as_of")) <= 0.6:
            issues.append(audit_issue("warning", f"{path}.date", "データが古い可能性があります。再確認してください。"))

    valuation = data.get("valuation")
    if valuation is not None:
        issues.extend(validate_valuation(valuation))
    return issues


def validation_summary(issues: list[dict[str, str]]) -> dict[str, int]:
    counts = {"error": 0, "warning": 0, "info": 0}
    for issue in issues:
        severity = issue.get("severity", "info")
        counts[severity if severity in counts else "info"] += 1
    return counts


def evidence_score(evidence: list[dict[str, Any]], as_of_text: Any | None = None) -> dict[str, Any]:
    total_abs = 0.0
    total = 0.0
    weighted_positive = 0.0
    weighted_negative = 0.0
    counts = {"positive": 0, "negative": 0, "neutral": 0, "mixed": 0, "unknown": 0}
    components: list[dict[str, Any]] = []
    for row in evidence:
        direction = normalize_id(row.get("direction")) or "unknown"
        scored = evidence_weight(row, as_of_text)
        signed = scored["direction_value"] * scored["weight"]
        total += signed
        if scored["direction_value"] > 0:
            total_abs += scored["weight"]
            weighted_positive += scored["weight"]
        elif scored["direction_value"] < 0:
            total_abs += scored["weight"]
            weighted_negative += scored["weight"]
        counts[direction if direction in counts else "unknown"] += 1
        components.append(
            {
                "item": row.get("item", ""),
                "direction": direction,
                "weight": round(scored["weight"], 3),
                "source_type": scored["source_type"],
                "materiality": scored["materiality"],
                "confidence": scored["confidence"],
            }
        )
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
        "weighted_positive": round(weighted_positive, 2),
        "weighted_negative": round(weighted_negative, 2),
        "components": sorted(components, key=lambda item: item["weight"], reverse=True),
    }


def coverage_report(evidence: list[dict[str, Any]], catalog: dict[str, Any]) -> dict[str, Any]:
    category_ids = [category["id"] for category in catalog.get("categories", [])]
    covered = sorted({normalize_id(row.get("category")) for row in evidence if normalize_id(row.get("category"))})
    covered_known = [category_id for category_id in covered if category_id in category_ids]
    missing = [category_id for category_id in category_ids if category_id not in covered_known]
    coverage = 0 if not category_ids else round(len(covered_known) / len(category_ids) * 100)
    return {"coverage_pct": coverage, "covered": covered_known, "missing": missing}


def split_evidence(evidence: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    result = {"positive": [], "negative": [], "neutral": [], "mixed": [], "unknown": []}
    for row in evidence:
        direction = normalize_id(row.get("direction")) or "unknown"
        bucket = direction if direction in result else "unknown"
        result[bucket].append(row)
    return result


def top_rows(rows: list[dict[str, Any]], as_of_text: Any | None = None, limit: int = 5) -> list[dict[str, Any]]:
    return sorted(rows, key=lambda row: evidence_weight(row, as_of_text)["weight"], reverse=True)[:limit]


def md_escape(text: Any) -> str:
    return str(text if text is not None else "").replace("\n", " ").replace("|", "\\|").strip()


def format_row_bullets(rows: list[dict[str, Any]], fallback: str, as_of_text: Any | None = None) -> list[str]:
    if not rows:
        return [f"- {fallback}"]
    bullets = []
    for row in top_rows(rows, as_of_text):
        scored = evidence_weight(row, as_of_text)
        source = md_escape(row.get("source", ""))
        date = md_escape(row.get("date", ""))
        suffix_parts = [
            part
            for part in [
                source,
                date,
                f"confidence={scored['confidence']}",
                f"materiality={scored['materiality']}",
                f"source={scored['source_type']}",
                f"weight={scored['weight']:.2f}",
            ]
            if part
        ]
        bullets.append(
            f"- {md_escape(row.get('item'))}: {md_escape(row.get('value'))}. "
            f"{md_escape(row.get('interpretation'))} ({' / '.join(suffix_parts)})"
        )
    return bullets


def latest_financial_kpi(data: dict[str, Any]) -> dict[str, Any]:
    kpis = data.get("financials", {}).get("kpis", [])
    if not isinstance(kpis, list) or not kpis:
        return {}
    return sorted([row for row in kpis if isinstance(row, dict)], key=lambda row: row.get("fy", 0))[-1]


def evaluate_investability(
    data: dict[str, Any],
    catalog: dict[str, Any],
    issues: list[dict[str, str]],
    evidence_score_result: dict[str, Any],
    coverage: dict[str, Any],
    valuation_result: dict[str, Any],
) -> dict[str, Any]:
    evidence = data.get("evidence", [])
    if not isinstance(evidence, list):
        evidence = []
    categories = {normalize_id(row.get("category")) for row in evidence if isinstance(row, dict)}
    source_types = [infer_source_type(row) for row in evidence if isinstance(row, dict)]
    institutional_sources = {"primary_filing", "exchange", "regulator", "company_ir", "market_data", "consensus", "sell_side"}
    institutional_ratio = 0.0 if not source_types else sum(1 for source in source_types if source in institutional_sources) / len(source_types)
    primary_ratio = 0.0 if not source_types else sum(1 for source in source_types if source in {"primary_filing", "exchange", "regulator"}) / len(source_types)
    issue_counts = validation_summary(issues)
    core_categories = ["financials", "valuation", "estimates", "market", "events_catalysts", "risk_scenarios"]
    missing_core = [category for category in core_categories if category not in categories]
    institutional_required = ["ownership_flows", "capital_allocation", "governance_legal"]
    missing_institutional = [category for category in institutional_required if category not in categories]

    has_valuation = bool(valuation_result.get("scenarios"))
    current_price = valuation_result.get("current_price") or 0
    expected_return = valuation_result.get("expected_return")
    scenario_prices = [row.get("price") for row in valuation_result.get("scenarios", []) if row.get("price") is not None]
    bear_price = min(scenario_prices) if scenario_prices and current_price else None
    bull_price = max(scenario_prices) if scenario_prices and current_price else None
    bear_return = None if bear_price is None or not current_price else bear_price / current_price - 1
    bull_return = None if bull_price is None or not current_price else bull_price / current_price - 1
    risk_reward = None
    if expected_return is not None and bear_return is not None and bear_return < 0:
        risk_reward = expected_return / abs(bear_return)

    latest_kpi = latest_financial_kpi(data)
    fcf_margin = latest_kpi.get("fcf_margin")
    operating_margin = latest_kpi.get("operating_margin")
    revenue_growth = latest_kpi.get("revenue_growth")

    score = 0.0
    score += max(0, 18 - issue_counts["error"] * 8 - issue_counts["warning"] * 1.5)
    score += min(16, coverage["coverage_pct"] * 0.16)
    score += min(10, institutional_ratio * 10)
    score += min(8, primary_ratio * 8)
    score += 8 if "risk_scenarios" in categories else 0
    score += 5 if evidence_score_result["counts"]["negative"] > 0 else 0
    score += 4 if "events_catalysts" in categories else 0
    score += 4 if "estimates" in categories else 0
    score += 5 if latest_kpi else 0
    score += 3 if fcf_margin is not None and fcf_margin > 0 else 0
    score += 3 if operating_margin is not None and operating_margin > 0 else 0
    score += 2 if revenue_growth is not None and revenue_growth > 0 else 0

    valuation_points = 0.0
    if has_valuation and current_price:
        valuation_points += 5
        if expected_return is not None:
            if expected_return >= 0.25:
                valuation_points += 10
            elif expected_return >= 0.15:
                valuation_points += 7
            elif expected_return >= 0.05:
                valuation_points += 3
        if bear_return is not None:
            if bear_return > -0.15:
                valuation_points += 6
            elif bear_return > -0.30:
                valuation_points += 4
            elif bear_return > -0.45:
                valuation_points += 1
        if risk_reward is not None:
            if risk_reward >= 1.5:
                valuation_points += 5
            elif risk_reward >= 1.0:
                valuation_points += 3
    score += min(24, valuation_points)
    score -= len(missing_institutional) * 4
    if primary_ratio < 0.40:
        score -= (0.40 - primary_ratio) * 20
    if coverage["coverage_pct"] < 85:
        score -= (85 - coverage["coverage_pct"]) * 0.30

    blockers: list[str] = []
    warnings: list[str] = []
    next_actions: list[str] = []
    if issue_counts["error"]:
        blockers.append("入力データにエラーがあります。投資判断前に修正してください。")
    if not has_valuation or not current_price:
        blockers.append("現在価格を含むバリュエーション・シナリオが未整備です。")
    if "risk_scenarios" not in categories:
        blockers.append("反証条件・下方シナリオが未整備です。")
    if missing_core:
        warnings.append("コアカテゴリ不足: " + "、".join(missing_core))
    if missing_institutional:
        warnings.append("機関投資家目線の重要カテゴリ不足: " + "、".join(missing_institutional))
    if evidence_score_result["counts"]["negative"] == 0:
        warnings.append("弱材料・反証材料が不足しています。意図的な反対仮説の検証が必要です。")
    if institutional_ratio < 0.6:
        warnings.append("一次情報・市場データ・コンセンサス等の比率が低く、手入力依存が高い状態です。")
    if primary_ratio < 0.4:
        warnings.append("一次情報・取引所・規制当局データの比率が低く、検証可能性が不足しています。")
    if coverage["coverage_pct"] < 85:
        warnings.append("情報カバレッジが85%未満です。投資候補化するには未充足カテゴリを埋めてください。")
    if expected_return is not None and expected_return < 0.10:
        warnings.append("期待リターンが低く、リスクに対する余地が薄い可能性があります。")
    if bear_return is not None and bear_return < -0.35:
        warnings.append("ベアケース下落余地が大きく、ポジションサイズ制約が必要です。")
    if risk_reward is not None and risk_reward < 1.0:
        warnings.append("期待リターンがベアケース損失を十分に上回っていません。")
    if coverage["coverage_pct"] < 75:
        next_actions.append("不足カテゴリを埋め、情報カバレッジを75%以上に上げる。")
    if "ownership_flows" not in categories:
        next_actions.append("保有・需給・空売り・指数イベントを確認する。")
    if "governance_legal" not in categories:
        next_actions.append("ガバナンス、訴訟、規制、会計リスクを確認する。")
    if "capital_allocation" not in categories:
        next_actions.append("自社株買い、配当、M&A、希薄化、ROIC/WACCを確認する。")
    if not next_actions:
        next_actions.append("主要反証条件を次回決算・イベントで再検証する。")

    normalized = int(round(max(0, min(100, score))))
    if blockers:
        readiness = "調査未完了"
    elif normalized >= 78 and not warnings:
        readiness = "投資候補"
    elif normalized >= 68:
        readiness = "監視候補"
    elif normalized >= 50:
        readiness = "追加調査"
    else:
        readiness = "見送り寄り"

    return {
        "score": normalized,
        "readiness": readiness,
        "institutional_source_ratio": institutional_ratio,
        "primary_source_ratio": primary_ratio,
        "expected_return": expected_return,
        "bear_return": bear_return,
        "bull_return": bull_return,
        "risk_reward": risk_reward,
        "missing_core": missing_core,
        "blockers": blockers,
        "warnings": warnings,
        "next_actions": next_actions,
    }


def decision_brief(investability: dict[str, Any]) -> dict[str, str]:
    blockers = investability.get("blockers", [])
    warnings = investability.get("warnings", [])
    readiness = investability.get("readiness", "")
    next_actions = investability.get("next_actions", [])
    next_action = next_actions[0] if next_actions else "主要反証条件を次回決算・イベントで再検証する。"

    handling = "追加調査"
    human_decision = "不足している判断材料を埋めるか、いったん見送るかを決める。"
    if blockers:
        handling = "調査未完了"
        human_decision = "ブロッカーを解消するまで投資候補として扱わない。"
    elif readiness == "投資候補":
        handling = "投資候補として人間レビューへ"
        human_decision = "ポジションサイズ、許容損失、注文条件を人間が最終判断する。"
    elif readiness == "監視候補":
        handling = "監視候補"
        human_decision = "ウォッチリストに残し、未充足カテゴリを埋めて再判定する。"
    elif readiness == "見送り寄り":
        handling = "見送り寄り"
        human_decision = "投資仮説を再設計するか、調査対象から外すかを決める。"

    reason = (blockers or warnings or ["警告なし。残る論点はポートフォリオ制約と売買条件です。"])[0]
    if blockers:
        completion_criteria = "ブロッカー0件、現在価格を含むシナリオ、反証条件を揃える。"
    elif warnings:
        completion_criteria = "重要カテゴリ不足、一次情報比率、カバレッジ警告を解消する。"
    else:
        completion_criteria = "人間がリスク許容度、資金配分、執行条件を確認する。"

    return {
        "handling": handling,
        "human_decision": human_decision,
        "reason": reason,
        "next_action": next_action,
        "completion_criteria": completion_criteria,
    }


def build_summary(data: dict[str, Any], catalog: dict[str, Any], include_catalog: bool) -> str:
    issues = validate_research_data(data, catalog)
    issue_counts = validation_summary(issues)
    company = data.get("company", {})
    evidence = data.get("evidence", [])
    if not isinstance(evidence, list):
        evidence = []
    by_category = catalog_by_id(catalog)
    as_of = company.get("as_of", today_iso())
    score = evidence_score(evidence, as_of)
    coverage = coverage_report(evidence, catalog)
    buckets = split_evidence(evidence)
    valuation_result = calculate_valuation(data.get("valuation"))
    investability = evaluate_investability(data, catalog, issues, score, coverage, valuation_result)
    brief = decision_brief(investability)

    ticker = md_escape(company.get("ticker", ""))
    name = md_escape(company.get("name", ""))
    company_label = " / ".join([part for part in [ticker, name] if part]) or "未設定"

    lines = [
        f"# 投資判断用リサーチサマリ: {company_label}",
        "",
        "> この出力は投資調査メモであり、売買推奨ではありません。一次情報、価格、リスク許容度を別途確認してください。",
        "",
        "## 1. 基本情報",
        "",
        f"- 市場: {md_escape(company.get('market', ''))}",
        f"- セクター: {md_escape(company.get('sector', ''))}",
        f"- 通貨: {md_escape(company.get('currency', ''))}",
        f"- データ基準日: {md_escape(as_of)}",
        f"- 投資仮説: {md_escape(data.get('thesis', '')) or '未入力'}",
        "",
        "## 2. 判断ブリーフ",
        "",
        f"- 現在の扱い: {md_escape(brief['handling'])}",
        f"- 今日の人間判断: {md_escape(brief['human_decision'])}",
        f"- 理由: {md_escape(brief['reason'])}",
        f"- 次の一手: {md_escape(brief['next_action'])}",
        f"- 完了条件: {md_escape(brief['completion_criteria'])}",
        "",
        "## 3. 結論サマリ",
        "",
        f"- 証拠スコア: {score['score']} / 100",
        f"- 調査スタンス: {score['stance']}",
        f"- 情報カバレッジ: {coverage['coverage_pct']}% ({len(coverage['covered'])}/{len(catalog.get('categories', []))}カテゴリ)",
        f"- 加重ポジティブ: {score['weighted_positive']} / 加重ネガティブ: {score['weighted_negative']}",
        f"- 投資可能性スコア: {investability['score']} / 100",
        f"- 客観ゲート: {investability['readiness']}",
        f"- データ監査: error {issue_counts['error']}件 / warning {issue_counts['warning']}件",
        "",
        "## 4. 投資可能性ゲート",
        "",
        f"- 一次・機関品質ソース比率: {safe_pct(investability['institutional_source_ratio'])}",
        f"- 一次情報・取引所・規制当局ソース比率: {safe_pct(investability['primary_source_ratio'])}",
        f"- 期待リターン: {safe_pct(investability['expected_return'])}",
        f"- ベアケース下落率: {safe_pct(investability['bear_return'])}",
        f"- ブルケース上昇率: {safe_pct(investability['bull_return'])}",
        f"- 期待リターン/ベア損失: {investability['risk_reward']:.2f}x" if investability["risk_reward"] is not None else "- 期待リターン/ベア損失: -",
        "",
        "ブロッカー:",
    ]
    lines.extend([f"- {item}" for item in investability["blockers"]] or ["- 重大なブロッカーは未検出です。"])
    lines.extend(["", "警告:", *([f"- {item}" for item in investability["warnings"]] or ["- 主要な警告は未検出です。"])])
    lines.extend(["", "次の確認事項:", *[f"- {item}" for item in investability["next_actions"]]])
    lines.extend([
        "",
        "## 5. データ品質監査",
        "",
    ])
    if issues:
        for issue in issues[:12]:
            lines.append(f"- [{issue['severity']}] `{issue['path']}`: {issue['message']}")
        if len(issues) > 12:
            lines.append(f"- 他 {len(issues) - 12}件")
    else:
        lines.append("- 入力検証で重大な問題は見つかりませんでした。")

    lines.extend(["", "## 6. 強材料", ""])
    lines.extend(format_row_bullets(buckets["positive"], "明確な強材料は未入力です。", as_of))
    lines.extend(["", "## 7. 弱材料・反証条件", ""])
    lines.extend(format_row_bullets(buckets["negative"], "明確な弱材料は未入力です。", as_of))
    lines.extend(["", "## 8. 中立・確認待ち材料", ""])
    neutral_rows = buckets["neutral"] + buckets["mixed"] + buckets["unknown"]
    lines.extend(format_row_bullets(neutral_rows, "中立・確認待ち材料は未入力です。", as_of))

    lines.extend(["", "## 9. 未充足データと次の取得優先度", ""])
    if coverage["missing"]:
        for category_id in coverage["missing"]:
            category = by_category[category_id]
            metrics = "、".join(category.get("required_metrics", [])[:3])
            lines.append(f"- {category['name']} (`{category_id}`): {metrics}")
    else:
        lines.append("- 全カテゴリに少なくとも1件の証拠があります。次は数値の鮮度、一次資料比率、反証条件の精度を確認してください。")

    financials = data.get("financials", {})
    if financials.get("kpis"):
        lines.extend(["", "## 10. SEC財務KPI時系列", ""])
        lines.append("|FY|売上|売上成長|営業利益率|FCF|FCFマージン|ROE|負債/資産|")
        lines.append("|---|---:|---:|---:|---:|---:|---:|---:|")
        for row in financials["kpis"]:
            lines.append(
                "|"
                + "|".join(
                    [
                        str(row.get("fy", "")),
                        compact_number(row.get("revenue"), "$") if row.get("revenue") is not None else "-",
                        safe_pct(row.get("revenue_growth")),
                        safe_pct(row.get("operating_margin")),
                        compact_number(row.get("fcf"), "$") if row.get("fcf") is not None else "-",
                        safe_pct(row.get("fcf_margin")),
                        safe_pct(row.get("roe")),
                        safe_pct(row.get("liability_ratio")),
                    ]
                )
                + "|"
            )

    if valuation_result.get("scenarios"):
        lines.extend(["", "## 11. バリュエーション・シナリオ", ""])
        lines.append(f"- 期待株価: {valuation_result.get('currency', '')}{valuation_result.get('expected_price', 0):.2f}")
        if valuation_result.get("current_price"):
            lines.append(f"- 現在価格比の期待リターン: {safe_pct(valuation_result.get('expected_return'))}")
        lines.append("")
        lines.append("|シナリオ|確率|売上|EBITDA率|倍率|株価|")
        lines.append("|---|---:|---:|---:|---:|---:|")
        for row in valuation_result["scenarios"]:
            lines.append(
                f"|{md_escape(row['name'])}|{safe_pct(row['probability'], 0)}|"
                f"{compact_number(row['revenue'], valuation_result.get('currency', ''))}|{safe_pct(row['ebitda_margin'])}|"
                f"{row['ev_ebitda']:.1f}x|{valuation_result.get('currency', '')}{row['price']:.2f}|"
            )

    lines.extend(["", "## 12. エージェント実行計画", ""])
    lines.extend(format_agent_plan_markdown(load_agent_playbook(), compact=True).splitlines())

    lines.extend(["", "## 13. エビデンス台帳", ""])
    lines.append("|カテゴリ|項目|値|解釈|出所|日付|確信度|重要度|出所種別|方向|")
    lines.append("|---|---|---|---|---|---|---|---|---|---|")
    for row in evidence:
        category_id = normalize_id(row.get("category"))
        category_name = by_category.get(category_id, {}).get("name", category_id)
        source_url = md_escape(row.get("source_url", ""))
        source_label = md_escape(row.get("source", ""))
        source = f"[{source_label}]({source_url})" if source_url and source_label else source_label or source_url
        scored = evidence_weight(row, as_of)
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
                    md_escape(scored["confidence"]),
                    md_escape(scored["materiality"]),
                    md_escape(scored["source_type"]),
                    md_escape(row.get("direction", "")),
                ]
            )
            + "|"
        )
    if include_catalog:
        lines.extend(["", "---", "", format_catalog_markdown(catalog)])
    return "\n".join(lines).rstrip() + "\n"


def render_html_report(markdown_text: str, title: str = "Investment Research Summary") -> str:
    body = html.escape(markdown_text)
    return f"""<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{html.escape(title)}</title>
    <style>
      body {{ font-family: system-ui, -apple-system, "Yu Gothic UI", Meiryo, sans-serif; margin: 32px; line-height: 1.65; color: #1f2937; }}
      pre {{ white-space: pre-wrap; word-wrap: break-word; background: #f8fafc; border: 1px solid #dbe3ea; padding: 20px; border-radius: 8px; }}
    </style>
  </head>
  <body>
    <pre>{body}</pre>
  </body>
</html>
"""


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


def sec_archive_url(cik: str, accession: str, primary_doc: str | None = None) -> str:
    accession_clean = str(accession).replace("-", "")
    doc = primary_doc or ""
    suffix = f"/{doc}" if doc else ""
    return f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{accession_clean}{suffix}"


def fact_duration_days(row: dict[str, Any]) -> int | None:
    start = parse_date(row.get("start"))
    end = parse_date(row.get("end"))
    if not start or not end:
        return None
    return (end - start).days


def fact_candidates(
    facts: dict[str, Any],
    concepts: list[str],
    units: list[str],
    forms: tuple[str, ...] = ("10-K", "10-Q"),
) -> list[dict[str, Any]]:
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
    return candidates


def choose_latest_fact(facts: dict[str, Any], concepts: list[str], units: list[str], forms: tuple[str, ...] = ("10-K", "10-Q")) -> dict[str, Any] | None:
    candidates = fact_candidates(facts, concepts, units, forms)
    if not candidates:
        return None
    candidates.sort(key=lambda row: (str(row.get("end", "")), str(row.get("filed", ""))), reverse=True)
    return candidates[0]


def choose_annual_facts(facts: dict[str, Any], spec: dict[str, Any], years: int) -> dict[int, dict[str, Any]]:
    candidates = fact_candidates(facts, spec["concepts"], spec["units"], ("10-K", "10-K/A", "20-F", "40-F"))
    by_fy: dict[int, dict[str, Any]] = {}
    for row in candidates:
        fy = row.get("fy")
        if not isinstance(fy, int):
            continue
        duration = fact_duration_days(row)
        if spec["kind"] == "flow" and duration is not None and duration < 250:
            continue
        existing = by_fy.get(fy)
        if existing is None or str(row.get("filed", "")) > str(existing.get("filed", "")):
            by_fy[fy] = row
    selected_years = sorted(by_fy, reverse=True)[:years]
    return {fy: by_fy[fy] for fy in selected_years}


def build_sec_kpis(facts: dict[str, Any], years: int) -> list[dict[str, Any]]:
    raw_by_metric = {metric: choose_annual_facts(facts, spec, years) for metric, spec in SEC_FACT_SPECS.items()}
    all_years = sorted({fy for metric_rows in raw_by_metric.values() for fy in metric_rows})
    rows: list[dict[str, Any]] = []
    for fy in all_years:
        row: dict[str, Any] = {"fy": fy}
        for metric, metric_rows in raw_by_metric.items():
            if fy in metric_rows:
                row[metric] = metric_rows[fy].get("val")
                row[f"{metric}_filed"] = metric_rows[fy].get("filed")
                row[f"{metric}_concept"] = metric_rows[fy].get("concept")
        rows.append(row)
    rows.sort(key=lambda row: row["fy"])
    previous: dict[str, Any] | None = None
    for row in rows:
        row["revenue_growth"] = pct_change(row.get("revenue"), previous.get("revenue") if previous else None)
        row["operating_margin"] = ratio(row.get("operating_income"), row.get("revenue"))
        row["net_margin"] = ratio(row.get("net_income"), row.get("revenue"))
        capex = row.get("capex")
        row["fcf"] = None if row.get("operating_cf") is None or capex is None else float(row["operating_cf"]) - abs(float(capex))
        row["fcf_margin"] = ratio(row.get("fcf"), row.get("revenue"))
        row["liability_ratio"] = ratio(row.get("liabilities"), row.get("assets"))
        row["roe"] = ratio(row.get("net_income"), row.get("equity"))
        previous = row
    return rows


def sec_fact_evidence(
    facts: dict[str, Any],
    item: str,
    concepts: list[str],
    interpretation: str,
    direction: str,
    source_url: str,
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
        "source_url": source_url,
        "date": fact.get("filed", ""),
        "confidence": "high",
        "direction": direction,
        "materiality": "high",
        "source_type": "primary_filing",
    }


def sec_kpi_evidence(kpis: list[dict[str, Any]], cik: str) -> list[dict[str, Any]]:
    if len(kpis) < 2:
        return []
    latest = kpis[-1]
    evidence: list[dict[str, Any]] = []
    revenue_growth = latest.get("revenue_growth")
    if revenue_growth is not None:
        evidence.append(
            {
                "category": "financials",
                "item": "SEC売上成長率",
                "value": f"FY{latest['fy']} 売上成長率 {safe_pct(revenue_growth)}",
                "interpretation": "SEC companyfactsから計算した年次売上成長率。セグメント、価格/数量、M&A要因は本文で確認してください。",
                "source": "SEC companyfacts annual KPI",
                "source_url": f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json",
                "date": latest.get("revenue_filed") or today_iso(),
                "confidence": "high",
                "direction": "positive" if revenue_growth > 0.05 else "negative" if revenue_growth < -0.05 else "neutral",
                "materiality": "high",
                "source_type": "primary_filing",
            }
        )
    operating_margin = latest.get("operating_margin")
    if operating_margin is not None:
        margins = [row["operating_margin"] for row in kpis if row.get("operating_margin") is not None]
        median_margin = statistics.median(margins) if margins else operating_margin
        evidence.append(
            {
                "category": "financials",
                "item": "SEC営業利益率",
                "value": f"FY{latest['fy']} 営業利益率 {safe_pct(operating_margin)}",
                "interpretation": f"取得年数内の中央値 {safe_pct(median_margin)} と比較。改善/悪化の要因はMD&Aで確認してください。",
                "source": "SEC companyfacts annual KPI",
                "source_url": f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json",
                "date": latest.get("operating_income_filed") or today_iso(),
                "confidence": "high",
                "direction": "positive" if operating_margin > median_margin else "negative" if operating_margin < median_margin else "neutral",
                "materiality": "high",
                "source_type": "primary_filing",
            }
        )
    fcf_margin = latest.get("fcf_margin")
    if fcf_margin is not None:
        evidence.append(
            {
                "category": "financials",
                "item": "SEC FCFマージン",
                "value": f"FY{latest['fy']} FCFマージン {safe_pct(fcf_margin)}",
                "interpretation": "営業CFから設備投資を控除して算出。運転資本と一過性投資の影響を確認してください。",
                "source": "SEC companyfacts annual KPI",
                "source_url": f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json",
                "date": latest.get("operating_cf_filed") or today_iso(),
                "confidence": "high",
                "direction": "positive" if fcf_margin > 0.05 else "negative" if fcf_margin < 0 else "neutral",
                "materiality": "high",
                "source_type": "primary_filing",
            }
        )
    return evidence


def fetch_sec_company(ticker: str, user_agent: str, years: int) -> dict[str, Any]:
    cik = cik_from_ticker(ticker, user_agent)
    submissions = sec_request(f"https://data.sec.gov/submissions/CIK{cik}.json", user_agent)
    companyfacts_url = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json"
    facts = sec_request(companyfacts_url, user_agent)
    recent = submissions.get("filings", {}).get("recent", {})
    filing_rows = []
    forms = recent.get("form", [])
    for idx, form in enumerate(forms[:30]):
        accession = recent.get("accessionNumber", [""])[idx]
        primary_doc = recent.get("primaryDocument", [""])[idx]
        filing_rows.append(
            {
                "form": form,
                "filing_date": recent.get("filingDate", [""])[idx],
                "report_date": recent.get("reportDate", [""])[idx],
                "accession": accession,
                "primary_document": primary_doc,
                "url": sec_archive_url(cik, accession, primary_doc) if accession else "",
            }
        )

    evidence: list[dict[str, Any]] = []
    fact_specs = [
        ("売上高", ["Revenues", "SalesRevenueNet", "RevenueFromContractWithCustomerExcludingAssessedTax"], "直近開示の売上規模。前年比・セグメント別内訳は別途確認が必要。", "neutral"),
        ("純利益", ["NetIncomeLoss", "ProfitLoss"], "利益水準の一次情報。営業外・一過性項目の有無は10-K/10-Q本文で確認する。", "neutral"),
        ("営業キャッシュフロー", ["NetCashProvidedByUsedInOperatingActivities"], "利益の現金化を確認する入口。運転資本要因の分解が必要。", "neutral"),
        ("総資産", ["Assets"], "貸借対照表の規模。資本効率の計算に使用する。", "neutral"),
        ("総負債", ["Liabilities"], "財務レバレッジの入口。現金、有利子負債、リース負債の分解が必要。", "neutral"),
        ("希薄化後EPS", ["EarningsPerShareDiluted"], "1株利益の一次情報。Non-GAAP EPSやコンセンサスとは区別する。", "neutral"),
    ]
    for spec in fact_specs:
        row = sec_fact_evidence(facts, *spec, companyfacts_url)
        if row:
            evidence.append(row)

    kpis = build_sec_kpis(facts, years)
    evidence.extend(sec_kpi_evidence(kpis, cik))

    for filing in filing_rows[:10]:
        evidence.append(
            {
                "category": "events_catalysts",
                "item": f"SEC filing {filing['form']}",
                "value": f"filed={filing['filing_date']}, report={filing['report_date']}",
                "interpretation": "最新開示の本文、リスク要因、MD&A、注記を確認する。",
                "source": "SEC submissions",
                "source_url": filing["url"],
                "date": filing["filing_date"],
                "confidence": "high",
                "direction": "neutral",
                "materiality": "medium",
                "source_type": "primary_filing",
            }
        )

    return {
        "schema_version": "1.1",
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
        "financials": {"kpis": kpis},
        "raw": {"sec_recent_filings": filing_rows},
    }


def validate_valuation(valuation: dict[str, Any]) -> list[dict[str, str]]:
    issues: list[dict[str, str]] = []
    if not isinstance(valuation, dict):
        return [audit_issue("error", "valuation", "valuation はオブジェクトで入力してください。")]
    scenarios = valuation.get("scenarios", [])
    if not isinstance(scenarios, list):
        return [audit_issue("error", "valuation.scenarios", "scenarios は配列で入力してください。")]
    probability_total = 0.0
    for idx, row in enumerate(scenarios):
        path = f"valuation.scenarios[{idx}]"
        if not isinstance(row, dict):
            issues.append(audit_issue("error", path, "シナリオはオブジェクトで入力してください。"))
            continue
        for field in ["name", "probability", "revenue", "ebitda_margin", "ev_ebitda"]:
            if row.get(field) in [None, ""]:
                issues.append(audit_issue("warning", f"{path}.{field}", f"{field} が未入力です。"))
        try:
            probability_total += float(row.get("probability", 0))
        except (TypeError, ValueError):
            issues.append(audit_issue("error", f"{path}.probability", "probability は数値で入力してください。"))
    if scenarios and abs(probability_total - 1.0) > 0.01:
        issues.append(audit_issue("warning", "valuation.scenarios", f"確率合計が 1.0 ではありません: {probability_total:.2f}"))
    return issues


def calculate_valuation(valuation: Any) -> dict[str, Any]:
    if not isinstance(valuation, dict):
        return {"scenarios": []}
    scenarios = valuation.get("scenarios", [])
    if not isinstance(scenarios, list):
        return {"scenarios": []}
    try:
        shares = float(valuation.get("shares_outstanding", 0))
        net_debt = float(valuation.get("net_debt", 0))
        current_price = float(valuation.get("current_price", 0))
    except (TypeError, ValueError):
        return {"scenarios": []}
    if shares <= 0:
        return {"scenarios": []}
    rows: list[dict[str, Any]] = []
    expected_price = 0.0
    probability_total = 0.0
    for row in scenarios:
        try:
            probability = float(row.get("probability", 0))
            revenue = float(row.get("revenue", 0))
            ebitda_margin = float(row.get("ebitda_margin", 0))
            ev_ebitda = float(row.get("ev_ebitda", 0))
        except (TypeError, ValueError):
            continue
        ebitda = revenue * ebitda_margin
        enterprise_value = ebitda * ev_ebitda
        equity_value = enterprise_value - net_debt
        price = equity_value / shares
        expected_price += probability * price
        probability_total += probability
        rows.append(
            {
                "name": row.get("name", ""),
                "probability": probability,
                "revenue": revenue,
                "ebitda_margin": ebitda_margin,
                "ev_ebitda": ev_ebitda,
                "ebitda": ebitda,
                "enterprise_value": enterprise_value,
                "equity_value": equity_value,
                "price": price,
            }
        )
    if probability_total and not math.isclose(probability_total, 1.0):
        expected_price = expected_price / probability_total
    expected_return = None if current_price <= 0 else expected_price / current_price - 1
    return {
        "currency": valuation.get("currency", ""),
        "current_price": current_price,
        "expected_price": expected_price,
        "expected_return": expected_return,
        "scenarios": rows,
    }


def evidence_from_csv(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            if not any(str(value or "").strip() for value in row.values()):
                continue
            rows.append({column: str(row.get(column, "") or "").strip() for column in CSV_COLUMNS})
        return rows


def jp_import_template() -> str:
    sample_rows = [
        {
            "category": "financials",
            "item": "EDINET 有価証券報告書",
            "value": "売上高、営業利益、営業CF、総資産などを入力",
            "interpretation": "有報本文・注記から一過性要因、セグメント、会計方針を確認する。",
            "source": "EDINET",
            "source_url": "https://disclosure2.edinet-fsa.go.jp/",
            "date": today_iso(),
            "confidence": "high",
            "direction": "neutral",
            "materiality": "high",
            "source_type": "primary_filing",
        },
        {
            "category": "events_catalysts",
            "item": "TDnet 適時開示",
            "value": "決算短信、業績修正、資本政策、M&Aなど",
            "interpretation": "イベント日程、会社計画との差、翌期ガイダンスの変化を確認する。",
            "source": "TDnet",
            "source_url": "https://www.release.tdnet.info/",
            "date": today_iso(),
            "confidence": "high",
            "direction": "neutral",
            "materiality": "medium",
            "source_type": "exchange",
        },
        {
            "category": "ownership_flows",
            "item": "JPX 空売り・信用残",
            "value": "空売り残高、信用買残、需給イベントを入力",
            "interpretation": "需給の混雑度とイベント性の売買を確認する。",
            "source": "JPX",
            "source_url": "https://www.jpx.co.jp/markets/statistics-equities/",
            "date": today_iso(),
            "confidence": "medium",
            "direction": "neutral",
            "materiality": "medium",
            "source_type": "exchange",
        },
    ]
    out = []
    out.append(",".join(CSV_COLUMNS))
    for row in sample_rows:
        out.append(",".join(csv_quote(row[column]) for column in CSV_COLUMNS))
    return "\n".join(out) + "\n"


def csv_quote(value: Any) -> str:
    text = str(value if value is not None else "")
    if any(char in text for char in [",", '"', "\n"]):
        return '"' + text.replace('"', '""') + '"'
    return text


def load_agent_playbook() -> dict[str, Any]:
    if AGENT_PLAYBOOK_PATH.exists():
        return load_json(AGENT_PLAYBOOK_PATH)
    return {
        "agents": [
            {"name": "Research Orchestrator", "role": "銘柄、地域、目的から調査タスクを分解し、各エージェントの成果物を統合する。"},
            {"name": "Filing Agent", "role": "SEC/EDINET/TDnetの一次資料から財務、リスク、イベントを抽出する。"},
            {"name": "Financial Analyst Agent", "role": "成長率、利益率、CF、財務安全性を計算する。"},
            {"name": "Valuation Agent", "role": "相対評価、DCF/SOTP、シナリオ株価を作る。"},
            {"name": "Market & Flow Agent", "role": "株価、流動性、空売り、保有変化を整理する。"},
            {"name": "Risk Agent", "role": "反証条件、下方シナリオ、ポジション管理条件を明確にする。"},
            {"name": "Audit Agent", "role": "出所、日付、欠落、矛盾、古いデータを監査する。"},
        ]
    }


def format_agent_plan_markdown(playbook: dict[str, Any], compact: bool = False) -> str:
    lines = [] if compact else ["# エージェント構成", ""]
    for agent in playbook.get("agents", []):
        name = agent.get("name", "")
        role = agent.get("role", "")
        if compact:
            lines.append(f"- {name}: {role}")
            continue
        lines.extend([f"## {name}", "", role, ""])
        outputs = agent.get("outputs", [])
        if outputs:
            lines.append("成果物:")
            lines.extend([f"- {output}" for output in outputs])
            lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def merge_csv_into_data(base: dict[str, Any], csv_rows: list[dict[str, Any]]) -> dict[str, Any]:
    result = json.loads(json.dumps(base, ensure_ascii=False))
    result.setdefault("evidence", [])
    result["evidence"].extend(csv_rows)
    return result


def run_catalog(args: argparse.Namespace) -> None:
    catalog = load_json(CATALOG_PATH)
    text = json.dumps(catalog, ensure_ascii=False, indent=2) if args.format == "json" else format_catalog_markdown(catalog)
    write_text(args.output, text)


def run_template(args: argparse.Namespace) -> None:
    catalog = load_json(CATALOG_PATH)
    text = json.dumps(empty_template(catalog), ensure_ascii=False, indent=2)
    write_text(args.output, text + "\n")


def run_validate(args: argparse.Namespace) -> None:
    catalog = load_json(CATALOG_PATH)
    data = load_json(args.input)
    issues = validate_research_data(data, catalog)
    payload = {"summary": validation_summary(issues), "issues": issues}
    text = json.dumps(payload, ensure_ascii=False, indent=2) if args.format == "json" else format_validation_markdown(payload)
    write_text(args.output, text)
    if payload["summary"]["error"] and args.fail_on_error:
        raise SystemExit(2)


def format_validation_markdown(payload: dict[str, Any]) -> str:
    summary = payload["summary"]
    lines = ["# データ品質監査", "", f"- errors: {summary['error']}", f"- warnings: {summary['warning']}", f"- info: {summary['info']}", ""]
    if payload["issues"]:
        lines.append("## Issues")
        lines.extend([f"- [{issue['severity']}] `{issue['path']}`: {issue['message']}" for issue in payload["issues"]])
    else:
        lines.append("重大な問題は見つかりませんでした。")
    return "\n".join(lines).rstrip() + "\n"


def run_summary(args: argparse.Namespace) -> None:
    catalog = load_json(CATALOG_PATH)
    data = load_json(args.input)
    markdown_text = build_summary(data, catalog, args.include_catalog)
    if args.format == "html":
        text = render_html_report(markdown_text)
    elif args.format == "json":
        text = json.dumps({"markdown": markdown_text, "audit": validate_research_data(data, catalog)}, ensure_ascii=False, indent=2)
    else:
        text = markdown_text
    write_text(args.output, text)


def run_fetch_sec(args: argparse.Namespace) -> None:
    if "@" not in args.user_agent:
        raise SystemExit("SEC access requires a descriptive --user-agent including an email address.")
    data = fetch_sec_company(args.ticker, args.user_agent, args.years)
    write_text(args.output, json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def run_jp_template(args: argparse.Namespace) -> None:
    write_text(args.output, jp_import_template())


def run_import_csv(args: argparse.Namespace) -> None:
    base = load_json(args.base) if args.base else empty_template(load_json(CATALOG_PATH))
    merged = merge_csv_into_data(base, evidence_from_csv(args.input))
    write_text(args.output, json.dumps(merged, ensure_ascii=False, indent=2) + "\n")


def run_scenario_template(args: argparse.Namespace) -> None:
    write_text(args.output, json.dumps(scenario_template(), ensure_ascii=False, indent=2) + "\n")


def run_agent_plan(args: argparse.Namespace) -> None:
    text = format_agent_plan_markdown(load_agent_playbook())
    write_text(args.output, text)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="機関投資家型の情報カタログとエビデンス台帳から投資調査サマリを生成します。",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent(
            """
            Examples:
              python tools/invest_research_tool.py catalog --output outputs/catalog.md
              python tools/invest_research_tool.py template --output examples/my_company.json
              python tools/invest_research_tool.py validate --input examples/sample_company.json
              python tools/invest_research_tool.py summary --input examples/sample_company.json --output outputs/sample_summary.md
              python tools/invest_research_tool.py fetch-sec --ticker AAPL --years 5 --user-agent "Your Name your@email.com" --output data/AAPL_sec.json
              python tools/invest_research_tool.py jp-template --output examples/jp_import_template.csv
              python tools/invest_research_tool.py import-csv --base examples/sample_company.json --input examples/jp_import_template.csv --output data/merged.json
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

    validate = sub.add_parser("validate", help="会社別JSONの入力品質を監査します。")
    validate.add_argument("--input", type=Path, required=True)
    validate.add_argument("--output", type=Path)
    validate.add_argument("--format", choices=["markdown", "json"], default="markdown")
    validate.add_argument("--fail-on-error", action="store_true")
    validate.set_defaults(func=run_validate)

    summary = sub.add_parser("summary", help="会社別JSONから投資調査サマリを生成します。")
    summary.add_argument("--input", type=Path, required=True)
    summary.add_argument("--output", type=Path)
    summary.add_argument("--format", choices=["markdown", "html", "json"], default="markdown")
    summary.add_argument("--include-catalog", action="store_true", help="サマリ末尾に情報カタログを含めます。")
    summary.set_defaults(func=run_summary)

    sec = sub.add_parser("fetch-sec", help="SEC EDGAR APIから米国企業の初期JSONと年次KPIを作成します。")
    sec.add_argument("--ticker", required=True)
    sec.add_argument("--user-agent", required=True, help='例: "Your Name your@email.com"')
    sec.add_argument("--years", type=int, default=5)
    sec.add_argument("--output", type=Path)
    sec.set_defaults(func=run_fetch_sec)

    jp = sub.add_parser("jp-template", help="EDINET/TDnet/JPX向けCSV取り込みテンプレートを生成します。")
    jp.add_argument("--output", type=Path)
    jp.set_defaults(func=run_jp_template)

    import_csv = sub.add_parser("import-csv", help="CSVエビデンスを会社別JSONへ取り込みます。")
    import_csv.add_argument("--input", type=Path, required=True)
    import_csv.add_argument("--base", type=Path)
    import_csv.add_argument("--output", type=Path, required=True)
    import_csv.set_defaults(func=run_import_csv)

    scenario = sub.add_parser("scenario-template", help="バリュエーション・シナリオ入力テンプレートを生成します。")
    scenario.add_argument("--output", type=Path)
    scenario.set_defaults(func=run_scenario_template)

    agents = sub.add_parser("agent-plan", help="エージェント構成と成果物定義をMarkdownで出力します。")
    agents.add_argument("--output", type=Path)
    agents.set_defaults(func=run_agent_plan)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        args.func(args)
        return 0
    except SystemExit as exc:
        return int(exc.code or 0)
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
