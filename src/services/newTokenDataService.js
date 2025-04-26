
// const axios = require('axios');
// const { ethers } = require('ethers');
// const { logger } = require('../utils/logger');
// const { defaultRpcUrls } = require('../config/config');

// // Standard ERC20/BEP20 ABI for token interactions
// const ERC20_ABI = [
//   "function name() view returns (string)",
//   "function symbol() view returns (string)",
//   "function decimals() view returns (uint8)",
//   "function totalSupply() view returns (uint256)",
//   "function balanceOf(address owner) view returns (uint256)"
// ];

// // Token factory interfaces for various DEXs to detect new tokens
// const FACTORY_ABI = [
//   "function getPair(address tokenA, address tokenB) view returns (address pair)",
//   "function allPairsLength() view returns (uint256)"
// ];

// // DEX pair interface to get reserves
// const PAIR_ABI = [
//   "function token0() view returns (address)",
//   "function token1() view returns (address)",
//   "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
// ];

// // WETH/WBNB/etc tokens for price calculations
// const WRAPPED_NATIVE = {
//   'eth': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
//   'bsc': '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', // WBNB
//   'ftm': '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83', // WFTM
//   'avax': '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7', // WAVAX
//   'poly': '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', // WMATIC
//   'arbi': '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', // WETH on Arbitrum
//   'cro': '0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23', // WCRO
//   'base': '0x4200000000000000000000000000000000000006', // WETH on Base
// };

// // Stable coins for price reference
// const STABLES = {
//   'eth': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
//   'bsc': '0xe9e7cea3dedca5984780bafc599bd69add087d56', // BUSD
//   'ftm': '0x04068da6c83afcfa0e13ba15a6696662335d5b75', // USDC
//   'avax': '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', // USDC
//   'poly': '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // USDC
//   'arbi': '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', // USDC
//   'cro': '0xc21223249ca28397b4b6541dffaecc539bff0c59', // USDC
//   'base': '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca', // USDC
// };

// // Popular DEX factory addresses
// const DEX_FACTORIES = {
//   'eth': {
//     'uniswap': '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
//     'sushiswap': '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac'
//   },
//   'bsc': {
//     'pancakeswap': '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73'
//   },
//   'ftm': {
//     'spookyswap': '0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3'
//   },
//   'avax': {
//     'traderjoe': '0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10'
//   },
//   'poly': {
//     'quickswap': '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32'
//   },
//   'arbi': {
//     'uniswap': '0x1F98431c8aD98523631AE4a59f267346ea31F984'
//   },
//   'base': {
//     'baseswap': '0xFDa619b6d20975be80A10332cD39b9a4b0E4908F'
//   }
// };

// /**
//  * Get basic on-chain data for a newly created token
//  * @param {string} contractAddress - Token contract address
//  * @param {string} chain - Blockchain network
//  * @returns {Promise<Object>} - On-chain token data
//  */
// async function getNewTokenData(contractAddress, chain = 'eth') {
//   try {
//     // Don't process Solana tokens with this method
//     if (chain === 'sol') {
//       return getSolanaNewTokenData(contractAddress);
//     }
    
//     // Make sure contract address is properly formatted
//     let formattedAddress = contractAddress;
//     if (!formattedAddress.startsWith('0x')) {
//       formattedAddress = `0x${formattedAddress}`;
//     }
    
//     // Get RPC URL for this chain
//     const rpcUrl = defaultRpcUrls[chain];
//     if (!rpcUrl) {
//       logger.error(`No RPC URL configured for chain: ${chain}`);
//       return null;
//     }
    
//     // Create provider and contract instance
//     const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
//     const tokenContract = new ethers.Contract(formattedAddress, ERC20_ABI, provider);
    
//     // Basic token information
//     let tokenInfo = {};
    
//     // Get token details
//     try {
//       const [name, symbol, decimals, totalSupply] = await Promise.all([
//         tokenContract.name(),
//         tokenContract.symbol(),
//         tokenContract.decimals(),
//         tokenContract.totalSupply()
//       ]);
      
//       tokenInfo = {
//         name,
//         symbol,
//         decimals: decimals.toString(),
//         totalSupply: totalSupply.toString(),
//         formattedTotalSupply: formatUnits(totalSupply, decimals)
//       };
      
