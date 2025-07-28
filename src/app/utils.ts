import { CompanyData } from "./types";

export const formatMarketCap = (marketCapInMillions: number): string => {
    if (marketCapInMillions >= 1000000) {
      return `$${(marketCapInMillions / 1000000).toFixed(2)}T`;
    } else if (marketCapInMillions >= 1000) {
      return `$${(marketCapInMillions / 1000).toFixed(1)}B`;
    } else {
      return `$${marketCapInMillions.toFixed(0)}M`;
    }
  };
  
  export const format52WeekRange = (low?: number, high?: number): string => {
    if (!low || !high) return "-";
    return `$${low.toFixed(2)} - $${high.toFixed(2)}`;
  };
  
  export const formatPeRatio = (pe?: number): string => {
    if (!pe || pe <= 0) return "-";
    return `${pe.toFixed(1)}x`;
  };
  
  export const formatDividendYield = (yieldValue?: number): string => {
    if (!yieldValue || yieldValue <= 0) return "0.00%";
    return `${yieldValue.toFixed(2)}%`;
  };
  
  export const formatEps = (eps?: number): string => {
    if (!eps) return "-";
    return `$${eps.toFixed(2)}`;
  };
  
  export const formatRevenueGrowth = (growth?: number): string => {
    if (!growth && growth !== 0) return "-";
    const sign = growth >= 0 ? "+" : "";
    return `${sign}${growth.toFixed(1)}%`;
  };

  export const getCompanyEmoji = (ticker: string) => {
    const emojis: { [key: string]: string } = {
      'AAPL': '🍎',
      'TSLA': '🚗',
      'MSFT': '💻',
      'GOOGL': '🔍',
      'NVDA': '🖥️',
      'AMZN': '📦',
      'META': '👥'
    };
    return emojis[ticker] || '🏢';
  };

  export const transformFinnhubData = (ticker: string, finnhubResponse: any, profileData?: any, financialsData?: any): CompanyData | null => {
    if (!finnhubResponse || !finnhubResponse.c) {
      return null;
    }

    const metrics = financialsData?.metric || {};

    return {
    name: profileData?.name || ticker,
    ticker: ticker,
    sector: "-",
    location: profileData?.country || "-",
    price: Number(finnhubResponse.c.toFixed(2)),
    change: Number(finnhubResponse.d.toFixed(2)),
    changePercent: Number(finnhubResponse.dp.toFixed(2)),
    fiftyTwoWeekLow: metrics['52WeekLow'] || Number(finnhubResponse.l.toFixed(2)),
    fiftyTwoWeekHigh: metrics['52WeekHigh'] || Number(finnhubResponse.h.toFixed(2)),
    marketCap: profileData?.marketCapitalization ? formatMarketCap(profileData.marketCapitalization) : "-",
    peRatio: formatPeRatio(metrics.peNormalizedAnnual),
    revenueGrowth: formatRevenueGrowth(metrics.revenueGrowthTTMYoy),
    eps: formatEps(metrics.epsTTM),
    dividendYield: formatDividendYield(metrics.currentDividendYieldTTM),
    logo: profileData?.logo || undefined,
  };
};