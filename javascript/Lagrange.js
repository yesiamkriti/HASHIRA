const fs = require('fs');
const path = require('path');

// Convert a number string in any base (up to base-36) to a BigInt
function toDecimal(str, base) {
  const digits = '0123456789abcdefghijklmnopqrstuvwxyz';
  str = str.toLowerCase();
  let result = 0n;

  for (let char of str) {
    const digit = BigInt(digits.indexOf(char));
    result = result * BigInt(base) + digit;
  }

  return result;
}

// Perform Lagrange Interpolation at x = 0 to find the secret
function lagrangeInterpolation(shares) {
  let secret = 0n;
  const k = shares.length;

  for (let i = 0; i < k; i++) {
    let xi = BigInt(shares[i].x);
    let yi = shares[i].y;

    let numerator = 1n;
    let denominator = 1n;

    for (let j = 0; j < k; j++) {
      if (i === j) continue;

      let xj = BigInt(shares[j].x);
      numerator *= -xj;
      denominator *= (xi - xj);
    }

    // Compute modular inverse if needed, but here we assume integers are safe
    const term = yi * numerator / denominator;
    secret += term;
  }

  return secret;
}

// Process a single JSON test file
function processTestFile(filePath) {
  const rawData = fs.readFileSync(filePath);
  const data = JSON.parse(rawData);

  const { k } = data.keys;

  // Extract and decode the shares
  const shares = Object.entries(data)
    .filter(([key]) => key !== 'keys')
    .map(([x, { base, value }]) => ({
      x: parseInt(x),
      y: toDecimal(value, parseInt(base))
    }))
    .sort((a, b) => a.x - b.x)
    .slice(0, k); // Use first k shares

  // Reconstruct the secret using Lagrange Interpolation
  const secret = lagrangeInterpolation(shares);

  console.log(`✅ ${path.basename(filePath)} ➜ Secret: ${secret.toString()}`);
}

// Process all test case files in a directory
function processAllFiles(folderPath) {
  const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.json'));

  for (const file of files) {
    try {
      const filePath = path.join(folderPath, file);
      processTestFile(filePath);
    } catch (err) {
      console.error(`❌ ${file} ➜ Error: ${err.message}`);
    }
  }
}

// Run from directory: /path/to/testcases
const testcasesFolder = path.join(__dirname, '../testcases');
processAllFiles(testcasesFolder);
