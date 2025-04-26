

const { CHAINS } = require('./chains');


const createChainButtons = () => {
 
  const rows = [];
  for (let i = 0; i < CHAINS.length; i += 2) {
    const row = [];
    

    row.push({
      text: `${CHAINS[i].emoji} ${CHAINS[i].shortName}`,
      callback_data: `chain:${CHAINS[i].id}`
    });
    
    
    if (i + 1 < CHAINS.length) {
      row.push({
        text: `${CHAINS[i+1].emoji} ${CHAINS[i+1].shortName}`,
        callback_data: `chain:${CHAINS[i+1].id}`
      });
    }
    
    rows.push(row);
  }
  
  return rows;
};


const EXAMPLE_TOKENS = {
  eth: [
    { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' },
    { symbol: 'LINK', name: 'Chainlink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA' },
    { symbol: 'SHIB', name: 'Shiba Inu', address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE' }
  ],
  bsc: [
    { symbol: 'CAKE', name: 'PancakeSwap', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82' },
    { symbol: 'XVS', name: 'Venus', address: '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63' },
    { symbol: 'FLOKI', name: 'Floki', address: '0xfb5B838b6cfEEdC2873aB27866079AC55363D37E' }
  ],
  ftm: [
    { symbol: 'SPIRIT', name: 'SpiritSwap', address: '0x5Cc61A78F164885776AA610fb0FE1257df78E59B' }
  ],
  avax: [
    { symbol: 'JOE', name: 'Trader Joe', address: '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd' }
  ],
  arbi: [
    { symbol: 'MAGIC', name: 'Magic', address: '0x539bdE0d7Dbd336b79148AA742883198BBF60342' }
  ],
  poly: [
    { symbol: 'QUICK', name: 'QuickSwap', address: '0xB5C064F955D8e7F38fE0460C556a72987494eE17' }
  ],
  base: [
    { symbol: 'BEND', name: 'Bend', address: '0x707d4c9e1ee3b2c023f6d76b835c355fcd0fe705' }
  ],
  sol: [
    { symbol: 'JUP', name: 'Jupiter', address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' }
  ],
  cro: [
    { symbol: 'VVS', name: 'VVS Finance', address: '0x2D03bECE6747ADC00E1a131BBA1469C15fD11e03' }
  ],
  sonic: [
    
    { symbol: 'SONIC', name: 'Sonic', address: '0x0000000000000000000000000000000000000000' }
  ]
};


const createExampleTokenButtons = (chainId) => {
  const tokens = EXAMPLE_TOKENS[chainId] || [];
  
  return tokens.map(token => [{
    text: `${token.symbol} - ${token.name}`,
    callback_data: `analyze:${token.address}:${chainId}`
  }]);
};


const createTokenInfoButtons = (address, chain) => {
  return [
    [
      { text: '📊 View Top Holders', callback_data: `holders:${address}:${chain}` },
      { text: '📈 View Market Data', callback_data: `market:${address}:${chain}` }
    ],
    [
      { text: '🔍 View on BubbleMaps', url: `https://app.bubblemaps.io/${chain}/token/${address}` },
      { text: '🔄 Change Network', callback_data: `changechain:${address}` }
    ]
  ];
};

module.exports = {
  CHAIN_KEYBOARD: {
    inline_keyboard: createChainButtons()
  },
  getExampleTokensKeyboard: (chainId) => ({
    inline_keyboard: [
      ...createExampleTokenButtons(chainId),
      [{ text: '« Back to Networks', callback_data: 'chains:back' }]
    ]
  }),
  getTokenInfoKeyboard: (address, chain) => ({
    inline_keyboard: createTokenInfoButtons(address, chain)
  }),
  getBackToTokenKeyboard: (address, chain) => ({
    inline_keyboard: [
      [{ text: '« Back to Token Analysis', callback_data: `analyze:${address}:${chain}` }]
    ]
  }),
  getChainSelectKeyboard: (address) => {
    const keyboard = createChainButtons();
    keyboard.push([{ text: '« Back to Analysis', callback_data: `analyze:${address}:auto` }]);
    
    return {
      inline_keyboard: keyboard
    };
  }
};