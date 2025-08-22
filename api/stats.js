export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const SUPABASE_URL = 'https://iqcmwpcpgduhwzwgfmwb.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxY213cGNwZ2R1aHd6d2dmbXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDU4NjQsImV4cCI6MjA3MTQyMTg2NH0.Xt9GWJItCDoFepy08d8IEmAlH3LyMH_wgXIXUn7M5Ts';
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/predictions?select=year_predicted`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    
    const allPredictions = await response.json();
    
    if (!allPredictions || allPredictions.length === 0) {
      return res.status(200).json({
        stats: {
          total: 0,
          mean: null,
          median: null,
          mode: null,
          distribution: {}
        }
      });
    }
    
    const predictions = allPredictions.map(p => p.year_predicted);
    
    // 통계 계산
    const total = predictions.length;
    const mean = predictions.reduce((a, b) => a + b, 0) / total;
    const sorted = [...predictions].sort((a, b) => a - b);
    const median = sorted[Math.floor(total / 2)];
    
    // 최빈값과 분포
    const frequency = {};
    predictions.forEach(y => {
      frequency[y] = (frequency[y] || 0) + 1;
    });
    const mode = Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );
    
    return res.status(200).json({
      stats: {
        total,
        mean: mean.toFixed(1),
        median: parseInt(median),
        mode: parseInt(mode),
        distribution: frequency
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}