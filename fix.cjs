const fs = require('fs');

function fixStorageLimitUI(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix percentage
    content = content.replace(
        /Math\.min\(100,\s*\(\s*data\.user\.storageUsed\s*\/\s*data\.user\.storageLimit\s*\)\s*\*\s*100\s*\)/g,
        "data.user.storageLimit === -1 ? 0 : Math.min(100, (data.user.storageUsed / data.user.storageLimit) * 100)"
    );

    // Fix formatBytes
    content = content.replace(
        /\{formatBytes\(\s*data\.user\?\.storageLimit\s*\|\|\s*0\s*\)\}/g,
        "{data.user?.storageLimit === -1 ? 'Unlimited' : formatBytes(data.user?.storageLimit || 0)}"
    );

    fs.writeFileSync(filePath, content);
}

fixStorageLimitUI('src/routes/(app)/+layout.svelte');
fixStorageLimitUI('src/routes/(app)/dashboard/+page.svelte');
fixStorageLimitUI('src/routes/(app)/drive/+page.svelte');

console.log('Fixed storage limits');
