/**
 * Hash detection logic
 */
import * as fs from 'fs-extra';
import * as path from 'path';
import {
  isHex,
  isBase64,
  isAscii,
  shannonEntropy,
  safeBase64Decode,
  safeHexDecode,
  getCharset,
  getCharStats,
  decodeROT13,
  decodeURL,
  decodeBinary,
  decodeOctal,
  decodeUnicode,
  decodeHTML
} from './utils';

interface HashPattern {
  name: string;
  length?: number;
  charset?: string;
  prefixes?: string[];
  suffixes?: string[];
  example?: string;
  source?: string;
  regex?: string;
  notes?: string;
}

interface DetectionResult {
  id: string;
  name: string;
  score: number;
  color: 'green' | 'yellow' | 'red';
  reasons: string[];
}

interface AnalysisResult {
  input: string;
  results: DetectionResult[];
  stats: ReturnType<typeof getCharStats>;
  decoding: {
    base64?: string;
    hex?: string;
  };
  freq: { [key: string]: number };
}

let hashPatterns: { [key: string]: HashPattern } = {};

export async function loadHashPatterns(): Promise<void> {
  try {
    const patternsPath = path.join(__dirname, '../data/hash_patterns.json');
    const data = await fs.readJson(patternsPath);
    hashPatterns = data;
    console.log(`Loaded ${Object.keys(hashPatterns).length} hash patterns`);
  } catch (error) {
    console.error('Failed to load hash patterns:', error);
    hashPatterns = {};
  }
}

