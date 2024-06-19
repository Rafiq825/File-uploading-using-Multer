const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3000;

/* SINGLE FILE */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads";

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = function (req, file, cb) {
  if (file.mimetype == "image/png" || file.mimetype == "image/jpeg") {
    cb(null, true);
  } else {
    req.errorMessage = "File is not a valid image!";
    cb(null, false);
  }
};

const upload = multer({ storage, fileFilter });

app.post("/", upload.single("image"), (req, res) => {
  console.log(req.body);
  if (req.errorMessage) {
    return res.send(req.errorMessage);
  }

  return res.send("File uploaded");
});

/* MULTIPLE FILES*/
const uploadDocuments = multer({
  storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype == "application/pdf") {
      cb(null, true);
    } else {
      !req.invalidFiles
        ? (req.invalidFiles = [file.originalname])
        : req.invalidFiles.push(file.originalname);
      cb(null, false);
    }
  },
});

app.post(
  "/multiple-files",
  uploadDocuments.array("documents", 4),
  (req, res) => {
    if (req.invalidFiles) {
      return res.status(200).json({
        warning: true,
        message:
          "Some files did not uploaded due to wrong format: " +
          req.invalidFiles.join(", "),
      });
    }

    return res.status(200).json({
      warning: false,
      message: "Files uploaded successfully",
    });
  }
);

/* MULTIPLE FIELDS */
const uploadProfile = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = "profile";

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      cb(null, dir);
    },
    filename: function (req, file, cb) {
      cb(
        null,
        Date.now() + "-" + file.fieldname + path.extname(file.originalname)
      );
    },
  }),
  fileFilter: function (req, file, cb) {
    let acceptFile = true;

    if (file.fieldname == "avatar" || file.fieldname == "banner") {
      if (file.mimetype == "image/png" || file.mimetype == "image/jpeg") {
        acceptFile = true;
      }
    } else if (file.fieldname == "document") {
      if (file.mimetype == "application/pdf") {
        acceptFile = true;
      }
    }

    if (!acceptFile) {
      const message = `Field ${file.fieldname} wrong type (${file.mimetype})`;
      !req.invalidFiles
        ? (req.invalidFiles = [message])
        : req.invalidFiles.push(message);
    }

    cb(null, acceptFile);
  },
});

const fields = [
  {
    name: "profile",
    maxCount: 1,
  },
  {
    name: "banner",
    maxCount: 1,
  },
  {
    name: "document",
    maxCount: 1,
  },
];


app.post("/multiple", uploadProfile.fields(fields), (req, res) => {
  if (req.invalidFiles) {
    return res.status(200).json({
      warning: true,
      message: "Some files did not uploaded: " + req.invalidFiles.join(", "),
    });
  }

  return res.status(200).json({
    warning: false,
    message: "Files uploaded successfully",
  });
});


// uploading file to store in memory storage
const memoryStorage = multer({
  storage: multer.memoryStorage(),
});

app.post("/memory", memoryStorage.single("file"), (req, res) => {
  // Validate file format
  if (file.mimetype != "application/pdf") {
    return res.send("File is not a .pdf");
  }

  // Checking and creating the directory
  const dir = "files";

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  // Building file name
  const filename = Date.now() + path.extname(req.file.originalname);

  // Save the file to direcoty
  fs.writeFileSync(dir + "/" + filename, req.file.buffer);

  res.send("Success");
});



app.listen(3000, () =>
  console.log(`Server started on http://localhost:${port}`)
);
