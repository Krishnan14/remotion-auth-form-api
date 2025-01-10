const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Enable CORS for all origins
app.use(cors());

// Directory to save uploaded files
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create a unique folder for the submission
    const uniqueFolder = req.uniqueFolder;
    cb(null, uniqueFolder);
  },
  filename: (req, file, cb) => {
    // Generate a filename using timestamp and file extension
    const timestamp = Date.now(); // Use current timestamp
    const extension = path.extname(file.originalname); // Extract file extension
    cb(null, `${timestamp}${extension}`);
  },
});
const upload = multer({ storage });

// Middleware to create a unique folder for each submission
app.use((req, res, next) => {
  const uniqueFolderName = Date.now().toString(); // Use timestamp for uniqueness
  req.uniqueFolder = path.join(uploadDir, uniqueFolderName);

  if (!fs.existsSync(req.uniqueFolder)) {
    fs.mkdirSync(req.uniqueFolder, { recursive: true });
  }

  next();
});

// Upload endpoint
app.post("/upload", upload.array("file"), (req, res) => {
  try {
    const videoTitle = req.body.video_title;
    const theme = req.body.theme;
    const uniqueFolder = req.uniqueFolder;

    // Process uploaded files
    const files = req.files.map((file) => ({
      originalName: file.originalname,
      savedName: file.filename,
      path: path.join(uniqueFolder, file.filename),
    }));

    // Save metadata to a JSON file in the unique folder
    const metadata = {
      video_title: videoTitle,
      theme: theme,
      files,
    };
    const metadataPath = path.join(uniqueFolder, "metadata.json");
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    res.json({
      message: "Files uploaded successfully!",
      metadata,
      folder: uniqueFolder,
    });
  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
