const cloudinary = require('cloudinary').v2;
const multer = require('multer');

/* Configure Cloudinary */
const configureCloudinary = () => {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  } else {
    console.warn('[CLOUDINARY] Not configured — image uploads disabled');
  }
};

/* Multer: store in memory for streaming to Cloudinary */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files or PDFs are allowed'), false);
    }
  },
});

/**
 * Upload a buffer to Cloudinary.
 * Returns the secure URL of the uploaded image.
 */
const uploadToCloudinary = (buffer, folder = 'exam-questions') => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return reject(new Error('Cloudinary not configured'));
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
};

/**
 * Upload a document (like PDF) to Cloudinary.
 * Returns the secure URL.
 */
const uploadDocumentToCloudinary = (buffer, filename, folder = 'exam-documents') => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return reject(new Error('Cloudinary not configured'));
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', format: 'pdf', public_id: filename },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
};

module.exports = { configureCloudinary, upload, uploadToCloudinary, uploadDocumentToCloudinary };
