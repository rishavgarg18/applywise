#!/usr/bin/env npx tsx
/**
 * Resume parse regression script.
 * Usage: npm run test:parse [-- --fixture sample-resume.pdf]
 */
import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import { orchestrateExtraction } from "../src/lib/resume-extraction/orchestrator";
import { scoreExtraction } from "../src/lib/resume-extraction/quality";

const FIXTURES_DIR = resolve(
  __dirname,
  "../src/lib/resume-extraction/__fixtures__"
);

async function main() {
  const args = process.argv.slice(2);
  const fixtureIdx = args.indexOf("--fixture");
  const fixtureName =
    fixtureIdx >= 0 ? args[fixtureIdx + 1] : "sample-resume.pdf";

  const pdfPath = join(FIXTURES_DIR, fixtureName);
  const expectedPath = join(
    FIXTURES_DIR,
    fixtureName.replace(/\.pdf$/i, "-expected.json")
  );

  if (!existsSync(pdfPath)) {
    console.error(`Fixture not found: ${pdfPath}`);
    process.exit(1);
  }

  const pdfBuffer = readFileSync(pdfPath);
  const base64Pdf = pdfBuffer.toString("base64");

  console.log(`Parsing ${fixtureName}...`);
  const result = await orchestrateExtraction({ base64Pdf });

  console.log(`Quality score: ${result.qualityScore}`);
  if (result.warning) console.log(`Warning: ${result.warning}`);

  console.log("\nExtracted profile summary:");
  console.log(`  Name: ${result.profile.fullName}`);
  console.log(`  Email: ${result.profile.email}`);
  console.log(`  Experiences: ${result.profile.experiences?.length ?? 0}`);
  console.log(`  Education: ${result.profile.education?.length ?? 0}`);

  if (existsSync(expectedPath)) {
    const expected = JSON.parse(readFileSync(expectedPath, "utf-8"));
    const minScore = expected.minQualityScore ?? 50;
    if (result.qualityScore < minScore) {
      console.error(
        `\nFAIL: quality score ${result.qualityScore} < minimum ${minScore}`
      );
      process.exit(1);
    }

    for (const field of expected.requiredFields || []) {
      const val = (result.profile as unknown as Record<string, unknown>)[field];
      if (val == null || val === "" || (Array.isArray(val) && val.length === 0)) {
        console.error(`\nFAIL: missing required field "${field}"`);
        process.exit(1);
      }
    }
    console.log("\nPASS: fixture expectations met");
  } else {
    const score = scoreExtraction(result.profile);
    if (score < 50) {
      console.error(`\nFAIL: quality score ${score} below threshold`);
      process.exit(1);
    }
    console.log("\nPASS: basic quality threshold met");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
