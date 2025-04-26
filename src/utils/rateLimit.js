class RateLimiter {
  constructor(limit = 60, interval = 60000) {
    this.limit = limit;
    this.interval = interval;
    this.tokens = limit;
    this.lastRefill = Date.now();
  }
  
  canMakeRequest() {
    this.refillTokens();
    
    if (this.tokens > 0) {
      this.tokens -= 1;
      return true;
    }
    
    return false;
  }
  
  refillTokens() {
    const now = Date.now();
    const elapsedTime = now - this.lastRefill;
    
    if (elapsedTime >= this.interval) {
      this.tokens = this.limit;
      this.lastRefill = now;
    } else if (elapsedTime > 0) {
      const tokensToAdd = Math.floor((elapsedTime / this.interval) * this.limit);
      
      if (tokensToAdd > 0) {
        this.tokens = Math.min(this.limit, this.tokens + tokensToAdd);
        this.lastRefill += Math.floor((tokensToAdd / this.limit) * this.interval);
      }
    }
  }
  
  getWaitTime() {
    if (this.tokens > 0) return 0;
    
    this.refillTokens();
    
    if (this.tokens > 0) return 0;
    
    const timePerToken = this.interval / this.limit;
    return Math.ceil(timePerToken);
  }
  
  reset() {
    this.tokens = this.limit;
    this.lastRefill = Date.now();
  }
}

module.exports = {
  bubblemapsRateLimiter: new RateLimiter(30, 60000),
  coingeckoRateLimiter: new RateLimiter(50, 60000),
  screenshotRateLimiter: new RateLimiter(10, 60000)
};