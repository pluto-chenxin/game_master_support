const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const targetDirectory = path.join(__dirname, 'src');

// Files to ignore
const ignoreDirs = ['node_modules', 'build', 'dist', '.git'];

// Replace 'http://localhost:5000' with '${config.API_URL}'
const findAndReplace = async (filePath) => {
  try {
    // Skip non-JS and non-JSX files
    if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) {
      return;
    }

    const data = await readFile(filePath, 'utf8');
    let modified = false;

    // Import the config if it's not already imported and the file contains the localhost URL
    let newData = data;
    if (data.includes('http://localhost:5000') && !data.includes("import config from './config'") && !data.includes("import config from '../config'")) {
      const lines = data.split('\n');
      let insertIndex = 0;
      
      // Find a good place to insert the import
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('import') && !lines[i].includes('from')) {
          continue;
        }
        if (lines[i].includes('import')) {
          insertIndex = i + 1;
        } else if (insertIndex > 0 && !lines[i].trim()) {
          break;
        }
      }
      
      // Determine the correct import path
      const importPath = filePath.includes('/src/components/') || 
                         filePath.includes('/src/pages/') || 
                         filePath.includes('/src/context/') ? 
                         '../config' : './config';
                         
      lines.splice(insertIndex, 0, `import config from '${importPath}';`);
      newData = lines.join('\n');
      modified = true;
    }

    // Replace direct API URL references
    if (newData.includes('http://localhost:5000')) {
      newData = newData.replace(/['"]http:\/\/localhost:5000\/api\//g, '`${config.API_URL}/api/');
      newData = newData.replace(/http:\/\/localhost:5000\$\{/g, '${config.API_URL}${');
      
      // Fix string closing - replace " with ` where needed
      newData = newData.replace(/\$\{config\.API_URL\}\/api\/([^`]*?)"/g, '${config.API_URL}/api/$1`');
      
      // Fix specific cases for img src attributes
      newData = newData.replace(/['"]http:\/\/localhost:5000(.*?)['"](?=[,\s])/g, '`${config.API_URL}$1`');
      
      // For action properties
      newData = newData.replace(/action: ['"]http:\/\/localhost:5000\/api\/uploads['"],/g, 'action: `${config.API_URL}/api/uploads`,');
      
      modified = true;
    }

    if (modified) {
      await writeFile(filePath, newData, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
};

const traverseDirectory = async (dir) => {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    
    if (ignoreDirs.some(ignoreDir => filePath.includes(`/${ignoreDir}/`))) {
      continue;
    }
    
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      await traverseDirectory(filePath);
    } else if (stats.isFile()) {
      await findAndReplace(filePath);
    }
  }
};

// Start the process
(async () => {
  console.log('Starting to update API URLs...');
  await traverseDirectory(targetDirectory);
  console.log('Finished updating API URLs!');
})(); 