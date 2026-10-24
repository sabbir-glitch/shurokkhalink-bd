import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import prettier from 'prettier'
import { analyzeMessage } from '../src/lib/analyzeMessage.ts'
import { calculateExactAgreement, calculateKindMetrics } from './evaluation-metrics.mjs'

const root = process.cwd()
const datasetPath = resolve(root, 'research', 'shurokkhabench-v0.2-challenge.json')
const defaultReportPath = resolve(
  root,
  'research',
  'results',
  'shurokkhabench-v0.2-candidate-results.json',
)
const historicalReportPath = resolve(
  root,
  'research',
  'results',
  'shurokkhabench-v0.1-results.json',
)

function sortedKinds(kinds) {
  return [...new Set(kinds)].sort()
}

function evaluateDataset(dataset, datasetBytes) {
  const caseResults = dataset.cases.map((caseItem) => {
    const expectedKinds = sortedKinds(
      caseItem.expectedFindings.map((finding) => finding.kind),
    )
    const observedKinds = sortedKinds(
      analyzeMessage(caseItem.message).map((finding) => finding.kind),
    )
    const exactMatch = JSON.stringify(expectedKinds) === JSON.stringify(observedKinds)

    return {
      id: caseItem.id,
      language: caseItem.language,
      category: caseItem.category,
      expectedKinds,
      observedKinds,
      exactMatch,
    }
  })

  const languageGroups = ['en', 'bn', 'mixed'].map((language) => {
    const group = caseResults.filter((caseItem) => caseItem.language === language)
    return {
      language,
      ...calculateExactAgreement(group),
    }
  })
  const mismatches = caseResults
    .filter((caseItem) => !caseItem.exactMatch)
    .map(({ id, language, category, expectedKinds, observedKinds }) => ({
      id,
      language,
      category,
      expectedKinds,
      observedKinds,
    }))
  const countsByLanguage = Object.fromEntries(
    ['en', 'bn', 'mixed'].map((language) => [
      language,
      dataset.cases.filter((caseItem) => caseItem.language === language).length,
    ]),
  )

  return {
    benchmark: dataset.benchmark,
    version: dataset.version,
    evaluationStatus: 'DRAFT — labels require human review',
    reviewStatus: 'not independently reviewed',
    interpretation:
      'Agreement with draft synthetic intended-indicator labels only. These results are not real-world phishing or fraud-detection effectiveness estimates.',
    dataset: {
      file: 'research/shurokkhabench-v0.2-challenge.json',
      sha256: createHash('sha256').update(datasetBytes).digest('hex'),
      caseCount: dataset.cases.length,
      countsByLanguage,
    },
    exactFindingSetAgreement: calculateExactAgreement(caseResults),
    perLanguageExactFindingSetAgreement: languageGroups,
    perKind: dataset.supportedKinds.map((kind) =>
      calculateKindMetrics(kind, caseResults),
    ),
    mismatchCount: mismatches.length,
    mismatches,
  }
}

async function run() {
  const datasetBytes = readFileSync(datasetPath)
  const dataset = JSON.parse(datasetBytes.toString('utf8'))
  const report = evaluateDataset(dataset, datasetBytes)
  const outputPath = process.argv[2]
    ? resolve(root, process.argv[2])
    : defaultReportPath

  const samePath =
    process.platform === 'win32'
      ? outputPath.toLowerCase() === historicalReportPath.toLowerCase()
      : outputPath === historicalReportPath
  if (samePath) {
    throw new Error('Refusing to overwrite the historical v0.1 report.')
  }

  mkdirSync(dirname(outputPath), { recursive: true })
  const reportText = await prettier.format(`${JSON.stringify(report, null, 2)}\n`, {
    filepath: outputPath,
  })
  writeFileSync(outputPath, reportText, 'utf8')

  console.log(
    `${report.exactFindingSetAgreement.exactFindingSetMatches}/${report.dataset.caseCount} exact finding sets; ${report.mismatchCount} mismatches.`,
  )
  console.log(`Draft candidate report: ${outputPath}`)
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  run().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}

export { evaluateDataset }
