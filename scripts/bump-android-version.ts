import fs from "node:fs";
import path from "node:path";

export interface BumpResult {
  previousVersionName: string;
  previousVersionCode: number;
  newVersionName: string;
  newVersionCode: number;
  releaseTag: string;
}

export function parseSemver(versionStr: string): { major: number; minor: number; patch: number } {
  const parts = versionStr.trim().replace(/^v/, "").split(".");
  const major = parseInt(parts[0] || "1", 10) || 1;
  const minor = parseInt(parts[1] || "0", 10) || 0;
  const patch = parseInt(parts[2] || "0", 10) || 0;
  return { major, minor, patch };
}

export function calculateNextVersionName(currentVersionName: string, bumpType: "patch" | "minor" | "major" | string): string {
  // If an explicit semantic version was provided (e.g. "1.2.3" or "v1.2.3")
  if (/^v?\d+\.\d+(\.\d+)?$/.test(bumpType) && !["patch", "minor", "major"].includes(bumpType)) {
    const clean = bumpType.replace(/^v/, "");
    const parts = clean.split(".");
    if (parts.length === 2) return `${clean}.0`;
    return clean;
  }

  const { major, minor, patch } = parseSemver(currentVersionName);

  switch (bumpType) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

export function bumpAndroidVersion(options: {
  rootDir?: string;
  bumpType?: "patch" | "minor" | "major" | string;
  explicitCode?: number;
  explicitVersion?: string;
  dryRun?: boolean;
  quiet?: boolean;
} = {}): BumpResult {
  const root = options.rootDir || process.cwd();
  const gradlePath = path.resolve(root, "android-shell/app/build.gradle.kts");
  const pkgPath = path.resolve(root, "package.json");

  if (!fs.existsSync(gradlePath)) {
    throw new Error(`Gradle file not found at: ${gradlePath}`);
  }

  const gradleContent = fs.readFileSync(gradlePath, "utf8");

  // Extract versionCode
  const codeMatch = gradleContent.match(/versionCode\s*=\s*(\d+)/);
  if (!codeMatch) {
    throw new Error("Unable to parse 'versionCode' from android-shell/app/build.gradle.kts");
  }
  const previousVersionCode = parseInt(codeMatch[1], 10);

  // Extract versionName
  const nameMatch = gradleContent.match(/versionName\s*=\s*"([^"]+)"/);
  if (!nameMatch) {
    throw new Error("Unable to parse 'versionName' from android-shell/app/build.gradle.kts");
  }
  const previousVersionName = nameMatch[1];

  // Calculate next values
  const newVersionCode = options.explicitCode !== undefined
    ? options.explicitCode
    : previousVersionCode + 1;

  let newVersionName: string;
  if (options.explicitVersion) {
    newVersionName = options.explicitVersion.replace(/^v/, "");
  } else {
    newVersionName = calculateNextVersionName(
      previousVersionName,
      options.bumpType || "patch",
    );
  }

  const releaseTag = `v${newVersionName}`;

  if (!options.quiet) {
    console.log("====================================================");
    console.log("🚀 Android Version Bump Engine");
    console.log("====================================================");
    console.log(`Previous Version : ${previousVersionName} (code: ${previousVersionCode})`);
    console.log(`New Version      : ${newVersionName} (code: ${newVersionCode})`);
    console.log(`Release Tag      : ${releaseTag}`);
    if (options.dryRun) {
      console.log("🔍 DRY RUN: No files were modified.");
    }
  }

  if (!options.dryRun) {
    // 1. Update android-shell/app/build.gradle.kts
    const updatedGradle = gradleContent
      .replace(/versionCode\s*=\s*\d+/, `versionCode = ${newVersionCode}`)
      .replace(/versionName\s*=\s*"[^"]+"/, `versionName = "${newVersionName}"`);
    fs.writeFileSync(gradlePath, updatedGradle, "utf8");
    if (!options.quiet) console.log("✓ Updated android-shell/app/build.gradle.kts");

    // 2. Update package.json
    if (fs.existsSync(pkgPath)) {
      const pkgRaw = fs.readFileSync(pkgPath, "utf8");
      const pkg = JSON.parse(pkgRaw);
      pkg.version = newVersionName;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
      if (!options.quiet) console.log("✓ Synchronized package.json version");
    }

    // 3. Write to GITHUB_OUTPUT if available
    const githubOutput = process.env.GITHUB_OUTPUT;
    if (githubOutput && fs.existsSync(githubOutput)) {
      const outputLines = [
        `previous_version_name=${previousVersionName}`,
        `previous_version_code=${previousVersionCode}`,
        `new_version_name=${newVersionName}`,
        `new_version_code=${newVersionCode}`,
        `release_tag=${releaseTag}`,
      ].join("\n") + "\n";
      fs.appendFileSync(githubOutput, outputLines, "utf8");
      if (!options.quiet) console.log("✓ Exported variables to GITHUB_OUTPUT");
    }
  }

  return {
    previousVersionName,
    previousVersionCode,
    newVersionName,
    newVersionCode,
    releaseTag,
  };
}

// CLI Execution entry point
if (process.argv[1] && (process.argv[1].endsWith("bump-android-version.ts") || process.argv[1].endsWith("bump-android-version.js"))) {
  const args = process.argv.slice(2);
  let bumpType = "patch";
  let explicitCode: number | undefined;
  let explicitVersion: string | undefined;
  let dryRun = false;
  let quiet = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--quiet") {
      quiet = true;
    } else if (arg === "--code" && args[i + 1]) {
      explicitCode = parseInt(args[++i], 10);
    } else if (arg === "--version" && args[i + 1]) {
      explicitVersion = args[++i];
    } else if (["patch", "minor", "major"].includes(arg)) {
      bumpType = arg;
    } else if (/^v?\d+\.\d+(\.\d+)?$/.test(arg)) {
      explicitVersion = arg;
    }
  }

  try {
    bumpAndroidVersion({
      bumpType,
      explicitCode,
      explicitVersion,
      dryRun,
      quiet,
    });
  } catch (err: any) {
    console.error(`❌ Version bump failed: ${err.message}`);
    process.exit(1);
  }
}
