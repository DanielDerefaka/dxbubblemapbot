const axios = require('axios');
const { logger } = require('../utils/logger');
const { defaultChain } = require('../config/config');


function isValidChain(chain, supportedChains = ['eth', 'bsc', 'ftm', 'avax', 'cro', 'arbi', 'poly', 'base', 'sol', 'sonic']) {
  if (!chain) return false;
  return supportedChains.includes(chain.toLowerCase());
}

/**
 * @param {string} contractAddress 
 * @param {string} chain 
 * @returns {Promise<Object>} 
 */
async function getTokenData(contractAddress, chain = defaultChain) {
  try {
   
    const normalizedChain = isValidChain(chain) ? chain.toLowerCase() : defaultChain;
    
 
    let normalizedAddress = contractAddress;
    

    if (normalizedChain !== 'sol') {
     
      normalizedAddress = contractAddress.startsWith('0x') 
        ? contractAddress.toLowerCase() 
        : `0x${contractAddress.toLowerCase()}`;
    }
    
    logger.info(`Getting token data for ${normalizedAddress} on chain ${normalizedChain}`);
    
  
    const mapDataUrl = `https://api-legacy.bubblemaps.io/map-data?token=${normalizedAddress}&chain=${normalizedChain}`;
    logger.info(`Fetching token data from map-data API: ${mapDataUrl}`);
    
    let mapDataResponse;
    try {
      mapDataResponse = await axios.get(mapDataUrl, { 
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BubbleMapsClient/1.0' 
        }
      });
      
      logger.debug(`Map-data API response status: ${mapDataResponse.status}`);
      
  
      if (mapDataResponse.data) {
       
        if (normalizedChain === 'sol' && mapDataResponse.data.full_name) {
          return processSolanaTokenData(mapDataResponse.data, normalizedAddress, normalizedChain);
        }
        
       
        if (normalizedChain !== 'sol' && mapDataResponse.data.full_name) {
          return processOtherData(mapDataResponse.data, normalizedAddress, normalizedChain);
        }
        
     
        if (mapDataResponse.data.success || mapDataResponse.data.map) {
          return processMapDataResponse(mapDataResponse.data, normalizedAddress, normalizedChain);
        }
        
  
        logger.warn(`Unexpected map-data response format: ${JSON.stringify(mapDataResponse.data).substring(0, 200)}...`);
      }
    } catch (mapDataError) {
      logger.warn(`Error from map-data API: ${mapDataError.message}`);
    
    }
   
    // Try the map-metadata API
    const metadataUrl = `https://api-legacy.bubblemaps.io/map-metadata?chain=${normalizedChain}&token=${normalizedAddress}`;
    logger.info(`Fetching token data from map-metadata API: ${metadataUrl}`);
    
    try {
      const metadataResponse = await axios.get(metadataUrl, { 
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BubbleMapsClient/1.0'
        }
      });
      
      if (metadataResponse.data) {
     
        return processMetadataResponse(metadataResponse.data, normalizedAddress, normalizedChain);
      }
    } catch (metadataError) {
      logger.warn(`Error from map-metadata API: ${metadataError.message}`);
    }
    
  
    throw new Error('Could not retrieve token data from BubbleMaps APIs');
  } catch (error) {
    logger.error(`Error fetching token data: ${error.message}`);
    
    // Create a basic fallback response with empty data
    return createFallbackTokenData(contractAddress, chain);
  }
}

/**

 * @param {Object} data 
 * @param {string} address 
 * @param {string} chain 
 * @returns {Object} 
 */
function processMapDataResponse(data, address, chain) {
  
  if (chain === 'sol') {
    return processSolanaTokenData(data, address, chain);
  }
  

 
  const name = data.name || 'Unknown Token';
  const symbol = data.symbol || '???';
  const map = data.map || {};
  

  const tokenDetails = map.token || {};
  const decimals = tokenDetails.decimals !== undefined ? tokenDetails.decimals : 18;
  const totalSupply = tokenDetails.totalSupply || '0';
  
 
  const stats = map.stats || {};
  const tokenStats = {
    decentralizationScore: stats.decentralizationScore || 0,
    holdersCount: stats.holdersNumber || 0,
    cexPercentage: stats.cexPercentage || 0,
    contractsPercentage: stats.contractsPercentage || 0,
    top10Percentage: stats.top10Percentage || 0,
    top50Percentage: stats.top50Percentage || 0,
    top100Percentage: stats.top100Percentage || 0
  };
  
  
  const holders = map.holders || [];
  const topHolders = holders.slice(0, 10).map(holder => ({
    address: holder.address || 'Unknown',
    percentage: holder.percentage || holder.balance || 0,
    label: holder.label || '',
    isContract: Boolean(holder.isContract),
    isCex: Boolean(holder.isCex)
  }));
  
 
  return {
    success: true,
    address: address,
    name: name,
    symbol: symbol,
    chain: chain,
    decimals: decimals,
    totalSupply: totalSupply,
    stats: tokenStats,
    topHolders: topHolders,
    updatedAt: map.updatedAt || new Date().toISOString()
  };
}

