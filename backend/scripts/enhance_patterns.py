#!/usr/bin/env python3
"""
Hash Pattern Enhancement Script

This script enhances the existing hash_patterns.json with:
1. Better regex patterns for existing hash types
2. Additional prefixes/suffixes for better detection
3. More comprehensive examples
4. Improved charset detection
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Optional

def load_patterns(file_path: str) -> Dict:
    """Load existing hash patterns."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"File {file_path} not found!")
        return {}
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return {}

def save_patterns(patterns: Dict, file_path: str):
    """Save patterns back to file."""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(patterns, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(patterns)} patterns to {file_path}")
    except Exception as e:
        print(f"Error saving patterns: {e}")

def generate_regex_for_hash(hash_example: str, hash_type: str) -> str:
    """Generate appropriate regex pattern for a hash type."""
    
    # bcrypt patterns
    if hash_type.lower() in ['bcrypt', 'blowfish']:
        return r'^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$'
    
    # Argon2 patterns
    elif 'argon2' in hash_type.lower():
        if 'argon2id' in hash_type.lower():
            return r'^\$argon2id\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$'
        elif 'argon2i' in hash_type.lower():
            return r'^\$argon2i\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$'
        elif 'argon2d' in hash_type.lower():
            return r'^\$argon2d\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$'
        else:
            return r'^\$argon2[id]?\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$'
    
    # SHA crypt patterns
    elif 'sha-512' in hash_type.lower() or 'sha512' in hash_type.lower():
        return r'^\$6\$[^$]+\$[A-Za-z0-9./]+$'
    elif 'sha-256' in hash_type.lower() or 'sha256' in hash_type.lower():
        return r'^\$5\$[^$]+\$[A-Za-z0-9./]+$'
    elif 'md5' in hash_type.lower() and 'crypt' in hash_type.lower():
        return r'^\$1\$[^$]+\$[A-Za-z0-9./]+$'
    
    # Standard hash patterns
    elif hash_type.upper() == 'MD5':
        return r'^[a-fA-F0-9]{32}$'
    elif hash_type.upper() == 'SHA1':
        return r'^[a-fA-F0-9]{40}$'
    elif hash_type.upper() == 'SHA256':
        return r'^[a-fA-F0-9]{64}$'
    elif hash_type.upper() == 'SHA512':
        return r'^[a-fA-F0-9]{128}$'
    
    # NTLM
    elif hash_type.upper() == 'NTLM':
        return r'^[a-fA-F0-9]{32}$'
    
    # Base64 patterns
    elif 'base64' in hash_type.lower():
        return r'^[A-Za-z0-9+/]+=*$'
    
    # Generic hex patterns based on length
    elif hash_example and re.match(r'^[a-fA-F0-9]+$', hash_example):
        length = len(hash_example)
        return f'^[a-fA-F0-9]{{{length}}}$'
    
    # Generic base64 patterns
    elif hash_example and re.match(r'^[A-Za-z0-9+/]+=*$', hash_example):
        return r'^[A-Za-z0-9+/]+=*$'
    
    # Default: exact match
    else:
        return f'^{re.escape(hash_example)}$'

