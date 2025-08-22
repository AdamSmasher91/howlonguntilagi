export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const SUPABASE_URL = 'https://iqcmwpcpgduhwzwgfmwb.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxY213cGNwZ2R1aHd6d2dmbXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDU4NjQsImV4cCI6MjA3MTQyMTg2NH0.Xt9GWJItCDoFepy08d8IEmAlH3LyMH_wgXIXUn7M5Ts';
  
  try {
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
      return res.status(200).json({ timeline: [], totalVoters: 0 });
    }
    
    // 연도별로 그룹화
    const yearlyData = {};
    let totalVoters = 0;
    
    allPredictions.forEach(prediction => {
      const year = new Date(prediction.created_at).getFullYear();
      if (!yearlyData[year]) {
        yearlyData[year] = {
          predictions: [],
          cumulativeCount: 0
        };
      }
      yearlyData[year].predictions.push(prediction.year_predicted);
      totalVoters++;
    });
    
    // 누적 투표자 수 계산
    let cumulativeCount = 0;
    const timeline = Object.keys(yearlyData)
      .sort((a, b) => a - b)
      .map(year => {
        const predictions = yearlyData[year].predictions;
        const average = predictions.reduce((a, b) => a + b, 0) / predictions.length;
        cumulativeCount += predictions.length;
        
        // 예측 분포 계산
        const distribution = {};
        predictions.forEach(p => {
          distribution[p] = (distribution[p] || 0) + 1;
        });
        
        return {
          year: parseInt(year),
          count: predictions.length,
          cumulativeCount: cumulativeCount,
          averagePrediction: average.toFixed(1),
          minPrediction: Math.min(...predictions),
          maxPrediction: Math.max(...predictions),
          mostCommon: Object.keys(distribution).reduce((a, b) => 
            distribution[a] > distribution[b] ? a : b
          )
        };
      });
    
    return res.status(200).json({ 
      timeline,
      totalVoters,
      summary: {
        totalYears: timeline.length,
        overallAverage: (allPredictions.reduce((a, b) => a + b.year_predicted, 0) / allPredictions.length).toFixed(1)
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