/**
* @param {Object} data 
 * @param {string} address 
 * @param {string} chain 
 * @returns {Object} 
 */
function processMetadataResponse(data, address, chain) {

  return {
    success: true,
    address: address,
    name: data.name || 'Unknown Token',
    symbol: data.symbol || '???',
    chain: chain,
    decimals: data.decimals !== undefined ? data.decimals : 18,
    totalSupply: data.totalSupply || '0',
    stats: {
      decentralizationScore: data.decentralizationScore || 0,
      holdersCount: data.holdersCount || 0,
      cexPercentage: data.cexPercentage || 0,
      contractsPercentage: data.contractsPercentage || 0,
      top10Percentage: data.top10Percentage || 0,
      top50Percentage: data.top50Percentage || 0,
      top100Percentage: data.top100Percentage || 0
    },
    topHolders: [], 
    updatedAt: data.updatedAt || new Date().toISOString()
  };
}

/**
* @param {Object} data 
 * @param {string} address 
 * @param {string} chain 
 * @returns {Object}
 */
function processSolanaTokenData(data, address, chain) {

  const name = data.full_name || 'Unknown Token';

  const symbol = data.symbol || name.split(' ')[0] || '???';
  
  
  const stats = calculateSolanaStats(data);
  

  const topHolders = extractSolanaHolders(data);
  

  return {
    success: true,
    address: address,
    name: name,
    symbol: symbol,
    chain: chain,
    decimals: data.decimals || 9, 
    totalSupply: data.total_supply || '0',
    stats: stats,
    topHolders: topHolders,
    updatedAt: data.dt_update || new Date().toISOString()
  };
}

/**
 * Process data for non-Solana chains that return a Solana-like response format
 * @param {Object} data 
 * @param {string} address 
 * @param {string} chain 
 * @returns {Object} 
 */
function processOtherData(data, address, chain) {

  const name = data.full_name || 'Unknown Token';
 
  const symbol = data.symbol || name.split(' ')[0] || '???';
  
  
  const stats = calculateSolanaStats(data);
  

  const topHolders = extractSolanaHolders(data);
  
 
  return {
    success: true,
    address: address,
    name: name,
    symbol: symbol,
    chain: chain, 
    decimals: data.decimals || (chain === 'sol' ? 9 : 18), 
    totalSupply: data.total_supply || '0',
    stats: stats,
    topHolders: topHolders,
    updatedAt: data.dt_update || new Date().toISOString()
  };
}

/**
 * @param {Object} data 
 * @returns {Object} 
 */
function calculateSolanaStats(data) {
  let stats = {
    decentralizationScore: 0,
    holdersCount: 0,
    cexPercentage: 0,
    contractsPercentage: 0,
    top10Percentage: 0,
    top50Percentage: 0,
    top100Percentage: 0
  };
  

  if (data.nodes && Array.isArray(data.nodes)) {
    stats.holdersCount = data.nodes.length;
  
    const sortedNodes = [...data.nodes].sort((a, b) => b.percentage - a.percentage);
    
  
    if (sortedNodes.length > 0) {
      const top10 = sortedNodes.slice(0, Math.min(10, sortedNodes.length));
      stats.top10Percentage = top10.reduce((sum, node) => sum + node.percentage, 0);
      
      const top50 = sortedNodes.slice(0, Math.min(50, sortedNodes.length));
      stats.top50Percentage = top50.reduce((sum, node) => sum + node.percentage, 0);
      
      const top100 = sortedNodes.slice(0, Math.min(100, sortedNodes.length));
      stats.top100Percentage = top100.reduce((sum, node) => sum + node.percentage, 0);
      
     
      stats.decentralizationScore = Math.max(0, 100 - (stats.top10Percentage / 2));
      
     
      stats.contractsPercentage = data.nodes
        .filter(node => node.is_contract)
        .reduce((sum, node) => sum + node.percentage, 0);
    }
  }
  
  return stats;
}

