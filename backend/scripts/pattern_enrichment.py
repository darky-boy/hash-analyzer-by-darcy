#!/usr/bin/env python3
"""
Hash Pattern Enrichment and Scraping System

This script enhances the existing hash_patterns.json file by:
1. Scraping authoritative hash reference websites
2. Extracting comprehensive hash information
3. Cleaning and deduplicating patterns
4. Updating the JSON with enriched data
5. Validating detection improvements

Sources:
- Hashcat example hashes
- John the Ripper formats
- Online hash identifier tools
- GitHub repositories with hash examples
"""

import json
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import logging
from typing import Dict, List, Set, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class HashPattern:
    name: str
    length: Optional[int] = None
    charset: Optional[str] = None
    prefixes: Optional[List[str]] = None
    suffixes: Optional[List[str]] = None
    regex: Optional[str] = None
    example: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None

class HashPatternEnricher:
    def __init__(self, patterns_file: str = "data/hash_patterns.json"):
        self.patterns_file = Path(patterns_file)
        self.existing_patterns = self.load_existing_patterns()
        self.new_patterns = []
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
    def load_existing_patterns(self) -> Dict:
        """Load existing hash patterns from JSON file."""
        try:
            with open(self.patterns_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(f"Patterns file {self.patterns_file} not found. Starting with empty patterns.")
            return {}
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON file: {e}")
            return {}
    
    def save_patterns(self):
        """Save enriched patterns back to JSON file."""
        try:
            with open(self.patterns_file, 'w', encoding='utf-8') as f:
                json.dump(self.existing_patterns, f, indent=2, ensure_ascii=False)
            logger.info(f"Saved {len(self.existing_patterns)} patterns to {self.patterns_file}")
        except Exception as e:
            logger.error(f"Error saving patterns: {e}")
    
    def scrape_hashcat_examples(self):
        """Scrape Hashcat example hashes from their wiki."""
        logger.info("Scraping Hashcat example hashes...")
        
        try:
            url = "https://hashcat.net/wiki/doku.php?id=example_hashes"
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for hash examples in the content
            hash_examples = []
            
            # Find code blocks and pre tags that might contain hash examples
            for code_block in soup.find_all(['code', 'pre']):
                text = code_block.get_text().strip()
                lines = text.split('\n')
                
                for line in lines:
                    line = line.strip()
                    if self.is_potential_hash(line):
                        hash_examples.append(line)
            
            logger.info(f"Found {len(hash_examples)} potential hash examples from Hashcat")
            return hash_examples
            
        except Exception as e:
            logger.error(f"Error scraping Hashcat examples: {e}")
            return []
    
    def scrape_john_the_ripper_formats(self):
        """Scrape John the Ripper supported hash formats."""
        logger.info("Scraping John the Ripper formats...")
        
        try:
            url = "https://openwall.com/john/doc/EXAMPLES.shtml"
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract hash format information
            formats = []
            
            # Look for hash format descriptions
            for element in soup.find_all(['p', 'li', 'pre']):
                text = element.get_text().strip()
                if any(keyword in text.lower() for keyword in ['hash', 'password', 'crypt', 'md5', 'sha']):
                    formats.append(text)
            
            logger.info(f"Found {len(formats)} format descriptions from John the Ripper")
            return formats
            
        except Exception as e:
            logger.error(f"Error scraping John the Ripper formats: {e}")
            return []
    
    def scrape_online_hash_tools(self):
        """Scrape hash examples from online hash identifier tools."""
        logger.info("Scraping online hash tools...")
        
        # List of online hash identifier tools to scrape
        tools = [
            "https://hashes.com/en/identify/hash",
            "https://www.tunnelsup.com/hash-analyzer/",
            "https://hashkiller.io/hash-identifier"
        ]
        
        hash_examples = []
        
        for tool_url in tools:
            try:
                response = self.session.get(tool_url, timeout=30)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for hash examples in the page
                for element in soup.find_all(['code', 'pre', 'span', 'div']):
                    text = element.get_text().strip()
                    if self.is_potential_hash(text):
                        hash_examples.append(text)
                
                time.sleep(1)  # Be respectful to the server
                
            except Exception as e:
                logger.error(f"Error scraping {tool_url}: {e}")
                continue
        
        logger.info(f"Found {len(hash_examples)} hash examples from online tools")
        return hash_examples
    
    def is_potential_hash(self, text: str) -> bool:
        """Check if text looks like a potential hash."""
        if not text or len(text) < 8:
            return False
        
        # Check for common hash patterns
        hash_patterns = [
            r'^[a-fA-F0-9]{32,128}$',  # Hex hashes
            r'^\$2[aby]\$',  # bcrypt
            r'^\$argon2',  # Argon2
            r'^\$6\$',  # SHA-512 crypt
            r'^\$5\$',  # SHA-256 crypt
            r'^\$1\$',  # MD5 crypt
            r'^[A-Za-z0-9+/]+=*$',  # Base64
            r'^\{SHA\}',  # SHA with prefix
            r'^\{SSHA\}',  # Salted SHA
        ]
        
        for pattern in hash_patterns:
            if re.match(pattern, text):
                return True
        
        return False
    
    def analyze_hash_example(self, hash_example: str) -> Optional[HashPattern]:
        """Analyze a hash example and extract pattern information."""
        if not hash_example or len(hash_example) < 8:
            return None
        
        pattern = HashPattern(name="Unknown")
        
        # Determine charset
        if re.match(r'^[a-fA-F0-9]+$', hash_example):
            pattern.charset = "hex"
        elif re.match(r'^[A-Za-z0-9+/]+=*$', hash_example):
            pattern.charset = "base64"
        elif re.match(r'^[\x20-\x7E]+$', hash_example):
            pattern.charset = "ascii"
        
        # Determine length
        pattern.length = len(hash_example)
        
        # Check for prefixes
        prefixes = []
        if hash_example.startswith('$2'):
            prefixes.append('$2a$')
            prefixes.append('$2b$')
            prefixes.append('$2y$')
            pattern.name = "bcrypt"
        elif hash_example.startswith('$argon2'):
            prefixes.append('$argon2id$')
            prefixes.append('$argon2i$')
            prefixes.append('$argon2d$')
            pattern.name = "Argon2"
        elif hash_example.startswith('$6$'):
            prefixes.append('$6$')
            pattern.name = "SHA-512 crypt"
        elif hash_example.startswith('$5$'):
            prefixes.append('$5$')
            pattern.name = "SHA-256 crypt"
        elif hash_example.startswith('$1$'):
            prefixes.append('$1$')
            pattern.name = "MD5 crypt"
        elif hash_example.startswith('{SHA}'):
            prefixes.append('{SHA}')
            pattern.name = "SHA-1 with prefix"
        elif hash_example.startswith('{SSHA}'):
            prefixes.append('{SSHA}')
            pattern.name = "Salted SHA-1"
        
        if prefixes:
            pattern.prefixes = prefixes
        
        # Generate regex pattern
        pattern.regex = self.generate_regex_pattern(hash_example)
        
        # Set example
        pattern.example = hash_example
        
        # Determine name if not set
        if pattern.name == "Unknown":
            if pattern.charset == "hex":
                if pattern.length == 32:
                    pattern.name = "MD5"
                elif pattern.length == 40:
                    pattern.name = "SHA-1"
                elif pattern.length == 64:
                    pattern.name = "SHA-256"
                elif pattern.length == 128:
                    pattern.name = "SHA-512"
                else:
                    pattern.name = f"Hex Hash ({pattern.length} chars)"
            elif pattern.charset == "base64":
                pattern.name = "Base64"
            else:
                pattern.name = f"Hash ({pattern.length} chars)"
        
        return pattern
    
    def generate_regex_pattern(self, hash_example: str) -> str:
        """Generate a regex pattern for a hash example."""
        if not hash_example:
            return ""
        
        # Escape special regex characters
        escaped = re.escape(hash_example)
        
        # Replace specific parts with regex patterns
        if hash_example.startswith('$2'):
            # bcrypt pattern
            return r'^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$'
        elif hash_example.startswith('$argon2'):
            # Argon2 pattern
            return r'^\$argon2[id]?\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$'
        elif hash_example.startswith('$6$'):
            # SHA-512 crypt pattern
            return r'^\$6\$[^$]+\$[A-Za-z0-9./]+$'
        elif hash_example.startswith('$5$'):
            # SHA-256 crypt pattern
            return r'^\$5\$[^$]+\$[A-Za-z0-9./]+$'
        elif hash_example.startswith('$1$'):
            # MD5 crypt pattern
            return r'^\$1\$[^$]+\$[A-Za-z0-9./]+$'
        elif hash_example.startswith('{SHA}'):
            # SHA with prefix pattern
            return r'^\{SHA\}[A-Za-z0-9+/]+=*$'
        elif hash_example.startswith('{SSHA}'):
            # Salted SHA pattern
            return r'^\{SSHA\}[A-Za-z0-9+/]+=*$'
        elif re.match(r'^[a-fA-F0-9]+$', hash_example):
            # Hex pattern
            return f'^[a-fA-F0-9]{{{len(hash_example)}}}$'
        elif re.match(r'^[A-Za-z0-9+/]+=*$', hash_example):
            # Base64 pattern
            return r'^[A-Za-z0-9+/]+=*$'
        else:
            # Generic pattern
            return f'^{re.escape(hash_example)}$'
    
    def deduplicate_patterns(self):
        """Remove duplicate patterns and merge similar ones."""
        logger.info("Deduplicating patterns...")
        
        seen_patterns = set()
        unique_patterns = {}
        
        for key, pattern in self.existing_patterns.items():
            # Create a signature for the pattern
            signature = (
                pattern.get('name', ''),
                pattern.get('length'),
                pattern.get('charset', ''),
                tuple(pattern.get('prefixes', []) or []),
                tuple(pattern.get('suffixes', []) or [])
            )
            
            if signature not in seen_patterns:
                seen_patterns.add(signature)
                unique_patterns[key] = pattern
            else:
                # Merge with existing pattern
                existing = unique_patterns.get(key, {})
                if pattern.get('example') and pattern['example'] not in (existing.get('example', '')):
                    # Add example if it's different
                    if 'examples' not in existing:
                        existing['examples'] = [existing.get('example', '')]
                    existing['examples'].append(pattern['example'])
                
                # Merge other fields
                for field in ['source', 'notes']:
                    if pattern.get(field) and not existing.get(field):
                        existing[field] = pattern[field]
                
                unique_patterns[key] = existing
        
        self.existing_patterns = unique_patterns
        logger.info(f"After deduplication: {len(unique_patterns)} unique patterns")
    
    def enrich_existing_patterns(self):
        """Enrich existing patterns with additional information."""
        logger.info("Enriching existing patterns...")
        
        for key, pattern in self.existing_patterns.items():
            # Add regex if missing
            if not pattern.get('regex') and pattern.get('example'):
                pattern['regex'] = self.generate_regex_pattern(pattern['example'])
            
            # Normalize charset
            if pattern.get('charset'):
                charset = pattern['charset'].lower()
                if charset in ['hexadecimal', 'hexadecimal_lower', 'hexadecimal_upper']:
                    pattern['charset'] = 'hex'
                elif charset in ['base64', 'base64_standard']:
                    pattern['charset'] = 'base64'
                elif charset in ['ascii', 'printable']:
                    pattern['charset'] = 'ascii'
            
            # Add source if missing
            if not pattern.get('source'):
                pattern['source'] = 'Pattern Enrichment System'
    
    def run_enrichment(self):
        """Run the complete pattern enrichment process."""
        logger.info("Starting hash pattern enrichment process...")
        
        # Step 1: Scrape data from various sources
        hashcat_examples = self.scrape_hashcat_examples()
        john_formats = self.scrape_john_the_ripper_formats()
        online_examples = self.scrape_online_hash_tools()
        
        # Step 2: Analyze scraped examples
        all_examples = hashcat_examples + online_examples
        new_patterns = []
        
        for example in all_examples:
            pattern = self.analyze_hash_example(example)
            if pattern and pattern.name != "Unknown":
                new_patterns.append(pattern)
        
        logger.info(f"Analyzed {len(new_patterns)} new patterns from scraped data")
        
        # Step 3: Add new patterns to existing ones
        for pattern in new_patterns:
            key = pattern.name.replace(' ', '_').replace('(', '').replace(')', '')
            if key not in self.existing_patterns:
                self.existing_patterns[key] = {
                    'name': pattern.name,
                    'length': pattern.length,
                    'charset': pattern.charset,
                    'prefixes': pattern.prefixes,
                    'suffixes': pattern.suffixes,
                    'regex': pattern.regex,
                    'example': pattern.example,
                    'source': 'Pattern Enrichment System',
                    'notes': pattern.notes
                }
        
        # Step 4: Deduplicate and clean
        self.deduplicate_patterns()
        self.enrich_existing_patterns()
        
        # Step 5: Save enriched patterns
        self.save_patterns()
        
        logger.info("Pattern enrichment process completed!")
        return len(self.existing_patterns)

def main():
    """Main function to run the pattern enrichment process."""
    enricher = HashPatternEnricher()
    total_patterns = enricher.run_enrichment()
    print(f"Enrichment complete! Total patterns: {total_patterns}")

if __name__ == "__main__":
    main()
