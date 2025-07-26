'use client';

import { useState } from 'react';

// Helper function to format market cap from millions to readable format
const formatMarketCap = (marketCapInMillions: number): string => {
  if (marketCapInMillions >= 1000000) {
    return `$${(marketCapInMillions / 1000000).toFixed(2)}T`;
  } else if (marketCapInMillions >= 1000) {
    return `$${(marketCapInMillions / 1000).toFixed(1)}B`;
  } else {
    return `$${marketCapInMillions.toFixed(0)}M`;
  }
};

// Helper function to format 52-week range
const format52WeekRange = (low?: number, high?: number): string => {
  if (!low || !high) return "-";
  return `$${low.toFixed(2)} - $${high.toFixed(2)}`;
};

// Helper function to format P/E ratio
const formatPeRatio = (pe?: number): string => {
  if (!pe || pe <= 0) return "-";
  return `${pe.toFixed(1)}x`;
};

// Helper function to format dividend yield
const formatDividendYield = (yieldValue?: number): string => {
  if (!yieldValue || yieldValue <= 0) return "0.00%";
  return `${yieldValue.toFixed(2)}%`;
};

// Helper function to format EPS
const formatEps = (eps?: number): string => {
  if (!eps) return "-";
  return `$${eps.toFixed(2)}`;
};

// Helper function to format revenue growth
const formatRevenueGrowth = (growth?: number): string => {
  if (!growth && growth !== 0) return "-";
  const sign = growth >= 0 ? "+" : "";
  return `${sign}${growth.toFixed(1)}%`;
};

// Data structure for our UI
interface CompanyData {
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

// Transform Finnhub response to our data structure
  const transformFinnhubData = (ticker: string, finnhubResponse: any, profileData?: any, financialsData?: any): CompanyData | null => {
    if (!finnhubResponse || !finnhubResponse.c) {
      return null;
    }

    const metrics = financialsData?.metric || {};

    return {
    name: profileData?.name || ticker, // Use real name from profile, fallback to ticker
    ticker: ticker,
    sector: "-", // Not available in free Finnhub plan
    location: profileData?.country || "-", // Use country from profile
    price: Number(finnhubResponse.c.toFixed(2)),
    change: Number(finnhubResponse.d.toFixed(2)),
    changePercent: Number(finnhubResponse.dp.toFixed(2)),
    // Real 52-week range from financials (preferred) or day range (fallback)
    fiftyTwoWeekLow: metrics['52WeekLow'] || Number(finnhubResponse.l.toFixed(2)),
    fiftyTwoWeekHigh: metrics['52WeekHigh'] || Number(finnhubResponse.h.toFixed(2)),
    // Real data from various Finnhub endpoints
    marketCap: profileData?.marketCapitalization ? formatMarketCap(profileData.marketCapitalization) : "-",
    peRatio: formatPeRatio(metrics.peNormalizedAnnual),
    revenueGrowth: formatRevenueGrowth(metrics.revenueGrowthTTMYoy), // Real revenue growth YoY
    eps: formatEps(metrics.epsTTM), // Using TTM (Trailing Twelve Months) EPS
    dividendYield: formatDividendYield(metrics.currentDividendYieldTTM),
    logo: profileData?.logo || undefined,
  };
};

// Helper function to get company emoji
const getCompanyEmoji = (ticker: string) => {
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

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(false);

      const fetchStockData = async (symbol: string) => {
    try {
      // Replace with your actual Finnhub API key
      const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'YOUR_API_KEY_HERE';
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
      
      console.log('Fetching data from:', url);
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Finnhub response for', symbol, ':', data);
      return data;
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return null;
    }
  };

  const fetchCompanyProfile = async (symbol: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'YOUR_API_KEY_HERE';
      const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`;
      
      console.log('Fetching company profile from:', url);
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Finnhub profile response for', symbol, ':', data);
      return data;
    } catch (error) {
      console.error('Error fetching company profile:', error);
      return null;
    }
  };

  const fetchBasicFinancials = async (symbol: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'YOUR_API_KEY_HERE';
      const url = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`;
      
      console.log('Fetching basic financials from:', url);
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Finnhub financials response for', symbol, ':', data);
      return data;
    } catch (error) {
      console.error('Error fetching basic financials:', error);
      return null;
    }
  };

  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setLoading(true);
      const ticker = searchTerm.toUpperCase().trim();
      