/**
 * Extract holder information from token data with nodes structure
 * @param {Object} data 
 * @returns {Array} 
 */
function extractSolanaHolders(data) {
  if (!data.nodes || !Array.isArray(data.nodes)) {
    return [];
  }
  

  const sortedNodes = [...data.nodes]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10); // Get top 10
  

  return sortedNodes.map(node => ({
    address: node.address || 'Unknown',
    percentage: node.percentage || 0,
    label: node.label || '',
    isContract: Boolean(node.is_contract),
    isCex: false // Default since we don't have this info
  }));
}

/**
 * @param {string} address 
 * @param {string} chain 
 * @returns {Object}
 */
function createFallbackTokenData(address, chain) {
  const normalizedChain = isValidChain(chain) ? chain.toLowerCase() : defaultChain;
  
  return {
    success: false,
    address: address,
    name: 'Unknown Token',
    symbol: '???',
    chain: normalizedChain,
    decimals: normalizedChain === 'sol' ? 9 : 18,
    totalSupply: '0',
    stats: {
      decentralizationScore: 0,
      holdersCount: 0,
      cexPercentage: 0,
      contractsPercentage: 0,
      top10Percentage: 0,
      top50Percentage: 0,
      top100Percentage: 0
    },
    topHolders: [],
    updatedAt: new Date().toISOString(),
    error: 'Failed to fetch token data from BubbleMaps API'
  };
}

/**
 * Get bubble map URL for embedding
 * @param {string} contractAddress 
 * @param {string} chain 
 * @returns {string} 
 */
function getBubbleMapUrl(contractAddress, chain = defaultChain) {
  // Normalize chain
  const normalizedChain = isValidChain(chain) ? chain.toLowerCase() : defaultChain;
  

  let normalizedAddress = contractAddress;
  if (normalizedChain !== 'sol') {
    normalizedAddress = contractAddress.startsWith('0x') 
      ? contractAddress.toLowerCase() 
      : `0x${contractAddress.toLowerCase()}`;
  }
  

  const baseUrl = `https://app.bubblemaps.io/${normalizedChain}/token/${normalizedAddress}`;
  
  if (normalizedChain !== 'eth' && normalizedChain !== 'sol') {
    return `${baseUrl}?chain=${normalizedChain}`;
  }
  
  return baseUrl;
}

/**
 * @param {string} contractAddress 
 * @param {string} chain 
 * @returns {Promise<Object>} 
 */
async function debugTokenData(contractAddress, chain = defaultChain) {
  const normalizedChain = isValidChain(chain) ? chain.toLowerCase() : defaultChain;
  let normalizedAddress = contractAddress;
  
  if (normalizedChain !== 'sol') {
    normalizedAddress = contractAddress.startsWith('0x') 
      ? contractAddress.toLowerCase() 
      : `0x${contractAddress.toLowerCase()}`;
  }
  
  try {
   
    const mapDataUrl = `https://api-legacy.bubblemaps.io/map-data?token=${normalizedAddress}&chain=${normalizedChain}`;
    const mapDataResponse = await axios.get(mapDataUrl, { 
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BubbleMapsClient/1.0'
      }
    });
    
 
    const metadataUrl = `https://api-legacy.bubblemaps.io/map-metadata?chain=${normalizedChain}&token=${normalizedAddress}`;
    const metadataResponse = await axios.get(metadataUrl, { 
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BubbleMapsClient/1.0'
      }
    });
    
    return {
      success: true,
      mapDataStatus: mapDataResponse.status,
      mapDataSample: JSON.stringify(mapDataResponse.data).substring(0, 500),
      metadataStatus: metadataResponse.status,
      metadataSample: JSON.stringify(metadataResponse.data).substring(0, 500)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  getTokenData,
  getBubbleMapUrl,
  isValidChain,
  calculateSolanaStats,
  processSolanaTokenData,
  extractSolanaHolders,
  processOtherData,
  debugTokenData 
};