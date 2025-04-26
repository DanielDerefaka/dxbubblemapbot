const { logger } = require('../utils/logger');

function calculateRiskMetrics(tokenData, marketData) {
  const riskMetrics = {
    concentrationRisk: null,
    liquidityRisk: null,
    volatilityRisk: null,
    overallRisk: null,
    riskFactors: [],
    safetyFactors: []
  };
  
  try {
    if (tokenData && tokenData.stats) {
      const concentrationScore = calculateConcentrationRisk(tokenData.stats);
      riskMetrics.concentrationRisk = concentrationScore;
      
      if (tokenData.stats.top10Percentage > 70) {
        riskMetrics.riskFactors.push('Top 10 holders control over 70% of supply');
      }
      
      if (tokenData.stats.cexPercentage > 50) {
        riskMetrics.riskFactors.push('Over 50% of supply held on centralized exchanges');
      }
      
      if (tokenData.stats.top10Percentage < 30) {
        riskMetrics.safetyFactors.push('Well-distributed token supply');
      }
    }
    
    if (marketData) {
      const liquidityScore = calculateLiquidityRisk(marketData);
      riskMetrics.liquidityRisk = liquidityScore;
      
      if (marketData.volume24h && marketData.marketCap && 
          (marketData.volume24h / marketData.marketCap) < 0.03) {
        riskMetrics.riskFactors.push('Low trading volume relative to market cap');
      }
      
      if (marketData.technicalIndicators && marketData.technicalIndicators.volatility) {
        riskMetrics.volatilityRisk = marketData.technicalIndicators.volatility;
        
        if (marketData.technicalIndicators.volatility === 'High') {
          riskMetrics.riskFactors.push('High price volatility');
        }
      }
      
      if (marketData.marketCapRank && marketData.marketCapRank < 100) {
        riskMetrics.safetyFactors.push('Top 100 cryptocurrency by market cap');
      }
      
      if (marketData.exchanges && marketData.exchanges.length > 3) {
        riskMetrics.safetyFactors.push('Listed on multiple major exchanges');
      }
    }
    
    riskMetrics.overallRisk = calculateOverallRisk(
      riskMetrics.concentrationRisk,
      riskMetrics.liquidityRisk,
      riskMetrics.volatilityRisk
    );
    
  } catch (error) {
    logger.error(`Error calculating risk metrics: ${error.message}`);
  }
  
  return riskMetrics;
}

function calculateConcentrationRisk(stats) {
  const top10Percentage = stats.top10Percentage || 0;
  const decentralizationScore = stats.decentralizationScore || 0;
  
  const riskScore = (top10Percentage * 0.7) + ((100 - decentralizationScore) * 0.3);
  
  if (riskScore < 30) return 'Low';
  if (riskScore < 50) return 'Medium';
  if (riskScore < 75) return 'High';
  return 'Very High';
}

function calculateLiquidityRisk(marketData) {
  if (!marketData || !marketData.marketCap || !marketData.volume24h) {
    return 'High';
  }
  
  const volumeToMarketCapRatio = marketData.volume24h / marketData.marketCap;
  
  if (volumeToMarketCapRatio > 0.15) return 'Low';
  if (volumeToMarketCapRatio > 0.05) return 'Medium';
  if (volumeToMarketCapRatio > 0.01) return 'High';
  return 'Very High';
}

function calculateOverallRisk(concentrationRisk, liquidityRisk, volatilityRisk) {
  const riskScores = {
    'Low': 1,
    'Medium': 2,
    'High': 3,
    'Very High': 4
  };
  
  const concentrationScore = riskScores[concentrationRisk] || 2;
  const liquidityScore = riskScores[liquidityRisk] || 2;
  const volatilityScore = riskScores[volatilityRisk] || 2;
  
  const weightedScore = (
    (concentrationScore * 0.5) + 
    (liquidityScore * 0.3) + 
    (volatilityScore * 0.2)
  );
  
  if (weightedScore < 1.5) return 'Low';
  if (weightedScore < 2.5) return 'Medium';
  if (weightedScore < 3.5) return 'High';
  return 'Very High';
}

function getInvestmentInsights(tokenData, marketData, riskMetrics) {
  const insights = {
    summary: '',
    keyPoints: [],
    technicalOutlook: '',
    riskAssessment: ''
  };
  
  try {
    if (tokenData && marketData) {
      insights.summary = generateTokenSummary(tokenData, marketData, riskMetrics);
      
      insights.keyPoints = generateKeyPoints(tokenData, marketData, riskMetrics);
      
      insights.technicalOutlook = generateTechnicalOutlook(marketData);
      
      insights.riskAssessment = generateRiskAssessment(riskMetrics);
    }
  } catch (error) {
    logger.error(`Error generating investment insights: ${error.message}`);
    insights.summary = 'Could not generate investment insights due to insufficient data.';
  }
  
  return insights;
}

