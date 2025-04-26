const axios = require('axios');
const { logger } = require('../utils/logger');
const { coingeckoApiKey, covalentApiKey } = require('../config/config');
const { ethers } = require('ethers');
const { defaultRpcUrls } = require('../config/config');

async function getTokenMarketData(contractAddress, chain = 'eth') {
  try {
    const defiLlamaData = await getDataFromDeFiLlama(contractAddress, chain);
    if (defiLlamaData && Object.keys(defiLlamaData).length > 0) {
      logger.info(`Market data retrieved from DeFi Llama for ${contractAddress}`);
      return defiLlamaData;
    }

    const covalentData = await getDataFromCovalent(contractAddress, chain);
    if (covalentData && Object.keys(covalentData).length > 0) {
      logger.info(`Market data retrieved from Covalent for ${contractAddress}`);
      return covalentData;
    }

    const coingeckoData = await getDataFromCoinGecko(contractAddress, chain);
    if (coingeckoData && Object.keys(coingeckoData).length > 0) {
      logger.info(`Market data retrieved from CoinGecko for ${contractAddress}`);
      return coingeckoData;
    }

    const dexPrice = await getTokenPriceFromDex(contractAddress, chain);
    if (dexPrice && dexPrice.price) {
      logger.info(`Retrieved price from DEX for ${contractAddress}: $${dexPrice.price}`);
      
      const tokenInfo = await getBasicTokenInfo(contractAddress, chain);
      
      return {
        ...tokenInfo,
        ...dexPrice,
        source: 'dex-' + (dexPrice.priceSource || 'unknown'),
        success: true,
        lastUpdated: new Date().toISOString()
      };
    }

    logger.warn(`Failed to retrieve market data from all sources for ${contractAddress}`);
    return createFallbackMarketData(contractAddress, chain);
  } catch (error) {
    logger.error(`Error in getTokenMarketData: ${error.message}`);
    return createFallbackMarketData(contractAddress, chain);
  }
}

async function getDataFromDeFiLlama(contractAddress, chain) {
  try {
    const chainMap = {
      'eth': 'ethereum',
      'bsc': 'bsc',
      'ftm': 'fantom',
      'avax': 'avax',
      'poly': 'polygon',
      'arbi': 'arbitrum',
      'cro': 'cronos',
      'base': 'base',
      'sol': 'solana',
      'sonic': 'sonic'
    };

    const defiLlamaChain = chainMap[chain] || 'ethereum';
    
    let formattedAddress = contractAddress;
    if (chain !== 'sol' && !contractAddress.startsWith('0x')) {
      formattedAddress = `0x${contractAddress}`;
    }
    
    const coinUrl = `https://coins.llama.fi/prices/current/${defiLlamaChain}:${formattedAddress}`;
    logger.debug(`Fetching DeFi Llama data from: ${coinUrl}`);
    
    const coinResponse = await axios.get(coinUrl, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TokenAnalyzer/1.0'
      }
    });
    
    if (coinResponse.data && coinResponse.data.coins) {
      const coinKey = `${defiLlamaChain}:${formattedAddress}`;
      const coinData = coinResponse.data.coins[coinKey];
      
      if (!coinData) {
        logger.debug(`No data found in DeFi Llama for ${coinKey}`);
        return null;
      }
      
      let chartData = {};
      try {
        const chartUrl = `https://coins.llama.fi/chart/${defiLlamaChain}:${formattedAddress}`;
        const chartResponse = await axios.get(chartUrl, { timeout: 5000 });
        
        if (chartResponse.data && chartResponse.data.prices) {
          chartData = processDefiLlamaChartData(chartResponse.data.prices);
        }
      } catch (chartError) {
        logger.debug(`Error getting DeFi Llama chart data: ${chartError.message}`);
      }
      
      return {
        success: true,
        address: formattedAddress,
        chain: chain,
        name: coinData.name || 'Unknown Token',
        symbol: coinData.symbol || '???',
        price: coinData.price || null,
        priceChangePercentage24h: calculatePriceChange(chartData.priceHistory) || null,
        marketCap: coinData.mcap || null,
        totalSupply: coinData.totalSupply || null,
        volume24h: coinData.volume || null,
        
        high24h: chartData.high24h || null,
        low24h: chartData.low24h || null,
        
        source: 'defi-llama',
        lastUpdated: coinData.timestamp ? new Date(coinData.timestamp * 1000).toISOString() : new Date().toISOString(),
        
        confidence: coinData.confidence || null
      };
    }
    
    return null;
  } catch (error) {
    logger.debug(`DeFi Llama API error: ${error.message}`);
    return null;
  }
}

