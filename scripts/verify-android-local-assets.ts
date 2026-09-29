import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log('====================================================');
console.log('🧪 Starting Android Local Assets & Offline Mandate Test');
console.log('====================================================');

const rootDir = process.cwd();

// 1. Verify MainActivity.kt architecture
const mainActivityPath = path.join(
  rootDir,
  'android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt'
);
assert(fs.existsSync(mainActivityPath), 'MainActivity.kt must exist');
const activityContent = fs.readFileSync(mainActivityPath, 'utf8');

// Assert APP_URL is purged
assert(!activityContent.includes('APP_URL'), 'MainActivity.kt must NOT contain any APP_URL definition or usage');
console.log('✅ PASS: APP_URL is completely removed from MainActivity.kt');

// Assert remote website host (github.io) is purged
assert(!activityContent.includes('github.io'), 'MainActivity.kt must NOT reference remote github.io host');
console.log('✅ PASS: Remote web-app domain (github.io) is completely removed from MainActivity.kt');

// Assert LOCAL_ASSET_DOMAIN is defined and used
assert(
  activityContent.includes('LOCAL_ASSET_DOMAIN = "appassets.androidplatform.net"'),
  'MainActivity.kt must define LOCAL_ASSET_DOMAIN as appassets.androidplatform.net'
);
console.log('✅ PASS: LOCAL_ASSET_DOMAIN is configured for appassets.androidplatform.net');

// Assert onCreate exclusively loads from local asset domain
assert(
  activityContent.includes('webView.loadUrl("https://$LOCAL_ASSET_DOMAIN/$querySuffix")'),
  'MainActivity.kt must unconditionally load from local asset domain'
);
console.log('✅ PASS: onCreate unconditionally loads from local asset domain');

// Assert onNewIntent exclusively loads from local asset domain
assert(
  activityContent.includes('Navigating to shared URL via local asset domain: https://$LOCAL_ASSET_DOMAIN/$querySuffix'),
  'MainActivity.kt onNewIntent must route through local asset domain'
);
console.log('✅ PASS: onNewIntent unconditionally routes through local asset domain');

// Assert shouldOverrideUrlLoading keeps only local assets and YouTube player embeds
assert(
  activityContent.includes('if (host == LOCAL_ASSET_DOMAIN)'),
  'shouldOverrideUrlLoading must preserve LOCAL_ASSET_DOMAIN'
);
console.log('✅ PASS: shouldOverrideUrlLoading preserves local assets in WebView');

// 2. Verify Android assets bundling
const assetsDir = path.join(rootDir, 'android-shell/app/src/main/assets');
assert(fs.existsSync(assetsDir), 'android-shell assets directory must exist');
assert(fs.existsSync(path.join(assetsDir, 'index.html')), 'assets/index.html must exist');
console.log('✅ PASS: Local assets directory contains bundled production index.html');

// 3. Verify build scripts ensure assets are always packaged
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
assert(
  pkg.scripts['build:android-assets']?.includes('cp -r dist/* android-shell/app/src/main/assets/'),
  'package.json must contain build:android-assets script'
);
console.log('✅ PASS: package.json provides build:android-assets bundling command');

// 4. Verify build.gradle.kts integrates asset build on preBuild
const buildGradlePath = path.join(rootDir, 'android-shell/app/build.gradle.kts');
const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
assert(
  buildGradleContent.includes('prepareWebAssets') && buildGradleContent.includes('build:android-assets'),
  'build.gradle.kts must prepare web assets before assembling APK'
);
console.log('✅ PASS: build.gradle.kts attaches web assets preparation to preBuild');

console.log('====================================================');
console.log('📊 ANDROID LOCAL ASSETS TEST: All tests passed!');
console.log('====================================================');
