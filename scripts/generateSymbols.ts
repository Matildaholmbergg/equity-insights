import { createReadStream, writeFileSync } from 'fs';
import csv from 'csv-parser';

const companies: Array<{ symbol: string; name: string; sector: string }> = [];

createReadStream('sp500_companies.csv')
  .pipe(csv())
  .on('data', (row) => companies.push({ symbol: row.Symbol, name: row.Shortname, sector: row.Sector }))
  .on('end', () => {
    companies.sort((a, b) => a.symbol.localeCompare(b.symbol));
    
    const tsContent = `export const POPULAR_SYMBOLS: { symbol: string; name: string; sector?: string }[] = [
${companies.map(c => `    { symbol: "${c.symbol}", name: "${c.name}", sector: "${c.sector}" }`).join(',\n')}
];
`;
    
    writeFileSync('src/app/symbolList.ts', tsContent);
    console.log(`✅ Generated ${companies.length} companies`);
  }); 