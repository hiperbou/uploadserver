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
let config = { 
    uploadDirectories: ['uploads'],
    addTimestamp: false
};

if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} else {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

let uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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
    if(req.body.addTimestamp) cb(null, Date.now() + '-' + file.originalname);
    else cb(null, file.originalname);
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
        <style>
          /* Basic Reset */
          body, h1, h2, ul, form, input, button, select {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            padding: 20px;
            background-color: #f4f4f4;
          }

          h1, h2 {
            margin-bottom: 20px;
            text-align: center;
          }

          form {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
          }

          label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
          }

          input[type="file"],
          input[type="text"],
          select,
          button {
            width: 100%;
            padding: 10px;
            margin-bottom: 15px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 16px;
          }

          button {
            background-color: #28a745;
            color: white;
            border: none;
            cursor: pointer;
          }

          button:hover {
            background-color: #218838;
          }

          ul {
            list-style-type: none;
            padding: 0;
          }

          ul li {
            background: #fff;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          ul li a {
            text-decoration: none;
            color: #007bff;
          }

          ul li a:hover {
            text-decoration: underline;
          }

          /* Responsive Design */
          @media (min-width: 600px) {
            body {
              max-width: 600px;
              margin: 0 auto;
            }

            form {
              display: grid;
              grid-template-columns: 1fr;
              gap: 15px;
            }

            label {
              grid-column: span 1;
            }

            input[type="file"],
            input[type="text"],
            select,
            button {
              margin-bottom: 0;
            }

            button {
              grid-column: span 1;
            }
          }
        </style>
      </head>
      <body>
        <h1>Upload a File</h1>
        <form action="/upload" method="POST" enctype="multipart/form-data">
          <label for="directory">Select Upload Directory:</label>
          <select name="directory" id="directory" required>
            ${directoryOptions}
          </select>
          <label>
          <input type="checkbox" id="addTimestamp" name="addTimestamp" ${config.addTimestamp? 'checked' : ''}>
          <span>Add Timestamp to Filename:</span>
          </label>
          <input type="file" name="file" required>
          <button type="submit">Upload</button>
        </form>

        <h2>Add New Upload Directory</h2>
        <form action="/add-directory" method="POST">
          <input type="text" name="newDirectory" placeholder="Upload Directory Name" required>
          <button type="submit">Add Directory</button>
        </form>

        <h2>Uploaded Files</h2>
        <ul>${fileList}</ul>
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
    config.addTimestamp = req.body.addTimestamp ? true : false;
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