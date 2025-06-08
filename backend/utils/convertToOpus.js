// utils/convertToOpus.js
const path = require("path");
const os = require("os");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

function convertToOpus(inputPath) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(os.tmpdir(), `converted_${Date.now()}.opus`);

    ffmpeg(inputPath)
      .outputOptions([
        "-c:a libopus",
        "-b:a 64000",
        "-vbr on",
        "-application voip",
      ])
      .format("opus")
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
}

module.exports = convertToOpus;
