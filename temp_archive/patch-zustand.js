const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.mjs')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/import\.meta\.env \? import\.meta\.env\.MODE : void 0/g, 'process.env.NODE_ENV');
      content = content.replace(/import\.meta\.env/g, 'process.env');
      fs.writeFileSync(fullPath, content);
      console.log('Patched', fullPath);
    }
  }
}

replaceInDir('node_modules/zustand/esm');
