import { $ } from "bun";
import { readFileSync, existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const version = pkg.version as string;

type Target = {
  bunTarget: string;
  outName: string;
};

// Targets to cross-compile for
const TARGETS: Target[] = [
  { bunTarget: "bun-darwin-arm64", outName: `pr-ping-darwin-arm64` },
  { bunTarget: "bun-darwin-x64", outName: `pr-ping-darwin-x64` },
  { bunTarget: "bun-linux-x64", outName: `pr-ping-linux-x64` },
  { bunTarget: "bun-linux-arm64", outName: `pr-ping-linux-arm64` },
];

const DIST = "dist";
const entrypoint = "src/index.tsx";

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

console.log(`Building pr-ping v${version} for ${TARGETS.length} targets...\n`);

for (const target of TARGETS) {
  const binName = target.outName;
  const binPath = `${DIST}/${binName}`;

  console.log(`[${target.bunTarget}] Building...`);

  const result = await $`bun build ${entrypoint} --compile --target=${target.bunTarget} --outfile ${binPath}`
    .nothrow()
    .quiet();

  if (result.exitCode !== 0) {
    console.error(`[${target.bunTarget}] FAILED:\n${result.stderr.toString().trim()}`);
    continue;
  }

  console.log(`[${target.bunTarget}] Done (${binName})`);
}

// Create .tar.gz archives
console.log("\nCreating archives...");

const tarResults: string[] = [];

for (const target of TARGETS) {
  const binName = target.outName;
  const binPath = `${DIST}/${binName}`;

  if (!existsSync(binPath)) {
    console.warn(`[${target.bunTarget}] Binary not found, skipping archive`);
    continue;
  }

  const archiveName = `pr-ping-v${version}-${target.bunTarget.replace("bun-", "")}.tar.gz`;
  const archivePath = `${DIST}/${archiveName}`;

  await $`tar czf ${archivePath} -C ${DIST} ${binName}`;

  const size = (await $`wc -c < ${archivePath}`.text()).trim();
  tarResults.push(`${archiveName}  ${Number(size).toLocaleString()} bytes`);

  await rm(binPath);
}

console.log("\n" + tarResults.join("\n"));

// Generate checksums
const checksumResults = await $`cd ${DIST} && sha256sum *`.text();
console.log("\nSHA256 checksums:");
console.log(checksumResults);

await writeFile(`${DIST}/SHA256SUMS.txt`, checksumResults);

console.log("\nDone. Artifacts in dist/");