function processDefiLlamaChartData(prices) {
  if (!prices || !Array.isArray(prices) || prices.length === 0) {
    return {};
  }
  
  const now = Date.now() / 1000;
  const last24h = prices.filter(p => p.timestamp > now - 86400);
  
  const priceData = last24h.length > 10 ? last24h : prices.slice(-Math.min(24, prices.length));
  
  if (priceData.length === 0) return {};
  
  const priceValues = priceData.map(p => p.price);
  
  return {
    high24h: Math.max(...priceValues),
    low24h: Math.min(...priceValues),
    priceHistory: priceData.map(p => ({ 
      timestamp: p.timestamp,
      price: p.price
    }))
  };
}

function calculatePriceChange(priceHistory) {
  if (!priceHistory || priceHistory.length < 2) return null;
  
  const oldestPrice = priceHistory[0].price;
  const newestPrice = priceHistory[priceHistory.length - 1].price;
  
  if (oldestPrice === 0) return null;
  
  return ((newestPrice - oldestPrice) / oldestPrice) * 100;
}

async function getDataFromCovalent(contractAddress, chain) {
  if (!covalentApiKey) {
    logger.debug('Skipping Covalent API call: No API key');
    return null;
  }
  
  try {
    const chainMap = {
      'eth': '1',
      'bsc': '56',
      'ftm': '250',
      'avax': '43114',
      'poly': '137',
      'arbi': '42161',
      'cro': '25',
      'base': '8453',
      'sol': '1399'
    };
    
    const covalentChainId = chainMap[chain] || '1';
    
    if (chain === 'sol') {
      return getDataFromCovalentSolana(contractAddress);
    }
    
    let formattedAddress = contractAddress;
    if (!formattedAddress.startsWith('0x')) {
      formattedAddress = `0x${formattedAddress}`;
    }
    
    const url = `https://api.covalenthq.com/v1/${covalentChainId}/tokens/${formattedAddress}/`;
    
    const response = await axios.get(url, {
      auth: {
        username: covalentApiKey,
        password: ''
      },
      timeout: 10000
    });
    
    if (response.data && response.data.data && response.data.data.items && response.data.data.items.length > 0) {
      const tokenData = response.data.data.items[0];
      
      return {
        success: true,
        address: formattedAddress,
        chain: chain,
        name: tokenData.contract_name || 'Unknown Token',
        symbol: tokenData.contract_ticker_symbol || '???',
        price: tokenData.quote_rate || null,
        marketCap: tokenData.market_cap_usd || null,
        totalSupply: tokenData.total_supply || null,
        volume24h: null,
        
        contractDecimals: tokenData.contract_decimals || 18,
        logoUrl: tokenData.logo_url || null,
        
        source: 'covalent',
        lastUpdated: new Date().toISOString()
      };
    }
    
    return null;
  } catch (error) {
    logger.debug(`Covalent API error: ${error.message}`);
    return null;
  }
}

async function getDataFromCovalentSolana(contractAddress) {
  if (!covalentApiKey) return null;
  
  try {
    const url = `https://api.covalenthq.com/v1/solana-mainnet/tokens/${contractAddress}/`;
    
    const response = await axios.get(url, {
      auth: {
        username: covalentApiKey,
        password: ''
      },
      timeout: 10000
    });
    
    if (response.data && response.data.data) {
      const tokenData = response.data.data;
      
      return {
        success: true,
        address: contractAddress,
        chain: 'sol',
        name: tokenData.contract_name || 'Unknown Token',
        symbol: tokenData.contract_ticker_symbol || '???',
        price: tokenData.quote_rate || null,
        marketCap: tokenData.market_cap_usd || null,
        totalSupply: tokenData.total_supply || null,
        
        contractDecimals: tokenData.contract_decimals || 9,
        logoUrl: tokenData.logo_url || null,
        
        source: 'covalent-solana',
        lastUpdated: new Date().toISOString()
      };
    }
    
    return null;
  } catch (error) {
    logger.debug(`Covalent Solana API error: ${error.message}`);
    return null;
  }
}

