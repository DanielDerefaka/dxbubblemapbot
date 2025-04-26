const axios = require('axios');
const { logger } = require('../utils/logger');

async function getSignificantTransactions(contractAddress, chain = 'eth') {
  try {
    if (chain === 'eth') {
      return await getEthereumTransactions(contractAddress);
    }
    
    if (chain === 'bsc') {
      return await getBscTransactions(contractAddress);
    }
    
    return [];
  } catch (error) {
    logger.warn(`Error fetching significant transactions: ${error.message}`);
    return [];
  }
}

async function getEthereumTransactions(contractAddress) {
  const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
  
  if (!etherscanApiKey) {
    logger.warn('No Etherscan API key found, skipping transaction fetching');
    return [];
  }
  
  try {
    const url = `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${contractAddress}&page=1&offset=100&sort=desc&apikey=${etherscanApiKey}`;
    
    const response = await axios.get(url, { timeout: 5000 });
    
    if (response.data && response.data.status === '1' && response.data.result) {
      return processTransactions(response.data.result, 'eth');
    }
    
    return [];
  } catch (error) {
    logger.warn(`Error fetching Ethereum transactions: ${error.message}`);
    return [];
  }
}

async function getBscTransactions(contractAddress) {
  const bscScanApiKey = process.env.BSCSCAN_API_KEY;
  
  if (!bscScanApiKey) {
    logger.warn('No BscScan API key found, skipping transaction fetching');
    return [];
  }
  
  try {
    const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${contractAddress}&page=1&offset=100&sort=desc&apikey=${bscScanApiKey}`;
    
    const response = await axios.get(url, { timeout: 5000 });
    
    if (response.data && response.data.status === '1' && response.data.result) {
      return processTransactions(response.data.result, 'bsc');
    }
    
    return [];
  } catch (error) {
    logger.warn(`Error fetching BSC transactions: ${error.message}`);
    return [];
  }
}

function processTransactions(transactions, chain) {
  if (!transactions || !Array.isArray(transactions)) {
    return [];
  }
  
  try {
    const decimals = parseInt(transactions[0].tokenDecimal || '18');
    const symbol = transactions[0].tokenSymbol || '';
    
    const values = transactions.map(tx => 
      parseFloat(tx.value) / Math.pow(10, decimals)
    );
    
    values.sort((a, b) => b - a);
    
    const significantThreshold = values[Math.floor(values.length * 0.05)] || 0;
    
    const significantTxs = transactions
      .filter(tx => {
        const value = parseFloat(tx.value) / Math.pow(10, decimals);
        return value >= significantThreshold;
      })
      .map(tx => {
        const value = parseFloat(tx.value) / Math.pow(10, decimals);
        
        return {
          hash: tx.hash,
          timestamp: parseInt(tx.timeStamp) * 1000,
          from: tx.from,
          to: tx.to,
          value: value,
          symbol: symbol,
          isWhaleMovement: isWhaleAddress(tx.from) || isWhaleAddress(tx.to),
          explorerUrl: getExplorerUrl(tx.hash, chain)
        };
      })
      .slice(0, 5);
    
    return significantTxs;
  } catch (error) {
    logger.warn(`Error processing transactions: ${error.message}`);
    return [];
  }
}

function isWhaleAddress(address) {
  return false;
}

function getExplorerUrl(hash, chain) {
  const explorers = {
    'eth': `https://etherscan.io/tx/${hash}`,
    'bsc': `https://bscscan.com/tx/${hash}`,
    'poly': `https://polygonscan.com/tx/${hash}`,
    'ftm': `https://ftmscan.com/tx/${hash}`,
    'avax': `https://snowtrace.io/tx/${hash}`,
    'arbi': `https://arbiscan.io/tx/${hash}`,
    'base': `https://basescan.org/tx/${hash}`,
    'sol': `https://solscan.io/tx/${hash}`,
    'cro': `https://cronoscan.com/tx/${hash}`
  };
  
  return explorers[chain] || `https://etherscan.io/tx/${hash}`;
}

async function getWhaleActivityAnalysis(contractAddress, chain = 'eth') {
  try {
    const whaleAnalysis = {
      recentMovements: [],
      netFlow24h: 0,
      whaleConcentration: 0,
      alert: null
    };
    
    const transactions = await getSignificantTransactions(contractAddress, chain);
    
    if (transactions.length > 0) {
      whaleAnalysis.recentMovements = transactions
        .filter(tx => tx.isWhaleMovement)
        .map(tx => ({
          time: new Date(tx.timestamp).toISOString(),
          amount: tx.value,
          symbol: tx.symbol,
          type: isSellingTransaction(tx) ? 'Sell' : 'Buy',
          url: tx.explorerUrl
        }));
      
      whaleAnalysis.netFlow24h = calculateNetFlow(transactions);
      
      if (whaleAnalysis.netFlow24h < -5) {
        whaleAnalysis.alert = 'Significant whale selling detected in the last 24 hours';
      }
    }
    
    return whaleAnalysis;
  } catch (error) {
    logger.warn(`Error analyzing whale activity: ${error.message}`);
    return {
      recentMovements: [],
      netFlow24h: 0,
      whaleConcentration: 0,
      alert: null
    };
  }
}

function isSellingTransaction(transaction) {
  return false;
}

function calculateNetFlow(transactions) {
  return 0;
}

async function getContractInteractionMetrics(contractAddress, chain = 'eth') {
  try {
    return {
      dailyTransactions: 0,
      uniqueAddresses24h: 0,
      contractCalls24h: 0,
      mostCommonInteraction: null
    };
  } catch (error) {
    logger.warn(`Error fetching contract interaction metrics: ${error.message}`);
    return null;
  }
}

module.exports = {
  getSignificantTransactions,
  getWhaleActivityAnalysis,
  getContractInteractionMetrics
};