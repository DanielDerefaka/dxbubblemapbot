const { getChainName, getChainEmoji } = require('../constants/chains');

function formatTokenData(tokenData, marketData = null) {
  let message = `🔍 *Token Analysis: ${tokenData.name} (${tokenData.symbol})* 🔍\n\n`;
  
  const chainName = getChainName(tokenData.chain);
  const chainEmoji = getChainEmoji(tokenData.chain);
  message += `${chainEmoji} *Chain:* ${chainName}\n`;
  message += `📝 *Contract:* \`${tokenData.address}\`\n\n`;
  
  message += `🏆 *Decentralization Score:* ${formatDecentralizationScore(tokenData.stats.decentralizationScore)}\n\n`;
  
  message += `📊 *Supply Distribution:*\n`;
  message += `• CEX: ${formatPercentage(tokenData.stats.cexPercentage)}\n`;
  message += `• Contracts: ${formatPercentage(tokenData.stats.contractsPercentage)}\n`;
  message += `• Top 10 Holders: ${formatPercentage(tokenData.stats.top10Percentage)}\n`;
  message += `• Total Holders: ${formatNumber(tokenData.stats.holdersCount)}\n\n`;
  
  if (marketData) {
    message += `💰 *Market Data:*\n`;
    
    if (marketData.price !== null) {
      message += `• Price: ${formatPrice(marketData.price)}`;
      
      if (marketData.priceChangePercentage24h !== null) {
        const changePrefix = marketData.priceChangePercentage24h >= 0 ? '📈' : '📉';
        message += ` ${changePrefix} ${formatPercentage(marketData.priceChangePercentage24h)}\n`;
      } else {
        message += '\n';
      }
    }
    
    if (marketData.marketCap !== null) {
      message += `• Market Cap: ${formatLargeNumber(marketData.marketCap)}\n`;
    } else if (marketData.totalSupply !== null && marketData.price !== null) {
      const calculatedMarketCap = marketData.totalSupply * marketData.price;
      message += `• Market Cap (est): ${formatLargeNumber(calculatedMarketCap)}\n`;
    }
    
    if (marketData.volume24h !== null) {
      message += `• 24h Volume: ${formatLargeNumber(marketData.volume24h)}\n`;
    }
    
    if (marketData.totalLiquidityUsd !== null) {
      message += `• Liquidity: ${formatLargeNumber(marketData.totalLiquidityUsd)}\n`;
    } else if (marketData.liquidityScore !== null) {
      message += `• Liquidity Score: ${marketData.liquidityScore.toFixed(2)}/10\n`;
    }
    
    if (marketData.high24h !== null && marketData.low24h !== null) {
      message += `• 24h Range: ${formatPrice(marketData.low24h)} - ${formatPrice(marketData.high24h)}`;
      if (marketData.calculatedMetrics) {
        message += ` (est)\n`;
      } else {
        message += `\n`;
      }
    }
    
    if (marketData.creationDate || marketData.creationBlock || marketData.approximateAge) {
      message += `• Token Age: `;
      if (marketData.creationDate) {
        const creationDate = new Date(marketData.creationDate);
        const now = new Date();
        const ageInDays = Math.floor((now - creationDate) / (1000 * 60 * 60 * 24));
        
        if (ageInDays < 1) {
          const ageInHours = Math.floor((now - creationDate) / (1000 * 60 * 60));
          message += `${ageInHours} hours\n`;
        } else {
          message += `${ageInDays} days\n`;
        }
      } else if (marketData.approximateAge) {
        message += `${marketData.approximateAge}\n`;
      } else {
        message += `New token\n`;
      }
    }
    
    message += '\n';
  }
  
  if (tokenData.updatedAt) {
    const date = new Date(tokenData.updatedAt);
    message += `_Last updated: ${date.toISOString().split('T')[0]}_\n`;
  }
  
  if (marketData && marketData.source) {
    let sourceDisplay = marketData.source;
    if (sourceDisplay === 'defi-llama') sourceDisplay = 'DeFi Llama';
    else if (sourceDisplay === 'coingecko') sourceDisplay = 'CoinGecko';
    else if (sourceDisplay === 'covalent') sourceDisplay = 'Covalent';
    else if (sourceDisplay === 'on-chain') sourceDisplay = 'On-chain data';
    else if (sourceDisplay.startsWith('dex-')) sourceDisplay = `DEX (${sourceDisplay.substring(4)})`;
    
    message += `_Market data: ${sourceDisplay}_\n`;
    
    if (marketData.calculatedMetrics) {
      message += `_Note: Some market metrics are estimated_\n`;
    }
  }
  
  message += `_Powered by BubbleMaps_`;
  
  return message;
}