async function getDataFromCoinGecko(contractAddress, chain) {
  try {
    const platformMap = {
      'eth': 'ethereum',
      'bsc': 'binance-smart-chain',
      'ftm': 'fantom',
      'avax': 'avalanche',
      'poly': 'polygon-pos',
      'arbi': 'arbitrum-one',
      'cro': 'cronos',
      'base': 'base',
      'sol': 'solana'
    };
    
    const platform = platformMap[chain] || 'ethereum';
    
    let formattedAddress = contractAddress;
    if (chain !== 'sol' && !formattedAddress.startsWith('0x')) {
      formattedAddress = `0x${formattedAddress}`;
    }
    
    const url = `https://api.coingecko.com/api/v3/coins/${platform}/contract/${formattedAddress}`;
    
    const headers = coingeckoApiKey ? { 'x-cg-pro-api-key': coingeckoApiKey } : {};
    
    const response = await axios.get(url, { 
      headers,
      timeout: 10000,
      params: {
        localization: 'false',
        tickers: 'true',
        market_data: 'true',
        community_data: 'true',
        developer_data: 'false',
        sparkline: 'true'
      }
    });
    
    if (response.data) {
      const data = response.data;
      return {
        success: true,
        address: formattedAddress,
        chain: chain,
        name: data.name || 'Unknown Token',
        symbol: data.symbol ? data.symbol.toUpperCase() : '???',
        
        price: data.market_data?.current_price?.usd || null,
        priceChangePercentage24h: data.market_data?.price_change_percentage_24h || null,
        priceChangePercentage7d: data.market_data?.price_change_percentage_7d || null,
        priceChangePercentage30d: data.market_data?.price_change_percentage_30d || null,
        
        marketCap: data.market_data?.market_cap?.usd || null,
        marketCapRank: data.market_data?.market_cap_rank || null,
        fullyDilutedValuation: data.market_data?.fully_diluted_valuation?.usd || null,
        
        volume24h: data.market_data?.total_volume?.usd || null,
        volumeChangePercentage24h: data.market_data?.total_volume_change_percentage_24h || null,
        liquidityScore: data.liquidity_score || null,
        
        circulatingSupply: data.market_data?.circulating_supply || null,
        totalSupply: data.market_data?.total_supply || null,
        maxSupply: data.market_data?.max_supply || null,
        
        allTimeHigh: data.market_data?.ath?.usd || null,
        allTimeHighDate: data.market_data?.ath_date?.usd || null,
        allTimeHighChangePercentage: data.market_data?.ath_change_percentage?.usd || null,
        allTimeLow: data.market_data?.atl?.usd || null,
        allTimeLowDate: data.market_data?.atl_date?.usd || null,
        allTimeLowChangePercentage: data.market_data?.atl_change_percentage?.usd || null,
        
        high24h: data.market_data?.high_24h?.usd || null,
        low24h: data.market_data?.low_24h?.usd || null,
        
        exchanges: data.tickers ? processExchangeData(data.tickers) : [],
        
        communityScore: data.community_score || null,
        redditSubscribers: data.community_data?.reddit_subscribers || null,
        twitterFollowers: data.community_data?.twitter_followers || null,
        
        coingeckoScore: data.coingecko_score || null,
        developerScore: data.developer_score || null,
        source: 'coingecko',
        lastUpdated: data.last_updated || null
      };
    }
    
    return null;
  } catch (error) {
    logger.debug(`CoinGecko API error: ${error.message}`);
    return null;
  }
}

function processExchangeData(tickers) {
  if (!tickers || !Array.isArray(tickers)) return [];
  
  return tickers
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5)
    .map(ticker => ({
      name: ticker.market?.name || 'Unknown',
      pair: ticker.base + '/' + ticker.target,
      price: ticker.last,
      volume: ticker.volume,
      trustScore: ticker.trust_score
    }));
}

