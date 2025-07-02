import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export const handleSupabaseError = (error) => {
  console.error("Supabase error:", error);
  return { error: error.message || "An error occurred" };
};

export const fetchPosts = async () => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return handleSupabaseError(error);
  }

  return { data };
};

export const createPost = async (message, imageUrl = null) => {
  const { data, error } = await supabase
    .from("posts")
    .insert([
      {
        message,
        image_url: imageUrl,
      },
    ])
    .select();

  if (error) {
    return handleSupabaseError(error);
  }

  return { data };
};

export const uploadImage = async (file, fileName) => {
  const { data, error } = await supabase.storage
    .from("posts")
    .upload(`${fileName}`, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    return handleSupabaseError(error);
  }

  const publicURL = supabase.storage.from("posts").getPublicUrl(fileName)
    .data.publicUrl;

  return { data: { path: data.path, publicURL } };
};
