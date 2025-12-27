#!/usr/bin/env python3
"""
Hash Pattern Validation and Testing Script

This script validates the enhanced hash patterns and tests detection accuracy.
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional

def load_patterns(file_path: str) -> Dict:
    """Load hash patterns from JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"File {file_path} not found!")
        return {}
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return {}

def validate_pattern_structure(pattern: Dict, key: str) -> List[str]:
    """Validate the structure of a single pattern."""
    errors = []
    
    # Required fields
    required_fields = ['name']
    for field in required_fields:
        if field not in pattern:
            errors.append(f"Missing required field: {field}")
    
    # Validate length if present
    if 'length' in pattern and pattern['length'] is not None:
        if not isinstance(pattern['length'], int) or pattern['length'] <= 0:
            errors.append(f"Invalid length: {pattern['length']}")
    
    # Validate charset if present
    if 'charset' in pattern and pattern['charset'] is not None:
        valid_charsets = ['hex', 'base64', 'ascii', 'alphanum']
        if pattern['charset'] not in valid_charsets:
            errors.append(f"Invalid charset: {pattern['charset']}")
    
    # Validate prefixes if present
    if 'prefixes' in pattern and pattern['prefixes'] is not None:
        if not isinstance(pattern['prefixes'], list):
            errors.append(f"Prefixes must be a list: {pattern['prefixes']}")
    
    # Validate suffixes if present
    if 'suffixes' in pattern and pattern['suffixes'] is not None:
        if not isinstance(pattern['suffixes'], list):
            errors.append(f"Suffixes must be a list: {pattern['suffixes']}")
    
    # Validate regex if present
    if 'regex' in pattern and pattern['regex']:
        try:
            re.compile(pattern['regex'])
        except re.error as e:
            errors.append(f"Invalid regex: {e}")
    
    # Validate example if present
    if 'example' in pattern and pattern['example']:
        example = pattern['example']
        
        # Check if example matches length
        if 'length' in pattern and pattern['length']:
            if len(example) != pattern['length']:
                errors.append(f"Example length {len(example)} doesn't match pattern length {pattern['length']}")
        
        # Check if example matches charset
        if 'charset' in pattern and pattern['charset']:
            charset = pattern['charset']
            if charset == 'hex' and not re.match(r'^[a-fA-F0-9]+$', example):
                errors.append(f"Example doesn't match hex charset: {example}")
            elif charset == 'base64' and not re.match(r'^[A-Za-z0-9+/]+=*$', example):
                errors.append(f"Example doesn't match base64 charset: {example}")
            elif charset == 'ascii' and not re.match(r'^[\x20-\x7E]+$', example):
                errors.append(f"Example doesn't match ascii charset: {example}")
        
        # Check if example matches regex
        if 'regex' in pattern and pattern['regex']:
            try:
                if not re.match(pattern['regex'], example):
                    errors.append(f"Example doesn't match regex: {example}")
            except re.error:
                pass  # Already caught above
    
    return errors

def test_pattern_detection(patterns: Dict) -> Dict[str, List[str]]:
    """Test pattern detection with known hash examples."""
    
    # Test cases: (hash, expected_patterns)
    test_cases = [
        # MD5
        ("5d41402abc4b2a76b9719d911017c592", ["MD5", "NTLM"]),
        
        # SHA-1
        ("a94a8fe5ccb19ba61c4c0873d391e987982fbbd3", ["SHA1"]),
        
        # SHA-256
        ("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", ["SHA256"]),
        
        # bcrypt
        ("$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4ZbC8K7K2", ["bcrypt"]),
        
        # Base64
        ("SGVsbG8gV29ybGQ=", ["Base64"]),
        
        # Hex
        ("48656c6c6f20576f726c64", ["Hex_Encoding"]),
        
        # Argon2id
        ("$argon2id$v=19$m=65536,t=2,p=1$c29tZXNhbHQ$RdescudvJCsgt3Yb4V3OoA", ["Argon2id"]),
        
        # SHA-512 crypt
        ("$6$rounds=5000$salt$hash", ["SHA-512_crypt"]),
    ]
    
    results = {}
    
    for hash_input, expected_patterns in test_cases:
        detected_patterns = []
        
        for key, pattern in patterns.items():
            # Check length match
            if pattern.get('length') and len(hash_input) == pattern['length']:
                detected_patterns.append(key)
                continue
            
            # Check prefix match
            if pattern.get('prefixes'):
                for prefix in pattern['prefixes']:
                    if hash_input.startswith(prefix):
                        detected_patterns.append(key)
                        break
            
            # Check regex match
            if pattern.get('regex'):
                try:
                    if re.match(pattern['regex'], hash_input):
                        detected_patterns.append(key)
                        continue
                except re.error:
                    pass
            
            # Check charset match
            if pattern.get('charset'):
                charset = pattern['charset']
                if charset == 'hex' and re.match(r'^[a-fA-F0-9]+$', hash_input):
                    detected_patterns.append(key)
                elif charset == 'base64' and re.match(r'^[A-Za-z0-9+/]+=*$', hash_input):
                    detected_patterns.append(key)
                elif charset == 'ascii' and re.match(r'^[\x20-\x7E]+$', hash_input):
                    detected_patterns.append(key)
        
        results[hash_input] = {
            'detected': detected_patterns,
            'expected': expected_patterns,
            'correct': any(p in expected_patterns for p in detected_patterns)
        }
    
    return results

