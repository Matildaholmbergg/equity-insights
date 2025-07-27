'use client';

import { useState } from 'react';
import { formatMarketCap, formatPeRatio, formatRevenueGrowth, formatEps, formatDividendYield, format52WeekRange, getCompanyEmoji, transformFinnhubData } from './utils';
import { CompanyData, InvestmentAnalysis } from './types';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<CompanyData | null>(null);
  const [analysis, setAnalysis] = useState<InvestmentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const fetchStockData = async (symbol: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      return data;
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return null;
    }
  };

  const fetchCompanyProfile = async (symbol: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY
      const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      return data;
    } catch (error) {
      console.error('Error fetching company profile:', error);
      return null;
    }
  };

  const fetchBasicFinancials = async (symbol: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY
      const url = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      return data;
    } catch (error) {
      console.error('Error fetching basic financials:', error);
      return null;
    }
  };

  const fetchInvestmentAnalysis = async (companyData: CompanyData): Promise<InvestmentAnalysis | null> => {
    try {
      setAnalysisLoading(true);
      console.log('Fetching investment analysis for', companyData.ticker);
      
      const response = await fetch(`/api/analyze/${companyData.ticker}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        throw new Error(`Analysis API error: ${response.status}`);
      }

      const analysisData = await response.json();
      console.log('Investment analysis received:', analysisData);
      
      return analysisData;
    } catch (error) {
      console.error('Error fetching investment analysis:', error);
      return null;
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setLoading(true);
      setAnalysis(null);
      const ticker = searchTerm.toUpperCase().trim();
      
      try {
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

          const [finnhubData, profileData, financialsData] = await Promise.all([
            fetchStockData(searchTicker),
            fetchCompanyProfile(searchTicker),
            fetchBasicFinancials(searchTicker)
          ]);
          
          const transformedData = transformFinnhubData(searchTicker, finnhubData, profileData, financialsData);
        
        if (transformedData) {
          console.log('Showing results without image preloading');
          setCurrentCompany(transformedData);
          setShowResults(true);
          
          // Fetch investment analysis in the background (non-blocking)
          fetchInvestmentAnalysis(transformedData).then((analysisResult) => {
            if (analysisResult) {
              setAnalysis(analysisResult);
            }
          });
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
    setAnalysis(null);
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
              className="text-lg font-light tracking-tight hover:text-gray-400 transition-colors cursor-pointer"
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
                  <div className={`text-sm font-light ${currentCompany.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>                    ${currentCompany.change >= 0 ? `+${currentCompany.change}` : currentCompany.change} {currentCompany.change >= 0 ? '↗' : '↘'} {currentCompany.changePercent >= 0 ? `+${currentCompany.changePercent}` : currentCompany.changePercent}%
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

          {/* Investment Analysis Section */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-light">🤖 AI Investment Analysis</h2>
                {analysisLoading && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </div>
                )}
              </div>
              
              {analysis ? (
                <div className="space-y-6">
                  {/* Recommendation Banner */}
                  <div className={`rounded-lg p-4 text-center ${
                    analysis.recommendation === 'BUY' ? 'bg-green-900/30 border border-green-600' :
                    analysis.recommendation === 'SELL' ? 'bg-red-900/30 border border-red-600' :
                    'bg-yellow-900/30 border border-yellow-600'
                  }`}>
                    <div className="text-2xl font-light mb-1">
                      Recommendation: <span className={`font-medium ${
                        analysis.recommendation === 'BUY' ? 'text-green-400' :
                        analysis.recommendation === 'SELL' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>{analysis.recommendation}</span>
                    </div>
                  </div>

                  {/* Analysis Content */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div>
                      <h3 className="text-lg font-light text-green-400 mb-3">💪 Strengths</h3>
                      <ul className="space-y-2">
                        {analysis.strengths.map((strength, index) => (
                          <li key={index} className="text-gray-300 text-sm leading-relaxed">
                            • {strength}
          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Risks */}
                    <div>
                      <h3 className="text-lg font-light text-red-400 mb-3">⚠️ Risks</h3>
                      <ul className="space-y-2">
                        {analysis.risks.map((risk, index) => (
                          <li key={index} className="text-gray-300 text-sm leading-relaxed">
                            • {risk}
          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Outlook */}
                  <div>
                    <h3 className="text-lg font-light text-blue-400 mb-3">🔮 Outlook</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {analysis.outlook}
                    </p>
                  </div>
                </div>
              ) : !analysisLoading ? (
                <p className="text-gray-400 font-light text-center py-8">
                  AI analysis will appear here after searching for a company...
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

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