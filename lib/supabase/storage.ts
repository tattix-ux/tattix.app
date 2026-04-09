"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { sanitizePhoneNumber } from "@/lib/utils";

type UploadOptions = {
  artistId: string;
  bucket?: string;
  prefix?: string;
};

export async function uploadArtistAsset(file: File, options: UploadOptions) {
  const supabase = createSupabaseBrowserClient();
  const extension = file.name.split(".").pop() ?? "bin";
  const safeName = sanitizePhoneNumber(
    `${options.prefix ?? "asset"}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const path = `${options.artistId}/${safeName}.${extension}`;

  const { error } = await supabase.storage
    .from(options.bucket ?? "artist-assets")
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(options.bucket ?? "artist-assets").getPublicUrl(path);

  return {
    path,
    publicUrl,
  };
}

export async function removeArtistAsset(path: string, options?: { bucket?: string }) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage.from(options?.bucket ?? "artist-assets").remove([path]);

  if (error) {
    throw error;
  }
}

export async function uploadPublicReferenceImage(file: File, artistId: string) {
  const supabase = createSupabaseBrowserClient();
  const extension = file.name.split(".").pop() ?? "bin";
  const safeName = sanitizePhoneNumber(
    `reference-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const path = `${artistId}/${safeName}.${extension}`;

  const { error } = await supabase.storage.from("submission-references").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("submission-references").getPublicUrl(path);

  return {
    path,
    publicUrl,
  };
}
