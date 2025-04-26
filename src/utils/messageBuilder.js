
function buildWelcomeMessage(firstName) {
    return {
      text: `👋 Welcome to BubbleMaps Bot, ${firstName}!\n\n` +
            'I can help you analyze any token supported by BubbleMaps to understand its ' +
            'distribution, decentralization score, and more.\n\n' +
            'To get started, send me a token contract address or use /analyze command.',
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📊 View Supported Chains', callback_data: 'chains:list' },
            { text: '❓ How to Use', callback_data: 'help' }
          ]
        ]
      }
    };
  }
  