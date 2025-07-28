'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  formatMarketCap,
  formatPeRatio,
  formatRevenueGrowth,
  formatEps,
  formatDividendYield,
  format52WeekRange,
  getCompanyEmoji,
  transformFinnhubData,
} from './utils';
import { POPULAR_SYMBOLS } from './symbolList';
import { CompanyData } from './types';

interface InvestmentAnalysis {
  summary: string;
  competitiveLandscape: { ticker: string; blurb: string }[];
  catalysts: string[];
  risks: { risk: string; severity: 'low' | 'medium' | 'high' }[];
  recommendation: 'BUY' | 'HOLD' | 'SELL';
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<CompanyData | null>(null);
  const [analysis, setAnalysis] = useState<InvestmentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY as string;

  /* ---------- suggestions ---------- */
  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.trim().toLowerCase();
    return POPULAR_SYMBOLS.filter(
      (s) =>
        s.symbol.toLowerCase().startsWith(q) ||
        s.name.toLowerCase().startsWith(q)
    ).slice(0, 8);
  }, [searchTerm]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchStockData = (symbol: string) =>
    fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`)
      .then((r) => r.json())
      .catch(() => null);
  const fetchCompanyProfile = (symbol: string) =>
    fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`)
      .then((r) => r.json())
      .catch(() => null);
  const fetchBasicFinancials = (symbol: string) =>
    fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`)
      .then((r) => r.json())
      .catch(() => null);

      const fetchInvestmentAnalysis = async (
        company: CompanyData
      ): Promise<InvestmentAnalysis | null> => {
        try {
          setAnalysisLoading(true);
      
          const res = await fetch(`/api/analyze/${company.ticker}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(company),
          });
      
          if (!res.ok) {
            let details = '';
            try {
              const payload = await res.json();
              details = payload?.message || payload?.error || '';
            } catch {
            }
            throw new Error(
              `Analysis API error ${res.status}${details ? ` – ${details}` : ''}`
            );
          }
      
          return await res.json();
        } catch (err) {
          console.error('Error fetching investment analysis:', err);
          return null;
        } finally {
          setAnalysisLoading(false);
        }
      };
      

  const performSearch = async (rawInput: string) => {
    const raw = rawInput.trim();
    if (!raw) return;
    setShowDropdown(false);
    setLoading(true);
    setAnalysis(null);

    const entry =
      POPULAR_SYMBOLS.find((s) => s.symbol.toUpperCase() === raw.toUpperCase()) ||
      POPULAR_SYMBOLS.find((s) => s.name.toLowerCase() === raw.toLowerCase());
    const symbol = entry ? entry.symbol : raw.toUpperCase();

    try {
      const [quote, profile, fin] = await Promise.all([
        fetchStockData(symbol),
        fetchCompanyProfile(symbol),
        fetchBasicFinancials(symbol),
      ]);
      const data = transformFinnhubData(symbol, quote, profile, fin);
      if (!data) throw new Error('Transform failed');
      setCurrentCompany(data);
      setShowResults(true);
      fetchInvestmentAnalysis(data).then(setAnalysis);
    } catch (err) {
      console.error('Search flow error:', err);
      alert('Failed to fetch stock data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchTerm);
  };

  const handleNewSearch = () => {
    setShowResults(false);
    setCurrentCompany(null);
    setAnalysis(null);
    setSearchTerm('');
  };

  const SearchInput = (
    <div className="relative w-full" key={showResults ? 'header' : 'landing'}>
      <input
        ref={inputRef}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => searchTerm && setShowDropdown(true)}
        placeholder="Enter company name or ticker…"
        className={`${
          showResults ? 'px-4 py-2 text-sm' : 'px-6 py-4 text-lg'
        } w-full bg-gray-900 border border-gray-800 rounded-lg font-light placeholder-gray-600 focus:outline-none focus:border-gray-600 focus:bg-gray-800`}
      />
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {suggestions.map((s) => (
            <div
              key={s.symbol}
              onClick={() => {
                setSearchTerm(s.symbol);
                performSearch(s.symbol);
              }}
              className="px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 cursor-pointer flex justify-between"
            >
              <span>{s.symbol}</span>
              <span className="text-gray-400 ml-4 truncate w-56 text-right">{s.name}</span>
            </div>
          ))}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white disabled:opacity-50"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </button>
    </div>
  );

  const QUICK_PICKS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'TSLA'];
  const QuickPickBar = (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      {QUICK_PICKS.map((sym) => (
        <button
          key={sym}
          onClick={() => performSearch(sym)}
          className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded-full border border-gray-600 font-medium"
        >
          {sym}
        </button>
      ))}
    </div>
  );


  if (showResults && currentCompany) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* header */}
        <div className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <button onClick={handleNewSearch} className="text-lg font-light tracking-tight hover:text-gray-400">EQUITY <span className="text-gray-400">INSIGHTS</span></button>
            <form onSubmit={handleSubmit} className="flex-1 max-w-md">{SearchInput}</form>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* header block */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex gap-4">
                {currentCompany.logo && (
                  <img
                    src={currentCompany.logo}
                    alt={`${currentCompany.name} logo`}
                    className="w-16 h-16 bg-white p-2 rounded-lg"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                )}
                <div>
                  <h1 className="text-3xl font-light mb-2">
                    {!currentCompany.logo &&
                      getCompanyEmoji(currentCompany.ticker)}{' '}
                    {currentCompany.name} ({currentCompany.ticker})
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
                <div
                  className={`text-sm font-light ${
                    currentCompany.change >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {currentCompany.change >= 0 ? '+' : ''}
                  ${currentCompany.change}{' '}
                  {currentCompany.change >= 0 ? '↗' : '↘'}{' '}
                  {currentCompany.changePercent >= 0 ? '+' : ''}
                  {currentCompany.changePercent}%
                </div>
              </div>
            </div>

            {/* key metrics */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <Metric label="Market Cap" value={currentCompany.marketCap} />
                <Metric label="P/E Ratio" value={currentCompany.peRatio} />
                <Metric
                  label="Revenue Growth (YoY)"
                  value={currentCompany.revenueGrowth}
                  highlight={currentCompany.revenueGrowth}
                />
                <Metric label="EPS" value={currentCompany.eps} />
                <Metric
                  label="52W Range"
                  value={format52WeekRange(
                    currentCompany.fiftyTwoWeekLow,
                    currentCompany.fiftyTwoWeekHigh
                  )}
                />
                <Metric
                  label="Dividend Yield"
                  value={currentCompany.dividendYield}
                />
              </div>
            </div>
          </div>

          {/* AI analysis */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-light">🤖 AI Investment Analysis</h2>
                {analysisLoading && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                    Analyzing…
                  </div>
                )}
              </div>

              {/* when analysis available */}
              {analysis ? (
                <>
                  {/* summary banner */}
                  <div
                    className={`rounded-lg p-4 mb-6 border ${
                      analysis.recommendation === 'BUY'
                        ? 'bg-green-900/30 border-green-600'
                        : analysis.recommendation === 'SELL'
                        ? 'bg-red-900/30 border-red-600'
                        : 'bg-yellow-900/30 border-yellow-600'
                    }`}
                  >
                    <p className="text-lg font-light leading-relaxed mb-2">
                      {analysis.summary}
                    </p>
                    <span
                      className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                        analysis.recommendation === 'BUY'
                          ? 'bg-green-700 text-green-200'
                          : analysis.recommendation === 'SELL'
                          ? 'bg-red-700 text-red-200'
                          : 'bg-yellow-700 text-yellow-200'
                      }`}
                    >
                      {analysis.recommendation}
                    </span>
                  </div>

                  {/* 3-column grid */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Competitive landscape */}
                    <Card title="🏁 Competitive Landscape">
                      <ul className="space-y-2">
                        {analysis.competitiveLandscape.map((c) => (
                          <li
                            key={c.ticker}
                            className="text-gray-300 text-sm leading-relaxed"
                          >
                            <span className="font-medium">{c.ticker}</span> —{' '}
                            {c.blurb}
                          </li>
                        ))}
                      </ul>
                    </Card>

                    {/* Catalysts */}
                    <Card title="⚡ Catalysts">
                      <ul className="space-y-2">
                        {analysis.catalysts.map((cat, i) => (
                          <li
                            key={i}
                            className="text-gray-300 text-sm leading-relaxed"
                          >
                            • {cat}
                          </li>
                        ))}
                      </ul>
                    </Card>

                    {/* Risks */}
                    <Card title="⚠️ Risks">
                      <ul className="space-y-2">
                        {analysis.risks.map((r, i) => (
                          <li
                            key={i}
                            className={`text-sm leading-relaxed ${
                              r.severity === 'high'
                                ? 'text-red-400'
                                : r.severity === 'medium'
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          >
                            • {r.risk}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>
                </>
              ) : !analysisLoading ? (
                <p className="text-gray-400 font-light text-center py-8">
                  AI analysis will appear here after searching for a company…
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
        <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-5"><span className="text-white">EQUITY </span><span className="text-gray-400">INSIGHTS</span></h1>
        <p className="text-lg text-gray-500 mb-5 font-light">Financial analysis for S&P 500 companies</p>
        <form onSubmit={handleSubmit} className="w-full">{SearchInput}</form>
        {QuickPickBar}
        <p className="text-sm text-gray-600 mt-6 font-light">Click a suggestion, a quick pick, or press Enter to search</p>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: string;
}) {
  const color =
    highlight && highlight.startsWith('+')
      ? 'text-green-400'
      : highlight && highlight.startsWith('-')
      ? 'text-red-400'
      : '';
  return (
    <div>
      <div className="text-gray-400 text-sm font-light mb-1">{label}</div>
      <div className={`text-xl font-light ${color}`}>{value}</div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-light mb-3">{title}</h3>
      {children}
    </div>
  );
}
