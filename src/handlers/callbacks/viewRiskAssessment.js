const { getTokenData } = require('../../services/bubblemapsService');
const { getTokenMarketData } = require('../../services/marketDataService');
const { calculateRiskMetrics } = require('../../services/riskAssessmentService');
const { formatRiskSection } = require('../../utils/enhancedFormatter');
const { getBackToTokenKeyboard } = require('../../constants/keyboards');
const { logger } = require('../../utils/logger');

/**
 
 * @param {TelegramBot} bot 
 * @param {Object} msg 
 * @param {string} address 
 * @param {string} chain 
 */
async function viewRiskAssessmentCallback(bot, msg, address, chain) {
  const chatId = msg.chat.id;
  
  try {
 
    await bot.editMessageText(
      '⚠️ *Calculating risk assessment...*',
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
    
  
    const riskMetrics = calculateRiskMetrics(tokenData, marketData);
    
    
    let riskText = `⚠️ *Risk Assessment: ${tokenData.name} (${tokenData.symbol})* ⚠️\n\n`;
    
   
    riskText += formatRiskSection(riskMetrics);
    

    riskText += `*Understanding the Risks:*\n`;
    riskText += `• Concentration Risk - Measures how concentrated token holdings are\n`;
    riskText += `• Liquidity Risk - Evaluates trading volume relative to market cap\n`;
    riskText += `• Volatility Risk - Assesses price stability over time\n\n`;
    
    
    if (riskMetrics.riskFactors && riskMetrics.riskFactors.length > 0) {
      riskText += `*Detailed Risk Factors:*\n`;
      riskMetrics.riskFactors.forEach(factor => {
        riskText += `• ${factor}\n`;
      });
      riskText += '\n';
    }
    
    
    if (riskMetrics.safetyFactors && riskMetrics.safetyFactors.length > 0) {
      riskText += `*Positive Factors:*\n`;
      riskMetrics.safetyFactors.forEach(factor => {
        riskText += `• ${factor}\n`;
      });
    }
    
    
    const keyboard = getBackToTokenKeyboard(address, chain);
    
    
    await bot.editMessageText(riskText, {
      chat_id: chatId,
      message_id: msg.message_id,
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    logger.error(`Error generating risk assessment: ${error.message}`);
    
   
    await bot.editMessageText(
      '❌ Could not generate risk assessment. Please try again later.',
      {
        chat_id: chatId,
        message_id: msg.message_id,
        reply_markup: getBackToTokenKeyboard(address, chain)
      }
    );
  }
}

module.exports = viewRiskAssessmentCallback;