export function detectCandidates(input: string): DetectionResult[] {
  try {
    console.log('Starting candidate detection...');
    
    if (!input || typeof input !== 'string') {
      console.error('Invalid input for detectCandidates:', input);
      return [];
    }
    
    const candidates: DetectionResult[] = [];
    const inputLength = input.length;
    
    console.log('Getting charset and entropy...');
    const charset = getCharset(input);
    const entropy = shannonEntropy(input);
    
    console.log('Hash patterns loaded:', Object.keys(hashPatterns).length);
    
    // Check against all patterns
    for (const [patternId, pattern] of Object.entries(hashPatterns)) {
    let score = 0;
    const reasons: string[] = [];
    let hasRegexMatch = false;
    let hasPrefixMatch = false;
    
    // 1. Regex matching (highest priority - weight: 0.4)
    if (pattern.regex) {
      try {
        const regex = new RegExp(pattern.regex);
        if (regex.test(input)) {
          score += 0.4;
          reasons.push('Regex pattern match');
          hasRegexMatch = true;
        }
      } catch (e) {
        // Invalid regex, skip
      }
    }
    
    // 2. Prefix matching (weight: 0.25)
    if (pattern.prefixes && pattern.prefixes.length > 0) {
      for (const prefix of pattern.prefixes) {
        if (input.startsWith(prefix)) {
          score += 0.25;
          reasons.push(`Prefix match (${prefix})`);
          hasPrefixMatch = true;
          break;
        }
      }
    }
    
    // 3. **FUZZY LENGTH MATCHING** - Allow ±4 character difference
    if (pattern.length) {
      const lengthDiff = Math.abs(inputLength - pattern.length);
      if (lengthDiff === 0) {
        score += 0.4;
        reasons.push(`Exact length match (${pattern.length})`);
      } else if (lengthDiff <= 4) {
        score += 0.3; // Reduced but still significant for fuzzy match
        reasons.push(`Fuzzy length match (${pattern.length} vs ${inputLength}, diff: ${lengthDiff})`);
      } else if (lengthDiff <= 8) {
        score += 0.1; // Small bonus for close matches
        reasons.push(`Near length match (${pattern.length} vs ${inputLength}, diff: ${lengthDiff})`);
      }
    }
    
    // 4. **FLEXIBLE CHARSET MATCHING** - Inclusive comparison
    if (pattern.charset) {
      let charsetMatch = false;
      
      // Direct charset match
      if (pattern.charset === charset) {
        score += 0.2;
        reasons.push(`Charset match (${charset})`);
        charsetMatch = true;
      }
      
      // Check decoded content charset
      const base64Decoded = safeBase64Decode(input);
      const hexDecoded = safeHexDecode(input);
      
      if (base64Decoded && pattern.charset === getCharset(base64Decoded)) {
        score += 0.15;
        reasons.push(`Decoded charset match (${pattern.charset})`);
        charsetMatch = true;
      }
      
      if (hexDecoded && pattern.charset === getCharset(hexDecoded)) {
        score += 0.15;
        reasons.push(`Decoded charset match (${pattern.charset})`);
        charsetMatch = true;
      }
      
      // Minor charset variations (e.g., hex case differences)
      if (!charsetMatch && pattern.charset === 'hex' && (charset === 'hex' || charset === 'alphanum')) {
        score += 0.1;
        reasons.push(`Charset variation match (${charset} -> ${pattern.charset})`);
      }
    }
    
    // 5. Suffix matching (weight: 0.1)
    if (pattern.suffixes && pattern.suffixes.length > 0) {
      for (const suffix of pattern.suffixes) {
        if (input.endsWith(suffix)) {
          score += 0.1;
          reasons.push(`Suffix match (${suffix})`);
          break;
        }
      }
    }
    
    // 6. **DYNAMIC ENTROPY BONUS** - Threshold based on hash length
    const entropyThreshold = Math.max(2.5, Math.min(4.0, 3.0 + (inputLength / 50)));
    if (entropy > entropyThreshold) {
      score += 0.1;
      reasons.push(`High entropy (${entropy.toFixed(2)}, threshold: ${entropyThreshold.toFixed(2)})`);
    }
    
    // 7. **DECODING AWARENESS** - Enhanced decoding bonus
    const base64Decoded = safeBase64Decode(input);
    const hexDecoded = safeHexDecode(input);
    if (base64Decoded || hexDecoded) {
      score += 0.1; // Increased from 0.05
      reasons.push('Decodable content');
      
      // Additional bonus if decoded content matches expected charset
      if (base64Decoded && pattern.charset && pattern.charset === getCharset(base64Decoded)) {
        score += 0.05;
        reasons.push('Decoded content charset match');
      }
      if (hexDecoded && pattern.charset && pattern.charset === getCharset(hexDecoded)) {
        score += 0.05;
        reasons.push('Decoded content charset match');
      }
    }
    
    // **SIGNATURE AWARENESS - Prefix Boost**
    // If candidate has a unique prefix/signature, boost score significantly
    if (hasPrefixMatch && pattern.prefixes && pattern.prefixes.length > 0) {
      score += 0.3; // Major boost for signature matches
      reasons.push(`Signature match (${pattern.prefixes[0]})`);
    }
    
    // **FLEXIBLE INCLUSION** - No strict skipping rules
    // Include patterns with meaningful score (>= 0.25, reduced from 0.35)
    if (score >= 0.25) {
      // **IMPROVED COLOR MAPPING**
      const color: 'green' | 'yellow' | 'red' = 
        score > 0.8 ? 'green' :     // very likely
        score >= 0.55 ? 'yellow' :  // possible
        'red';                      // unlikely but plausible
      
      candidates.push({
        id: patternId,
        name: pattern.name,
        score: Math.min(score, 1.0),
        color,
        reasons
      });
    }
  }
  
  // Sort by score (highest first) and limit to top 3
  const sortedCandidates = candidates.sort((a, b) => b.score - a.score);
  
    // Return top 3 matches maximum
    console.log('Returning top candidates:', sortedCandidates.length);
    return sortedCandidates.slice(0, 3);
    
  } catch (error) {
    console.error('Error in detectCandidates:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return [];
  }
}

export function analyzeInput(input: string): AnalysisResult {
  try {
    console.log('Starting analysis for input:', input.substring(0, 50) + '...');
    
    // Validate input
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input: must be a non-empty string');
    }
    
    if (input.length > 10000) {
      throw new Error('Input too long: maximum 10,000 characters allowed');
    }
    
    console.log('Detecting candidates...');
    const results = detectCandidates(input);
    console.log('Candidates detected:', results.length);
    
    console.log('Calculating character statistics...');
    const stats = getCharStats(input);
    console.log('Stats calculated:', stats);
    
    const freq = Object.fromEntries(
      Object.entries(stats).filter(([key]) => key !== 'entropy')
    );

    // Try all decoding methods with error handling
    console.log('Attempting decoding...');
    const decoding: { 
      base64?: string; 
      hex?: string; 
      rot13?: string;
      url?: string;
      binary?: string;
      octal?: string;
      unicode?: string;
      html?: string;
    } = {};

    try {
      const base64Decoded = safeBase64Decode(input);
      if (base64Decoded) decoding.base64 = base64Decoded;
    } catch (e) {
      console.warn('Base64 decoding failed:', e);
    }

    try {
      const hexDecoded = safeHexDecode(input);
      if (hexDecoded) decoding.hex = hexDecoded;
    } catch (e) {
      console.warn('Hex decoding failed:', e);
    }

    try {
      const rot13Decoded = decodeROT13(input);
      if (rot13Decoded) decoding.rot13 = rot13Decoded;
    } catch (e) {
      console.warn('ROT13 decoding failed:', e);
    }

    try {
      const urlDecoded = decodeURL(input);
      if (urlDecoded) decoding.url = urlDecoded;
    } catch (e) {
      console.warn('URL decoding failed:', e);
    }

    try {
      const binaryDecoded = decodeBinary(input);
      if (binaryDecoded) decoding.binary = binaryDecoded;
    } catch (e) {
      console.warn('Binary decoding failed:', e);
    }

    try {
      const octalDecoded = decodeOctal(input);
      if (octalDecoded) decoding.octal = octalDecoded;
    } catch (e) {
      console.warn('Octal decoding failed:', e);
    }

    try {
      const unicodeDecoded = decodeUnicode(input);
      if (unicodeDecoded) decoding.unicode = unicodeDecoded;
    } catch (e) {
      console.warn('Unicode decoding failed:', e);
    }

    try {
      const htmlDecoded = decodeHTML(input);
      if (htmlDecoded) decoding.html = htmlDecoded;
    } catch (e) {
      console.warn('HTML decoding failed:', e);
    }

    console.log('Decoding completed. Results:', Object.keys(decoding).length);

    // If no candidates found, add "Unknown" result
    if (results.length === 0) {
      console.log('No candidates found, adding Unknown result');
      results.push({
        id: 'unknown',
        name: 'Unknown',
        score: 0.0,
        color: 'red',
        reasons: ['no patterns matched']
      });
    }

    const result = {
      input,
      results,
      stats,
      decoding,
      freq
    };
    
    console.log('Analysis completed successfully');
    return result;
    
  } catch (error) {
    console.error('Error in analyzeInput:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return a safe fallback result
    return {
      input,
      results: [{
        id: 'error',
        name: 'Analysis Error',
        score: 0.0,
        color: 'red',
        reasons: ['analysis failed: ' + (error instanceof Error ? error.message : 'unknown error')]
      }],
      stats: {
        total: input.length,
        unique: new Set(input).size,
        digits: (input.match(/\d/g) || []).length,
        letters: (input.match(/[a-zA-Z]/g) || []).length,
        special: (input.match(/[^a-zA-Z0-9]/g) || []).length,
        entropy: 0
      },
      decoding: {},
      freq: {}
    };
  }
}
