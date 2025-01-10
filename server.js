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

// Directory to save uploaded files (Use an absolute path)
const imageUploadDir = path.join(__dirname, "uploads", "images"); // Ensure this directory exists
const uploadDir = path.join(__dirname, "uploads"); // Ensure this directory exists
if (!fs.existsSync(imageUploadDir)) {
  fs.mkdirSync(imageUploadDir, { recursive: true });
}

// Function to clear the uploads directory
const clearUploadsDirectory = () => {
  const files = fs.readdirSync(imageUploadDir);
  files.forEach((file) => {
    const filePath = path.join(imageUploadDir, file);
    if (fs.lstatSync(filePath).isFile()) {
      fs.unlinkSync(filePath); // Delete the file
    }
  });
};

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageUploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a timestamp
    const timestamp = Date.now();

    const extension = path.extname(file.originalname);

    // Create the new filename
    const newFileName = `${timestamp}${extension}`;
    cb(null, newFileName);
  },
});
const upload = multer({ storage });

// Upload endpoint
app.post("/upload", (req, res) => {
  try {
    // Clear previous files in the uploads directory before uploading new ones
    clearUploadsDirectory();

    // Handle file uploads
    upload.array("file")(req, res, (err) => {
      if (err) {
        console.error("Error during file upload:", err);
        return res.status(500).json({ error: "File upload failed" });
      }

      const videoTitle = req.body.video_title;
      const theme = req.body.theme;

      // Process uploaded files
      req.files.forEach((file) => {
        console.log(`File uploaded: ${file.originalname}`);
      });

      // Metadata processing (Optional)
      const metadata = {
        video_title: videoTitle,
        theme: theme,
        files: req.files.map((file) => file.originalname),
      };

      // Save metadata to a JSON file in the uploads directory
      const metadataPath = path.join(uploadDir, "metadata.json");
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      res.json({ message: "Files uploaded successfully!", metadata });
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
