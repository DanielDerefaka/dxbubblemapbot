
# BubbleMaps Telegram Bot

A Telegram bot that provides token analysis and visualizations using BubbleMaps.

## Features

- 📍 Generate bubble map screenshots for any token
- 📊 Display token decentralization scores
- 📦 Show supply distribution breakdowns
- 📈 Fetch live market information
- 🌐 Support for multiple blockchain networks

## How It Works

The bot connects to the BubbleMaps API to retrieve token data and generate visualizations. Users can interact with the bot through commands or by directly sending contract addresses.

### Available Commands

- `/start` - Start the bot and get a welcome message
- `/help` - Display help information
- `/analyze <address>` - Analyze a token by its contract address
- `/chains` - View supported blockchain networks

## Quick Start

1. Search for `@dxbubblemapbot` on Telegram
2. Send a contract address or use the `/analyze` command
3. View detailed token analysis and visualization

## Supported Blockchain Networks

- Ethereum (ETH)
- BNB Smart Chain (BSC)
- Fantom (FTM)
- Avalanche (AVAX)
- Polygon (MATIC)
- Arbitrum (ARB)
- Cronos (CRO)
- Base
- Solana (SOL)
- Sonic

## Installation

### Prerequisites

- Node.js 16.x or higher
- npm or yarn
- A Telegram Bot Token (from BotFather)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/DanielDerefaka/dxbubblemapbot.git
   cd bubblemaps-telegram-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file in the project root
   - Add the following variables:
     ```
     TELEGRAM_BOT_TOKEN=your_telegram_bot_token
     BUBBLEMAPS_API_KEY=your_bubblemaps_api_key_optional
     COINGECKO_API_KEY=your_coingecko_api_key_optional
     DEFAULT_CHAIN=eth
     LOG_LEVEL=info
     ```

4. Start the bot:
   ```bash
   npm start
   ```

### Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t bubblemaps-telegram-bot .
   ```

2. Run the container:
   ```bash
   docker run -d --env-file .env --name bubblemaps-bot bubblemaps-telegram-bot
   ```