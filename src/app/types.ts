
export interface CompanyData {
    name: string;
    ticker: string;
    sector: string;
    location: string;
    price: number;
    change: number;
    changePercent: number;
    marketCap: string;
    peRatio: string;
    revenueGrowth: string;
    eps: string;
    fiftyTwoWeekLow: number;
    fiftyTwoWeekHigh: number;
    dividendYield: string;
    logo?: string;
}
  
export interface InvestmentAnalysis {
    strengths: string[];
    risks: string[];
    outlook: string;
    recommendation: 'BUY' | 'HOLD' | 'SELL';
}