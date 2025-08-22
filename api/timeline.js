export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const SUPABASE_URL = 'https://iqcmwpcpgduhwzwgfmwb.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxY213cGNwZ2R1aHd6d2dmbXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDU4NjQsImV4cCI6MjA3MTQyMTg2NH0.Xt9GWJItCDoFepy08d8IEmAlH3LyMH_wgXIXUn7M5Ts';
  
  try {
    // 모든 예측 데이터를 날짜와 함께 가져오기
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/predictions?select=year_predicted,created_at`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    
    const allPredictions = await response.json();
    
    if (!allPredictions || allPredictions.length === 0) {
      return res.status(200).json({ timeline: [] });
    }
    
    // 연도별로 그룹화
    const yearlyData = {};
    
    allPredictions.forEach(prediction => {
      const year = new Date(prediction.created_at).getFullYear();
      if (!yearlyData[year]) {
        yearlyData[year] = [];
      }
      yearlyData[year].push(prediction.year_predicted);
    });
    
    // 각 연도별 통계 계산
    const timeline = Object.keys(yearlyData).map(year => {
      const predictions = yearlyData[year];
      const average = predictions.reduce((a, b) => a + b, 0) / predictions.length;
      
      return {
        year: parseInt(year),
        count: predictions.length,
        averagePrediction: average.toFixed(1),
        minPrediction: Math.min(...predictions),
        maxPrediction: Math.max(...predictions)
      };
    }).sort((a, b) => a.year - b.year);
    
    return res.status(200).json({ timeline });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}