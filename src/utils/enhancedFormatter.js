const { formatNumber, formatLargeNumber, formatPrice, formatPercentage } = require('./formatter');

function formatEnhancedTokenData(tokenData, marketData = null, riskMetrics = null, activityData = null) {
  let message = `🔍 *Token Analysis: ${tokenData.name} (${tokenData.symbol})* 🔍\n\n`;
  
  message += `${getChainEmoji(tokenData.chain)} *Chain:* ${getChainName(tokenData.chain)}\n`;
  message += `📝 *Contract:* \`${tokenData.address}\`\n\n`;
  
  if (marketData) {
    message += formatEnhancedMarketSection(marketData, tokenData.symbol);
  }
  
  message += `🏆 *Decentralization Score:* ${formatDecentralizationScore(tokenData.stats.decentralizationScore)}\n\n`;
  message += formatSupplyDistributionSection(tokenData);
  
  if (riskMetrics && riskMetrics.overallRisk) {
    message += formatRiskSection(riskMetrics);
  }
  
  if (activityData && activityData.recentMovements && activityData.recentMovements.length > 0) {
    message += formatActivitySection(activityData);
  }
  
  if (tokenData.updatedAt) {
    const date = new Date(tokenData.updatedAt);
    message += `\n_Last updated: ${date.toISOString().split('T')[0]}_\n`;
  }
  
  message += `_Powered by BubbleMaps_`;
  
  return message;
}

function formatEnhancedMarketSection(marketData, symbol) {
  let section = `💰 *Market Data:*\n`;
  
  if (marketData.price !== null) {
    section += `• Price: $${formatPrice(marketData.price)}`;
    
    if (marketData.priceChangePercentage24h !== null) {
      const changePrefix = marketData.priceChangePercentage24h >= 0 ? '📈' : '📉';
      section += ` ${changePrefix} ${formatPercentage(marketData.priceChangePercentage24h)}\n`;
    } else {
      section += '\n';
    }
  }
  
  if (marketData.marketCap !== null) {
    section += `• Market Cap: $${formatLargeNumber(marketData.marketCap)}`;
    
    if (marketData.marketCapRank) {
      section += ` (Rank #${marketData.marketCapRank})`;
    }
    
    section += '\n';
  }
  
  if (marketData.volume24h !== null) {
    section += `• 24h Volume: $${formatLargeNumber(marketData.volume24h)}`;
    
    if (marketData.volumeChangePercentage24h) {
      const volChangePrefix = marketData.volumeChangePercentage24h >= 0 ? '📈' : '📉';
      section += ` ${volChangePrefix} ${formatPercentage(marketData.volumeChangePercentage24h)}\n`;
    } else {
      section += '\n';
    }
  }
  
  if (marketData.allTimeHigh) {
    section += `• ATH: $${formatPrice(marketData.allTimeHigh)}`;
    
    if (marketData.allTimeHighChangePercentage) {
      section += ` (${formatPercentage(marketData.allTimeHighChangePercentage)} from current)`;
    }
    
    if (marketData.allTimeHighDate) {
      const athDate = new Date(marketData.allTimeHighDate);
      section += ` on ${athDate.toISOString().split('T')[0]}`;
    }
    
    section += '\n';
  }
  
  if (marketData.circulatingSupply || marketData.totalSupply) {
    let supplyInfo = '• Supply: ';
    
    if (marketData.circulatingSupply) {
      supplyInfo += `${formatLargeNumber(marketData.circulatingSupply)} ${symbol} circulating`;
      
      if (marketData.totalSupply) {
        supplyInfo += ` / ${formatLargeNumber(marketData.totalSupply)} total`;
      }
    } else if (marketData.totalSupply) {
      supplyInfo += `${formatLargeNumber(marketData.totalSupply)} ${symbol} total`;
    }
    
    section += `${supplyInfo}\n`;
  }
  
  if (marketData.technicalIndicators) {
    const { volatility, trendStrength } = marketData.technicalIndicators;
    
    if (volatility) {
      section += `• Volatility: ${volatility}`;
      
      if (trendStrength) {
        section += ` / Trend: ${trendStrength}`;
      }
      
      section += '\n';
    }
  }
  
  return section + '\n';
}

