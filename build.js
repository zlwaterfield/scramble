const fs = require('fs-extra');
const path = require('path');

async function build() {
  // Base extension files
  const commonFiles = [
    'popup.html',
    'popup.js',
    'styles.css',
    'icons'
  ];

  // Build for Chrome (MV3)
  await fs.ensureDir('dist/chrome');
  await fs.copy('src', 'dist/chrome');
  await fs.copy('manifests/manifest_v3.json', 'dist/chrome/manifest.json');

  // Build for Firefox (MV2)
  await fs.ensureDir('dist/firefox');
  await fs.copy('src', 'dist/firefox');
  await fs.copy('manifests/manifest_v2.json', 'dist/firefox/manifest.json');
}

build();