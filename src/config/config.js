
require('dotenv').config();

module.exports = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  bubblemapsApiKey: process.env.BUBBLEMAPS_API_KEY || null, 
  logLevel: process.env.LOG_LEVEL || 'info',
  defaultChain: process.env.DEFAULT_CHAIN || 'eth',
  coingeckoApiKey: process.env.COINGECKO_API_KEY || null, 
  puppeteerArgs: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu'
  ],
  defaultRpcUrls: {
    'eth': 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
    'bsc': 'https://bsc-dataseed.binance.org',
    'ftm': 'https://rpc.ftm.tools',
    'avax': 'https://api.avax.network/ext/bc/C/rpc',
    'poly': 'https://polygon-rpc.com',
    'arbi': 'https://arb1.arbitrum.io/rpc',
    'cro': 'https://evm.cronos.org',
    'base': 'https://mainnet.base.org',
    'sol': 'https://api.mainnet-beta.solana.com'
  },
};


