
class Cache {
    constructor(ttl = 300000) { 
      this.cache = new Map();
      this.ttl = ttl;
    }
    
    
    get(key) {
      if (!this.cache.has(key)) return null;
      
      const { value, expiry } = this.cache.get(key);
      
      
      if (Date.now() > expiry) {
        this.cache.delete(key);
        return null;
      }
      
      return value;
    }
    
    
    set(key, value, customTtl = null) {
      const ttl = customTtl || this.ttl;
      const expiry = Date.now() + ttl;
      
      this.cache.set(key, { value, expiry });
    }
    
    delete(key) {
      this.cache.delete(key);
    }
    
    cleanup() {
      const now = Date.now();
      
      for (const [key, { expiry }] of this.cache.entries()) {
        if (now > expiry) {
          this.cache.delete(key);
        }
      }
    }
    
    clear() {
      this.cache.clear();
    }
    
    size() {
      return this.cache.size;
    }
  }
  
  module.exports = {
    
    tokenCache: new Cache(300000), 
    marketCache: new Cache(60000), 
    screenshotCache: new Cache(600000) 
  };