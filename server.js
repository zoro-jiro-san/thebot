#!/usr/bin/env node

/**
 * Standalone Node.js Server for TheBot
 * Runs the bot API without Docker or Next.js
 * 
 * Usage: node server.js
 * Configure: Set environment variables in .env
 */

import http from 'http';
import url from 'url';
import { POST, GET } from './api/index.js';

const PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1';

const server = http.createServer(async (req, res) => {
  // Parse URL
  const parsedUrl = url.parse(req.url, true);
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  try {
    // Read request body
    let bodyData = '';
    await new Promise((resolve, reject) => {
      req.on('data', chunk => {
        bodyData += chunk;
      });
      req.on('end', resolve);
      req.on('error', reject);
    });
    
    // Create a proper Request-like object
    const fullUrl = `http://${req.headers.host || 'localhost'}${req.url}`;
    const request = {
      url: fullUrl,
      method: req.method,
      headers: new Map(Object.entries(req.headers)),
      get(key) {
        return this.headers.get(key);
      },
      json: async () => {
        try {
          return JSON.parse(bodyData || '{}');
        } catch {
          return {};
        }
      },
      text: async () => bodyData,
      clone: function() {
        return {
          ...this,
          json: async () => {
            try {
              return JSON.parse(bodyData || '{}');
            } catch {
              return {};
            }
          }
        };
      }
    };
    
    // Route to appropriate handler
    let response;
    if (req.method === 'POST') {
      response = await POST(request);
    } else if (req.method === 'GET') {
      response = await GET(request);
    } else {
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }
    
    // Handle the response
    if (response instanceof Response) {
      const status = response.status || 200;
      const body = await response.text();
      res.writeHead(status, response.headers || {});
      res.end(body);
    } else {
      // If it's a plain object, stringify it
      res.writeHead(200);
      res.end(JSON.stringify(response));
    }
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal server error', message: err.message }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                      🏰 TheBot Server                          ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Server:     http://${HOST}:${PORT}                           
║  API:        http://${HOST}:${PORT}/api/*                     
║  Status:     http://${HOST}:${PORT}/api/ping                  
║                                                                ║
║  Local LLM:  http://127.0.0.1:11434 (Ollama - Qwen 0.5B)    
║                                                                ║
║  Press Ctrl+C to stop                                         
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    process.exit(0);
  });
});
