const fs = require('fs');
const p = 'src/routes/(auth)/login/google/callback/+server.ts';
let c = fs.readFileSync(p, 'utf8');
c = c.replace('Bearer  + '$' + {tokens.accessToken}', 'Bearer  + '$' + {tokens.accessToken()}');
fs.writeFileSync(p, c);
console.log('Fixed');
