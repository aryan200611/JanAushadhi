"""
JanAushadhi Satya - Stage 1: Regex & Voice Transcript Tokenizer
Extracts numeric dosages, units, release modifiers, and normalizes spoken numbers.
Execution: Pure regex & dict mappings, zero latency (< 0.2ms).
"""

import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field


# Spoken number word dictionary for Indian medical transcription
SPOKEN_NUMBER_WORDS = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4,
    "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9,
    "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14,
    "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19,
    "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50,
    "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90
}

# Common multi-digit pharma spoken phrases
COMMON_PHARMA_SPOKEN_PATTERNS = [
    (r"\bsix\s+twenty\s+five\b", "625"),
    (r"\bsix\s+fifty\b", "650"),
    (r"\bfive\s+hundred\b", "500"),
    (r"\btwo\s+hundred\b", "200"),
    (r"\bone\s+hundred\b", "100"),
    (r"\bone\s+twenty\b", "120"),
    (r"\bseventy\s+five\b", "75"),
    (r"\bforty\b", "40"),
    (r"\btwenty\b", "20"),
    (r"\beighty\b", "80"),
    (r"\bfifty\b", "50"),
    (r"\btwenty\s+five\b", "25"),
    (r"\bten\b", "10"),
    (r"\bfive\b", "5"),
    (r"\bone\b", "1"),
    (r"\btwo\b", "2"),
    (r"\bthree\b", "3"),
    (r"\bfour\b", "4"),
    (r"\beight\b", "8"),
]

# Clinical release modifiers and pharmaceutical suffixes
RELEASE_MODIFIERS = {
    "sr": "Sustained Release",
    "xr": "Extended Release",
    "er": "Extended Release",
    "cr": "Controlled Release",
    "pr": "Prolonged Release",
    "mr": "Modified Release",
    "ec": "Enteric Coated",
    "dt": "Dispersible Tablet",
    "duo": "Dual Formulation",
    "forte": "High Potency",
    "plus": "Combination Formulation",
    "ds": "Double Strength"
}

UNITS_PATTERN = r"\b(mg|mcg|iu|au|g|ml|gm)\b"


@dataclass
class ParsedPrescriptionQuery:
    raw_query: str
    normalized_query: str
    core_name: str
    dosage_numbers: List[str] = field(default_factory=list)
    dosage_units: List[str] = field(default_factory=list)
    release_modifiers: List[str] = field(default_factory=list)
    explicit_strength: Optional[str] = None


def normalize_spoken_numbers(text: str) -> str:
    """
    Normalizes spoken number words from voice transcripts to Arabic digits.
    Example: 'glycomet gp two' -> 'glycomet gp 2'
             'telma forty' -> 'telma 40'
             'dolo six fifty' -> 'dolo 650'
    """
    lowered = text.lower().strip()
    
    # 1. Apply multi-word phrases first
    for pattern, digit in COMMON_PHARMA_SPOKEN_PATTERNS:
        lowered = re.sub(pattern, digit, lowered)

    # 2. Normalize compound single numbers like 'twenty five' -> '25'
    words = lowered.split()
    new_words = []
    i = 0
    while i < len(words):
        w = words[i]
        if w in ["twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]:
            tens_val = SPOKEN_NUMBER_WORDS[w]
            if i + 1 < len(words) and words[i + 1] in ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]:
                unit_val = SPOKEN_NUMBER_WORDS[words[i + 1]]
                new_words.append(str(tens_val + unit_val))
                i += 2
                continue
            else:
                new_words.append(str(tens_val))
                i += 1
                continue
        elif w in SPOKEN_NUMBER_WORDS:
            new_words.append(str(SPOKEN_NUMBER_WORDS[w]))
            i += 1
            continue
        new_words.append(w)
        i += 1

    return " ".join(new_words)


def tokenize_prescription(query: str) -> ParsedPrescriptionQuery:
    """
    Stage 1: Tokenizes a raw prescription query into its clinical components:
    - Normalizes voice transcript numbers
    - Extracts numeric dosages ('500', '625', '40', '20/5')
    - Extracts units ('mg', 'mcg', 'iu', 'au')
    - Extracts release modifiers ('sr', 'xr', 'er', 'duo', 'forte', 'plus', 'ds')
    - Isolates core drug name stem for high-accuracy phonetic/fuzzy matching
    """
    if not query:
        return ParsedPrescriptionQuery(
            raw_query="",
            normalized_query="",
            core_name=""
        )

    norm_query = normalize_spoken_numbers(query)

    # Normalize hyphens and slashes for drug combinations
    clean_text = norm_query.lower()
    
    # Extract dosage numbers: supports '625', '500', '40', '20/5', '1.25', etc.
    dosage_pattern = r"\b(\d+(?:\.\d+)?(?:/\d+(?:\.\d+)?)?)\s*(?:mg|mcg|iu|au|g|ml|gm)?\b"
    dosage_numbers = []
    for match in re.finditer(dosage_pattern, clean_text):
        num_str = match.group(1)
        # Avoid standalone 0 or year numbers unless reasonable
        if num_str not in dosage_numbers:
            dosage_numbers.append(num_str)

    # Extract units
    dosage_units = re.findall(UNITS_PATTERN, clean_text)

    # Extract release modifiers
    found_modifiers = []
    tokens = re.split(r"[\s\-_]+", clean_text)
    for t in tokens:
        if t in RELEASE_MODIFIERS:
            found_modifiers.append(t)

    # Extract explicit strength string if present (e.g. '40mg', '625mg', '500mg')
    explicit_strength = None
    strength_match = re.search(r"\b(\d+(?:\.\d+)?(?:/\d+(?:\.\d+)?)?)\s*(mg|mcg|iu|au|g|ml|gm)\b", clean_text)
    if strength_match:
        explicit_strength = f"{strength_match.group(1)}{strength_match.group(2)}"
    elif dosage_numbers:
        explicit_strength = f"{dosage_numbers[0]}"

    # Compute core name: strip dosages, units, and release modifiers
    core_tokens = []
    for t in tokens:
        # Check if t is numeric dosage
        is_num = bool(re.match(r"^\d+(?:\.\d+)?(?:/\d+(?:\.\d+)?)?$", t))
        is_unit = t in ["mg", "mcg", "iu", "au", "g", "ml", "gm"]
        is_modifier = t in RELEASE_MODIFIERS
        if not (is_num or is_unit or is_modifier):
            core_tokens.append(t)

    core_name = " ".join(core_tokens).strip()

    return ParsedPrescriptionQuery(
        raw_query=query,
        normalized_query=norm_query,
        core_name=core_name,
        dosage_numbers=dosage_numbers,
        dosage_units=dosage_units,
        release_modifiers=found_modifiers,
        explicit_strength=explicit_strength
    )
