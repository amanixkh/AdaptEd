const multer = require("multer");
const path = require("path");
const fs = require("fs");

const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024;
const UPLOADS_DIR = path.resolve(__dirname, "../../uploads");

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer/busboy decode multipart filenames as latin1 by default, breaking UTF-8 names
function fixOriginalnameEncoding(file) {
    try {
        file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");
    } catch {
        // Keep the original filename when conversion is not needed or fails.
    }
}

const storage = multer.diskStorage({
    destination: UPLOADS_DIR,
    filename:(req,file,cb)=>{
        cb(null, Date.now()+"-"+file.originalname);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: MAX_PDF_SIZE_BYTES,
    },
    fileFilter: (req, file, cb) => {
        fixOriginalnameEncoding(file);

        const isPdf = file.mimetype === "application/pdf" || /\.pdf$/i.test(file.originalname || "");
        if (!isPdf) {
            const error = new Error("Only PDF files are supported");
            error.code = "INVALID_FILE_TYPE";
            return cb(error);
        }

        cb(null, true);
    },
});

module.exports = upload;
