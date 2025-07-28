# Equity Insights

A modern financial analysis platform providing real-time stock data and AI-powered investment analysis for S&P 500 companies.

## Features

- **S&P 500 Coverage**: Search and analyze all 500 companies in the S&P 500 index
- **Real-time Data**: Live stock prices, market cap, P/E ratios, and key financial metrics via Finnhub API
- **AI Analysis**: LLM-powered investment insights including competitive landscape, catalysts, and risk assessment
- **Smart Search**: Autocomplete search by ticker symbol or company name

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **APIs**: Finnhub (financial data), OpenAI (investment analysis)
- **Data**: S&P 500 company list

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with:
   ```bash
   NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Generate company symbols** (optional):
   ```bash
   npm run generate:symbols
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## API Keys

- **Finnhub**: Get free API key at [finnhub.io](https://finnhub.io)
- **OpenAI**: Get API key at [platform.openai.com](https://platform.openai.com)

## Data Management

The S&P 500 company list is generated from `sp500_companies.csv`. To update:

1. Replace the CSV file with updated S&P 500 data
2. Run `npm run generate:symbols` to regenerate `src/app/symbolList.ts`

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Fork this repository
2. Connect to Vercel
3. Add your environment variables
4. Deploy!
