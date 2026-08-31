import os
import re

files_to_update = [
    r"src\routes\(app)\profile\+page.server.ts",
    r"src\routes\(auth)\login\+page.server.ts",
    r"src\routes\(auth)\onboarding\+server.ts",
    r"src\routes\(auth)\register\+page.server.ts",
    r"src\routes\(auth)\reset-password\[token]\+page.server.ts",
    r"src\routes\api\admin\users\[id]\+server.ts",
    r"src\routes\api\profile\change-password\+server.ts",
    r"src\routes\api\profile\request-key-reveal\+server.ts"
]

for fpath in files_to_update:
    if not os.path.exists(fpath):
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace imports
    content = re.sub(
        r"import bcrypt(js)? from 'bcryptjs';",
        "import { hashPassword, comparePassword } from '$lib/server/hash';",
        content
    )
    
    # Replace dynamic imports
    content = re.sub(
        r"const bcrypt = await import\('bcryptjs'\);",
        "const { hashPassword } = await import('$lib/server/hash');",
        content
    )

    # Replace method calls
    # bcrypt.hash(something, 10) -> hashPassword(something)
    content = re.sub(
        r"await bcrypt(?:js)?\.hash\(([^,]+), 10\)",
        r"await hashPassword(\1)",
        content
    )

    # bcrypt.compare(something, something2) -> comparePassword(something, something2)
    content = re.sub(
        r"await bcrypt(?:js)?\.compare\(([^,]+), ([^\)]+)\)",
        r"await comparePassword(\1, \2)",
        content
    )

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated server auth files!")
