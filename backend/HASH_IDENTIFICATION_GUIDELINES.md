# Hash Identification Guidelines

This document outlines the systematic approach for identifying hash types and creating robust detection patterns.

## 1. Length Analysis

Different hash algorithms produce hashes of specific lengths:

| Algorithm | Length | Format | Example |
|-----------|--------|--------|---------|
| MD5 | 32 | hex | `5d41402abc4b2a76b9719d911017c592` |
| SHA-1 | 40 | hex | `a94a8fe5ccb19ba61c4c0873d391e987982fbbd3` |
| SHA-256 | 64 | hex | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| SHA-512 | 128 | hex | `cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e` |
| bcrypt | 60 | mixed | `$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4ZbC8K7K2` |
| NTLM | 32 | hex | `5d41402abc4b2a76b9719d911017c592` |

## 2. Charset & Encoding Analysis

### Hexadecimal Hashes
- **Charset**: `0-9`, `a-f` (lowercase) or `A-F` (uppercase)
- **Common algorithms**: MD5, SHA-1, SHA-256, SHA-512, NTLM
- **Detection**: Use regex pattern `^[a-fA-F0-9]+$`

### Base64 Hashes
- **Charset**: `A-Z`, `a-z`, `0-9`, `+`, `/`, `=`
- **Common algorithms**: Some password hashes, encoded data
- **Detection**: Use regex pattern `^[A-Za-z0-9+/]+=*$`

### ASCII Hashes
- **Charset**: Printable ASCII characters
- **Common algorithms**: Some legacy systems, custom formats
- **Detection**: Use regex pattern `^[\x20-\x7E]+$`

## 3. Signature/Prefix/Suffix Analysis

### Common Hash Signatures

| Signature | Algorithm | Example |
|-----------|-----------|---------|
| `$2a$`, `$2b$`, `$2y$` | bcrypt | `$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4ZbC8K7K2` |
| `$argon2id$` | Argon2id | `$argon2id$v=19$m=65536,t=2,p=1$c29tZXNhbHQ$RdescudvJCsgt3Yb4V3OoA` |
| `$argon2i$` | Argon2i | `$argon2i$v=19$m=65536,t=2,p=1$c29tZXNhbHQ$RdescudvJCsgt3Yb4V3OoA` |
| `$argon2d$` | Argon2d | `$argon2d$v=19$m=65536,t=2,p=1$c29tZXNhbHQ$RdescudvJCsgt3Yb4V3OoA` |
| `$6$` | SHA-512 crypt | `$6$rounds=5000$salt$hash` |
| `$5$` | SHA-256 crypt | `$5$rounds=5000$salt$hash` |
| `$1$` | MD5 crypt | `$1$salt$hash` |
| `{SHA}` | SHA-1 with prefix | `{SHA}W6ph5Mm5Pz8GgiULbPgzG37mj9g=` |
| `{SSHA}` | Salted SHA-1 | `{SSHA}W6ph5Mm5Pz8GgiULbPgzG37mj9g=` |

## 4. Entropy Analysis

### Entropy Thresholds
- **Low entropy** (< 3.0): Likely not a hash, possibly plaintext or simple encoding
- **Medium entropy** (3.0-4.0): Possible hash or encoded data
- **High entropy** (> 4.0): Likely cryptographic hash

### Dynamic Entropy Calculation
```typescript
const entropyThreshold = Math.max(2.5, Math.min(4.0, 3.0 + (inputLength / 50)));
```

## 5. Tools & References

### Online Hash Analyzers
- [hashes.com](https://hashes.com) - Comprehensive hash database
- [tunnelsup.com](https://tunnelsup.com/hash-analyzer/) - Hash analyzer
- [hashkiller.io](https://hashkiller.io) - Hash identification

### Command-line Tools
- **hash-identifier** (Kali Linux): `hash-identifier`
- **hashid**: `hashid <hash>`
- **john**: `john --list=formats`

### Hashcat References
- [Hashcat example hashes](https://hashcat.net/wiki/doku.php?id=example_hashes)
- [Hashcat hash modes](https://hashcat.net/wiki/doku.php?id=hashcat)

## 6. Pattern Creation Guidelines

### JSON Pattern Structure
```json
{
  "algorithm_name": {
    "name": "Human-readable name",
    "length": 32,
    "charset": "hex|base64|ascii",
    "prefixes": ["$2b$", "$2a$"],
    "suffixes": ["="],
    "regex": "^\\$2[aby]\\$[0-9]{2}\\$[./A-Za-z0-9]{53}$",
    "example": "example_hash_here",
    "source": "Hashcat, Wikipedia, etc.",
    "notes": "Additional information"
  }
}
```

### Pattern Best Practices

1. **Fuzzy Length Matching**
   - Allow ±4 character difference for variants
   - Handle different implementations of same algorithm

2. **Flexible Charset Matching**
   - Support case variations (hex uppercase/lowercase)
   - Handle base64 padding differences
   - Check decoded content charset

3. **Regex Patterns**
   - Use specific patterns for high-confidence detection
   - Include common variations and edge cases
   - Test patterns with multiple examples

4. **Prefix/Suffix Matching**
   - Include all known variations
   - Handle optional prefixes/suffixes
   - Support multiple signature formats

5. **Example Hashes**
   - Use real-world examples
   - Include variations from different sources
   - Test with actual hash samples

## 7. Detection Confidence Scoring

### Scoring Weights
- **Regex match**: +0.4 (highest confidence)
- **Exact length match**: +0.4
- **Fuzzy length match**: +0.3
- **Prefix match**: +0.25
- **Charset match**: +0.2
- **Suffix match**: +0.1
- **High entropy**: +0.1
- **Decodable content**: +0.1
- **Signature match**: +0.3 (additional boost)

### Color Mapping
- **Green** (score > 0.8): Very likely
- **Yellow** (0.55-0.8): Possible/ambiguous
- **Red** (0.25-0.55): Unlikely but plausible
- **Discarded** (< 0.25): Not shown

## 8. Testing & Validation

### Test Cases
1. **MD5**: `5d41402abc4b2a76b9719d911017c592`
2. **SHA-1**: `a94a8fe5ccb19ba61c4c0873d391e987982fbbd3`
3. **SHA-256**: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
4. **bcrypt**: `$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4ZbC8K7K2`
5. **Base64**: `SGVsbG8gV29ybGQ=`

### Validation Checklist
- [ ] Pattern matches expected hash types
- [ ] Fuzzy length matching works for variants
- [ ] Charset detection handles case variations
- [ ] Prefix/suffix matching is accurate
- [ ] Entropy calculation is appropriate
- [ ] Confidence scores are meaningful
- [ ] Color mapping reflects confidence levels

## 9. Common Hash Variants

### MD5 Variants
- Standard MD5 (32 hex chars)
- MD5 with salt (40+ chars)
- MD5 with different encodings

### SHA-1 Variants
- Standard SHA-1 (40 hex chars)
- SHA-1 with salt
- SHA-1 in different formats

### bcrypt Variants
- `$2a$` (original)
- `$2b$` (current standard)
- `$2y$` (PHP compatibility)

### Argon2 Variants
- Argon2i (data-independent)
- Argon2d (data-dependent)
- Argon2id (hybrid)

## 10. Maintenance & Updates

### Regular Updates
- Monitor new hash algorithms
- Update patterns based on real-world examples
- Test with new hash variants
- Improve detection accuracy

### Quality Assurance
- Validate patterns with multiple examples
- Test edge cases and variations
- Monitor false positive/negative rates
- Update confidence thresholds as needed

---

*This document should be updated as new hash types are discovered and patterns are refined.*
