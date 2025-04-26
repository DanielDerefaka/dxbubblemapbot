
module.exports = {
    START_MESSAGE: `
  🔍 *Welcome to BubbleMaps Bot!* 🔍
  
  Analyze any cryptocurrency token with detailed insights and visualizations from BubbleMaps.
  
  *What can I do?*
  • Generate interactive bubble map visualizations
  • Show token decentralization scores
  • Display supply distribution data
  • Provide market information
  
  *How to use:*
  Just send me a token contract address or use the /analyze command followed by an address.
  
  Example: /analyze 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984
  
  Use /help to see all available commands.
    `,
    
    HELP_MESSAGE: `
  📚 *BubbleMaps Bot Help* 📚
  
  *Available Commands:*
  • /start - Start the bot and get a welcome message
  • /help - Display this help message
  • /analyze <address> - Analyze a token by its contract address
  • /chains - View supported blockchain networks
  
  *Quick Usage:*
  1. Simply paste any contract address
  2. Select the blockchain network if needed
  3. Receive detailed token analysis and visualization
  
  *About Decentralization Score:*
  The score (0-100%) indicates how well distributed a token is. Higher scores mean less concentration risk.
  
  *Need More Help?*
  Visit [bubblemaps.io](https://bubblemaps.io) for more information.
    `,
    
    SUPPORTED_CHAINS_MESSAGE: `
  🔗 *Supported Blockchain Networks* 🔗
  
  Select a network to see example tokens from that chain:
    `,
    
    LOADING_MESSAGE: '🔍 *Analyzing token...* Please wait while I gather data.',
    
    GENERATING_SCREENSHOT: '📊 *Generating bubble map visualization...*',
    
    ERROR_INVALID_ADDRESS: '❌ Please provide a valid contract address (0x followed by 40 hexadecimal characters)',
    
    ERROR_FETCHING_DATA: '❌ Error fetching token data. Please check the contract address and try again.',
    
    ERROR_GENERATING_SCREENSHOT: '❌ Error generating bubble map visualization. Please try again later.',
    
    NO_RESULTS_FOUND: '❌ No results found for this token. Please check the contract address and blockchain network.',
    
    EXAMPLE_TOKEN_MESSAGE: chain => `
  🔗 *Example ${chain.name} Tokens* 🔗
  
  Click on any address to analyze:
    `
  };
  