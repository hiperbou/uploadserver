const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const DEFAULT_PORT = 3000;
// Get the port from command-line arguments or use the default
const port = process.argv[2] || DEFAULT_PORT;

app.use(express.urlencoded({ extended: true }));

// Load config file
const configPath = path.join(__dirname, 'config.json');
let config = { uploadDirectories: ['uploads'] };

if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} else {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, req.body.directory || 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Serve the HTML form
app.get('/', (req, res) => {
  const uploadDir = path.join(__dirname, 'uploads');
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error('Error reading uploads directory:', err);
      return res.status(500).send('Unable to read uploaded files.');
    }

    // Generate HTML for the list of files
    const fileList = files.map(file => `
      <li>
        <a href="/download/${file}" download>${file}</a>
      </li>
    `).join('');

    // Generate HTML for the directory dropdown
    const directoryOptions = config.uploadDirectories.map(dir => `
      <option value="${dir}">${dir}</option>
    `).join('');

    // Send the HTML response
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>File Upload</title>
      </head>
      <body>
        <h1>Upload a File</h1>
        <form action="/upload" method="POST" enctype="multipart/form-data">
          <input type="file" name="file" required>
          <label for="directory">Select Upload Directory:</label>
          <select name="directory" id="directory" required>
            ${directoryOptions}
          </select>
          <button type="submit">Upload</button>
        </form>

        <h2>Uploaded Files</h2>
        <ul>${fileList}</ul>

        <h2>Add New Directory</h2>
        <form action="/add-directory" method="POST">
          <input type="text" name="newDirectory" placeholder="New Directory Name" required>
          <button type="submit">Add Directory</button>
        </form>
      </body>
      </html>
    `);
  });
});

// Handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.redirect('/');
});

// Handle adding new directories
app.post('/add-directory', (req, res) => {
  const newDirectory = req.body.newDirectory;
  if (!newDirectory) {
    return res.status(400).send('No directory name provided.');
  }

  // Add the new directory to the config
  config.uploadDirectories.push(newDirectory);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  // Create the directory if it doesn't exist
  const fullPath = path.join(__dirname, newDirectory);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  res.redirect('/');
});

// Serve files for download
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  res.download(filePath, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(404).send('File not found.');
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});