async function getTokenPriceFromDex(contractAddress, chain) {
  try {
    if (chain === 'sol') {
      return getSolanaPriceData(contractAddress);
    }
    
    let formattedAddress = contractAddress;
    if (!formattedAddress.startsWith('0x')) {
      formattedAddress = `0x${formattedAddress}`;
    }
    
    const rpcUrl = defaultRpcUrls[chain];
    if (!rpcUrl) {
      logger.error(`No RPC URL configured for chain: ${chain}`);
      return { price: null, priceSource: null };
    }
    
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    const ERC20_ABI = [
      "function decimals() view returns (uint8)"
    ];
    
    let decimals = 18;
    try {
      const tokenContract = new ethers.Contract(formattedAddress, ERC20_ABI, provider);
      decimals = await tokenContract.decimals();
    } catch (error) {
      logger.debug(`Could not get token decimals, using default 18: ${error.message}`);
    }
    
    const WRAPPED_NATIVE = {
      'eth': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      'bsc': '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
      'ftm': '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
      'avax': '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
      'poly': '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      'arbi': '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      'cro': '0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23',
      'base': '0x4200000000000000000000000000000000000006',
    };
    
    const STABLES = {
      'eth': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      'bsc': '0xe9e7cea3dedca5984780bafc599bd69add087d56',
      'ftm': '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
      'avax': '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
      'poly': '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
      'arbi': '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
      'cro': '0xc21223249ca28397b4b6541dffaecc539bff0c59',
      'base': '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca',
    };
    
    const DEX_FACTORIES = {
      'eth': ['0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac'],
      'bsc': ['0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73'],
      'ftm': ['0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3'],
      'avax': ['0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10'],
      'poly': ['0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32'],
      'arbi': ['0x1F98431c8aD98523631AE4a59f267346ea31F984'],
      'base': ['0xFDa619b6d20975be80A10332cD39b9a4b0E4908F']
    };
    
    const FACTORY_ABI = [
      "function getPair(address tokenA, address tokenB) view returns (address pair)"
    ];
    
    const PAIR_ABI = [
      "function token0() view returns (address)",
      "function token1() view returns (address)",
      "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
    ];
    
    for (const factoryAddress of (DEX_FACTORIES[chain] || [])) {
      try {
        const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
        
        const wrappedNative = WRAPPED_NATIVE[chain];
        if (wrappedNative) {
          const pairAddress = await factory.getPair(formattedAddress, wrappedNative);
          
          if (pairAddress && pairAddress !== ethers.constants.AddressZero) {
            const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
            const [token0, token1, reserves] = await Promise.all([
              pair.token0(),
              pair.token1(),
              pair.getReserves()
            ]);
            
            const isToken0 = token0.toLowerCase() === formattedAddress.toLowerCase();
            const tokenReserve = isToken0 ? reserves[0] : reserves[1];
            const nativeReserve = isToken0 ? reserves[1] : reserves[0];
            
            const nativePrice = await getNativeTokenPrice(chain, provider);
            
            if (nativePrice) {
              const tokenPrice = (nativeReserve / Math.pow(10, 18)) / 
                               (tokenReserve / Math.pow(10, decimals)) * nativePrice;
              
              return {
                price: tokenPrice,
                priceSource: 'dex-native',
                liquidityUsd: (nativeReserve / Math.pow(10, 18)) * nativePrice * 2
              };
            }
          }
        }
        
        const stable = STABLES[chain];
        if (stable) {
          const pairAddress = await factory.getPair(formattedAddress, stable);
          
          if (pairAddress && pairAddress !== ethers.constants.AddressZero) {
            const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
            const [token0, token1, reserves] = await Promise.all([
              pair.token0(),
              pair.token1(),
              pair.getReserves()
            ]);
            
            const isToken0 = token0.toLowerCase() === formattedAddress.toLowerCase();
            const tokenReserve = isToken0 ? reserves[0] : reserves[1];
            const stableReserve = isToken0 ? reserves[1] : reserves[0];
            
            const tokenPrice = (stableReserve / Math.pow(10, 6)) / 
                             (tokenReserve / Math.pow(10, decimals));
            
            return {
              price: tokenPrice,
              priceSource: 'dex-stable',
              liquidityUsd: (stableReserve / Math.pow(10, 6)) * 2
            };
          }
        }
      } catch (error) {
        logger.debug(`Error checking DEX ${factoryAddress}: ${error.message}`);
      }
    }
    
    return { price: null, priceSource: null };
  } catch (error) {
    logger.warn(`Error getting token price from DEX: ${error.message}`);
    return { price: null, priceSource: null };
  }
}

