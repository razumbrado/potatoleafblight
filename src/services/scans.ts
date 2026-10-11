import { requireSupabase, SCAN_BUCKET } from '@/lib/supabase';
import type { ClassificationResult, ScanRecord } from '@/types';
import { extensionForMime } from '@/utils/image';

const PAGE_SIZE = 1000;
const STORAGE_CHUNK = 100;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/** Loads every scan belonging to the user, newest first. RLS also restricts rows server-side. */
export async function fetchAllScans(userId: string): Promise<ScanRecord[]> {
  const supabase = requireSupabase();
  const all: ScanRecord[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('scan_history')
      .select('*')
      .eq('user_id', userId)
      .order('scanned_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    all.push(...((data ?? []) as ScanRecord[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return all;
}

/**
 * Uploads the image to private Storage, then records the real model output in PostgreSQL.
 * If the database insert fails, the uploaded image is removed so no orphan file is left behind.
 */
export async function saveScan(params: {
  userId: string;
  file: File;
  result: ClassificationResult;
}): Promise<ScanRecord> {
  const supabase = requireSupabase();
  const { userId, file, result } = params;

  const contentType = file.type || 'image/jpeg';
  const imagePath = `${userId}/${crypto.randomUUID()}.${extensionForMime(contentType)}`;

  const { error: uploadError } = await supabase.storage.from(SCAN_BUCKET).upload(imagePath, file, {
    contentType,
    cacheControl: '3600',
    upsert: false,
  });
  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  const { data, error: insertError } = await supabase
    .from('scan_history')
    .insert({
      user_id: userId,
      image_path: imagePath,
      predicted_disease: result.predictedDisease,
      confidence: result.confidence,
      early_blight_probability: result.earlyBlightProbability,
      late_blight_probability: result.lateBlightProbability,
      scanned_at: result.analyzedAt,
    })
    .select()
    .single();

  if (insertError || !data) {
    // Compensate: do not leave an image without a record.
    await supabase.storage.from(SCAN_BUCKET).remove([imagePath]);
    throw new Error(`Could not save the scan record: ${insertError?.message ?? 'no row returned'}`);
  }
  return data as ScanRecord;
}

async function removeImages(paths: string[]) {
  const supabase = requireSupabase();
  for (let i = 0; i < paths.length; i += STORAGE_CHUNK) {
    const chunk = paths.slice(i, i + STORAGE_CHUNK);
    const { error } = await supabase.storage.from(SCAN_BUCKET).remove(chunk);
    if (error) throw new Error(`Could not delete stored images: ${error.message}`);
    chunk.forEach((path) => signedUrlCache.delete(path));
  }
}

/**
 * Deletes the stored image first, then the row. If the first step fails nothing is lost;
 * if the second fails the record remains (without its image) and the delete can be retried.
 */
export async function deleteScan(scan: Pick<ScanRecord, 'id' | 'image_path'>): Promise<void> {
  const supabase = requireSupabase();
  await removeImages([scan.image_path]);
  const { error } = await supabase.from('scan_history').delete().eq('id', scan.id);
  if (error) throw new Error(`Could not delete the scan record: ${error.message}`);
}

/** Removes every scan and stored image for the user. Returns the number of records deleted. */
export async function clearAllScans(userId: string): Promise<number> {
  const supabase = requireSupabase();
  const scans = await fetchAllScans(userId);
  if (scans.length === 0) return 0;
  await removeImages(scans.map((scan) => scan.image_path));
  const { error } = await supabase.from('scan_history').delete().eq('user_id', userId);
  if (error) throw new Error(`Could not clear scan records: ${error.message}`);
  return scans.length;
}

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/** Short-lived signed URLs for private images. Cached in memory until shortly before expiry. */
export async function getSignedUrls(paths: string[]): Promise<Record<string, string>> {
  const supabase = requireSupabase();
  const now = Date.now();
  const result: Record<string, string> = {};
  const missing: string[] = [];

  for (const path of new Set(paths)) {
    const cached = signedUrlCache.get(path);
    if (cached && cached.expiresAt > now) result[path] = cached.url;
    else missing.push(path);
  }

  if (missing.length > 0) {
    const { data, error } = await supabase.storage.from(SCAN_BUCKET).createSignedUrls(missing, SIGNED_URL_TTL_SECONDS);
    if (error) throw error;
    for (const item of data ?? []) {
      if (item.path && item.signedUrl && !item.error) {
        signedUrlCache.set(item.path, {
          url: item.signedUrl,
          expiresAt: now + (SIGNED_URL_TTL_SECONDS - 300) * 1000,
        });
        result[item.path] = item.signedUrl;
      }
    }
  }
  return result;
}

export function clearSignedUrlCache() {
  signedUrlCache.clear();
}
