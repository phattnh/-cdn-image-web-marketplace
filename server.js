const express = require("express");
const path = require("path");
const app = express();
const sizeOf = require("image-size");
require("dotenv").config();
const fs = require("fs");
const cors = require("cors");
const http = require("http");
const sharp = require("sharp");
const server = http.createServer(app);
app.use(express.static("public"));
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hi! I'm CDN image caching");
});

app.get("/image-list", (req, res) => {
  fs.readdir(path.resolve(__dirname, "public/images"), (err, files) => {
    if (err) {
      return res.status(400).json({ data: [] });
    }
    res.setHeader("Cache-Control", "max-age=10");
    res.status(200).json({ data: files });
  });
});

app.get("/images", async (req, res) => {
  const { src, width, height, quality, format, fit } = req.query;
  const imagesPath = path.resolve(__dirname, "public/images");
  sizeOf(`${imagesPath}/${src}`, (err, dimensions) => {
    if (err) {
      return res.status(400).json({ err, message: "Image src is not valid" });
    }
    const { width: dw, height: dh, _format: dt } = dimensions;
    let _width = Number(width);
    let _height = Number(height);
    let _quality = Number(quality);
    const _format = format || dt;
    const _fit = fit || "inside";
    _width = isNaN(_width) ? dw : _width;
    _height = isNaN(_height) ? dh : _height;
    _quality = isNaN(_quality) ? 100 : _quality;
    fs.readFile(`${imagesPath}/${src}`, (err, data) => {
      if (err) {
        return res.status(400).json({ err, message: "Image src is not valid" });
      }
      const emitToImagePath = path.resolve(
        __dirname,
        `public/images/${src}-${_width}-${_height}-${_quality}-${_format}-${_fit}.${_format}`
      );
      sharp(data)
        .resize({
          width: _width,
          height: _height,
          fit: fit || "inside",
        })
        .toFormat(format, { quality: _quality })
        .toFile(emitToImagePath, (err, info) => {
          if (info) {
            res.setHeader("Cache-Control", "max-age=5");
            res.status(200).sendFile(emitToImagePath);
          } else {
            res.status(400).json(err);
          }
        });
    });
  });
  return;
});

process.on("uncaughtException", (error) => {
  console.log("Oh my god, something terrible happened: ", error);
  process.exit(1); // exit application
});

server.listen(process.env.PORT, () => {
  console.log("Server listening on port", process.env.PORT);
});