async function getNativeTokenPrice(chain, provider) {
  try {
    const native = WRAPPED_NATIVE[chain];
    const stable = STABLES[chain];
    
    if (native && stable && DEX_FACTORIES[chain]) {
      for (const factoryAddress of DEX_FACTORIES[chain]) {
        try {
          const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
          const pairAddress = await factory.getPair(native, stable);
          
          if (pairAddress && pairAddress !== ethers.constants.AddressZero) {
            const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
            const [token0, reserves] = await Promise.all([
              pair.token0(),
              pair.getReserves()
            ]);
            
            const stableIsToken0 = token0.toLowerCase() === stable.toLowerCase();
            const stableReserve = stableIsToken0 ? reserves[0] : reserves[1];
            const nativeReserve = stableIsToken0 ? reserves[1] : reserves[0];
            
            return (stableReserve / Math.pow(10, 6)) / (nativeReserve / Math.pow(10, 18));
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    const prices = {
      'eth': 2500,
      'bsc': 300,
      'ftm': 0.5,
      'avax': 20,
      'poly': 0.7,
      'arbi': 2500,
      'cro': 0.2,
      'base': 2500
    };
    
    return prices[chain] || null;
  } catch (error) {
    return null;
  }
}

async function getSolanaPriceData(mintAddress) {
  try {
    const response = await axios.get('https://price.jup.ag/v4/price', {
      params: {
        ids: mintAddress
      },
      timeout: 5000
    });
    
    if (response.data && 
        response.data.data && 
        response.data.data[mintAddress]) {
      
      const jupiterData = response.data.data[mintAddress];
      
      return {
        price: parseFloat(jupiterData.price) || null,
        priceSource: 'jupiter-aggregator',
        priceChangePercentage24h: jupiterData.priceChange24h ? parseFloat(jupiterData.priceChange24h) * 100 : null
      };
    }
    
    return { price: null, priceSource: null };
  } catch (error) {
    logger.debug(`Error getting Solana price data: ${error.message}`);
    return { price: null, priceSource: null };
  }
}

async function getBasicTokenInfo(contractAddress, chain) {
  try {
    if (chain === 'sol') {
      return await getSolanaBasicInfo(contractAddress);
    }
    
    let formattedAddress = contractAddress;
    if (!formattedAddress.startsWith('0x')) {
      formattedAddress = `0x${formattedAddress}`;
    }
    
    const rpcUrl = defaultRpcUrls[chain];
    if (!rpcUrl) {
      logger.error(`No RPC URL configured for chain: ${chain}`);
      return createFallbackMarketData(contractAddress, chain);
    }
    
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    const ERC20_ABI = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)"
    ];
    
    const tokenContract = new ethers.Contract(formattedAddress, ERC20_ABI, provider);
    
    let tokenInfo = {};
    
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.totalSupply()
      ]);
      
      const formattedTotalSupply = ethers.utils.formatUnits(totalSupply, decimals);
      
      tokenInfo = {
        success: true,
        address: formattedAddress,
        chain: chain,
        name,
        symbol,
        decimals: decimals.toString(),
        totalSupply: totalSupply.toString(),
        formattedTotalSupply,
        source: 'on-chain',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.warn(`Error getting token details: ${error.message}`);
      return createFallbackMarketData(contractAddress, chain);
    }
    
    return tokenInfo;
  } catch (error) {
    logger.error(`Error in getBasicTokenInfo: ${error.message}`);
    return createFallbackMarketData(contractAddress, chain);
  }
}

async function getSolanaBasicInfo(mintAddress) {
  try {
    const rpcUrl = defaultRpcUrls.sol || 'https://api.mainnet-beta.solana.com';
    
    const supplyResponse = await axios.post(rpcUrl, {
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenSupply',
      params: [mintAddress]
    });
    
    if (supplyResponse.data && 
        supplyResponse.data.result && 
        supplyResponse.data.result.value) {
      
      const tokenSupply = supplyResponse.data.result.value;
      
      const accountResponse = await axios.post(rpcUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'getAccountInfo',
        params: [mintAddress, { encoding: 'jsonParsed' }]
      });
      
      let mintInfo = {};
      if (accountResponse.data && 
          accountResponse.data.result && 
          accountResponse.data.result.value && 
          accountResponse.data.result.value.data) {
        
        const data = accountResponse.data.result.value.data;
        if (data.program === 'spl-token' && data.parsed && data.parsed.info) {
          mintInfo = data.parsed.info;
        }
      }
      
      return {
        success: true,
        address: mintAddress,
        chain: 'sol',
        name: mintInfo.name || 'Solana Token',
        symbol: mintInfo.symbol || '???',
        decimals: mintInfo.decimals || 9,
        totalSupply: tokenSupply.amount,
        formattedTotalSupply: tokenSupply.uiAmount || tokenSupply.amount,
        source: 'solana-rpc',
        lastUpdated: new Date().toISOString()
      };
    }
    
    return createFallbackMarketData(mintAddress, 'sol');
  } catch (error) {
    logger.error(`Error getting Solana token info: ${error.message}`);
    return createFallbackMarketData(mintAddress, 'sol');
  }
}

function createFallbackMarketData(contractAddress, chain) {
  return {
    success: false,
    address: contractAddress,
    chain: chain,
    name: 'Unknown Token',
    symbol: '???',
    price: null,
    marketCap: null,
    volume24h: null,
    totalSupply: null,
    source: 'fallback',
    lastUpdated: new Date().toISOString(),
    error: 'Failed to fetch market data from all available sources'
  };
}

module.exports = {
  getTokenMarketData,
  getDataFromDeFiLlama,
  getDataFromCovalent,
  getDataFromCoinGecko,
  getBasicTokenInfo,
  createFallbackMarketData,
  processDefiLlamaChartData,
  calculatePriceChange,
  processExchangeData
};