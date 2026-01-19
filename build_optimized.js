const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const stagingDir = path.join(__dirname, 'staging');
const distDir = path.join(__dirname, 'dist', 'optimized');

// Clean staging
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir);

// Copy directories
const dirsToCopy = ['build', 'public', 'src-electron'];
dirsToCopy.forEach(dir => {
  const src = path.join(__dirname, dir);
  const dest = path.join(stagingDir, dir);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
  } else {
    console.error(`Directory not found: ${src}`);
  }
});

// Create minimal package.json
const pkg = require('./package.json');
const minimalPkg = {
  name: pkg.name,
  productName: pkg.build?.productName || pkg.name,
  version: pkg.version,
  description: pkg.description,
  author: pkg.author,
  homepage: pkg.homepage,
  main: "public/electron.js",
  dependencies: {
    "sql.js": pkg.dependencies["sql.js"],
    "xlsx": pkg.dependencies["xlsx"]
  }
};

fs.writeFileSync(path.join(stagingDir, 'package.json'), JSON.stringify(minimalPkg, null, 2));

console.log('Staging prepared. Installing production dependencies...');

try {
  execSync('npm install --production', { cwd: stagingDir, stdio: 'inherit' });
  console.log('Dependencies installed.');
} catch (e) {
  console.error('Failed to install dependencies:', e);
  process.exit(1);
}

console.log('Running electron-packager...');
// We use the electron-packager from the root devDependencies
const packagerCmd = `npx electron-packager "${stagingDir}" "Isvara Inventory Manager" --platform=win32 --arch=x64 --out="${distDir}" --overwrite --asar --prune=true`;

try {
  execSync(packagerCmd, { stdio: 'inherit' });
  console.log('Packaging complete!');
} catch (e) {
  console.error('Packaging failed:', e);
  process.exit(1);
}
