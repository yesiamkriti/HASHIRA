const fs = require('fs')
const path = require('path')
const Decimal = require('decimal.js')

const folderPath = '../testcases'

function parseValue(base, value) {
  return new Decimal(parseInt(value, parseInt(base)))
}

function loadTestCases(folderPath) {
  return fs.readdirSync(folderPath).filter((file) => file.endsWith('.json'))
}

function readTestCase(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const { k } = data.keys
  const shares = Object.entries(data)
    .filter(([key]) => key !== 'keys')
    .map(([x, obj]) => ({
      x: new Decimal(x),
      y: parseValue(obj.base, obj.value),
    }))
    .sort((a, b) => a.x.comparedTo(b.x))
    .slice(0, k)
  return { k, shares }
}

function gaussElimination(matrix, result) {
  const n = matrix.length

  for (let i = 0; i < n; i++) {
    let factor = matrix[i][i]
    for (let j = 0; j < n; j++) {
      matrix[i][j] = matrix[i][j].div(factor)
    }
    result[i] = result[i].div(factor)

    for (let k = i + 1; k < n; k++) {
      let f = matrix[k][i]
      for (let j = 0; j < n; j++) {
        matrix[k][j] = matrix[k][j].minus(f.mul(matrix[i][j]))
      }
      result[k] = result[k].minus(f.mul(result[i]))
    }
  }

  let solution = Array(n).fill(new Decimal(0))
  for (let i = n - 1; i >= 0; i--) {
    solution[i] = result[i]
    for (let j = i + 1; j < n; j++) {
      solution[i] = solution[i].minus(matrix[i][j].mul(solution[j]))
    }
  }

  return solution
}

function reconstructSecretGauss(shares) {
  const k = shares.length
  const matrix = []
  const result = []

  for (let i = 0; i < k; i++) {
    const row = []
    const xi = shares[i].x
    for (let j = 0; j < k; j++) {
      row.push(xi.pow(j))
    }
    matrix.push(row)
    result.push(shares[i].y)
  }

  const coeffs = gaussElimination(matrix, result)
  return coeffs[0].round().toString() // return string for full accuracy
}

function main() {
  const testFiles = loadTestCases(folderPath)

  testFiles.forEach((file) => {
    const { shares } = readTestCase(path.join(folderPath, file))
    const secret = reconstructSecretGauss(shares)
    console.log(`✅ ${file} ➜ Secret: ${secret}`)
  })
}

main()
