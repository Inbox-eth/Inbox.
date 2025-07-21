import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import NameStone from '@namestone/namestone-sdk';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import { createThirdwebClient } from 'thirdweb';
import { upload as uploadToThirdweb } from 'thirdweb/storage';

dotenv.config();
dotenv.config({ path: '.env.local', override: true }); // Loads .env.local and overrides

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for file uploads with disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

const ns = new NameStone(process.env.NAMESTONE_API_KEY, { network: 'sepolia' });

// Initialize thirdweb client for storage
const thirdwebClient = createThirdwebClient({
  clientId: process.env.THIRDWEB_CLIENT_ID,
});

// Open SQLite database
let db;
(async () => {
  db = await open({
    filename: './user-mapping.sqlite',
    driver: sqlite3.Database
  });
  await db.exec(`CREATE TABLE IF NOT EXISTS user_mapping (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inboxId TEXT,
    walletAddress TEXT,
    ensName TEXT
  )`);
})();

app.get('/api/namestone', async (req, res) => {
  const { name, address } = req.query;
  if (address) {
    // Lookup by address
    const results = await ns.getNames({ address });
    return res.json(results);
  }
  if (name) {
    // Lookup by name
    const results = await ns.searchNames({
      domain: process.env.NAMESTONE_ENS_DOMAIN,
      name,
      exact_match: true,
    });
    return res.json(results);
  }
  res.status(400).json({ error: 'Missing name or address' });
});

app.post('/api/namestone', async (req, res) => {
  const { name, address } = req.body;
  if (!name || !address) return res.status(400).json({ error: 'Missing name or address' });
  // Check if name is available
  const results = await ns.searchNames({
    domain: process.env.NAMESTONE_ENS_DOMAIN,
    name,
    exact_match: true,
  });
  if (results.length > 0) return res.status(400).json({ error: 'Name is already taken' });
  // Register name
  await ns.setName({ name, domain: process.env.NAMESTONE_ENS_DOMAIN, address });
  res.json({ success: true });
});

app.post('/api/user-mapping', async (req, res) => {
  const { inboxId, walletAddress, ensName } = req.body;
  if (!inboxId || !walletAddress || !ensName) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  await db.run(
    'INSERT INTO user_mapping (inboxId, walletAddress, ensName) VALUES (?, ?, ?)',
    inboxId, walletAddress, ensName
  );
  res.json({ success: true });
});

app.get('/api/user-mapping', async (req, res) => {
  const { inboxId, walletAddress, ensName } = req.query;
  let row = null;
  if (inboxId) {
    row = await db.get('SELECT * FROM user_mapping WHERE inboxId = ?', inboxId);
  } else if (walletAddress) {
    row = await db.get('SELECT * FROM user_mapping WHERE walletAddress = ?', walletAddress);
  } else if (ensName) {
    row = await db.get('SELECT * FROM user_mapping WHERE ensName = ?', ensName);
  }
  if (row) return res.json(row);
  res.status(404).json({ error: 'Not found' });
});

app.post('/api/upload-attachment', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Read the file buffer from disk
    const fileBuffer = fs.readFileSync(req.file.path);

    // Create a File or Blob-like object for thirdweb
    const fileForUpload = {
      name: req.file.originalname,
      data: fileBuffer,
      type: req.file.mimetype,
    };

    // Upload file to thirdweb storage (IPFS)
    const uris = await uploadToThirdweb({
      client: thirdwebClient,
      files: [fileForUpload],
    });
    console.log('uploadToThirdweb uris:', uris);
    let url = uris; // <-- treat as string, not array
    console.log('Initial url:', url);
    // Convert ipfs:// to https:// gateway
    if (url && url.startsWith('ipfs://')) {
      url = url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    console.log('Final url:', url);
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error('Failed to delete local uploaded file:', err);
      }
    });
    res.json({ url });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve index.html for SPA routing
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(3001, () => console.log('InboxApp server running on port 3001')); 