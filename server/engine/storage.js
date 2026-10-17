const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'watchtower-screenshots';

let supabaseInstance = null;

function isConfigured() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key);
}

function getClient() {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  try {
    supabaseInstance = createClient(url.trim(), key.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    return supabaseInstance;
  } catch (err) {
    console.error('[STORAGE] Error initializing Supabase client:', err.message);
    return null;
  }
}

/**
 * Uploads a local screenshot file to the private Supabase Storage bucket
 * @param {string} localFilePath - Local path on filesystem
 * @param {string} storagePath - Remote object path in bucket (e.g. monitors/mon-123/snap-abc.png)
 * @returns {Promise<{ success: boolean, storagePath: string, error?: string }>}
 */
async function uploadScreenshot(localFilePath, storagePath) {
  if (!isConfigured()) {
    return { success: false, storagePath: '', error: 'Supabase Storage is not configured' };
  }

  const client = getClient();
  if (!client) {
    return { success: false, storagePath: '', error: 'Failed to create Supabase client' };
  }

  try {
    if (!fs.existsSync(localFilePath)) {
      return { success: false, storagePath: '', error: `Local file not found: ${localFilePath}` };
    }

    const fileBuffer = fs.readFileSync(localFilePath);
    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error(`[STORAGE] Supabase upload failed for ${storagePath}:`, error.message);
      return { success: false, storagePath: '', error: error.message };
    }

    console.log(`[STORAGE] Uploaded screenshot to Supabase Storage: ${BUCKET_NAME}/${storagePath}`);
    return { success: true, storagePath };
  } catch (err) {
    console.error(`[STORAGE] Exception during screenshot upload:`, err.message);
    return { success: false, storagePath: '', error: err.message };
  }
}

/**
 * Generates a fresh temporary signed URL for a private screenshot
 * @param {string} storagePath - Object path in bucket
 * @param {number} expiresIn - Expiration in seconds (default 3600 = 1 hour)
 * @returns {Promise<{ success: boolean, signedUrl?: string, error?: string }>}
 */
async function getSignedUrl(storagePath, expiresIn = 3600) {
  if (!storagePath || !isConfigured()) {
    return { success: false, error: 'Storage not configured or empty path' };
  }

  const client = getClient();
  if (!client) {
    return { success: false, error: 'Failed to create Supabase client' };
  }

  try {
    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, expiresIn);

    if (error || !data?.signedUrl) {
      console.warn(`[STORAGE] Could not create signed URL for ${storagePath}:`, error?.message);
      return { success: false, error: error?.message || 'Signed URL generation failed' };
    }

    return { success: true, signedUrl: data.signedUrl };
  } catch (err) {
    console.error(`[STORAGE] Exception creating signed URL for ${storagePath}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Downloads a screenshot from Supabase Storage as a Buffer (for pixel diff calculation)
 * @param {string} storagePath - Remote object path
 * @returns {Promise<Buffer|null>}
 */
async function downloadScreenshotBuffer(storagePath) {
  if (!storagePath || !isConfigured()) return null;

  const client = getClient();
  if (!client) return null;

  try {
    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .download(storagePath);

    if (error || !data) {
      console.warn(`[STORAGE] Could not download image ${storagePath}:`, error?.message);
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error(`[STORAGE] Exception downloading screenshot buffer for ${storagePath}:`, err.message);
    return null;
  }
}

module.exports = {
  isConfigured,
  BUCKET_NAME,
  uploadScreenshot,
  getSignedUrl,
  downloadScreenshotBuffer
};
