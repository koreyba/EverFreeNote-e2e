const fs = require('fs');
const path = require('path');

const resultsPath = path.resolve(__dirname, 'results.json');
if (!fs.existsSync(resultsPath)) {
  console.error('results.json not found');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const reportsDir = path.resolve(__dirname, 'a11y-reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

function findAttachments(obj) {
  let attachments = [];
  if (obj && typeof obj === 'object') {
    if (obj.attachments && Array.isArray(obj.attachments)) {
      attachments.push(...obj.attachments);
    }
    for (const key of Object.keys(obj)) {
      attachments.push(...findAttachments(obj[key]));
    }
  }
  return attachments;
}

const allAttachments = findAttachments(data);
console.log(`Found ${allAttachments.length} attachments.`);

let count = 0;
allAttachments.forEach(att => {
  if (att.contentType === 'text/markdown' && att.body) {
    const decoded = Buffer.from(att.body, 'base64').toString('utf8');
    const filename = att.name;
    const dest = path.join(reportsDir, filename);
    fs.writeFileSync(dest, decoded, 'utf8');
    console.log(`Extracted: ${filename}`);
    count++;
  }
});
console.log(`Successfully extracted ${count} markdown reports.`);
