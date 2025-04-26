
const CHAINS = [
  { id: 'eth', name: 'Ethereum', emoji: '💠', shortName: 'ETH' },
  { id: 'bsc', name: 'BNB Smart Chain', emoji: '🔶', shortName: 'BSC' },
  { id: 'ftm', name: 'Fantom', emoji: '👻', shortName: 'FTM' },
  { id: 'avax', name: 'Avalanche', emoji: '❄️', shortName: 'AVAX' },
  { id: 'cro', name: 'Cronos', emoji: '🔵', shortName: 'CRO' },
  { id: 'arbi', name: 'Arbitrum', emoji: '🔵', shortName: 'ARB' },
  { id: 'poly', name: 'Polygon', emoji: '💜', shortName: 'MATIC' },
  { id: 'base', name: 'Base', emoji: '🔵', shortName: 'BASE' },
  { id: 'sol', name: 'Solana', emoji: '💙', shortName: 'SOL' },
  { id: 'sonic', name: 'Sonic', emoji: '💨', shortName: 'SONIC' }
];

function getChainById(id) {
  return CHAINS.find(chain => chain.id === id) || CHAINS[0];
}

function getChainName(id) {
  const chain = getChainById(id);
  return chain ? chain.name : 'Unknown Chain';
}

function getChainEmoji(id) {
  const chain = getChainById(id);
  return chain ? chain.emoji : '🔗';
}

function getChainIds() {
  return CHAINS.map(chain => chain.id);
}

function isValidChain(id) {
  return getChainIds().includes(id);
}

module.exports = {
  CHAINS,
  getChainById,
  getChainName,
  getChainEmoji,
  getChainIds,
  isValidChain
};