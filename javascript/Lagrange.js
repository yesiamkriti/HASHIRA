const fs = require('fs');
const path = require('path');

// Convert any base string to decimal
function toDecimal(str, base) {
  const digits = '0123456789abcdefghijklmnopqrstuvwxyz';
  str = str.toLowerCase();
  let num = 0;
  for (let i = 0; i < str.length; i++) {
    num = num * base + digits.indexOf(str[i]);
  }
  return num;
}

// Lagrange interpolation to get f(0)
function lagrangeInterpolation(shares) {
  let secret = 0;
  const k = shares.length;

  for (let i = 0; i < k; i++) {
    let xi = shares[i].x;
    let yi = shares[i].y;
    let numerator = 1;
    let denominator = 1;

    for (let j = 0; j < k; j++) {
      if (i !== j) {
        let xj = shares[j].x;
        numerator *= -xj;
        denominator *= (xi - xj);
      }
    }
    secret += yi * (numerator / denominator);
  }

  return Math.round(secret);
}

// Process a single JSON file
function processFile(filePath) {
  const rawData = fs.readFileSync(filePath);
  const json = JSON.parse(rawData);

  const { k } = json.keys;

  const shares = Object.keys(json)
    .filter(key => key !== 'keys')
    .map(key => ({
      x: parseInt(key),
      y: toDecimal(json[key].value, parseInt(json[key].base))
    }))
    .sort((a, b) => a.x - b.x)
    .slice(0, k);

  const secret = lagrangeInterpolation(shares);
  console.log(`✅ ${path.basename(filePath)} ➜ Secret: ${secret}`);
}

// Process all files in a directory
function processAllTestcases(folderPath) {
  const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.json'));
  for (const file of files) {
    try {
      processFile(path.join(folderPath, file));
    } catch (err) {
      console.error(`❌ Failed: ${file} - ${err.message}`);
    }
  }
}

// Run the automation
const folderPath = path.join(__dirname, '../testcases');
processAllTestcases(folderPath);
