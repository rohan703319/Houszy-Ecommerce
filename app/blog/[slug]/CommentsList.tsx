"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function CommentsList({ blogPostId }: { blogPostId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH COMMENTS
  async function loadComments() {
    try {
      const res = await fetch(
        `${API_BASE}/api/BlogComments/post/${blogPostId}?includeUnapproved=false`
      );
      const json = await res.json();
      setComments(json?.data ?? []);
    } catch {
      setComments([]);
    }
    setLoading(false);
  }

 useEffect(() => {
  loadComments();

  // 🔥 When comment is added, refresh list
  const refresh = () => loadComments();
  window.addEventListener("comment-added", refresh);

  return () => window.removeEventListener("comment-added", refresh);
}, []);


  return (
    <div className="mt-8">
      {loading && <p className="text-gray-500">Loading comments...</p>}

      {!loading && comments.length === 0 && (
        <p className="text-gray-600">No comments yet.</p>
      )}

      <ul className="space-y-4">
        {comments.map((c) => (
          <li
            key={c.id}
            className="bg-gray-50 p-4 rounded-xl border"
          >
            <div className="font-semibold text-sm">{c.authorName}</div>
            <div className="text-xs text-gray-500">
              {new Date(c.createdAt).toLocaleString()}
            </div>
            <p className="mt-2 text-gray-700">{c.commentText}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