function formatTopHolders(tokenData) {
  const { name, symbol, topHolders } = tokenData;
  
  let message = `👥 *Top Holders: ${name} (${symbol})* 👥\n\n`;
  
  if (!topHolders || topHolders.length === 0) {
    return message + 'No holder data available.';
  }
  
  topHolders.forEach((holder, index) => {
    const percentage = holder.percentage || holder.balance || 0;
    const address = holder.address || 'Unknown Address';
    const label = holder.label || (holder.isContract ? '📄 Contract' : '👤 Wallet');
    
    message += `${index + 1}. ${label}\n`;
   
     message += `   \`${address}\`\n`;
    message += `   Holds: ${formatPercentage(percentage)}\n`;
    
    if (holder.isCex) {
      message += `   🏦 Exchange\n`;
    } else if (holder.isContract) {
      message += `   📄 Contract\n`;
    }
    
    if (index < topHolders.length - 1) {
      message += `\n`;
    }
  });
  
  return message;
}

function formatMarketData(tokenData, marketData) {
  if (!marketData) {
    return `💰 *Market Data: ${tokenData.name} (${tokenData.symbol})* 💰\n\nNo market data available for this token.`;
  }
  
  let message = `💰 *Market Data: ${tokenData.name} (${tokenData.symbol})* 💰\n\n`;
  
  if (marketData.price !== null) {
    message += `*Current Price:* ${formatPrice(marketData.price)}`;
    
    if (marketData.priceChangePercentage24h !== null) {
      const changePrefix = marketData.priceChangePercentage24h >= 0 ? '📈' : '📉';
      message += ` ${changePrefix} ${formatPercentage(marketData.priceChangePercentage24h)} (24h)\n\n`;
    } else {
      message += '\n\n';
    }
  }
  
  message += `*Market Metrics:*\n`;
  
  if (marketData.marketCap !== null) {
    message += `• Market Cap: ${formatLargeNumber(marketData.marketCap)}\n`;
  } else if (marketData.totalSupply !== null && marketData.price !== null) {
    const calculatedMarketCap = marketData.totalSupply * marketData.price;
    message += `• Market Cap (est): ${formatLargeNumber(calculatedMarketCap)}\n`;
  }
  
  if (marketData.volume24h !== null) {
    message += `• 24h Trading Volume: ${formatLargeNumber(marketData.volume24h)}\n`;
  }
  
  if (marketData.totalLiquidityUsd !== null) {
    message += `• Total Liquidity: ${formatLargeNumber(marketData.totalLiquidityUsd)}\n`;
  }
  
  if (marketData.liquidityScore !== null) {
    message += `• Liquidity Score: ${marketData.liquidityScore.toFixed(2)}/10\n`;
  }
  
  if (marketData.circulatingSupply !== null || marketData.totalSupply !== null) {
    if (marketData.circulatingSupply !== null) {
      message += `• Circulating Supply: ${formatLargeNumber(marketData.circulatingSupply)} ${tokenData.symbol}\n`;
    }
    
    if (marketData.totalSupply !== null) {
      message += `• Total Supply: ${formatLargeNumber(marketData.totalSupply)} ${tokenData.symbol}\n`;
    }
    
    if (marketData.maxSupply !== null) {
      message += `• Max Supply: ${formatLargeNumber(marketData.maxSupply)} ${tokenData.symbol}\n`;
    }
  }
  
  if (marketData.volume24h !== null && marketData.marketCap !== null && marketData.marketCap > 0) {
    const volumeToMarketCap = (marketData.volume24h / marketData.marketCap * 100).toFixed(2);
    message += `• Volume/Market Cap: ${volumeToMarketCap}%\n`;
  }
  
  message += '\n';
  
  message += `*Historical Data:*\n`;
  
  if (marketData.high24h !== null && marketData.low24h !== null) {
    message += `• 24h High: ${formatPrice(marketData.high24h)}\n`;
    message += `• 24h Low: ${formatPrice(marketData.low24h)}\n`;
  }
  
  if (marketData.priceChangePercentage7d !== null) {
    const change7dPrefix = marketData.priceChangePercentage7d >= 0 ? '📈' : '📉';
    message += `• 7d Change: ${change7dPrefix} ${formatPercentage(marketData.priceChangePercentage7d)}\n`;
  }
  
  if (marketData.priceChangePercentage30d !== null) {
    const change30dPrefix = marketData.priceChangePercentage30d >= 0 ? '📈' : '📉';
    message += `• 30d Change: ${change30dPrefix} ${formatPercentage(marketData.priceChangePercentage30d)}\n`;
  }
  
  if (marketData.allTimeHigh !== null) {
    message += `• All-Time High: ${formatPrice(marketData.allTimeHigh)}`;
    
    if (marketData.allTimeHighDate !== null) {
      const athDate = new Date(marketData.allTimeHighDate);
      message += ` (${athDate.toISOString().split('T')[0]})`;
    }
    
    if (marketData.allTimeHighChangePercentage !== null) {
      message += ` | ${formatPercentage(marketData.allTimeHighChangePercentage)} from ATH\n`;
    } else {
      message += '\n';
    }
  }
  
  if (marketData.allTimeLow !== null) {
    message += `• All-Time Low: ${formatPrice(marketData.allTimeLow)}`;
    
    if (marketData.allTimeLowDate !== null) {
      const atlDate = new Date(marketData.allTimeLowDate);
      message += ` (${atlDate.toISOString().split('T')[0]})`;
    }
    
    if (marketData.allTimeLowChangePercentage !== null) {
      message += ` | ${formatPercentage(marketData.allTimeLowChangePercentage)} from ATL\n`;
    } else {
      message += '\n';
    }
  }
  
  if (marketData.exchanges && marketData.exchanges.length > 0) {
    message += `\n*Top Exchanges:*\n`;
    
    marketData.exchanges.slice(0, 3).forEach((exchange, index) => {
      message += `• ${exchange.name}: ${exchange.pair} @ ${formatPrice(exchange.price)}\n`;
    });
  }
  
  if (marketData.isNewToken || marketData.creationDate || marketData.creationBlock) {
    message += `\n*Token Age Information:*\n`;
    
    if (marketData.creationDate) {
      const creationDate = new Date(marketData.creationDate);
      message += `• Creation Date: ${creationDate.toISOString().split('T')[0]}\n`;
      
      const now = new Date();
      const ageInDays = Math.floor((now - creationDate) / (1000 * 60 * 60 * 24));
      
      if (ageInDays < 1) {
        const ageInHours = Math.floor((now - creationDate) / (1000 * 60 * 60));
        message += `• Age: ${ageInHours} hours\n`;
      } else {
        message += `• Age: ${ageInDays} days\n`;
      }
    } else if (marketData.creationBlock) {
      message += `• Creation Block: ${marketData.creationBlock}\n`;
      
      if (marketData.approximateAge) {
        message += `• Approximate Age: ${marketData.approximateAge}\n`;
      }
    }
  }
  
  message += '\n';
  if (marketData.source) {
    let sourceDisplay = marketData.source;
    if (sourceDisplay === 'defi-llama') sourceDisplay = 'DeFi Llama';
    else if (sourceDisplay === 'coingecko') sourceDisplay = 'CoinGecko';
    else if (sourceDisplay === 'covalent') sourceDisplay = 'Covalent';
    else if (sourceDisplay === 'on-chain') sourceDisplay = 'On-chain data';
    else if (sourceDisplay.startsWith('dex-')) sourceDisplay = `DEX (${sourceDisplay.substring(4)})`;
    
    message += `_Data Source: ${sourceDisplay}_\n`;
    
    if (marketData.calculatedMetrics) {
      message += `_Note: Some market metrics are estimated based on on-chain data_\n`;
    }
  }
  
  if (marketData.lastUpdated) {
    message += `_Last updated: ${new Date(marketData.lastUpdated).toISOString().split('T')[0]}_\n`;
  }
  
  message += `_Powered by BubbleMaps_`;
  
  return message;
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

function formatPercentage(value) {
  if (value === undefined || value === null) {
    return 'N/A';
  }
  
  const numVal = typeof value === 'string' ? parseFloat(value) : value;
  return `${numVal.toFixed(2)}%`;
}

function formatPrice(price) {
  if (price === undefined || price === null) {
    return 'N/A';
  }
  
  const numVal = typeof price === 'string' ? parseFloat(price) : price;
  
  if (numVal < 0.0001) {
    return `$${numVal.toExponential(6)}`;
  } else if (numVal < 0.01) {
    return `$${numVal.toFixed(6)}`;
  } else if (numVal < 1) {
    return `$${numVal.toFixed(4)}`;
  } else if (numVal < 1000) {
    return `$${numVal.toFixed(2)}`;
  } else {
    return `$${formatLargeNumber(numVal)}`;
  }
}

function formatLargeNumber(num) {
  if (num === undefined || num === null) {
    return 'N/A';
  }
  
  const numVal = typeof num === 'string' ? parseFloat(num) : num;
  
  if (numVal >= 1e12) {
    return `${(numVal / 1e12).toFixed(2)}T`;
  } else if (numVal >= 1e9) {
    return `${(numVal / 1e9).toFixed(2)}B`;
  } else if (numVal >= 1e6) {
    return `${(numVal / 1e6).toFixed(2)}M`;
  } else if (numVal >= 1e3) {
    return `${(numVal / 1e3).toFixed(2)}K`;
  } else {
    return numVal.toFixed(2);
  }
}

function formatNumber(num) {
  if (num === undefined || num === null) {
    return 'N/A';
  }
  
  const numVal = typeof num === 'string' ? parseFloat(num) : num;
  
  return numVal.toLocaleString();
}

function truncateAddress(address) {
  if (!address) return 'Unknown';
  
  if (address.startsWith('0x') && address.length >= 42) {
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  }
  
  if (address.length > 12) {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
  
  return address;
}

module.exports = {
  formatTokenData,
  formatTopHolders,
  formatMarketData,
  formatDecentralizationScore,
  formatPercentage,
  formatPrice,
  formatLargeNumber,
  formatNumber,
  truncateAddress
};