              try {
          // Handle common company name aliases
          let searchTicker = ticker;
          const aliases: { [key: string]: string } = {
            'APPLE': 'AAPL',
            'TESLA': 'TSLA', 
            'MICROSOFT': 'MSFT',
            'GOOGLE': 'GOOGL',
            'ALPHABET': 'GOOGL',
            'NVIDIA': 'NVDA',
            'AMAZON': 'AMZN',
            'META': 'META',
            'FACEBOOK': 'META'
          };
          
          searchTicker = aliases[ticker] || ticker;

                  // Fetch real data from Finnhub in parallel
          const [finnhubData, profileData, financialsData] = await Promise.all([
            fetchStockData(searchTicker),
            fetchCompanyProfile(searchTicker),
            fetchBasicFinancials(searchTicker)
          ]);
          
          // Transform data with all API responses
          const transformedData = transformFinnhubData(searchTicker, finnhubData, profileData, financialsData);
        
        if (transformedData) {
          // Prepare parallel operations
          const operations = [];
          
          // If there's a logo, preload it in parallel
          if (transformedData.logo) {
            console.log('Preloading logo in parallel:', transformedData.logo);
            operations.push(
              preloadImage(transformedData.logo).catch((error) => {
                console.log('Logo failed to load, will remove it:', error);
                transformedData.logo = undefined; // Remove logo if it fails to load
              })
            );
          }
          
          // Wait for all operations (currently just logo preloading, but extensible)
          if (operations.length > 0) {
            await Promise.all(operations);
          }
          
          console.log('All operations completed, showing results');
          setCurrentCompany(transformedData);
          setShowResults(true);
        } else {
          alert(`Sorry, we couldn't fetch data for "${searchTerm}". Please check the ticker symbol and try again.`);
        }
      } catch (error) {
        console.error('Search error:', error);
        alert('Error fetching stock data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNewSearch = () => {
    setShowResults(false);
    setCurrentCompany(null);
    setSearchTerm('');
  };

  if (showResults && currentCompany) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header with search */}
        <div className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button 
              onClick={handleNewSearch}
              className="text-lg font-light tracking-tight hover:text-gray-400 transition-colors"
            >
              EQUITY <span className="text-gray-400">INSIGHTS</span>
            </button>
            
            <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search another company..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm font-light text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 focus:bg-gray-800 transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Company Results */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Company Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                {currentCompany.logo && (
                  <img 
                    src={currentCompany.logo} 
                    alt={`${currentCompany.name} logo`}
                    className="w-16 h-16 rounded-lg bg-white p-2"
                    onError={(e) => {
                      // Hide logo if it fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div>
                  <h1 className="text-3xl font-light mb-2">
                    {!currentCompany.logo && getCompanyEmoji(currentCompany.ticker)} {currentCompany.name} ({currentCompany.ticker})
                  </h1>
                  <p className="text-gray-400 font-light">
                    {currentCompany.sector} • {currentCompany.location}
                  </p>
                </div>
              </div>
              
                              <div className="text-right">
                  <div className="text-3xl font-light mb-1">
                    ${currentCompany.price}
                  </div>
                  <div className={`text-sm font-light ${currentCompany.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${currentCompany.change >= 0 ? `+${currentCompany.change}` : currentCompany.change} {currentCompany.change >= 0 ? '↗' : '↘'} {currentCompany.changePercent >= 0 ? `+${currentCompany.changePercent}` : currentCompany.changePercent}%
                  </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-gray-400 text-sm font-light mb-1">Market Cap</div>
                  <div className="text-xl font-light">{currentCompany.marketCap}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm font-light mb-1">P/E Ratio</div>
                  <div className="text-xl font-light">{currentCompany.peRatio}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm font-light mb-1">Revenue Growth (YoY)</div>
                  <div className={`text-xl font-light ${
                    currentCompany.revenueGrowth.startsWith('+') ? 'text-green-400' : 
                    currentCompany.revenueGrowth.startsWith('-') ? 'text-red-400' : ''
                  }`}>
                    {currentCompany.revenueGrowth}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm font-light mb-1">EPS</div>
                  <div className="text-xl font-light">{currentCompany.eps}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm font-light mb-1">52W Range</div>
                  <div className="text-xl font-light">
                    {format52WeekRange(currentCompany.fiftyTwoWeekLow, currentCompany.fiftyTwoWeekHigh)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm font-light mb-1">Dividend Yield</div>
                  <div className="text-xl font-light">{currentCompany.dividendYield}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Placeholder for report sections */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-light mb-4">📊 Executive Summary</h2>
              <p className="text-gray-400 font-light">
                Report sections coming soon...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Landing page (original design)
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-2xl text-center">
        {/* App Title */}
        <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-5">
          <span className="text-white">EQUITY </span>
          <span className="text-gray-400">INSIGHTS</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg text-gray-500 mb-5 font-light">
          Professional financial analysis for any company
        </p>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter company ticker or name..."
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-6 py-4 text-lg font-light text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 focus:bg-gray-800 transition-all duration-200"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
            </button>
          </div>
        </form>

        {/* Subtle hint */}
        <p className="text-sm text-gray-600 mt-6 font-light">
          Search any public company ticker symbol
        </p>
      </div>
    </div>
  );
}
