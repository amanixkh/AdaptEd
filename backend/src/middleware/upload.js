const multer = require("multer");

// Multer/busboy decode multipart filenames as latin1 by default, breaking UTF-8 names
function fixOriginalnameEncoding(file) {
    file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");
}

const storage = multer.diskStorage({
    destination:"uploads/",
    filename:(req,file,cb)=>{
        cb(null, Date.now()+"-"+file.originalname);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        fixOriginalnameEncoding(file);
        cb(null, true);
    },
});

module.exports = upload;
