const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads/videos");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, uploadDir),
  filename: (req, file, callback) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    callback(null, uniqueName);
  },
});

const fileFilter = (req, file, callback) => {
  const supportedMimeTypes = ["video/mp4", "video/webm", "video/quicktime"];
  const supportedExtension = /\.(mp4|webm|mov)$/i.test(file.originalname || "");

  if (supportedMimeTypes.includes(file.mimetype) || supportedExtension) {
    return callback(null, true);
  }
  const error = new Error("Only MP4, WebM, and MOV files are allowed");
  error.code = "INVALID_FILE_TYPE";
  return callback(error, false);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 },
});
