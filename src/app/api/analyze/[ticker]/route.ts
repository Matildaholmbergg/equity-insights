// /api/analyze/[ticker]/route.ts
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/** ----- types still used by the UI ----- */
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
export type AnalysisResponse = z.infer<typeof AnalysisSchema>;

/** ----- 1 · define structured‑output schema ----- */
const AnalysisSchema = z.object({
  strengths: z.array(z.string()),
  risks: z.array(z.string()),
  outlook: z.string(),
  recommendation: z.enum(['BUY', 'HOLD', 'SELL']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const company: CompanyData = await req.json();
    const { ticker } = params;
    console.log(`Analyzing ${ticker} with OpenAI…`);

    /** ----- 2 · compose prompt (unchanged) ----- */
    const prompt = `
You are a professional financial analyst. Analyze the following company as an investment opportunity.

Company: ${company.name} (${company.ticker})
Current Price: $${company.price}
Recent Change: ${company.change >= 0 ? '+' : ''}$${company.change} (${company.changePercent >= 0 ? '+' : ''}${company.changePercent}%)
Market Cap: ${company.marketCap}
P/E Ratio: ${company.peRatio}
EPS: ${company.eps}
Revenue Growth (YoY): ${company.revenueGrowth}
Dividend Yield: ${company.dividendYield}

Return **only** JSON that matches the "analysis" schema we provided.
`;

    /** ----- 3 · call GPT‑4o with schema enforcement ----- */
    const completion = await openai.chat.completions.parse({
      model: 'gpt-4.1',        // first model snapshot that supports schema
      messages: [
        {
          role: 'system',
          content:
            'You are a professional financial analyst. Respond with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: zodResponseFormat(AnalysisSchema, 'analysis'),
      temperature: 0.7,
      max_tokens: 500,
    });

    const msg = completion.choices[0].message;

    // Handle edge cases (optional but recommended)
    if ('refusal' in msg && msg.refusal) {
      throw new Error('OpenAI refused to comply.');
    }
    if (!('parsed' in msg)) {
      throw new Error('No parsed content from OpenAI.');
    }

    const analysis: AnalysisResponse = msg.parsed!;
    console.log(`Analysis complete for ${ticker}`);
    return Response.json(analysis);
  } catch (err) {
    console.error('analyze API error:', err);
    return Response.json(
      {
        error: 'Failed to generate analysis',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
