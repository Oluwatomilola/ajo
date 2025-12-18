#!/usr/bin/env python3

import os

files = [
    'frontend/src/components/SecurePrompt.tsx', 
    'frontend/src/utils/secureStorage.ts'
]

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fix the problematic line - replace the bad single quote character
        content = content.replace("\"': ''", "\"': '''")
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f'Fixed {filepath}')
    else:
        print(f'File not found: {filepath}')

print('All files processed')