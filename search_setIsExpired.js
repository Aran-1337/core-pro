const fs = require('fs');
const content = fs.readFileSync('D:\\core\\src\\app\\courses\\[id]\\page.tsx', 'utf8');
content.split('\n').forEach((line, index) => {
  if (line.includes('setIsExpired')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
