const fs = require('fs');
const file = 'www/app.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
    /const reverseArrangementLineForRTL = \(content\) => {\n        \/\/ Disabled JS reversal since CSS now forces \.section-badges-row to direction: ltr\.\n        \/\/ We want the editor text content to simply mirror exactly what is typed \n        \/\/ without reversing it under the hood\. \n        return content;\n    };/g,
    `const reverseArrangementLineForRTL = (content) => {
        const isRTL = detectRTL(content);
        if (!isRTL) return content;
        const arrangementLinePattern = /^([\\s]*)(\\([A-Z]+\\d*\\)(?:\\s*\\([A-Z]+\\d*\\))+)([\\s]*)$/gim;
        return content.replace(arrangementLinePattern, (match, prefix, badges, suffix) => {
            const badgePattern = /\\([A-Z]+\\d*\\)/gi;
            const badgeMatches = badges.match(badgePattern);
            if (badgeMatches && badgeMatches.length > 1) {
                return prefix + badgeMatches.reverse().join(' ') + suffix;
            }
            return match;
        });
    };`
);
fs.writeFileSync(file, content);
console.log('Reverted.');
