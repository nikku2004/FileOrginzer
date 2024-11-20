import { watch } from 'chokidar';
import { existsSync, mkdirSync, renameSync, readdirSync } from 'fs';
import { basename, extname, join } from 'path';
import { format } from 'date-fns';

// Path to watch (you can change this to any directory you want)
const pathToWatch = "C:/Users/ASUS/Documents/Mahesh/FileOrginzer/";  // Watching the specific directory

// Function to create directory if it doesn't exist
const createDirectoryIfNeeded = (dirPath) => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
    console.log(`[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] Created directory: ${dirPath}`);
  }
};

// Function to determine folder based on file extension
const getFolderNameBasedOnExtension = (fileExtension) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
  const docExtensions = ['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx'];
  const videoExtensions = ['mp4', 'avi', 'mkv', 'mov'];
  const audioExtensions = ['mp3', 'wav', 'aac', 'flac'];

  if (videoExtensions.includes(fileExtension.toLowerCase())) {
    return 'video';  // Files with video extensions go to the 'video' folder
  } else if (audioExtensions.includes(fileExtension.toLowerCase())) {
    return 'audio';  // Files with audio extensions go to the 'audio' folder
  } else if (imageExtensions.includes(fileExtension.toLowerCase())) {
    return 'image';  // Files with image extensions go to the 'image' folder
  } else if (docExtensions.includes(fileExtension.toLowerCase())) {
    return 'doc';  // Files with document extensions go to the 'doc' folder
  } else {
    return null;  // Any other files go into the 'others' folder
  }
};

// Function to organize the file based on its extension
const organizeFile = (filePath) => {
  if (!filePath) {
    return;
  }

  const fileName = basename(filePath);
  const fileExtension = extname(filePath).slice(1);  // Get extension without the dot

  // Determine the correct folder based on the file extension
  const folderName = getFolderNameBasedOnExtension(fileExtension);
  if (!folderName) {
    return;
  }

  // Create the target directory for the folder name (image/ or doc/ or others/)
  const targetDir = join(pathToWatch, folderName);
  createDirectoryIfNeeded(targetDir);

  // Destination path for the file based on the determined folder
  const destPath = join(targetDir, fileName);

  try {
    // Move the file into the appropriate directory
    renameSync(filePath, destPath);
    console.log(`[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] Moved: ${filePath} -> ${destPath}`);
  } catch (err) {
    console.error(`[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] Error moving file ${filePath}:`, err);
  }
};

// Function to get existing files in the directory
const getExistingFiles = (dirPath) => {
  try {
    return readdirSync(dirPath).map(file => join(dirPath, file));
  } catch (err) {
    console.error(`Error reading directory ${dirPath}:`, err);
    return [];
  }
};

// Get existing files when the watcher starts (before handling new events)
const existingFiles = getExistingFiles(pathToWatch);

// Initialize watcher
const watcher = watch(pathToWatch, {
  persistent: true,  // Keeps the watcher running
  ignored: /node_modules|\.git/,  // Ignores directories like node_modules and .git
  ignoreInitial: true,  // This prevents triggering events for already existing files
  awaitWriteFinish: {
    stabilityThreshold: 2000,  // Wait for 2 seconds after the last change
    pollInterval: 100  // Check for changes every 100 milliseconds
  },
});

// Event listeners for different file system changes
watcher
  .on('add', path => {
    // Only process new files that weren't already in the directory
    if (!existingFiles.includes(path)) {
      console.log(`[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] File added: ${path}`);
      organizeFile(path);  // Organize the file when added
    }
  })
  .on('change', path => {
    // Process modified files
    console.log(`[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] File changed: ${path}`);
    organizeFile(path);  // Organize the file when modified
  })
  .on('unlink', path => {
    console.log(`[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] File removed: ${path}`);
  })
  .on('addDir', path => {
    console.log(`[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] Directory added: ${path}`);
  })
  .on('unlinkDir', path => {
    console.log(`[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] Directory removed: ${path}`);
  })
  .on('error', error => console.error(`[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] Watcher error: ${error}`))
  .on('ready', () => console.log(`[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] Watcher is now ready to detect changes in ${pathToWatch}`));

console.log(`[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] Watching file system activity in ${pathToWatch}`);
