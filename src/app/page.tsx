"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { supabase, createPost, uploadImage } from "../lib/supabase";

interface Post {
  id: number;
  message: string;
  image_url: string | null;
  created_at: string;
}

const MAX_CHARACTERS = 280;

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchInitialPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setPosts(data as Post[]);
      if (error) setError("Failed to load posts. Please refresh the page.");
    };

    fetchInitialPosts();

    const postsSubscription = supabase
      .channel("public:posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          setPosts((currentPosts) => [payload.new as Post, ...currentPosts]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsSubscription);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setFilePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;
    if (message.length > MAX_CHARACTERS) return;

    setIsSubmitting(true);
    setError(null); // Clear any previous errors
    try {
      let imageUrl = null;

      if (selectedFile) {
        const fileName = `${Date.now()}-${selectedFile.name}`;
        const result = await uploadImage(selectedFile, fileName);

        if ("error" in result) {
          setError("Failed to upload image. Please try again.");
          return;
        }

        imageUrl = result.data.publicURL;
      }

      await createPost(message, imageUrl as null);

      setMessage("");
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      setError("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <div className="min-h-screen pb-8 bg-[#e9ebee] font-sans text-[#1d2129]">
      <div className="bg-[#3b5998] h-12 flex items-center px-4 sm:px-8 text-white">
        <span className="font-bold text-xl sm:text-2xl tracking-tight mr-4 sm:mr-8">
          Wall
        </span>
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <span className="font-semibold text-sm sm:text-base">
            John Luis Cabantac
          </span>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row max-w-6xl mx-auto mt-4 sm:mt-6 gap-4 sm:gap-6 px-4 sm:px-0">
        <aside className="w-full lg:w-64 order-2 lg:order-1">
          <div className="bg-white rounded border border-[#ccc] p-4">
            <div className="mb-4">
              <div className="w-full aspect-square bg-[#d8dfea] rounded mb-2 overflow-hidden flex items-center justify-center max-w-[200px] mx-auto lg:mx-0">
                <Image
                  src="/profile-avatar.jpg"
                  alt="Profile"
                  width={200}
                  height={200}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
            <div className="border-t border-[#eee] pt-2 text-xs text-center lg:text-left">
              <div className="font-bold mb-1">Information</div>
              <div>
                Networks:
                <br />
                <span className="text-[#385898]">ScholaFlow</span>
              </div>
              <div className="mt-2">
                Current City:
                <br />
                <span className="text-[#385898]">Manila</span>
              </div>
            </div>
          </div>
        </aside>
        <main className="flex-1 order-1 lg:order-2">
          <div className="bg-white rounded border border-[#ccc] p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-4 mb-2">
              <h1 className="text-xl sm:text-2xl font-bold">
                John Luis Cabantac
              </h1>
            </div>
            <div className="flex gap-2 sm:gap-4 border-b border-[#ccc] mb-4 text-[#385898] text-sm font-semibold">
              <a
                href="#"
                className="border-b-2 border-[#3b5998] pb-1 text-[#3b5998]"
              >
                Wall
              </a>
            </div>
            <form
              onSubmit={handleSubmit}
              className="border border-[#d8dfea] rounded bg-[#f7f7f7] p-3 mb-4"
            >
              <div className="mb-2">
                <textarea
                  className="w-full p-2 border border-[#ccc] rounded resize-none focus:outline-none focus:border-[#3b5998] text-sm sm:text-base"
                  placeholder="What's on your mind?"
                  value={message}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (error) setError(null);
                  }}
                  rows={3}
                />
              </div>
              {error && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {error}
                </div>
              )}
              {filePreview && (
                <div className="mb-2 inline-block relative">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="max-w-full max-h-48 sm:max-h-64 rounded block"
                  />
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setFilePreview(null);
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-1 right-1 bg-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#666]">Attach:</span>
                  <label className="cursor-pointer">
                    <span className="w-6 h-6 bg-[#d8dfea] rounded inline-flex items-center justify-center hover:bg-[#c4cde0]">
                      <Image
                        src="/file.svg"
                        width={16}
                        height={16}
                        alt="Attach file"
                      />
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      disabled={isSubmitting}
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      accept="image/*"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span
                    className={`text-xs ${
                      message.length > MAX_CHARACTERS
                        ? "text-red-500"
                        : message.length > MAX_CHARACTERS * 0.8
                        ? "text-orange-500"
                        : "text-[#666]"
                    }`}
                  >
                    {MAX_CHARACTERS - message.length}
                  </span>
                  <button
                    type="submit"
                    className="bg-[#5b74a8] text-white px-4 py-1 rounded text-sm font-semibold disabled:opacity-50"
                    disabled={
                      isSubmitting ||
                      (!message.trim() && !selectedFile) ||
                      message.length > MAX_CHARACTERS
                    }
                  >
                    {isSubmitting ? "Posting..." : "Share"}
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-4 sm:space-y-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="border-b border-[#eee] pb-4 mb-4 last:border-b-0"
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 overflow-hidden rounded-md flex-shrink-0">
                      <Image
                        src="/profile-avatar.jpg"
                        alt="Profile"
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <a
                          href="#"
                          className="text-[#385898] font-semibold hover:underline"
                        >
                          John Luis Cabantac
                        </a>{" "}
                        <span className="break-words">{post.message}</span>
                      </div>

                      {post.image_url && (
                        <div className="mt-2 mb-2">
                          <Image
                            src={post.image_url}
                            alt="Post attachment"
                            width={600}
                            height={400}
                            className="max-w-full rounded max-h-64 sm:max-h-96 object-cover"
                          />
                        </div>
                      )}

                      <div className="text-xs text-[#666] mt-1">
                        {formatDate(post.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {posts.length === 0 && (
                <div className="text-center py-6 text-gray-500 text-sm sm:text-base">
                  No posts yet. Be the first to share something!
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
