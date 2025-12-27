/**
 * Utility functions for hash analysis
 */

export function isHex(str: string): boolean {
  return /^[0-9a-fA-F]+$/.test(str);
}

export function isBase64(str: string): boolean {
  return /^[A-Za-z0-9+/]+=*$/.test(str);
}

export function isAscii(str: string): boolean {
  return /^[\x00-\x7F]*$/.test(str);
}

export function shannonEntropy(str: string): number {
  try {
    if (!str || str.length === 0) return 0;
    
    const freq: { [key: string]: number } = {};
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }
    
    let entropy = 0;
    const length = str.length;
    
    for (const count of Object.values(freq)) {
      const p = count / length;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    
    return entropy;
  } catch (error) {
    console.error('Error calculating entropy:', error);
    return 0;
  }
}

export function freqAnalysis(str: string): { [key: string]: number } {
  const freq: { [key: string]: number } = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  return freq;
}

export function safeBase64Decode(str: string): string | null {
  try {
    // Add padding if needed
    const missingPadding = str.length % 4;
    if (missingPadding) {
      str += '='.repeat(4 - missingPadding);
    }
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

export function safeHexDecode(str: string): string | null {
  try {
    if (str.length % 2 !== 0) return null;
    return Buffer.from(str, 'hex').toString('utf-8');
  } catch {
    return null;
  }
}

export function getCharset(str: string): string {
  if (isHex(str)) return 'hex';
  if (isBase64(str)) return 'base64';
  if (isAscii(str)) return 'ascii';
  return 'unknown';
}

export function getCharStats(str: string) {
  try {
    if (!str || typeof str !== 'string') {
      return {
        total: 0,
        unique: 0,
        digits: 0,
        letters: 0,
        special: 0,
        entropy: 0
      };
    }
    
    return {
      total: str.length,
      unique: new Set(str).size,
      digits: (str.match(/\d/g) || []).length,
      letters: (str.match(/[a-zA-Z]/g) || []).length,
      special: (str.match(/[^a-zA-Z0-9]/g) || []).length,
      entropy: shannonEntropy(str)
    };
  } catch (error) {
    console.error('Error calculating character stats:', error);
    return {
      total: str ? str.length : 0,
      unique: 0,
      digits: 0,
      letters: 0,
      special: 0,
      entropy: 0
    };
  }
}

export function decodeROT13(str: string): string | null {
  try {
    return str.replace(/[a-zA-Z]/g, (char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + 13) % 26) + 65);
      } else if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + 13) % 26) + 97);
      }
      return char;
    });
  } catch {
    return null;
  }
}

export function decodeURL(str: string): string | null {
  try {
    return decodeURIComponent(str);
  } catch {
    return null;
  }
}

export function decodeBinary(str: string): string | null {
  try {
    // Check if string contains only 0s and 1s
    if (!/^[01]+$/.test(str)) return null;
    
    // Convert binary to text
    let result = '';
    for (let i = 0; i < str.length; i += 8) {
      const byte = str.substr(i, 8);
      if (byte.length === 8) {
        const charCode = parseInt(byte, 2);
        if (charCode >= 32 && charCode <= 126) { // Printable ASCII
          result += String.fromCharCode(charCode);
        }
      }
    }
    return result.length > 0 ? result : null;
  } catch {
    return null;
  }
}

export function decodeOctal(str: string): string | null {
  try {
    // Check if string contains only octal digits
    if (!/^[0-7]+$/.test(str)) return null;
    
    let result = '';
    for (let i = 0; i < str.length; i += 3) {
      const oct = str.substr(i, 3);
      if (oct.length === 3) {
        const charCode = parseInt(oct, 8);
        if (charCode >= 32 && charCode <= 126) { // Printable ASCII
          result += String.fromCharCode(charCode);
        }
      }
    }
    return result.length > 0 ? result : null;
  } catch {
    return null;
  }
}

export function decodeUnicode(str: string): string | null {
  try {
    // Check for Unicode escape sequences like \u0041
    if (!/\\u[0-9a-fA-F]{4}/.test(str)) return null;
    
    return str.replace(/\\u[0-9a-fA-F]{4}/g, (match) => {
      const code = parseInt(match.substr(2), 16);
      return String.fromCharCode(code);
    });
  } catch {
    return null;
  }
}

export function decodeHTML(str: string): string | null {
  try {
    const htmlEntities: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™'
    };
    
    let result = str;
    for (const [entity, char] of Object.entries(htmlEntities)) {
      result = result.replace(new RegExp(entity, 'g'), char);
    }
    
    // Also handle numeric HTML entities like &#65;
    result = result.replace(/&#(\d+);/g, (match, num) => {
      const code = parseInt(num);
      return code >= 32 && code <= 126 ? String.fromCharCode(code) : match;
    });
    
    return result !== str ? result : null;
  } catch {
    return null;
  }
}
