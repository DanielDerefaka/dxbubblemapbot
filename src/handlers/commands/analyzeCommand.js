const { getTokenData } = require('../../services/bubblemapsService');
const { getTokenMarketData } = require('../../services/marketDataService');
const { generateBubbleMapScreenshot } = require('../../services/screenshotService');
const { calculateRiskMetrics, getInvestmentInsights } = require('../../services/riskAssessmentService');
const { getWhaleActivityAnalysis } = require('../../services/tokenActivityService');
const { formatEnhancedTokenData } = require('../../utils/enhancedFormatter');
const { isValidContractAddress } = require('../../utils/validator');
const { ERROR_INVALID_ADDRESS, LOADING_MESSAGE, GENERATING_SCREENSHOT, ERROR_FETCHING_DATA } = require('../../constants/messages');
const { getTokenInfoKeyboard } = require('../../constants/keyboards');
const { logger } = require('../../utils/logger');
const { getChainEmoji } = require('../../utils/enhancedFormatter');

/**
 
 * @param {TelegramBot} bot 
 * @param {Object} msg 
 * @param {string} address 
 * @param {string} chain 
 * @param {boolean} editMessage 
 */
async function analyzeCommand(bot, msg, address, chain = 'eth', editMessage = false) {
  const chatId = msg.chat.id;
  

  if (!isValidContractAddress(address, chain)) {
    bot.sendMessage(chatId, ERROR_INVALID_ADDRESS);
    return;
  }
  

  let loadingMsg;
  
  if (editMessage && msg.message_id) {
   
    await bot.editMessageText(LOADING_MESSAGE, {
      chat_id: chatId,
      message_id: msg.message_id,
      parse_mode: 'Markdown'
    });
    loadingMsg = msg;
  } else {
    
    loadingMsg = await bot.sendMessage(chatId, LOADING_MESSAGE, {
      parse_mode: 'Markdown'
    });
  }
  
  try {
    logger.info(`Analyzing token: ${address} on chain: ${chain}`);
    
    
    const [tokenData, marketData, activityData] = await Promise.all([
      getTokenData(address, chain),
      getTokenMarketData(address, chain),
      getWhaleActivityAnalysis(address, chain)
    ]);
    
  
    const riskMetrics = calculateRiskMetrics(tokenData, marketData);
    

    const formattedData = formatEnhancedTokenData(tokenData, marketData, riskMetrics, activityData);
    
   
    const keyboard = getEnhancedTokenInfoKeyboard(address, chain);
    
  
    await bot.editMessageText(formattedData, {
      chat_id: chatId,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
    

    const screenshotMsg = await bot.sendMessage(chatId, GENERATING_SCREENSHOT, {
      parse_mode: 'Markdown'
    });
    
    try {
   
      const screenshot = await generateBubbleMapScreenshot(address, chain);
      
   
      const insights = getInvestmentInsights(tokenData, marketData, riskMetrics);
      
      
      const caption = `${getChainEmoji(chain)} *${tokenData.name} (${tokenData.symbol})* - Decentralization Score: ${tokenData.stats.decentralizationScore.toFixed(2)}%\n\n${insights.summary.substring(0, 100)}...`;
      
      
      await bot.sendPhoto(chatId, screenshot, {
        caption: caption,
        parse_mode: 'Markdown'
      });
      
      
      await bot.deleteMessage(chatId, screenshotMsg.message_id);
    } catch (screenshotError) {
      logger.error(`Error generating screenshot: ${screenshotError.message}`);
      
      
      await bot.editMessageText(
        '❌ Could not generate bubble map visualization. You can view it directly on BubbleMaps website.',
        {
          chat_id: chatId,
          message_id: screenshotMsg.message_id
        }
      );
    }
  } catch (error) {
    logger.error(`Error analyzing token: ${error.message}`);
    
   
    await bot.editMessageText(
      `${ERROR_FETCHING_DATA}\n\nError: ${error.message}`,
      {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      }
    );
  }
}

/**
 
 * @param {string} address 
 * @param {string} chain 
 * @returns {Object} 
 */
function getEnhancedTokenInfoKeyboard(address, chain) {
  return {
    inline_keyboard: [
      [
        { text: '📊 View Top Holders', callback_data: `holders:${address}:${chain}` },
        { text: '📈 View Market Data', callback_data: `market:${address}:${chain}` }
      ],
      [
        { text: '⚠️ Risk Assessment', callback_data: `risk:${address}:${chain}` },
        { text: '🔄 Recent Activity', callback_data: `activity:${address}:${chain}` }
      ],
      [
        { text: '🔍 View on BubbleMaps', url: `https://app.bubblemaps.io/token/${address}?chain=${chain}` },
        { text: '🔄 Change Network', callback_data: `changechain:${address}` }
      ]
    ]
  };
}

module.exports = analyzeCommand;