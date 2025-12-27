/**
 * Express server for Hash Analyzer API
 */
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { loadHashPatterns, analyzeInput } from './detector';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Load hash patterns at startup
loadHashPatterns().then(() => {
  console.log('Hash patterns loaded successfully');
}).catch((error) => {
  console.error('Failed to load hash patterns:', error);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Hash Analyzer API is running',
    timestamp: new Date().toISOString()
  });
});

// Main analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    console.log('Received analyze request:', { body: req.body, headers: req.headers });
    
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      console.error('Invalid request body:', req.body);
      return res.status(400).json({
        success: false,
        error: 'Invalid request body. Expected JSON object.'
      });
    }
    
    const { input, inputs } = req.body;
    
    // Validate input parameters
    if (!input && !inputs) {
      console.error('Missing input parameters');
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters. Provide either "input" (string) or "inputs" (array)'
      });
    }
    
    // Handle single input
    if (input !== undefined) {
      if (typeof input !== 'string') {
        console.error('Invalid input type:', typeof input);
        return res.status(400).json({
          success: false,
          error: 'Input must be a string'
        });
      }
      
      if (!input.trim()) {
        console.error('Empty input string');
        return res.status(400).json({
          success: false,
          error: 'Input cannot be empty'
        });
      }
      
      console.log('Analyzing single input:', input.substring(0, 50) + '...');
      const result = analyzeInput(input.trim());
      console.log('Analysis completed successfully');
      
      return res.json({
        success: true,
        data: result
      });
    }
    
    // Handle multiple inputs
    if (inputs !== undefined) {
      if (!Array.isArray(inputs)) {
        console.error('Invalid inputs type:', typeof inputs);
        return res.status(400).json({
          success: false,
          error: 'Inputs must be an array'
        });
      }
      
      if (inputs.length === 0) {
        console.error('Empty inputs array');
        return res.status(400).json({
          success: false,
          error: 'Inputs array cannot be empty'
        });
      }
      
      console.log('Analyzing multiple inputs:', inputs.length);
      const results = inputs
        .filter((inp: any) => typeof inp === 'string' && inp.trim())
        .map((inp: string) => {
          console.log('Processing input:', inp.substring(0, 50) + '...');
          return analyzeInput(inp.trim());
        });
      
      console.log('Multiple analysis completed successfully');
      return res.json({
        success: true,
        data: results
      });
    }
    
    console.error('No valid input provided');
    return res.status(400).json({
      success: false,
      error: 'Invalid request. Provide either "input" (string) or "inputs" (array)'
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Hash Analyzer API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Analysis endpoint: http://localhost:${PORT}/api/analyze`);
});
