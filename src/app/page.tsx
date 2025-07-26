'use client';

import { useState } from 'react';

// Mock data for companies
const mockData = {
  AAPL: {
    name: "Apple Inc.",
    ticker: "AAPL",
    sector: "Technology",
    location: "Cupertino, CA",
    price: 150.23,
    change: 2.45,
    changePercent: 1.65,
    marketCap: "2.35T",
    peRatio: "25.4x",
    revenue: "$394.3B",
    eps: "$6.11",
    fiftyTwoWeekLow: 124.17,
    fiftyTwoWeekHigh: 182.94,
    dividendYield: "0.52%",
    revenueGrowth: "+8.2%"
  },
  TSLA: {
    name: "Tesla, Inc.",
    ticker: "TSLA",
    sector: "Automotive",
    location: "Austin, TX",
    price: 248.85,
    change: -5.12,
    changePercent: -2.02,
    marketCap: "792.1B",
    peRatio: "65.7x",
    revenue: "$96.8B",
    eps: "$3.62",
    fiftyTwoWeekLow: 152.37,
    fiftyTwoWeekHigh: 299.29,
    dividendYield: "0.00%",
    revenueGrowth: "+18.8%"
  },
  MSFT: {
    name: "Microsoft Corporation",
    ticker: "MSFT",
    sector: "Technology",
    location: "Redmond, WA",
    price: 422.54,
    change: 1.89,
    changePercent: 0.45,
    marketCap: "3.14T",
    peRatio: "34.2x",
    revenue: "$245.1B",
    eps: "$12.05",
    fiftyTwoWeekLow: 309.45,
    fiftyTwoWeekHigh: 468.35,
    dividendYield: "0.68%",
    revenueGrowth: "+15.7%"
  },
  GOOGL: {
    name: "Alphabet Inc.",
    ticker: "GOOGL",
    sector: "Technology",
    location: "Mountain View, CA",
    price: 171.18,
    change: 0.95,
    changePercent: 0.56,
    marketCap: "2.11T",
    peRatio: "23.8x",
    revenue: "$307.4B",
    eps: "$7.07",
    fiftyTwoWeekLow: 129.40,
    fiftyTwoWeekHigh: 191.75,
    dividendYield: "0.00%",
    revenueGrowth: "+13.4%"
  },
  NVDA: {
    name: "NVIDIA Corporation",
    ticker: "NVDA",
    sector: "Technology",
    location: "Santa Clara, CA",
    price: 127.84,
    change: 3.22,
    changePercent: 2.58,
    marketCap: "3.15T",
    peRatio: "63.2x",
    revenue: "$126.0B",
    eps: "$2.05",
    fiftyTwoWeekLow: 39.23,
    fiftyTwoWeekHigh: 152.89,
    dividendYield: "0.03%",
    revenueGrowth: "+126.1%"
  }
};

// Helper function to get company emoji
const getCompanyEmoji = (ticker: string) => {
  const emojis: { [key: string]: string } = {
    'AAPL': '🍎',
    'TSLA': '🚗',
    'MSFT': '💻',
    'GOOGL': '🔍',
    'NVDA': '🖥️'
  };
  return emojis[ticker] || '🏢';
};

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<typeof mockData.AAPL | null>(null);

      const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const ticker = searchTerm.toUpperCase().trim();
      
      // Check if we have data for this company
      if (ticker in mockData) {
        setCurrentCompany(mockData[ticker as keyof typeof mockData]);
        setShowResults(true);
      } else if (ticker === 'APPLE') {
        setCurrentCompany(mockData.AAPL);
        setShowResults(true);
      } else if (ticker === 'TESLA') {
        setCurrentCompany(mockData.TSLA);
        setShowResults(true);
      } else if (ticker === 'MICROSOFT') {
        setCurrentCompany(mockData.MSFT);
        setShowResults(true);
      } else if (ticker === 'GOOGLE' || ticker === 'ALPHABET') {
        setCurrentCompany(mockData.GOOGL);
        setShowResults(true);
      } else if (ticker === 'NVIDIA') {
        setCurrentCompany(mockData.NVDA);
        setShowResults(true);
      } else {
        // TODO: Handle companies not in our mock data
        alert(`Sorry, we don't have data for "${searchTerm}" yet. Try: AAPL, TSLA, MSFT, GOOGL, or NVDA`);
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
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
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
              <div>
                <h1 className="text-3xl font-light mb-2">
                  {getCompanyEmoji(currentCompany.ticker)} {currentCompany.name} ({currentCompany.ticker})
                </h1>
                <p className="text-gray-400 font-light">
                  {currentCompany.sector} • {currentCompany.location}
                </p>
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
                  <div className="text-gray-400 text-sm font-light mb-1">Revenue (TTM)</div>
                  <div className="text-xl font-light">{currentCompany.revenue}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm font-light mb-1">EPS</div>
                  <div className="text-xl font-light">{currentCompany.eps}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm font-light mb-1">52W Range</div>
                  <div className="text-xl font-light">
                    ${currentCompany.fiftyTwoWeekLow} - ${currentCompany.fiftyTwoWeekHigh}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm font-light mb-1">Dividend Yield</div>
                  <div className="text-xl font-light">{currentCompany.dividendYield}</div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="text-gray-400 text-sm font-light mb-1">Revenue Growth (YoY)</div>
                <div className="text-xl font-light text-green-400">{currentCompany.revenueGrowth}</div>
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
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors duration-200"
            >
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
            </button>
          </div>
        </form>

        {/* Subtle hint */}
        <p className="text-sm text-gray-600 mt-6 font-light">
          Try: AAPL, TSLA, MSFT, GOOGL, NVDA
        </p>
      </div>
    </div>
  );
}