//       logger.info(`Retrieved on-chain data for ${formattedAddress}: ${name} (${symbol})`);
//     } catch (err) {
//       logger.warn(`Error getting token details: ${err.message}`);
//       tokenInfo = {
//         name: 'Unknown Token',
//         symbol: '???',
//         decimals: '18',
//         totalSupply: '0',
//         formattedTotalSupply: '0'
//       };
//     }
    
//     // Get price from liquidity pools if available
//     const priceInfo = await getTokenPriceFromDex(formattedAddress, chain, provider, tokenInfo.decimals);
    
//     // Get liquidity information if available
//     const liquidityInfo = await getTokenLiquidity(formattedAddress, chain, provider);
    
//     // Get creation info
//     const creationInfo = await getTokenCreationInfo(formattedAddress, chain, provider);
    
//     // Combine all info
//     return {
//       success: true,
//       address: formattedAddress,
//       chain,
//       ...tokenInfo,
//       ...priceInfo,
//       ...liquidityInfo,
//       ...creationInfo,
//       source: 'on-chain',
//       lastUpdated: new Date().toISOString(),
//     };
//   } catch (error) {
//     logger.error(`Error in getNewTokenData: ${error.message}`);
//     return {
//       success: false,
//       address: contractAddress,
//       chain,
//       error: `Failed to retrieve on-chain data: ${error.message}`
//     };
//   }
// }

// /**
//  * Format units with proper decimal places
//  * @param {string|number} value - Value to format
//  * @param {string|number} decimals - Number of decimal places
//  * @returns {string} - Formatted value
//  */
// function formatUnits(value, decimals) {
//   try {
//     return ethers.utils.formatUnits(value.toString(), decimals.toString());
//   } catch (error) {
//     return '0';
//   }
// }

// /**
//  * Get token price from DEX liquidity pools
//  * @param {string} tokenAddress - Token contract address
//  * @param {string} chain - Blockchain network
//  * @param {Object} provider - Ethers provider
//  * @param {string|number} decimals - Token decimals
//  * @returns {Promise<Object>} - Price information
//  */
// async function getTokenPriceFromDex(tokenAddress, chain, provider, decimals) {
//   try {
//     const factories = DEX_FACTORIES[chain];
//     if (!factories) {
//       return { price: null, priceSource: null };
//     }
    
//     // Try each factory
//     for (const [dexName, factoryAddress] of Object.entries(factories)) {
//       try {
//         const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
        
//         // Try to find a pair with WETH/WBNB/etc
//         const wrappedNative = WRAPPED_NATIVE[chain];
//         if (wrappedNative) {
//           const pairAddress = await factory.getPair(tokenAddress, wrappedNative);
          
//           // If pair exists
//           if (pairAddress && pairAddress !== ethers.constants.AddressZero) {
//             const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
//             const [token0, token1, reserves] = await Promise.all([
//               pair.token0(),
//               pair.token1(),
//               pair.getReserves()
//             ]);
            
//             // Calculate price against wrapped native token (ETH/BNB/etc)
//             const isToken0 = token0.toLowerCase() === tokenAddress.toLowerCase();
//             const tokenReserve = isToken0 ? reserves[0] : reserves[1];
//             const nativeReserve = isToken0 ? reserves[1] : reserves[0];
            
//             // Calculate price in the native token (ETH/BNB/etc)
//             const tokenDecimals = parseInt(decimals) || 18;
//             const nativePrice = nativeReserve.toString() / Math.pow(10, 18) / 
//                               (tokenReserve.toString() / Math.pow(10, tokenDecimals));
            
//             return {
//               price: nativePrice,
//               priceToken: isToken0 ? token1 : token0,
//               priceSource: `${dexName}-pool`,
//               liquidityNative: nativeReserve.toString() / Math.pow(10, 18)
//             };
//           }
//         }
        
//         // Try to find a pair with stablecoins
//         const stable = STABLES[chain];
//         if (stable) {
//           const pairAddress = await factory.getPair(tokenAddress, stable);
          
//           // If pair exists
//           if (pairAddress && pairAddress !== ethers.constants.AddressZero) {
//             const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
//             const [token0, token1, reserves] = await Promise.all([
//               pair.token0(),
//               pair.token1(),
//               pair.getReserves()
//             ]);
            
//             // Calculate price against stable
//             const isToken0 = token0.toLowerCase() === tokenAddress.toLowerCase();
//             const tokenReserve = isToken0 ? reserves[0] : reserves[1];
//             const stableReserve = isToken0 ? reserves[1] : reserves[0];
            
