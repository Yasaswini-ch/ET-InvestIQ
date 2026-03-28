import { BudgetAnnouncement } from "@/lib/types/intelligence";

export const BUDGET_2026_ANNOUNCEMENTS: BudgetAnnouncement[] = [
  {
    id: 'ltcg_rate',
    title: 'LTCG Tax on Equity Mutual Funds',
    category: 'taxation',
    shortText: 'Long-term capital gains tax rate change on equity MFs and stocks',
    fullText: 'The Union Budget 2026-27 has proposed an adjustment to the Long-Term Capital Gains (LTCG) tax rate on equity mutual funds and listed equities, altering the exemption limits and flat rates to streamline capital gains taxation for retail investors.',
    affectsAssetClasses: ['equity_mf', 'direct_equity'],
    severity: 'high'
  },
  {
    id: 'elss_80c',
    title: 'Section 80C and ELSS',
    category: 'taxation',
    shortText: 'Changes to 80C deduction limit affecting ELSS fund investments',
    fullText: 'In a bid to encourage the transition to the new tax regime, the government has reviewed the utility of Section 80C deductions, affecting the lock-in attractiveness and tax-saving properties of ELSS (Equity Linked Savings Scheme) mutual funds.',
    affectsAssetClasses: ['elss'],
    severity: 'high'
  },
  {
    id: 'stt_mf',
    title: 'Securities Transaction Tax on MF Redemptions',
    category: 'taxation',
    shortText: 'STT revision on mutual fund redemptions',
    fullText: 'To curb excessive short-term speculative redemption in equity funds, the Securities Transaction Tax (STT) has been slightly revised upwards for specific categories of mutual fund redemptions.',
    affectsAssetClasses: ['equity_mf'],
    severity: 'medium'
  },
  {
    id: 'new_tax_regime',
    title: 'New Tax Regime Slabs',
    category: 'taxation',
    shortText: 'Revised income tax slabs under new regime',
    fullText: 'The basic exemption limit and intermediate tax slabs under the default new tax regime have been widened to provide more disposable income in the hands of the middle class, impacting the overall investible surplus for systematic investment plans.',
    affectsAssetClasses: ['all'],
    severity: 'high'
  },
  {
    id: 'gold_import_duty',
    title: 'Gold Import Duty',
    category: 'asset_class',
    shortText: 'Changes to gold import duty affecting gold ETFs and sovereign gold bonds',
    fullText: 'The import duty on physical gold has been recalibrated, causing a cascading effect on domestic gold prices. This directly impacts the valuation and future returns of Gold ETFs and Sovereign Gold Bonds (SGBs).',
    affectsAssetClasses: ['gold_etf', 'sgb'],
    severity: 'medium'
  },
  {
    id: 'infra_push',
    title: 'Infrastructure Spending Push',
    category: 'sectoral',
    shortText: 'Increased capex allocation — impact on infra and PSU sector funds',
    fullText: 'The government has increased capital expenditure allocation towards roadways, railways, and core infrastructure by a significant margin. This structural push is expected to yield multi-year order books for capital goods and infrastructure-focused PSU funds.',
    affectsAssetClasses: ['sectoral_infra', 'psu_funds'],
    severity: 'medium'
  },
  {
    id: 'startup_tax',
    title: 'Startup and SME Tax Incentives',
    category: 'sectoral',
    shortText: 'Tax breaks for startups — impact on small cap and ELSS funds',
    fullText: 'Extended tax holidays and easier listing norms for Small and Medium Enterprises (SMEs) and startups will structurally benefit the SME exchange listings and small-cap mutual funds that have high exposure to these dynamic growth segments.',
    affectsAssetClasses: ['small_cap', 'elss'],
    severity: 'low'
  },
  {
    id: 'nps_changes',
    title: 'NPS Contribution Rules',
    category: 'retirement',
    shortText: 'Changes to NPS tax deduction and employer contribution rules',
    fullText: 'The employer contribution limit to the National Pension System (NPS) has been rationalized, and the tax-free withdrawal limits upon superannuation have been improved to incentivize long-term retirement planning over pure equity products.',
    affectsAssetClasses: ['nps'],
    severity: 'medium'
  }
];