function formatSupplyDistributionSection(tokenData) {
  let section = `📊 *Supply Distribution:*\n`;
  
  if (tokenData.stats) {
    if (tokenData.stats.cexPercentage !== undefined) {
      section += `• CEX: ${formatPercentage(tokenData.stats.cexPercentage)}\n`;
    }
    
    if (tokenData.stats.contractsPercentage !== undefined) {
      section += `• Contracts: ${formatPercentage(tokenData.stats.contractsPercentage)}\n`;
    }
    
    if (tokenData.stats.top10Percentage !== undefined) {
      section += `• Top 10 Holders: ${formatPercentage(tokenData.stats.top10Percentage)}\n`;
    }
    
    if (tokenData.stats.holdersCount !== undefined) {
      section += `• Total Holders: ${formatNumber(tokenData.stats.holdersCount)}\n`;
    }
  }
  
  return section + '\n';
}

function formatRiskSection(riskMetrics) {
  let section = `⚠️ *Risk Assessment:*\n`;
  
  section += `• Overall Risk: ${getRiskEmoji(riskMetrics.overallRisk)} ${riskMetrics.overallRisk}\n`;
  
  if (riskMetrics.concentrationRisk) {
    section += `• Concentration Risk: ${getRiskEmoji(riskMetrics.concentrationRisk)} ${riskMetrics.concentrationRisk}\n`;
  }
  
  if (riskMetrics.liquidityRisk) {
    section += `• Liquidity Risk: ${getRiskEmoji(riskMetrics.liquidityRisk)} ${riskMetrics.liquidityRisk}\n`;
  }
  
  if (riskMetrics.riskFactors && riskMetrics.riskFactors.length > 0) {
    section += `• Key Risk Factors: ${riskMetrics.riskFactors.slice(0, 2).join('; ')}\n`;
  }
  
  return section + '\n';
}

function formatActivitySection(activityData) {
  let section = `🔄 *Recent Activity:*\n`;
  
  if (activityData.alert) {
    section += `• Alert: ${activityData.alert}\n`;
  }
  
  if (activityData.netFlow24h !== undefined && activityData.netFlow24h !== 0) {
    const flowDirection = activityData.netFlow24h > 0 ? 'inflow' : 'outflow';
    section += `• 24h Net Flow: ${Math.abs(activityData.netFlow24h).toFixed(2)} ${flowDirection}\n`;
  }
  
  if (activityData.recentMovements && activityData.recentMovements.length > 0) {
    activityData.recentMovements.slice(0, 2).forEach((tx, idx) => {
      const date = new Date(tx.time);
      const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      section += `• Transaction ${idx + 1}: ${tx.type} ${tx.amount.toFixed(2)} ${tx.symbol} at ${formattedTime}\n`;
    });
  }
  
  return section + '\n';
}

function getRiskEmoji(riskLevel) {
  switch(riskLevel.toLowerCase()) {
    case 'low':
      return '🟢';
    case 'medium':
      return '🟡';
    case 'high':
      return '🟠';
    case 'very high':
      return '🔴';
    default:
      return '⚪';
  }
}

function formatDecentralizationScore(score) {
  if (score === undefined || score === null) {
    return 'N/A';
  }
  
  const scoreVal = typeof score === 'string' ? parseFloat(score) : score;
  
  const fullBlocks = Math.floor(scoreVal / 10);
  const emptyBlocks = 10 - fullBlocks;
  
  let visual = '';
  for (let i = 0; i < fullBlocks; i++) {
    visual += '🟩';
  }
  for (let i = 0; i < emptyBlocks; i++) {
    visual += '⬜';
  }
  
  let scoreText;
  if (scoreVal < 30) {
    scoreText = '🔴 Low';
  } else if (scoreVal < 70) {
    scoreText = '🟡 Medium';
  } else {
    scoreText = '🟢 High';
  }
  
  return `${scoreVal.toFixed(2)}% ${visual} ${scoreText}`;
}

function getChainEmoji(chainId) {
  const chainEmojis = {
    'eth': '💠',
    'bsc': '🔶',
    'ftm': '👻',
    'avax': '❄️',
    'cro': '🔵',
    'arbi': '🔵',
    'poly': '💜',
    'base': '🔵',
    'sol': '💙',
    'sonic': '💨'
  };
  
  return chainEmojis[chainId] || '🔗';
}

function getChainName(chainId) {
  const chainNames = {
    'eth': 'Ethereum',
    'bsc': 'BNB Smart Chain',
    'ftm': 'Fantom',
    'avax': 'Avalanche',
    'cro': 'Cronos',
    'arbi': 'Arbitrum',
    'poly': 'Polygon',
    'base': 'Base',
    'sol': 'Solana',
    'sonic': 'Sonic'
  };
  
  return chainNames[chainId] || 'Unknown Chain';
}

module.exports = {
  formatEnhancedTokenData,
  formatEnhancedMarketSection,
  formatSupplyDistributionSection,
  formatRiskSection,
  formatActivitySection,
  formatDecentralizationScore,
  getChainEmoji,
  getChainName
};