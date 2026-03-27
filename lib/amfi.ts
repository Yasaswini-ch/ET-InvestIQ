export async function fetchAMFINAV() {
  try {
    const response = await fetch('https://www.amfiindia.com/spages/NAVAll.txt');
    const data = await response.text();
    return parseNAVData(data);
  } catch (error) {
    console.error('AMFI fetch error:', error);
    return [];
  }
}

function parseNAVData(data: string) {
  const lines = data.split('\n');
  const funds: Array<{
    schemeCode: string;
    schemeName: string;
    nav: number;
    date: string;
  }> = [];

  for (const line of lines) {
    const parts = line.split(';');
    if (parts.length >= 5) {
      const nav = parseFloat(parts[4]);
      if (!isNaN(nav)) {
        funds.push({
          schemeCode: parts[0].trim(),
          schemeName: parts[3].trim(),
          nav,
          date: parts[5]?.trim() || '',
        });
      }
    }
  }

  return funds;
}

export function findFundByName(funds: Array<{schemeName: string}>, searchName: string) {
  const normalizedSearch = searchName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return funds.find(f => 
    f.schemeName.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalizedSearch)
  );
}
