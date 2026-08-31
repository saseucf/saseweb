import os
import re

directories = ['app', 'components']
replace_patterns = [(r'<span className="text-\[#fbbf24\]">UCF</span>', r'UCF')]

for root, _, files in os.walk('.'):
    if 'node_modules' in root or '.next' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            # Skip the home page
            if path == r'.\app\page.tsx' or path == './app/page.tsx' or path == 'app/page.tsx' or path == r'app\page.tsx':
                continue
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            new_content = content
            for old, new in replace_patterns:
                new_content = re.sub(old, new, new_content)
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Reverted {path}')
