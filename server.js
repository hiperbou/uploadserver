/*
//Deno imports
import express from "npm:express@4.21.2";
import multer from "npm:multer@1.4.5-lts.1";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import qrcode from "npm:qrcode";
const __dirname = import.meta.dirname;
*/
//Node imports
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const qrcode = require('qrcode');

const app = express();

const DEFAULT_PORT = 3000;
// Get the port from command-line arguments or use the default
const port = process.argv[2] || DEFAULT_PORT;

// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
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
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send('File uploaded successfully!');
});

// Start the server
app.listen(port, () => {
  const interfaceIpAddress = getInterfaceIpAddress();
  console.log(`Server is running on http://localhost:${port} Your IP address is: ${interfaceIpAddress}`);
  printQrCode(`http://${interfaceIpAddress}:${port}`);
});

function getInterfaceIpAddress() {
  const interfaces = os.networkInterfaces();

  // Common Wi-Fi interface names across different operating systems
  const wifiInterfaceNames = ['Wi-Fi', 'wlan0', 'en0'];

  for (const interfaceName of wifiInterfaceNames) {
      if (interfaces[interfaceName]) {
          for (const iface of interfaces[interfaceName]) {
              if (iface.family === 'IPv4' && !iface.internal) {
                  return iface.address;
              }
          }
      }
  }

  // Fallback if no Wi-Fi interface is found
  for (const interfaceName in interfaces) {
      const networkInterface = interfaces[interfaceName];
      for (const iface of networkInterface) {
          if (iface.family === 'IPv4' && !iface.internal) {
              return iface.address;
          }
      }
  }

  return '0.0.0.0'; // Fallback if no interface is found
}

function printQrCode(data) {
  qrcode.toString(data, { type: 'terminal' }, (err, qrCode) => {
      if (err) {
          console.error('Error generating QR code:', err);
          return;
      }
      console.log(qrCode);
  });
}