def enhance_pattern(pattern: Dict, key: str) -> Dict:
    """Enhance a single pattern with better detection capabilities."""
    enhanced = pattern.copy()
    
    # Add regex if missing
    if not enhanced.get('regex') and enhanced.get('example'):
        enhanced['regex'] = generate_regex_for_hash(enhanced['example'], enhanced.get('name', ''))
    
    # Enhance prefixes for known hash types
    name = enhanced.get('name', '').lower()
    
    if 'bcrypt' in name:
        if not enhanced.get('prefixes'):
            enhanced['prefixes'] = ['$2a$', '$2b$', '$2y$']
    
    elif 'argon2' in name:
        if 'argon2id' in name:
            enhanced['prefixes'] = ['$argon2id$']
        elif 'argon2i' in name:
            enhanced['prefixes'] = ['$argon2i$']
        elif 'argon2d' in name:
            enhanced['prefixes'] = ['$argon2d$']
        else:
            enhanced['prefixes'] = ['$argon2id$', '$argon2i$', '$argon2d$']
    
    elif 'sha-512' in name or 'sha512' in name:
        if not enhanced.get('prefixes'):
            enhanced['prefixes'] = ['$6$']
    
    elif 'sha-256' in name or 'sha256' in name:
        if not enhanced.get('prefixes'):
            enhanced['prefixes'] = ['$5$']
    
    elif 'md5' in name and 'crypt' in name:
        if not enhanced.get('prefixes'):
            enhanced['prefixes'] = ['$1$']
    
    elif name == 'sha-1' or name == 'sha1':
        if not enhanced.get('prefixes'):
            enhanced['prefixes'] = ['{SHA}']
    
    elif 'ssha' in name or 'salted sha' in name:
        if not enhanced.get('prefixes'):
            enhanced['prefixes'] = ['{SSHA}']
    
    # Normalize charset
    if enhanced.get('charset'):
        charset = enhanced['charset'].lower()
        if charset in ['hexadecimal', 'hexadecimal_lower', 'hexadecimal_upper']:
            enhanced['charset'] = 'hex'
        elif charset in ['base64', 'base64_standard']:
            enhanced['charset'] = 'base64'
        elif charset in ['ascii', 'printable']:
            enhanced['charset'] = 'ascii'
    
    # Add source if missing
    if not enhanced.get('source'):
        enhanced['source'] = 'Pattern Enhancement Script'
    
    # Add notes for special cases
    if 'bcrypt' in name and not enhanced.get('notes'):
        enhanced['notes'] = 'Blowfish-based password hashing with configurable cost'
    elif 'argon2' in name and not enhanced.get('notes'):
        enhanced['notes'] = 'Memory-hard password hashing function'
    elif 'ntlm' in name and not enhanced.get('notes'):
        enhanced['notes'] = 'Microsoft NTLM authentication protocol hash'
    
    return enhanced

def add_missing_patterns(patterns: Dict) -> Dict:
    """Add commonly missing hash patterns."""
    
    # Common hash patterns that might be missing
    missing_patterns = {
        'NTLM': {
            'name': 'NTLM',
            'length': 32,
            'charset': 'hex',
            'prefixes': None,
            'example': '5d41402abc4b2a76b9719d911017c592',
            'source': 'Microsoft NTLM',
            'notes': 'Microsoft NTLM authentication protocol hash'
        },
        'Base64': {
            'name': 'Base64',
            'length': None,
            'charset': 'base64',
            'prefixes': None,
            'example': 'SGVsbG8gV29ybGQ=',
            'source': 'RFC 4648',
            'notes': 'Base64 encoding'
        },
        'Hex_Encoding': {
            'name': 'Hex Encoding',
            'length': None,
            'charset': 'hex',
            'prefixes': None,
            'example': '48656c6c6f20576f726c64',
            'source': 'Hexadecimal encoding',
            'notes': 'Hexadecimal encoding of data'
        }
    }
    
    for key, pattern in missing_patterns.items():
        if key not in patterns:
            patterns[key] = pattern
            print(f"Added missing pattern: {key}")
    
    return patterns

def main():
    """Main function to enhance hash patterns."""
    patterns_file = "backend/data/hash_patterns.json"
    
    print("Loading existing patterns...")
    patterns = load_patterns(patterns_file)
    
    if not patterns:
        print("No patterns found to enhance!")
        return
    
    print(f"Found {len(patterns)} existing patterns")
    
    # Enhance existing patterns
    print("Enhancing existing patterns...")
    enhanced_count = 0
    
    for key, pattern in patterns.items():
        original_pattern = pattern.copy()
        enhanced_pattern = enhance_pattern(pattern, key)
        
        if enhanced_pattern != original_pattern:
            patterns[key] = enhanced_pattern
            enhanced_count += 1
    
    print(f"Enhanced {enhanced_count} patterns")
    
    # Add missing patterns
    print("Adding missing common patterns...")
    patterns = add_missing_patterns(patterns)
    
    # Save enhanced patterns
    print("Saving enhanced patterns...")
    save_patterns(patterns, patterns_file)
    
    print("Pattern enhancement completed!")

if __name__ == "__main__":
    main()