//             // Calculate price in USD
//             const tokenDecimals = parseInt(decimals) || 18;
//             const stableDecimals = 6; // USDC has 6 decimals
//             const priceUsd = stableReserve.toString() / Math.pow(10, stableDecimals) / 
//                            (tokenReserve.toString() / Math.pow(10, tokenDecimals));
            
//             return {
//               price: priceUsd,
//               priceToken: isToken0 ? token1 : token0,
//               priceSource: `${dexName}-stable-pool`,
//               liquidityUsd: stableReserve.toString() / Math.pow(10, stableDecimals)
//             };
//           }
//         }
//       } catch (dexError) {
//         logger.debug(`Error checking ${dexName}: ${dexError.message}`);
//       }
//     }
    
//     // If no price found
//     return { price: null, priceSource: null };
//   } catch (error) {
//     logger.warn(`Error getting token price: ${error.message}`);
//     return { price: null, priceSource: null };
//   }
// }

// /**
//  * Get token liquidity information
//  * @param {string} tokenAddress - Token contract address
//  * @param {string} chain - Blockchain network
//  * @param {Object} provider - Ethers provider
//  * @returns {Promise<Object>} - Liquidity information
//  */
// async function getTokenLiquidity(tokenAddress, chain, provider) {
//   try {
//     const factories = DEX_FACTORIES[chain];
//     if (!factories) {
//       return { totalLiquidityUsd: null };
//     }
    
//     let totalLiquidityUsd = 0;
//     let poolsFound = 0;
    
//     // Try each factory
//     for (const [dexName, factoryAddress] of Object.entries(factories)) {
//       try {
//         const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
        
//         // Try wrapped native pair
//         const wrappedNative = WRAPPED_NATIVE[chain];
//         if (wrappedNative) {
//           const pairAddress = await factory.getPair(tokenAddress, wrappedNative);
//           if (pairAddress && pairAddress !== ethers.constants.AddressZero) {
//             // Get ETH price in USD (simplified approach)
//             const ethPriceUsd = await getEthPriceUsd(chain, provider);
//             if (ethPriceUsd) {
//               const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
//               const reserves = await pair.getReserves();
//               const nativeReserve = reserves[1].toString() / Math.pow(10, 18);
//               const liquidityUsd = nativeReserve * ethPriceUsd * 2; // Both sides
//               totalLiquidityUsd += liquidityUsd;
//               poolsFound++;
//             }
//           }
//         }
        
//         // Try stable pair
//         const stable = STABLES[chain];
//         if (stable) {
//           const pairAddress = await factory.getPair(tokenAddress, stable);
//           if (pairAddress && pairAddress !== ethers.constants.AddressZero) {
//             const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
//             const reserves = await pair.getReserves();
//             const stableReserve = reserves[1].toString() / Math.pow(10, 6); // USDC has 6 decimals
//             const liquidityUsd = stableReserve * 2; // Both sides
//             totalLiquidityUsd += liquidityUsd;
//             poolsFound++;
//           }
//         }
//       } catch (dexError) {
//         logger.debug(`Error checking liquidity on ${dexName}: ${dexError.message}`);
//       }
//     }
    
//     return { 
//       totalLiquidityUsd: poolsFound > 0 ? totalLiquidityUsd : null,
//       poolsFound
//     };
//   } catch (error) {
//     logger.warn(`Error getting token liquidity: ${error.message}`);
//     return { totalLiquidityUsd: null, poolsFound: 0 };
//   }
// }

// /**
//  * Get ETH/BNB/etc price in USD
//  * @param {string} chain - Blockchain network
//  * @param {Object} provider - Ethers provider
//  * @returns {Promise<number|null>} - Native token price in USD
//  */
// async function getEthPriceUsd(chain, provider) {
//   try {
//     const nativeToken = WRAPPED_NATIVE[chain];
//     const stable = STABLES[chain];
    
//     if (!nativeToken || !stable) {
//       return null;
//     }
    
//     // Try to get from major DEXes on this chain
//     const factories = DEX_FACTORIES[chain];
//     if (!factories) {
//       return null;
//     }
    
//     for (const factoryAddress of Object.values(factories)) {
//       try {
//         const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
//         const pairAddress = await factory.getPair(nativeToken, stable);
        
