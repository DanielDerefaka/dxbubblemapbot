const { logger } = require('../utils/logger');
const analyzeCommand = require('./commands/analyzeCommand');
const chainsCommand = require('./commands/chainsCommand');
const chainSelectCallback = require('./callbacks/chainSelect');
const viewHoldersCallback = require('./callbacks/viewHolders');
const viewMetricsCallback = require('./callbacks/viewMetrics');
const viewRiskAssessmentCallback = require('./callbacks/viewRiskAssessment');
const viewTokenActivityCallback = require('./callbacks/viewTokenActivity');

/**

 * @param {TelegramBot} bot 
 * @param {Object} callbackQuery 
 */
async function handleCallbackQuery(bot, callbackQuery) {
  const msg = callbackQuery.message;
  const callbackData = callbackQuery.data;
  
  logger.info(`Received callback query: ${callbackData} from ${callbackQuery.from.id}`);
  
  try {
 
    await bot.answerCallbackQuery(callbackQuery.id);
    
    
    const [action, ...params] = callbackData.split(':');
    
    
    switch (action) {
      case 'analyze':
       
        const address = params[0];
        const chain = params[1] || 'eth';
        
        
        const chainToUse = chain === 'auto' ? 'eth' : chain;
        
        analyzeCommand(bot, msg, address, chainToUse, true);
        break;
        
      case 'chain':
        
        const chainId = params[0];
        chainSelectCallback(bot, msg, chainId);
        break;
        
      case 'chains':
        
        const chainsAction = params[0] || 'list';
        
        if (chainsAction === 'back') {
          chainsCommand(bot, msg);
        }
        break;
        
      case 'holders':
       
        viewHoldersCallback(bot, msg, params[0], params[1] || 'eth');
        break;
        
      case 'market':
       
        viewMetricsCallback(bot, msg, params[0], params[1] || 'eth');
        break;
        
      case 'risk':
      
        viewRiskAssessmentCallback(bot, msg, params[0], params[1] || 'eth');
        break;
        
      case 'activity':
    
        viewTokenActivityCallback(bot, msg, params[0], params[1] || 'eth');
        break;
        
      case 'changechain':
        
        const tokenAddress = params[0];
        
       
        const chainsKeyboard = require('../constants/keyboards').getChainSelectKeyboard(tokenAddress);
        
        await bot.editMessageText(
          '🔗 *Select Blockchain Network*\n\nChoose the blockchain network for this token:',
          {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            reply_markup: chainsKeyboard,
            parse_mode: 'Markdown'
          }
        );
        break;
        
      case 'noop':
       
        break;
        
      default:
        logger.warn(`Unknown callback action: ${action}`);
    }
  } catch (error) {
    logger.error(`Error handling callback query: ${error.message}`);
    
    
    bot.sendMessage(
      msg.chat.id,
      'An error occurred while processing your request. Please try again.'
    );
  }
}

module.exports = {
  handleCallbackQuery
};