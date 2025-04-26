function isValidContractAddress(address, chain = 'eth') {
  if (!address) return false;
  
  if (chain === 'sol') {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  } else {
    return /^0x[a-fA-F0-9]{40}$/i.test(address);
  }
}

function extractContractAddress(text) {
  if (!text) return null;
  
  const ethMatch = text.match(/0x[a-fA-F0-9]{40}/);
  if (ethMatch) return ethMatch[0];
  
  const solMatch = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
  if (solMatch) return solMatch[0];
  
  return null;
}

function isValidChain(chainId, supportedChains = ['eth', 'bsc', 'ftm', 'avax', 'cro', 'arbi', 'poly', 'base', 'sol', 'sonic']) {
  if (!chainId) return false;
  return supportedChains.includes(chainId.toLowerCase());
}

function detectChain(address) {
  if (!address) return 'eth';
  
  if (!address.startsWith('0x') && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return 'sol';
  }
  
  return 'eth';
}

module.exports = {
  isValidContractAddress,
  extractContractAddress,
  isValidChain,
  detectChain
};