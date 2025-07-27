import OpenAI from 'openai';
import { NextRequest } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CompanyData {
  name: string;
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  peRatio: string;
  revenueGrowth: string;
  eps: string;
  dividendYield: string;
}

interface AnalysisResponse {
  strengths: string[];
  risks: string[];
  outlook: string;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
}

export async function POST(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const companyData: CompanyData = await request.json();
    const { ticker } = params;

    console.log(`Analyzing ${ticker} with OpenAI...`);

    // Create a structured prompt for investment analysis
    const prompt = `
You are a professional financial analyst. Analyze the following company as an investment opportunity.

Company: ${companyData.name} (${companyData.ticker})
Current Price: $${companyData.price}
Recent Change: ${companyData.change >= 0 ? '+' : ''}$${companyData.change} (${companyData.changePercent >= 0 ? '+' : ''}${companyData.changePercent}%)
Market Cap: ${companyData.marketCap}
P/E Ratio: ${companyData.peRatio}
EPS: ${companyData.eps}
Revenue Growth (YoY): ${companyData.revenueGrowth}
Dividend Yield: ${companyData.dividendYield}

Please provide a structured investment analysis with the following format:

{
  "strengths": ["List 2-3 key investment strengths"],
  "risks": ["List 2-3 key investment risks"],
  "outlook": "A concise 2-3 sentence outlook on the company's future prospects",
  "recommendation": "BUY, HOLD, or SELL"
}

Base your analysis on the financial metrics provided and general knowledge about the company and industry. Be concise but insightful.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional financial analyst providing investment advice. Always respond with valid JSON in the exact format requested."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const analysisText = completion.choices[0]?.message?.content;
    
    if (!analysisText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let analysis: AnalysisResponse;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', analysisText);
      throw new Error('Invalid response format from OpenAI');
    }

    console.log(`Analysis complete for ${ticker}`);

    return Response.json(analysis);

  } catch (error) {
    console.error('Error in analyze API:', error);
    
    return Response.json(
      { 
        error: 'Failed to generate analysis',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 