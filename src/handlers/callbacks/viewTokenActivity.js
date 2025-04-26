const { getTokenData } = require('../../services/bubblemapsService');
const { getWhaleActivityAnalysis, getSignificantTransactions } = require('../../services/tokenActivityService');
const { getBackToTokenKeyboard } = require('../../constants/keyboards');
const { logger } = require('../../utils/logger');

/**
 
 * @param {TelegramBot} bot
 * @param {Object} msg 
 * @param {string} address 
 * @param {string} chain 
 */
async function viewTokenActivityCallback(bot, msg, address, chain) {
  const chatId = msg.chat.id;
  
  try {

    await bot.editMessageText(
      '🔄 *Analyzing recent activity...*',
      {
        chat_id: chatId,
        message_id: msg.message_id,
        parse_mode: 'Markdown'
      }
    );
    
  
    const [tokenData, whaleActivity, transactions] = await Promise.all([
      getTokenData(address, chain),
      getWhaleActivityAnalysis(address, chain),
      getSignificantTransactions(address, chain)
    ]);
    
    
    let activityText = `🔄 *Recent Activity: ${tokenData.name} (${tokenData.symbol})* 🔄\n\n`;
    
    
    if (whaleActivity && whaleActivity.alert) {
      activityText += `*Whale Activity Alert:*\n`;
      activityText += `• ${whaleActivity.alert}\n\n`;
    }
    
  
    if (transactions && transactions.length > 0) {
      activityText += `*Significant Transactions:*\n`;
      
      transactions.forEach((tx, index) => {
        const date = new Date(tx.timestamp);
        const formattedDate = `${date.toISOString().split('T')[0]} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        activityText += `${index + 1}. ${formattedDate}\n`;
        activityText += `   Amount: ${tx.value.toFixed(2)} ${tx.symbol}\n`;
        activityText += `   From: \`${tx.from.substring(0, 8)}...\`\n`;
        activityText += `   To: \`${tx.to.substring(0, 8)}...\`\n`;
        
        if (tx.isWhaleMovement) {
          activityText += `   🐋 Whale Movement\n`;
        }
        
        if (index < transactions.length - 1) {
          activityText += `\n`;
        }
      });
    } else {
      activityText += `No significant transactions found in recent history.\n`;
    }
    
    
    activityText += `\n*View all transactions:*\n`;
    
    const explorerLinks = {
      'eth': `https://etherscan.io/token/${address}`,
      'bsc': `https://bscscan.com/token/${address}`,
      'ftm': `https://ftmscan.com/token/${address}`,
      'avax': `https://snowtrace.io/token/${address}`,
      'poly': `https://polygonscan.com/token/${address}`,
      'arbi': `https://arbiscan.io/token/${address}`,
      'base': `https://basescan.org/token/${address}`,
      'sol': `https://solscan.io/token/${address}`,
      'cro': `https://cronoscan.com/token/${address}`
    };
    
    const explorerUrl = explorerLinks[chain] || `https://etherscan.io/token/${address}`;
    activityText += `[View on Explorer](${explorerUrl})`;
    
 
    const keyboard = getBackToTokenKeyboard(address, chain);
    
 
    await bot.editMessageText(activityText, {
      chat_id: chatId,
      message_id: msg.message_id,
      parse_mode: 'Markdown',
      reply_markup: keyboard,
      disable_web_page_preview: true
    });
  } catch (error) {
    logger.error(`Error fetching token activity: ${error.message}`);
    
    
    await bot.editMessageText(
      '❌ Could not fetch token activity data. Please try again later.',
      {
        chat_id: chatId,
        message_id: msg.message_id,
        reply_markup: getBackToTokenKeyboard(address, chain)
      }
    );
  }
}

module.exports = viewTokenActivityCallback;