//         if (pairAddress && pairAddress !== ethers.constants.AddressZero) {
//           const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
//           const [token0, reserves] = await Promise.all([
//             pair.token0(),
//             pair.getReserves()
//           ]);
          
//           const stableIsToken0 = token0.toLowerCase() === stable.toLowerCase();
//           const stableReserve = stableIsToken0 ? reserves[0] : reserves[1];
//           const nativeReserve = stableIsToken0 ? reserves[1] : reserves[0];
          
//           // USDC has 6 decimals, WETH has 18
//           return (stableReserve.toString() / Math.pow(10, 6)) / 
//                  (nativeReserve.toString() / Math.pow(10, 18));
//         }
//       } catch (error) {
//         logger.debug(`Error getting native price from factory: ${error.message}`);
//       }
//     }
    
//     // Fallback to hardcoded estimates if everything fails
//     const prices = {
//       'eth': 2500,
//       'bsc': 300,
//       'ftm': 0.5,
//       'avax': 20,
//       'poly': 0.7,
//       'arbi': 2500, // Same as ETH
//       'cro': 0.2,
//       'base': 2500  // Same as ETH
//     };
    
//     return prices[chain] || null;
//   } catch (error) {
//     logger.warn(`Error getting native token price: ${error.message}`);
//     return null;
//   }
// }

// /**
//  * Get token creation information
//  * @param {string} tokenAddress - Token contract address
//  * @param {string} chain - Blockchain network
//  * @param {Object} provider - Ethers provider
//  * @returns {Promise<Object>} - Creation information
//  */
// async function getTokenCreationInfo(tokenAddress, chain, provider) {
//   try {
//     // Try to get the contract creation transaction
//     const code = await provider.getCode(tokenAddress);
//     if (code === '0x') {
//       return { creationBlock: null, creationDate: null };
//     }
    
//     // Get transaction count to estimate creation block
//     // This is a heuristic - actual creation detection would require indexing
//     const blockNumber = await provider.getBlockNumber();
    
//     // Start binary search to find creation block
//     // This is a simplified approach - more advanced solutions would use traces or logs
//     let startBlock = Math.max(1, blockNumber - 1000000); // Look back up to ~1 million blocks
//     let endBlock = blockNumber;
//     let creationBlock = null;
    
//     // Binary search approach, max 10 iterations to avoid too many RPC calls
//     for (let i = 0; i < 10 && startBlock <= endBlock; i++) {
//       const midBlock = Math.floor((startBlock + endBlock) / 2);
      
//       try {
//         // Check if contract existed at this block
//         const codeAtBlock = await provider.getCode(tokenAddress, midBlock);
        
//         if (codeAtBlock === '0x') {
//           // Contract did not exist yet, search in later blocks
//           startBlock = midBlock + 1;
//         } else {
//           // Contract already existed, search in earlier blocks
//           endBlock = midBlock - 1;
//           creationBlock = midBlock; // This might be the creation block or close to it
//         }
//       } catch (error) {
//         // If error occurs, just use the midpoint to continue
//         endBlock = midBlock - 1;
//       }
//     }
    
//     // Get timestamp if we found a creation block estimate
//     let creationDate = null;
//     if (creationBlock) {
//       try {
//         const block = await provider.getBlock(creationBlock);
//         if (block && block.timestamp) {
//           creationDate = new Date(block.timestamp * 1000).toISOString();
//         }
//       } catch (error) {
//         logger.warn(`Error getting block timestamp: ${error.message}`);
//       }
//     }
    
//     return {
//       creationBlock,
//       creationDate,
//       approximateAge: creationBlock ? `${blockNumber - creationBlock} blocks` : null
//     };
//   } catch (error) {
//     logger.warn(`Error getting token creation info: ${error.message}`);
//     return { creationBlock: null, creationDate: null };
//   }
// }

// /**
//  * Get basic data for a new Solana token
//  * @param {string} tokenAddress - Token mint address
//  * @returns {Promise<Object>} - Basic Solana token data
//  */
// async function getSolanaNewTokenData(tokenAddress) {
//   try {
//     // Solana RPC URL
//     const rpcUrl = defaultRpcUrls.sol || 'https://api.mainnet-beta.solana.com';
    
//     // Get token info via RPC call
//     const response = await axios.post(rpcUrl, {
//       jsonrpc: '2.0',
//       id: 1,
//       method: 'getTokenSupply',
//       params: [tokenAddress]
//     });
    
