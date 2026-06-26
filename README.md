# 機関投資家型リサーチサマリツール

機関投資家や証券会社が投資判断で確認する情報をカタログ化し、会社別のエビデンスを入力すると投資調査サマリを生成するローカルツールです。

これは売買推奨ツールではありません。目的は、一次情報、データ鮮度、コンセンサス、需給、リスクシナリオを同じ形式で並べ、投資判断前の抜け漏れを減らすことです。

## 構成

- `data/information_catalog.json`: 機関投資家が確認する情報カテゴリとデータ源
- `examples/sample_company.json`: 入力JSONのサンプル
- `tools/invest_research_tool.py`: CLI版のカタログ出力、テンプレート作成、サマリ生成、SEC初期データ取得
- `dashboard/index.html`: ブラウザで使う静的ダッシュボード

## すぐ使う

ブラウザで次を開きます。

`C:\Users\yutao\OneDrive\デスクトップ\★Codex★\株銘柄選定\dashboard\index.html`

画面左のJSONを編集し、`Summary` を押すとサマリが更新されます。`Markdown保存` で調査メモを書き出せます。

## CLI

PowerShell で `株銘柄選定` フォルダに移動して使います。

```powershell
.\run_tool.cmd catalog --output outputs/catalog.md
.\run_tool.cmd template --output examples/my_company.json
.\run_tool.cmd summary --input examples/sample_company.json --output outputs/sample_summary.md
```

米国株はSEC EDGAR APIから初期JSONを作れます。SECのアクセス方針に合わせ、連絡可能なメールアドレスを含むUser-Agentを指定してください。

```powershell
.\run_tool.cmd fetch-sec --ticker AAPL --user-agent "Your Name your@email.com" --output data/AAPL_sec.json
.\run_tool.cmd summary --input data/AAPL_sec.json --output outputs/AAPL_summary.md
```

PythonがPATHにある環境では、`python tools/invest_research_tool.py ...` でも同じように動きます。PowerShellの実行ポリシーを許可している環境では、同梱の `run_tool.ps1` も使えます。

## 入力データ形式

最小単位はエビデンス行です。

```json
{
  "category": "financials",
  "item": "売上成長",
  "value": "直近期売上は前年比 +8.2%",
  "interpretation": "数量回復と価格改定が寄与。",
  "source": "FY2025 Form 10-K",
  "source_url": "https://www.sec.gov/search-filings",
  "date": "2026-02-15",
  "confidence": "high",
  "direction": "positive"
}
```

`category` は `data/information_catalog.json` のIDを使います。`direction` は `positive`、`negative`、`neutral`、`mixed`、`unknown`、`confidence` は `high`、`medium`、`low` を想定しています。

## 情報カテゴリ

このツールは次の観点をチェックします。

- 財務諸表・開示資料
- 株価・流動性・テクニカル需給
- バリュエーション
- 業績予想・コンセンサス・アナリスト論点
- 保有・資金フロー・ポジショニング
- マクロ・金利・為替・コモディティ
- 業界・競争環境・サプライチェーン
- 資本政策・株主還元・M&A
- ガバナンス・法務・規制
- イベント・カタリスト
- リスク・シナリオ・ポートフォリオ影響

## データ源の考え方

無料公開データだけでは、機関投資家が使うBloomberg、FactSet、Refinitiv、Visible Alpha、証券会社レポート、プライムブローカー需給、専門業界データと同等にはなりません。そのため、このツールは次の方針です。

- 一次情報は公開APIや企業開示から取得する
- 有料データや証券会社レポートは手入力・CSV化してエビデンスとして入れる
- すべての判断材料に出所、日付、確信度、方向を付ける
- 未入力カテゴリを明示し、調査の抜け漏れを見える化する

主な公開データ源:

- SEC EDGAR APIs: https://www.sec.gov/search-filings/edgar-application-programming-interfaces
- SEC EDGAR access policy: https://www.sec.gov/os/accessing-edgar-data
- EDINET: https://disclosure2.edinet-fsa.go.jp/
- TDnet: https://www.release.tdnet.info/
- JPX 統計情報: https://www.jpx.co.jp/markets/statistics-equities/
- FRED API: https://fred.stlouisfed.org/docs/api/fred/
- CFTC Commitments of Traders: https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm
- FINRA Data: https://www.finra.org/finra-data

## 実務での運用

1. SEC/EDINET/TDnetなど一次情報から財務・イベントを入れる。
2. 株価、流動性、バリュエーション、コンセンサスを追加する。
3. 競合、業界統計、マクロ感応度、需給を追加する。
4. ブル・ベース・ベア、反証条件、損失許容度を入力する。
5. サマリを出力し、未充足カテゴリを埋める。

投資判断では、最終的にポジションサイズ、流動性、税務、手数料、自身のリスク許容度を別途確認してください。
