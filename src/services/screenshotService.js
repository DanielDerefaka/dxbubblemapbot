const puppeteer = require('puppeteer');
const { logger } = require('../utils/logger');
const { getBubbleMapUrl } = require('./bubblemapsService');
const { puppeteerArgs } = require('../config/config');

async function generateBubbleMapScreenshot(contractAddress, chain) {
  let browser = null;
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: puppeteerArgs
    });
    
    const page = await browser.newPage();
    
    await page.setViewport({
      width: 1200,
      height: 900,
      deviceScaleFactor: 1.5
    });
    
    const url = getBubbleMapUrl(contractAddress, chain);
    logger.info(`Generating screenshot for: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForTimeout(5000);
    
    const is404 = await page.evaluate(() => {
      const bodyText = document.body.innerText || '';
      return bodyText.includes('404') || 
             bodyText.includes('not found') || 
             bodyText.includes('error loading');
    });
    
    if (is404) {
      logger.warn(`404 or error page detected for ${url}`);
      
      try {
        const hasSwitcher = await page.evaluate(() => {
          return !!document.querySelector('.chain-switcher, .chain-selector, [data-chain]');
        });
        
        if (hasSwitcher) {
          logger.info(`Found chain switcher, trying to select ${chain}`);
          
          const chainNames = {
            'eth': 'Ethereum',
            'bsc': 'BSC',
            'ftm': 'FTM',
            'avax': 'AVAX',
            'cro': 'CRO',
            'arbi': 'Arbitrum',
            'poly': 'Polygon',
            'base': 'Base',
            'sol': 'Solana',
            'sonic': 'Sonic'
          };
          
          await page.evaluate((chainId, names) => {
            const selectors = [
              `.chain-switcher [data-chain="${chainId}"]`,
              `.chain-selector [data-value="${chainId}"]`,
              `button:has-text("${names[chainId]}")`,
              `div[role="button"]:has-text("${names[chainId]}")`,
              `.dropdown-item:has-text("${names[chainId]}")`
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element) {
                element.click();
                return true;
              }
            }
            
            const buttons = document.querySelectorAll('button, [role="button"], .clickable');
            for (const button of buttons) {
              if (button.textContent.includes(names[chainId])) {
                button.click();
                return true;
              }
            }
            
            return false;
          }, chain, chainNames);
          
          await page.waitForTimeout(5000);
        }
      } catch (chainSelectionError) {
        logger.warn(`Error selecting chain: ${chainSelectionError.message}`);
      }
    }
    
    const containerSelectors = [
      '.visualization-container',
      '#bubblemap',
      '.bubblemap-container',
      '.chart-container',
      
      chain === 'sol' ? '.solana-visualization' : '.ethereum-visualization',
      
      'main',
      '#app-content',
      '.page-content',
      'body'
    ];
    
    let screenshot = null;
    
    for (const selector of containerSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          logger.info(`Taking screenshot of element with selector: ${selector}`);
          screenshot = await element.screenshot({
            type: 'png',
            omitBackground: false,
            encoding: 'binary'
          });
          break;
        }
      } catch (elementError) {
      }
    }
    
    if (!screenshot) {
      logger.info('Taking full page screenshot as fallback');
      screenshot = await page.screenshot({
        type: 'png',
        fullPage: false,
        encoding: 'binary'
      });
    }
    
    return screenshot;
  } catch (error) {
    logger.error(`Error generating screenshot: ${error.message}`);
    throw new Error('Failed to generate bubble map visualization');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function isBubbleMapAvailable(contractAddress, chain) {
  let browser = null;
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: puppeteerArgs
    });
    
    const page = await browser.newPage();
    const url = getBubbleMapUrl(contractAddress, chain);
    
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 15000
    });
    
    const hasError = await page.evaluate(() => {
      const errorText = document.body.innerText || '';
      return errorText.includes('404') || 
             errorText.includes('not found') || 
             errorText.includes('error loading');
    });
    
    return !hasError;
  } catch (error) {
    logger.warn(`Error checking bubble map availability: ${error.message}`);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  generateBubbleMapScreenshot,
  isBubbleMapAvailable
};