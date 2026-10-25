import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

export const supabaseClient =
  config.supabase?.url && config.supabase?.serviceKey
    ? createClient(config.supabase.url, config.supabase.serviceKey)
    : null;

// Ensure storage directories exist
const uploadDir = config.storage.localDir;
const tempDir = path.join(uploadDir, 'temp');
const publishedDir = path.join(uploadDir, 'published');
const proposalsDir = path.join(uploadDir, 'proposals');

[uploadDir, tempDir, publishedDir, proposalsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Permitted MIME types
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.doc', '.docx']);

// Multer Disk Storage configured to write to private temp storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueKey = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, uniqueKey);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: config.storage.maxUploadSizeMb * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(
        new Error(
          `Invalid file format (${ext}). Supported formats: PDF, PNG, JPG, WebP, DOC, DOCX. Executable or HTML files are strictly prohibited.`
        )
      );
    }
    cb(null, true);
  },
});

/**
 * Move file from temp to published official directory (or upload to Supabase)
 */
export async function moveToPublished(filename, mimeType = 'application/octet-stream') {
  const src = path.join(tempDir, filename);

  if (config.storage.provider === 'supabase' && supabaseClient) {
    try {
      const storageKey = `published/${filename}`;
      const fileBuffer = fs.readFileSync(src);
      const { error } = await supabaseClient.storage
        .from(config.supabase.bucket)
        .upload(storageKey, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!error) {
        if (fs.existsSync(src)) fs.unlinkSync(src);
        return storageKey;
      }
      console.error('Supabase upload error:', error);
    } catch (err) {
      console.error('Supabase moveToPublished failure:', err);
    }
  }

  const dest = path.join(publishedDir, filename);
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
    return path.join('published', filename).replace(/\\/g, '/');
  }
  return filename;
}

/**
 * Move file from temp to proposals directory (or upload to Supabase)
 */
export async function moveToProposals(filename, mimeType = 'application/octet-stream') {
  const src = path.join(tempDir, filename);

  if (config.storage.provider === 'supabase' && supabaseClient) {
    try {
      const storageKey = `proposals/${filename}`;
      const fileBuffer = fs.readFileSync(src);
      const { error } = await supabaseClient.storage
        .from(config.supabase.bucket)
        .upload(storageKey, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!error) {
        if (fs.existsSync(src)) fs.unlinkSync(src);
        return storageKey;
      }
      console.error('Supabase upload proposals error:', error);
    } catch (err) {
      console.error('Supabase moveToProposals failure:', err);
    }
  }

  const dest = path.join(proposalsDir, filename);
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
    return path.join('proposals', filename).replace(/\\/g, '/');
  }
  return filename;
}

/**
 * Retrieve public CDN URL from Supabase if configured
 */
export function getStoragePublicUrl(storageKey) {
  if (config.storage.provider === 'supabase' && supabaseClient && storageKey) {
    const { data } = supabaseClient.storage
      .from(config.supabase.bucket)
      .getPublicUrl(storageKey);
    return data?.publicUrl || null;
  }
  return null;
}

/**
 * Resolve full filesystem path for a stored key
 */
export function getStorageFilePath(storageKey) {
  return path.join(uploadDir, storageKey);
}