function generateTokenSummary(tokenData, marketData, riskMetrics) {
  let summary = `${tokenData.name} (${tokenData.symbol}) is `;
  
  if (marketData && marketData.marketCap) {
    if (marketData.marketCap > 10000000000) {
      summary += 'a large-cap token ';
    } else if (marketData.marketCap > 1000000000) {
      summary += 'a mid-cap token ';
    } else if (marketData.marketCap > 100000000) {
      summary += 'a small-cap token ';
    } else {
      summary += 'a micro-cap token ';
    }
    
    if (marketData.marketCapRank) {
      summary += `ranked #${marketData.marketCapRank} by market cap. `;
    } else {
      summary += 'by market capitalization. ';
    }
  }
  
  if (tokenData.stats && tokenData.stats.decentralizationScore !== undefined) {
    const score = tokenData.stats.decentralizationScore;
    if (score > 70) {
      summary += 'The token has a high decentralization score, indicating well-distributed ownership. ';
    } else if (score > 40) {
      summary += 'The token has a moderate decentralization score. ';
    } else {
      summary += 'The token has a low decentralization score, suggesting concentrated ownership. ';
    }
  }
  
  if (riskMetrics && riskMetrics.overallRisk) {
    summary += `Overall investment risk is assessed as ${riskMetrics.overallRisk.toLowerCase()}, `;
    
    if (riskMetrics.overallRisk === 'Low' || riskMetrics.overallRisk === 'Medium') {
      summary += 'which may be suitable for investors with appropriate risk tolerance. ';
    } else {
      summary += 'suggesting caution for potential investors. ';
    }
  }
  
  return summary;
}

function generateKeyPoints(tokenData, marketData, riskMetrics) {
  const points = [];
  
  if (marketData) {
    if (marketData.price && marketData.priceChangePercentage24h) {
      const direction = marketData.priceChangePercentage24h >= 0 ? 'up' : 'down';
      points.push(`Price is ${direction} ${Math.abs(marketData.priceChangePercentage24h).toFixed(2)}% in the last 24 hours`);
    }
    
    if (marketData.allTimeHigh && marketData.allTimeHighChangePercentage) {
      const percentFromATH = Math.abs(marketData.allTimeHighChangePercentage).toFixed(2);
      points.push(`Currently ${percentFromATH}% from all-time high of $${marketData.allTimeHigh.toFixed(2)}`);
    }
    
    if (marketData.liquidityScore) {
      points.push(`Liquidity is rated as ${marketData.liquidityScore > 70 ? 'high' : marketData.liquidityScore > 40 ? 'medium' : 'low'}`);
    }
  }
  
  if (tokenData && tokenData.stats) {
    if (tokenData.stats.top10Percentage) {
      points.push(`Top 10 holders control ${tokenData.stats.top10Percentage.toFixed(2)}% of token supply`);
    }
    
    if (tokenData.stats.cexPercentage !== undefined && tokenData.stats.contractsPercentage !== undefined) {
      points.push(`${tokenData.stats.cexPercentage.toFixed(2)}% on exchanges, ${tokenData.stats.contractsPercentage.toFixed(2)}% in contracts`);
    }
  }
  
  if (riskMetrics && riskMetrics.riskFactors && riskMetrics.riskFactors.length > 0) {
    riskMetrics.riskFactors.forEach(factor => {
      points.push(`Risk factor: ${factor}`);
    });
  }
  
  if (riskMetrics && riskMetrics.safetyFactors && riskMetrics.safetyFactors.length > 0) {
    riskMetrics.safetyFactors.forEach(factor => {
      points.push(`Positive factor: ${factor}`);
    });
  }
  
  return points;
}

function generateTechnicalOutlook(marketData) {
  if (!marketData || !marketData.technicalIndicators) {
    return 'Insufficient data for technical analysis.';
  }
  
  const { volatility, trendStrength } = marketData.technicalIndicators;
  
  let outlook = 'Technical analysis shows ';
  
  if (volatility) {
    outlook += `${volatility.toLowerCase()} volatility `;
  }
  
  if (trendStrength) {
    outlook += `with a ${trendStrength.toLowerCase()} trend. `;
  } else {
    outlook += '. ';
  }
  
  if (marketData.priceChangePercentage24h && marketData.priceChangePercentage7d) {
    const shortTerm = marketData.priceChangePercentage24h >= 0 ? 'positive' : 'negative';
    const longTerm = marketData.priceChangePercentage7d >= 0 ? 'positive' : 'negative';
    
    if (shortTerm === longTerm) {
      outlook += `Both short and long-term momentum are ${shortTerm}. `;
    } else {
      outlook += `Short-term momentum is ${shortTerm} while long-term momentum is ${longTerm}, indicating potential trend reversal. `;
    }
  }
  
  return outlook;
}

function generateRiskAssessment(riskMetrics) {
  if (!riskMetrics || !riskMetrics.overallRisk) {
    return 'Risk assessment unavailable due to insufficient data.';
  }
  
  let assessment = `Overall risk is rated as ${riskMetrics.overallRisk.toUpperCase()}. `;
  
  if (riskMetrics.concentrationRisk) {
    assessment += `Concentration risk: ${riskMetrics.concentrationRisk}. `;
  }
  
  if (riskMetrics.liquidityRisk) {
    assessment += `Liquidity risk: ${riskMetrics.liquidityRisk}. `;
  }
  
  if (riskMetrics.volatilityRisk) {
    assessment += `Volatility risk: ${riskMetrics.volatilityRisk}. `;
  }
  
  if (riskMetrics.riskFactors && riskMetrics.riskFactors.length > 0) {
    assessment += `Key risk factors include: ${riskMetrics.riskFactors.join('; ')}. `;
  }
  
  return assessment;
}

module.exports = {
  calculateRiskMetrics,
  getInvestmentInsights
};