// Helper function to format market cap from millions to readable format
export const formatMarketCap = (marketCapInMillions: number): string => {
    if (marketCapInMillions >= 1000000) {
      return `$${(marketCapInMillions / 1000000).toFixed(2)}T`;
    } else if (marketCapInMillions >= 1000) {
      return `$${(marketCapInMillions / 1000).toFixed(1)}B`;
    } else {
      return `$${marketCapInMillions.toFixed(0)}M`;
    }
  };
  
  // Helper function to format 52-week range
  export const format52WeekRange = (low?: number, high?: number): string => {
    if (!low || !high) return "-";
    return `$${low.toFixed(2)} - $${high.toFixed(2)}`;
  };
  
  // Helper function to format P/E ratio
  export const formatPeRatio = (pe?: number): string => {
    if (!pe || pe <= 0) return "-";
    return `${pe.toFixed(1)}x`;
  };
  
  // Helper function to format dividend yield
  export const formatDividendYield = (yieldValue?: number): string => {
    if (!yieldValue || yieldValue <= 0) return "0.00%";
    return `${yieldValue.toFixed(2)}%`;
  };
  
  // Helper function to format EPS
  export const formatEps = (eps?: number): string => {
    if (!eps) return "-";
    return `$${eps.toFixed(2)}`;
  };
  
  // Helper function to format revenue growth
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