const { getTokenData } = require('../../services/bubblemapsService');
const { getTokenMarketData } = require('../../services/marketDataService');
const { formatMarketData } = require('../../utils/formatter');
const { getBackToTokenKeyboard } = require('../../constants/keyboards');
const { logger } = require('../../utils/logger');

/**
 
 * @param {TelegramBot} bot 
 * @param {Object} msg 
 * @param {string} address 
 * @param {string} chain 
 */
async function viewMetricsCallback(bot, msg, address, chain) {
  const chatId = msg.chat.id;
  
  try {
   
    await bot.editMessageText(
      '📈 *Loading market data...*',
      {
        chat_id: chatId,
        message_id: msg.message_id,
        parse_mode: 'Markdown'
      }
    );
    
   
    const [tokenData, marketData] = await Promise.all([
      getTokenData(address, chain),
      getTokenMarketData(address, chain)
    ]);
    
   
    const marketText = formatMarketData(tokenData, marketData);
    
    
    const keyboard = getBackToTokenKeyboard(address, chain);
    
 
    await bot.editMessageText(marketText, {
      chat_id: chatId,
      message_id: msg.message_id,
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    logger.error(`Error fetching market data: ${error.message}`);
    
 
    await bot.editMessageText(
      '❌ Could not fetch market data. Please try again later.',
      {
        chat_id: chatId,
        message_id: msg.message_id,
        reply_markup: getBackToTokenKeyboard(address, chain)
      }
    );
  }
}

module.exports = viewMetricsCallback;