def generate_pattern_report(patterns: Dict) -> str:
    """Generate a comprehensive report about the patterns."""
    
    report = []
    report.append("=== HASH PATTERN VALIDATION REPORT ===\n")
    
    # Basic statistics
    total_patterns = len(patterns)
    patterns_with_regex = sum(1 for p in patterns.values() if p.get('regex'))
    patterns_with_prefixes = sum(1 for p in patterns.values() if p.get('prefixes'))
    patterns_with_examples = sum(1 for p in patterns.values() if p.get('example'))
    
    report.append(f"Total patterns: {total_patterns}")
    report.append(f"Patterns with regex: {patterns_with_regex} ({patterns_with_regex/total_patterns*100:.1f}%)")
    report.append(f"Patterns with prefixes: {patterns_with_prefixes} ({patterns_with_prefixes/total_patterns*100:.1f}%)")
    report.append(f"Patterns with examples: {patterns_with_examples} ({patterns_with_examples/total_patterns*100:.1f}%)")
    report.append("")
    
    # Charset distribution
    charset_counts = {}
    for pattern in patterns.values():
        charset = pattern.get('charset', 'unknown')
        charset_counts[charset] = charset_counts.get(charset, 0) + 1
    
    report.append("Charset distribution:")
    for charset, count in sorted(charset_counts.items()):
        report.append(f"  {charset}: {count} ({count/total_patterns*100:.1f}%)")
    report.append("")
    
    # Length distribution
    length_counts = {}
    for pattern in patterns.values():
        length = pattern.get('length')
        if length:
            length_counts[length] = length_counts.get(length, 0) + 1
    
    report.append("Length distribution (top 10):")
    for length, count in sorted(length_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        report.append(f"  {length} chars: {count} patterns")
    report.append("")
    
    return "\n".join(report)

def main():
    """Main function to validate and test patterns."""
    patterns_file = "backend/data/hash_patterns.json"
    
    print("Loading patterns...")
    patterns = load_patterns(patterns_file)
    
    if not patterns:
        print("No patterns found!")
        return
    
    print(f"Loaded {len(patterns)} patterns")
    
    # Validate pattern structure
    print("\nValidating pattern structure...")
    validation_errors = []
    
    for key, pattern in patterns.items():
        errors = validate_pattern_structure(pattern, key)
        if errors:
            validation_errors.append((key, errors))
    
    if validation_errors:
        print(f"Found {len(validation_errors)} patterns with errors:")
        for key, errors in validation_errors[:10]:  # Show first 10
            print(f"  {key}: {', '.join(errors)}")
        if len(validation_errors) > 10:
            print(f"  ... and {len(validation_errors) - 10} more")
    else:
        print("All patterns passed structure validation!")
    
    # Test pattern detection
    print("\nTesting pattern detection...")
    test_results = test_pattern_detection(patterns)
    
    correct_detections = sum(1 for r in test_results.values() if r['correct'])
    total_tests = len(test_results)
    
    print(f"Detection accuracy: {correct_detections}/{total_tests} ({correct_detections/total_tests*100:.1f}%)")
    
    print("\nDetailed test results:")
    for hash_input, result in test_results.items():
        status = "✓" if result['correct'] else "✗"
        print(f"  {status} {hash_input[:20]}...")
        print(f"    Detected: {result['detected']}")
        print(f"    Expected: {result['expected']}")
    
    # Generate report
    print("\nGenerating pattern report...")
    report = generate_pattern_report(patterns)
    
    # Save report
    report_file = "pattern_validation_report.txt"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"Report saved to {report_file}")
    print("\nPattern validation completed!")

if __name__ == "__main__":
    main()
