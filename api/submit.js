export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { year, humanCheck } = req.body;
  
  // 기본 검증
  if (!humanCheck) {
    return res.status(400).json({ error: 'Please confirm you are human' });
  }
  
  if (!year || year < 2025 || year > 2100) {
    return res.status(400).json({ error: 'Invalid year' });
  }

  // Supabase에 저장
  const SUPABASE_URL = 'https://iqcmwpcpgduhwzwgfmwb.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxY213cGNwZ2R1aHd6d2dmbXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDU4NjQsImV4cCI6MjA3MTQyMTg2NH0.Xt9GWJItCDoFepy08d8IEmAlH3LyMH_wgXIXUn7M5Ts';
  
  const ip = req.headers['x-forwarded-for'] || 'unknown';
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/predictions`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        year_predicted: year,
        ip_address: ip
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save');
    }
    
    // 통계 가져오기
    const statsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/predictions?select=year_predicted`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    
    const allPredictions = await statsResponse.json();
    const predictions = allPredictions.map(p => p.year_predicted);
    
    // 통계 계산
    const total = predictions.length;
    const mean = predictions.reduce((a, b) => a + b, 0) / total;
    const sorted = [...predictions].sort((a, b) => a - b);
    const median = sorted[Math.floor(total / 2)];
    
    // 최빈값 계산
    const frequency = {};
    predictions.forEach(y => {
      frequency[y] = (frequency[y] || 0) + 1;
    });
    const mode = Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );
    
    return res.status(200).json({
      success: true,
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