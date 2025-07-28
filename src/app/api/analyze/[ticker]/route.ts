import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const AnalysisSchema = z
  .object({
    summary: z.string(),
    competitiveLandscape: z
      .array(
        z.object({
          ticker: z.string().max(6),
          blurb: z.string(),
        })
      )
      .min(1),
    catalysts: z.array(z.string()).min(1),
    risks: z
      .array(
        z.object({
          risk: z.string(),
          severity: z.enum(['low', 'medium', 'high']),
        })
      )
      .min(1),
    recommendation: z.enum(['BUY', 'HOLD', 'SELL']),
  })
  .strict();

type AnalysisResponse = z.infer<typeof AnalysisSchema>;

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

export async function POST(
  req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const company: CompanyData = await req.json();
    const { ticker } = params;
    console.log(`Analyzing ${ticker} with OpenAI…`);

    const prompt = `You are a professional financial analyst. Analyze the following company as an investment opportunity.

Company: ${company.name} (${company.ticker})
Current Price: $${company.price}
Recent Change: ${company.change >= 0 ? '+' : ''}$${company.change} (${company.changePercent >= 0 ? '+' : ''}${company.changePercent}%)
Market Cap: ${company.marketCap}
P/E Ratio: ${company.peRatio}
EPS: ${company.eps}
Revenue Growth (YoY): ${company.revenueGrowth}
Dividend Yield: ${company.dividendYield}

Return ONLY a JSON object that matches the \"equity_analysis\" schema.`;

    const completion = await openai.chat.completions.parse({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: 'You are a professional financial analyst. Respond with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: zodResponseFormat(AnalysisSchema, 'equity_analysis'),
      temperature: 0.7,
    });

    const msg = completion.choices[0].message;
    if ('refusal' in msg && msg.refusal) throw new Error('OpenAI refused');
    if (!('parsed' in msg)) throw new Error('No parsed content');

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