//     if (response.data && response.data.result && response.data.result.value) {
//       const tokenSupply = response.data.result.value;
      
//       // Get token account info
//       const accountResponse = await axios.post(rpcUrl, {
//         jsonrpc: '2.0',
//         id: 1,
//         method: 'getAccountInfo',
//         params: [tokenAddress, { encoding: 'jsonParsed' }]
//       });
      
//       let mintInfo = {};
//       if (accountResponse.data && 
//           accountResponse.data.result && 
//           accountResponse.data.result.value && 
//           accountResponse.data.result.value.data) {
//         const data = accountResponse.data.result.value.data;
//         if (data.program === 'spl-token' && data.parsed && data.parsed.info) {
//           mintInfo = data.parsed.info;
//         }
//       }
      
//       // Try to get price from Jupiter Aggregator
//       let priceInfo = await getSolanaPriceFromJupiter(tokenAddress);
      
//       return {
//         success: true,
//         address: tokenAddress,
//         chain: 'sol',
//         name: 'Solana Token', // SPL tokens don't have names in the mint
//         symbol: mintInfo.symbol || '???',
//         decimals: mintInfo.decimals || 9,
//         totalSupply: tokenSupply.amount,
//         formattedTotalSupply: tokenSupply.uiAmount || tokenSupply.amount,
//         ...priceInfo,
//         source: 'solana-rpc',
//         lastUpdated: new Date().toISOString()
//       };
//     }
    
//     return {
//       success: false,
//       address: tokenAddress,
//       chain: 'sol',
//       error: 'Failed to retrieve token supply'
//     };
//   } catch (error) {
//     logger.error(`Error in getSolanaNewTokenData: ${error.message}`);
//     return {
//       success: false,
//       address: tokenAddress,
//       chain: 'sol',
//       error: `Failed to retrieve Solana token data: ${error.message}`
//     };
//   }
// }

// /**
//  * Try to get Solana token price from Jupiter Aggregator
//  * @param {string} mintAddress - Token mint address
//  * @returns {Promise<Object>} - Price information
//  */
// async function getSolanaPriceFromJupiter(mintAddress) {
//   try {
//     // USDC on Solana
//     const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    
//     // Query Jupiter for a quote
//     const response = await axios.get(`https://quote-api.jup.ag/v4/quote`, {
//       params: {
//         inputMint: mintAddress,
//         outputMint: usdcMint,
//         amount: 1000000000, // 1 token in raw units (assuming 9 decimals)
//         slippage: 0.5
//       },
//       timeout: 5000
//     });
    
//     if (response.data && response.data.outAmount) {
//       // USDC has 6 decimals
//       const price = parseInt(response.data.outAmount) / Math.pow(10, 6) / 1;
//       return {
//         price,
//         priceSource: 'jupiter-aggregator'
//       };
//     }
    
//     return { price: null, priceSource: null };
//   } catch (error) {
//     logger.debug(`Error getting Solana price from Jupiter: ${error.message}`);
//     return { price: null, priceSource: null };
//   }
// }

// /**
//  * Check if a token is newly created based on on-chain data
//  * @param {string} contractAddress - Token contract address
//  * @param {string} chain - Blockchain network
//  * @returns {Promise<boolean>} - True if token appears to be new
//  */
// async function isNewToken(contractAddress, chain) {
//   try {
//     // Check if it exists on aggregators first
//     // If it does, it's not new
//     const aggregatorCheck = await checkAggregators(contractAddress, chain);
//     if (aggregatorCheck) {
//       return false;
//     }
    
//     // For Solana, check differently
//     if (chain === 'sol') {
//       return isNewSolanaToken(contractAddress);
//     }
    
//     // Get RPC URL for this chain
//     const rpcUrl = defaultRpcUrls[chain];
//     if (!rpcUrl) {
//       return false;
//     }
    
//     // Create provider
//     const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
//     // Get current block
//     const currentBlock = await provider.getBlockNumber();
    
//     // Check token creation info
//     const creationInfo = await getTokenCreationInfo(contractAddress, chain, provider);
    
//     // If we couldn't detect creation, assume not new
//     if (!creationInfo.creationBlock) {
//       return false;
//     }
    
//     // Consider "new" if created within the last 10000 blocks
//     // This is approximately 1-2 days depending on the chain
//     return (currentBlock - creationInfo.creationBlock) < 10000;
//   } catch (error) {
//     logger.error(`Error in isNewToken: ${error.message}`);
//     return false;
//   }
// }

