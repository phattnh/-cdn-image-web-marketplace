const express = require("express");
const path = require("path");
const app = express();
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
  fs.access(imageStaticPath, (notExisted) => {
    if (notExisted) {
      fs.readFile(`${imagesPath}/${src}.webp`, (err, data) => {
        if (err) {
          return res
            .status(400)
            .json({ err, message: "Image src is not valid" });
        }
        sharp(data)
          .resize({
            width: Number(width),
            height: Number(height),
            fit: fit || "inside",
          })
          .toFormat(format, { quality: Number(quality) })
          .toFile(imageStaticPath, (err, info) => {
            if (info) {
              res.sendFile(imageStaticPath);
            } else {
              res.status(400).json(err);
            }
          });
      });
    } else {
      res.sendFile(imageStaticPath);
    }
  });
});

server.listen(process.env.PORT, () => {
  console.log("Server listening on port", process.env.PORT);
});
