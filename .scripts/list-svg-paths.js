const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'public', 'africa.svg');
const s = fs.readFileSync(file, 'utf8');
const pats = s.match(/<path\b[^>]*>/g) || [];
const results = pats.map(p => {
  const idMatch = p.match(/id=\"([^\"]+)\"/) || p.match(/id=\'([^\']+)\'/) || [];
  const titleMatch = p.match(/title=\"([^\"]+)\"/) || p.match(/title=\'([^\']+)\'/) || [];
  return {
    id: idMatch[1] || '<no-id>',
    title: titleMatch[1] || '<no-title>'
  }
});
results.forEach(r => console.log(r.id + ' - ' + r.title));
console.log('\nTotal paths found:', results.length);
