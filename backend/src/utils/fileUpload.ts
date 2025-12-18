import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { config } from '../config';

// Ensure upload directory exists
const uploadDir = config.uploadDir;
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop() || 'jpg';
    const filename = `${uuidv4()}.${ext}`;
    cb(null, filename);
  },
});

// File filter for images only
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('File must be an image'));
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxUploadSize, // 10MB default
  },
});

/**
 * Validate uploaded file
 */
export function validateImageFile(file: Express.Multer.File | undefined): void {
  if (!file) {
    throw new Error('No file uploaded');
  }

  if (!file.mimetype.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (file.size > config.maxUploadSize) {
    const maxSizeMB = config.maxUploadSize / (1024 * 1024);
    throw new Error(`File size exceeds maximum allowed size of ${maxSizeMB}MB`);
  }
}

