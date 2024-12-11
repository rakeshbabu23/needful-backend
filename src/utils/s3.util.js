const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const fsStream = require("fs");
const os = require("os");
const fs = require("fs").promises;
const path = require("path");
const streamifier = require("streamifier");
const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const getGCD = (a, b) => {
  if (!b) return a;
  return getGCD(b, a % b);
};

// Function to compress videos using ffmpeg
const compressVideo = async (file) => {
  return new Promise((resolve, reject) => {
    const tempPath = path.join(__dirname, `temp-${Date.now()}.mp4`);
    ffmpeg()
      .input(file.buffer)
      .inputFormat(file.mimetype.split("/")[1])
      .output(tempPath)
      .videoCodec("libx264") // Compress with h264 codec
      .audioCodec("aac")
      .outputOptions("-preset fast", "-crf 28") // Compress with a moderate quality setting
      .on("end", () => {
        fs.readFile(tempPath, (err, data) => {
          if (err) reject(err);
          fs.unlinkSync(tempPath); // Clean up temp file
          resolve(data);
        });
      })
      .on("error", reject)
      .run();
  });
};

// Function to compress images using sharp
const compressImage = async (file) => {
  return sharp(file.buffer).toFormat("jpeg", { quality: 80 }).toBuffer();
};

async function getVideoAspectRatio(fileBuffer) {
  return new Promise((resolve, reject) => {
    // Create a temporary file
    const tempFilePath = path.join(os.tmpdir(), `temp-video-${Date.now()}.mp4`);

    try {
      // Write buffer to temporary file
      fsStream.writeFileSync(tempFilePath, fileBuffer);

      // Use ffprobe to get metadata
      ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
        // Always try to remove the temporary file
        try {
          fsStream.unlinkSync(tempFilePath);
        } catch (unlinkError) {
          console.warn("Could not delete temporary file:", unlinkError);
        }

        if (err) {
          console.error("FFprobe error:", err);
          reject(err);
          return;
        }

        try {
          const videoStream = metadata.streams.find(
            (stream) => stream.codec_type === "video"
          );

          if (!videoStream) {
            reject(new Error("No video stream found"));
            return;
          }

          const width = videoStream.width;
          const height = videoStream.height;

          if (!width || !height) {
            reject(new Error("Could not determine video dimensions"));
            return;
          }

          const aspectRatio = `${width} / ${height}`;
          resolve(aspectRatio);
        } catch (error) {
          console.error("Metadata processing error:", error);
          reject(error);
        }
      });
    } catch (writeError) {
      console.error("Error writing temporary file:", writeError);
      reject(writeError);
    }
  });
}

