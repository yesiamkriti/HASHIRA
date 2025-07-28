const fs = require('fs');
const path = require('path');

// Convert base string to decimal
function toDecimal(str, base) {
  const digits = '0123456789abcdefghijklmnopqrstuvwxyz';
  str = str.toLowerCase();
  let num = 0;
  for (let i = 0; i < str.length; i++) {
    num = num * base + digits.indexOf(str[i]);
  }
  return num;
}

// Generate Vandermonde matrix and result vector
function constructMatrixAndVector(shares, k) {
  const matrix = [];
  const vector = [];

  for (let i = 0; i < k; i++) {
    const row = [];
    const xi = shares[i].x;
    let xPow = 1;

    for (let j = 0; j < k; j++) {
      row.push(xPow);       // xi^j
      xPow *= xi;
    }

    matrix.push(row);
    vector.push(shares[i].y);
  }

  return { matrix, vector };
}

// Solve Ax = b using Gaussian Elimination (returns x)
function gaussianElimination(matrix, vector) {
  const n = matrix.length;

  for (let i = 0; i < n; i++) {
    // Partial pivoting
    let maxRow = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(matrix[j][i]) > Math.abs(matrix[maxRow][i])) {
        maxRow = j;
      }
    }
    [matrix[i], matrix[maxRow]] = [matrix[maxRow], matrix[i]];
    [vector[i], vector[maxRow]] = [vector[maxRow], vector[i]];

    // Eliminate
    for (let j = i + 1; j < n; j++) {
      const factor = matrix[j][i] / matrix[i][i];
      for (let k = i; k < n; k++) {
        matrix[j][k] -= factor * matrix[i][k];
      }
      vector[j] -= factor * vector[i];
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = vector[i];
    for (let j = i + 1; j < n; j++) {
      sum -= matrix[i][j] * x[j];
    }
    x[i] = sum / matrix[i][i];
  }

  return x;
}

// Reconstruct secret using Matrix Method
function reconstructUsingMatrix(shares, k) {
  const { matrix, vector } = constructMatrixAndVector(shares, k);
  const coefficients = gaussianElimination(matrix, vector);
  return Math.round(coefficients[0]); // constant term (a₀) = secret
}

// Process one file
function processFile(filePath) {
  const raw = fs.readFileSync(filePath);
  const json = JSON.parse(raw);
  const k = json.keys.k;

  const shares = Object.entries(json)
    .filter(([key]) => key !== 'keys')
    .map(([x, data]) => ({
      x: parseInt(x),
      y: toDecimal(data.value, parseInt(data.base))
    }))
    .sort((a, b) => a.x - b.x)
    .slice(0, k);

  const secret = reconstructUsingMatrix(shares, k);
  console.log(`✅ ${path.basename(filePath)} ➜ Secret: ${secret}`);
}

// Process all JSON files in a folder
function processAllTestcases(folderPath) {
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      processFile(path.join(folderPath, file));
    } catch (err) {
      console.error(`❌ ${file}: ${err.message}`);
    }
  }
}

// Run
const folderPath = path.join(__dirname, '../testcases');
processAllTestcases(folderPath);
