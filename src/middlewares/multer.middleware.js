import multer from "multer"
import fs from "fs"
import path from "path"

const uploadFolder = path.resolve("public/temp");
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder)
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})

export const upload = multer({ 
    storage: storage 
})