const uploadFilesToS3 = async (files, userId, directory) => {
  try {
    // Categorize files into images and videos
    const imageFiles = [];
    const videoFiles = [];
    const thumbnailFiles = [];

    files.forEach((file) => {
      if (file.mimetype.startsWith("image/")) {
        imageFiles.push(file);
      } else if (file.mimetype.startsWith("video/")) {
        videoFiles.push(file);
      }
    });

    // Process image files: Resize and compress
    const imageUploadPromises = imageFiles.map(async (file) => {
      const compressedImageBuffer = await sharp(file.buffer)
        .jpeg({ quality: 80 })
        .toBuffer();

      const fileStream = streamifier.createReadStream(compressedImageBuffer);

      const uploadResult = await new Upload({
        client: s3Client,
        params: {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `${Date.now()}-${userId}-${directory}-${file.originalname}`,
          Body: fileStream,
          ContentType: file.mimetype,
        },
      }).done();

      return uploadResult.Location;
    });

    // Process video files: Compress video and create thumbnail
    // const videoUploadPromises = videoFiles.map(async (file) => {
    //   const fileStream = streamifier.createReadStream(file.buffer);

    //   // Compress the video
    //   const compressedVideoPath = `/tmp/${file.originalname}-compressed.mp4`; // Temporary path for the compressed video
    //   await new Promise((resolve, reject) => {
    //     ffmpeg(file.buffer)
    //       .output(compressedVideoPath)
    //       .videoCodec("libx264")
    //       .outputOptions("-preset fast")
    //       .on("end", resolve)
    //       .on("error", reject)
    //       .run();
    //   });

    //   // Upload the compressed video to S3
    //   const videoFileStream = fs.createReadStream(compressedVideoPath);
    //   const videoUpload = new Upload({
    //     client: s3Client,
    //     params: {
    //       Bucket: process.env.AWS_BUCKET_NAME,
    //       Key: `${Date.now()}-${userId}-${directory}-video-${
    //         file.originalname
    //       }`,
    //       Body: videoFileStream,
    //       ContentType: file.mimetype,
    //     },
    //   });

    //   const videoUploadResult = await videoUpload.done();

    //   // Generate and upload a thumbnail for the video
    //   const thumbnailPath = `/tmp/${file.originalname}.png`; // Temporary path for the thumbnail
    //   await new Promise((resolve, reject) => {
    //     ffmpeg(file.buffer)
    //       .screenshots({
    //         timestamps: ["50%"], // Create a thumbnail at 50% of the video length
    //         filename: thumbnailPath,
    //       })
    //       .on("end", resolve)
    //       .on("error", reject);
    //   });

    //   const thumbnailFileStream = fs.createReadStream(thumbnailPath);
    //   const thumbnailUpload = new Upload({
    //     client: s3Client,
    //     params: {
    //       Bucket: process.env.AWS_BUCKET_NAME,
    //       Key: `${Date.now()}-${userId}-${directory}-thumbnail-${
    //         file.originalname
    //       }.png`,
    //       Body: thumbnailFileStream,
    //       ContentType: "image/png",
    //     },
    //   });

    //   const thumbnailUploadResult = await thumbnailUpload.done();
    //   thumbnailFiles.push(thumbnailUploadResult.Location);

    //   return {
    //     videoUrl: videoUploadResult.Location,
    //     thumbnailUrl: thumbnailUploadResult.Location,
    //   };
    // });
    const videoUploadPromises = videoFiles.map(async (file) => {
      // Ensure tmp directory exists
      const aspectRatio = await getVideoAspectRatio(file.buffer);
      const tmpDir = path.join(os.tmpdir(), "video-upload");
      await fs.mkdir(tmpDir, { recursive: true });

      // Sanitize filename to prevent path issues
      const sanitizedFileName = file.originalname
        .replace(/[^a-z0-9.]/gi, "_")
        .substring(0, 255);

      // Create unique paths for compressed video and thumbnail
      const compressedVideoPath = path.join(
        tmpDir,
        `${Date.now()}-compressed-${sanitizedFileName}`
      );
      const thumbnailPath = path.join(
        tmpDir,
        `${Date.now()}-thumbnail-${sanitizedFileName}.png`
      );

      try {
        // Write buffer to a temporary input file for FFmpeg
        const tempInputPath = path.join(
          tmpDir,
          `${Date.now()}-input-${sanitizedFileName}`
        );
        await fs.writeFile(tempInputPath, file.buffer);

        // Compress video
        await new Promise((resolve, reject) => {
          ffmpeg(tempInputPath)
            .output(compressedVideoPath)
            .videoCodec("libx264")
            .outputOptions("-preset fast")
            .on("start", (commandLine) => {
              console.log("Video Compression Command:", commandLine);
            })
            .on("end", () => {
              console.log("Video compression completed");
              resolve();
            })
            .on("error", (err) => {
              console.error("FFmpeg Compression Error:", err);
              reject(err);
            })
            .run();
        });

        // Upload compressed video to S3
        const videoFileStream = fsStream.createReadStream(compressedVideoPath);
        const videoUpload = new Upload({
          client: s3Client,
          params: {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${Date.now()}-${userId}-${directory}-video-${sanitizedFileName}`,
            Body: videoFileStream,
            ContentType: file.mimetype,
          },
        });
        const videoUploadResult = await videoUpload.done();

        // Generate thumbnail
        await new Promise((resolve, reject) => {
          ffmpeg(tempInputPath)
            .screenshots({
              timestamps: ["50%"], // Create a thumbnail at 50% of the video length
              filename: thumbnailPath,
              size: "320x240", // Optional: specify thumbnail size
            })
            .on("start", (commandLine) => {
              console.log("Thumbnail Generation Command:", commandLine);
            })
            .on("end", () => {
              console.log("Thumbnail generation completed");
              resolve();
            })
            .on("error", (err) => {
              console.error("FFmpeg Thumbnail Error:", err);
              reject(err);
            });
        });

        // Upload thumbnail to S3
        const thumbnailFileStream = fsStream.createReadStream(thumbnailPath);
        const thumbnailUpload = new Upload({
          client: s3Client,
          params: {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${Date.now()}-${userId}-${directory}-thumbnail-${sanitizedFileName}.png`,
            Body: thumbnailFileStream,
            ContentType: "image/png",
          },
        });
        const thumbnailUploadResult = await thumbnailUpload.done();

        // Clean up temporary files
        await Promise.all([
          fs.unlink(tempInputPath),
          fs.unlink(compressedVideoPath),
          fs.unlink(thumbnailPath),
        ]);

        return {
          videoUrl: videoUploadResult.Location,
          thumbnailUrl: thumbnailUploadResult.Location,
          aspectRatio,
        };
      } catch (error) {
        console.error("Video Processing Error:", error);

        // Attempt to clean up temporary files
        await Promise.all([
          fs.unlink(compressedVideoPath).catch(() => {}),
          fs.unlink(thumbnailPath).catch(() => {}),
        ]);

        throw error;
      }
    });

    // Execute all uploads (images + videos + thumbnails)
    const imageUploadResults = await Promise.all(imageUploadPromises);
    const videoUploadResults = await Promise.all(videoUploadPromises);

    const allResults = [
      ...imageUploadResults.map((result) => ({
        type: "image",
        imageUrl: result,
        thumbnailUrl: null,
      })),
      ...videoUploadResults.map((result) => ({
        type: "video",
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        aspectRatio: result.aspectRatio,
      })),
    ];

    // Return result with URLs for all uploaded files
    console.log("All files uploaded successfully:", allResults);
    return allResults;
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
};

const uploadProfilePicture = async (file, userId, directory) => {
  try {
    const uploadResult = await new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${userId}-${directory}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      },
    }).done();
    console.log(
      "Profile picture uploaded successfully:",
      uploadResult.Location
    );
    return uploadResult.Location;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
};

module.exports = { uploadFilesToS3, uploadProfilePicture };