// /**
//  * Check if token exists on major aggregators
//  * @param {string} contractAddress - Token contract address
//  * @param {string} chain - Blockchain network
//  * @returns {Promise<boolean>} - True if exists on aggregators
//  */
// async function checkAggregators(contractAddress, chain) {
//   try {
//     // Check CoinGecko first
//     const platformMap = {
//       'eth': 'ethereum',
//       'bsc': 'binance-smart-chain',
//       'ftm': 'fantom',
//       'avax': 'avalanche',
//       'poly': 'polygon-pos',
//       'arbi': 'arbitrum-one',
//       'cro': 'cronos',
//       'base': 'base',
//       'sol': 'solana'
//     };
    
//     // Get the platform ID for the given chain
//     const platform = platformMap[chain] || 'ethereum';
    
//     // Format address for CoinGecko
//     let formattedAddress = contractAddress;
//     if (chain !== 'sol' && !formattedAddress.startsWith('0x')) {
//       formattedAddress = `0x${formattedAddress}`;
//     }
    
//     try {
//       const url = `https://api.coingecko.com/api/v3/coins/${platform}/contract/${formattedAddress}`;
//       const response = await axios.get(url, { timeout: 5000 });
//       if (response.status === 200) {
//         return true; // Exists on CoinGecko
//       }
//     } catch (error) {
//       // 404 means it doesn't exist, which is expected for new tokens
//       if (error.response && error.response.status !== 404) {
//         logger.debug(`Error checking CoinGecko: ${error.message}`);
//       }
//     }
    
//     // Then check DeFi Llama
//     try {
//       const chainMap = {
//         'eth': 'ethereum',
//         'bsc': 'bsc',
//         'ftm': 'fantom',
//         'avax': 'avax',
//         'poly': 'polygon',
//         'arbi': 'arbitrum',
//         'cro': 'cronos',
//         'base': 'base',
//         'sol': 'solana'
//       };
      
//       const llama_chain = chainMap[chain] || 'ethereum';
//       const url = `https://coins.llama.fi/prices/current/${llama_chain}:${formattedAddress}`;
//       const response = await axios.get(url, { timeout: 5000 });
      
//       if (response.data && 
//           response.data.coins && 
//           Object.keys(response.data.coins).length > 0) {
//         return true; // Exists on DeFi Llama
//       }
//     } catch (error) {
//       logger.debug(`Error checking DeFi Llama: ${error.message}`);
//     }
    
//     // Not found on any aggregator
//     return false;
//   } catch (error) {
//     logger.error(`Error checking aggregators: ${error.message}`);
//     return false;
//   }
// }

// /**
//  * Check if a Solana token is newly created
//  * @param {string} mintAddress - Token mint address
//  * @returns {Promise<boolean>} - True if token appears to be new
//  */
// async function isNewSolanaToken(mintAddress) {
//   try {
//     // Solana RPC URL
//     const rpcUrl = defaultRpcUrls.sol || 'https://api.mainnet-beta.solana.com';
    
//     // Get token account info
//     const accountResponse = await axios.post(rpcUrl, {
//       jsonrpc: '2.0',
//       id: 1,
//       method: 'getAccountInfo',
//       params: [mintAddress, { encoding: 'jsonParsed' }]
//     });
    
//     if (accountResponse.data && 
//         accountResponse.data.result && 
//         accountResponse.data.result.value) {
      
//       // Check for recent block slot
//       const slot = accountResponse.data.result.context?.slot;
//       const currentSlotResponse = await axios.post(rpcUrl, {
//         jsonrpc: '2.0',
//         id: 1,
//         method: 'getSlot',
//         params: []
//       });
      
//       const currentSlot = currentSlotResponse.data?.result || 0;
      
//       // If we have valid slots, check if created recently
//       if (slot && currentSlot) {
//         // Consider "new" if created within the last 500000 slots
//         // This is approximately 2-3 days on Solana
//         return (currentSlot - slot) < 500000;
//       }
//     }
    
//     return false;
//   } catch (error) {
//     logger.error(`Error checking if Solana token is new: ${error.message}`);
//     return false;
//   }
// }

// module.exports = {
//   getNewTokenData,
//   isNewToken,
//   getTokenPriceFromDex,
//   getTokenLiquidity,
//   getSolanaNewTokenData
// };