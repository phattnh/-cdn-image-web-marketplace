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

app.get("/", (req, res) => res.send("Hi! I'm CDN server"));

app.get("/images", async (req, res) => {
  const { src, width, height, quality, format, fit } = req.query;
  const fileName = `${src}-${width}px-${height}px-${fit}.${format}`;
  const imagesPath = path.resolve(__dirname, "public/images");
  const imageStaticPath = path.resolve(__dirname, `public/images/${fileName}`);
  sizeOf(`${imagesPath}/${src}.webp`, (err, dimensions) => {
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
    fs.readFile(`${imagesPath}/${src}.webp`, (err, data) => {
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
            res.sendFile(emitToImagePath);
          } else {
            res.status(400).json(err);
          }
        });
    });
  });
  return;
});

server.listen(process.env.PORT, () => {
  console.log("Server listening on port", process.env.PORT);
});
