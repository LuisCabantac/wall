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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchInitialPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setPosts(data as Post[]);
      if (error) console.error("Error fetching posts:", error);
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
    try {
      let imageUrl = null;

      if (selectedFile) {
        const fileName = `${Date.now()}-${selectedFile.name}`;
        const result = await uploadImage(selectedFile, fileName);

        if ("error" in result) {
          console.error("Error uploading image:", result.error);
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
    } catch (error) {
      console.error("Error creating post:", error);
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
      <div className="bg-[#3b5998] h-12 flex items-center px-8 text-white">
        <span className="font-bold text-2xl tracking-tight mr-8">Wall</span>
        <div className="ml-auto flex items-center gap-4">
          <span className="font-semibold">John Luis Cabantac</span>
        </div>
      </div>
      <div className="flex max-w-6xl mx-auto mt-6 gap-6">
        <aside className="w-64">
          <div className="bg-white rounded border border-[#ccc] p-4">
            <div className="mb-4">
              <div className="w-full aspect-square bg-[#d8dfea] rounded mb-2 overflow-hidden flex items-center justify-center">
                <Image
                  src="/profile-avatar.jpg"
                  alt="Profile"
                  width={200}
                  height={200}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
            <div className="border-t border-[#eee] pt-2 text-xs">
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
        <main className="flex-1">
          <div className="bg-white rounded border border-[#ccc] p-6">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-2xl font-bold">John Luis Cabantac</h1>
            </div>
            <div className="flex gap-4 border-b border-[#ccc] mb-4 text-[#385898] text-sm font-semibold">
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
                  className="w-full p-2 border border-[#ccc] rounded resize-none focus:outline-none focus:border-[#3b5998]"
                  placeholder="What's on your mind?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
              {filePreview && (
                <div className="mb-2 inline-block relative">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="max-w-full max-h-64 rounded block"
                  />
                  <button
                    type="button"
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
              <div className="flex items-center justify-between">
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
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      accept="image/*"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="ml-2 bg-[#5b74a8] text-white px-4 py-1 rounded text-sm font-semibold disabled:opacity-50"
                  disabled={isSubmitting || (!message.trim() && !selectedFile)}
                >
                  {isSubmitting ? "Posting..." : "Share"}
                </button>
              </div>
            </form>

            <div className="space-y-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="border-b border-[#eee] pb-4 mb-4 last:border-b-0"
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 overflow-hidden rounded-md">
                      <Image
                        src="/profile-avatar.jpg"
                        alt="Profile"
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">
                        <a
                          href="#"
                          className="text-[#385898] font-semibold hover:underline"
                        >
                          John Luis Cabantac
                        </a>{" "}
                        {post.message}
                      </div>

                      {post.image_url && (
                        <div className="mt-2 mb-2">
                          <Image
                            src={post.image_url}
                            alt="Post attachment"
                            width={600}
                            height={400}
                            className="max-w-full rounded max-h-96"
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
                <div className="text-center py-6 text-gray-500">
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
