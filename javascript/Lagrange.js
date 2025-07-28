const fs = require('fs');
const path = require('path');

// Convert base string to decimal (as BigInt)
function toDecimal(str, base) {
  const digits = '0123456789abcdefghijklmnopqrstuvwxyz';
  str = str.toLowerCase();
  let num = BigInt(0);
  for (let i = 0; i < str.length; i++) {
    num = num * BigInt(base) + BigInt(digits.indexOf(str[i]));
  }
  return num;
}

// Extended Euclidean Algorithm to find modular inverse
function modInverse(a, mod) {
  let m0 = mod, t, q;
  let x0 = BigInt(0), x1 = BigInt(1);

  if (mod === BigInt(1)) return BigInt(0);

  while (a > BigInt(1)) {
    q = a / mod;
    t = mod;

    mod = a % mod;
    a = t;
    t = x0;

    x0 = x1 - q * x0;
    x1 = t;
  }

  if (x1 < BigInt(0)) x1 += m0;

  return x1;
}

// Modular Lagrange Interpolation to find f(0)
function lagrangeInterpolation(shares, primeModulus) {
  let secret = BigInt(0);
  const k = shares.length;

  for (let i = 0; i < k; i++) {
    let xi = shares[i].x;
    let yi = shares[i].y;

    let numerator = BigInt(1);
    let denominator = BigInt(1);

    for (let j = 0; j < k; j++) {
      if (i !== j) {
        let xj = shares[j].x;
        numerator = (numerator * (-xj + primeModulus)) % primeModulus;
        denominator = (denominator * (xi - xj + primeModulus)) % primeModulus;
      }
    }

    const inv = modInverse(denominator, primeModulus);
    const term = (yi * numerator * inv) % primeModulus;
    secret = (secret + term) % primeModulus;
  }

  return secret;
}

// Process a single test case file
function processFile(filePath, primeModulus) {
  const rawData = fs.readFileSync(filePath);
  const json = JSON.parse(rawData);

  const { k } = json.keys;

  const shares = Object.keys(json)
    .filter(key => key !== 'keys')
    .map(key => ({
      x: BigInt(parseInt(key)),
      y: toDecimal(json[key].value, parseInt(json[key].base))
    }))
    .sort((a, b) => Number(a.x - b.x))
    .slice(0, k);

  const secret = lagrangeInterpolation(shares, primeModulus);
  console.log(`✅ ${path.basename(filePath)} ➜ Secret: ${secret.toString()}`);
}

// Process all JSON files in a directory
function processAllTestcases(folderPath, primeModulus) {
  const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.json'));
  for (const file of files) {
    try {
      processFile(path.join(folderPath, file), primeModulus);
    } catch (err) {
      console.error(`❌ Failed: ${file} - ${err.message}`);
    }
  }
}

// === Run ===
const folderPath = path.join(__dirname, '../testcases');

// ⚠️ Choose a safe large prime modulus ( > all possible secrets and shares )
// Example 2^127 - 1 (a Mersenne prime), or customize accordingly
const PRIME_MODULUS = BigInt('170141183460469231731687303715884105727');

processAllTestcases(folderPath, PRIME_MODULUS);
