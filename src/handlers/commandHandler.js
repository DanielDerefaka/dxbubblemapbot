
const { logger } = require('../utils/logger');
const startCommand = require('./commands/startCommand');
const helpCommand = require('./commands/helpCommand');
const analyzeCommand = require('./commands/analyzeCommand');
const chainsCommand = require('./commands/chainsCommand');
const { extractContractAddress, isValidContractAddress } = require('../utils/validator');
const { defaultChain } = require('../config/config');

/**
 * @param {TelegramBot} bot
 * @param {Object} msg 
 */
function handleCommand(bot, msg) {
  const chatId = msg.chat.id;
  const text = msg.text || '';
  
  logger.info(`Received command: ${text} from ${msg.from.id}`);
  
  try {

    const parts = text.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    
   
    switch (command) {
      case '/start':
        startCommand(bot, msg);
        break;
        
      case '/help':
        helpCommand(bot, msg);
        break;
        
      case '/analyze':
      
        const address = args.join(' ').trim();
        
        if (!address) {
          bot.sendMessage(chatId, 'Please provide a contract address. Example: /analyze 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984');
          return;
        }
        
        handleAddressAnalysis(bot, msg, address);
        break;
        
      case '/chains':
        chainsCommand(bot, msg);
        break;
        
      default:
       
        const extractedAddress = extractContractAddress(text);
        
        if (extractedAddress) {
       
          analyzeCommand(bot, msg, extractedAddress, defaultChain);
        } else {
          // Unknown command
          bot.sendMessage(chatId, 'Unknown command. Type /help to see available commands.');
        }
    }
  } catch (error) {
    logger.error(`Error handling command: ${error.message}`);
    bot.sendMessage(chatId, 'An error occurred while processing your command. Please try again.');
  }
}

/**
 * @param {TelegramBot} bot 
 * @param {Object} msg 
 */
function handleMessage(bot, msg) {
  const chatId = msg.chat.id;
  const text = msg.text || '';
  

  if (!text) return;
  
  
  const trimmedText = text.trim();
  
  logger.info(`Received message: ${trimmedText.substring(0, 20)}... from ${msg.from.id}`);
  
  try {
    
    handleAddressAnalysis(bot, msg, trimmedText);
  } catch (error) {
    logger.error(`Error handling message: ${error.message}`);
    bot.sendMessage(chatId, 'An error occurred while processing your message. Please try again.');
  }
}

/**
 * @param {TelegramBot} bot 
 * @param {Object} msg 
 * @param {string} text 
 */
function handleAddressAnalysis(bot, msg, text) {
  const chatId = msg.chat.id;
  

  let contractAddressInput = text;
  let chain = defaultChain;
  
  if (text.includes(':')) {
    const parts = text.split(':');
    contractAddressInput = parts[0].trim();
    chain = parts[1].trim();
  }
  
 
  const extractedAddress = extractContractAddress(contractAddressInput);
  
  if (extractedAddress && isValidContractAddress(extractedAddress, chain)) {

    analyzeCommand(bot, msg, extractedAddress, chain);
  } else {
 
    bot.sendMessage(
      chatId,
      'Please send me a valid contract address or use one of the available commands. Type /help to see available commands.'
    );
  }
}

module.exports = {
  handleCommand,
  handleMessage,
  handleAddressAnalysis
};