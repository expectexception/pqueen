"use client";

import { ChangeEvent, useState } from "react";

export default function TestUploadPage() {
  const [file, setFile] =
    useState<File | null>(null);

  const [message, setMessage] =
    useState("");

  const [uploading, setUploading] =
    useState(false);

  async function handleUpload(): Promise<void> {
    if (!file) {
      setMessage(
        "Please select an image first."
      );
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        "/api/admin/products/upload-image",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Upload failed."
        );
      }

      setMessage(
        `Upload successful: ${data.url}`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ): void {
    const selectedFile =
      event.target.files?.[0] ?? null;

    setFile(selectedFile);
    setMessage("");
  }

  return (
    <main
      style={{
        maxWidth: "700px",
        margin: "60px auto",
        padding: "30px",
      }}
    >
      <h1>Test Product Image Upload</h1>

      <p>
        Select a product image and test
        Supabase Storage.
      </p>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
      />

      {file && (
        <p>
          Selected: <strong>{file.name}</strong>
        </p>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{
          marginTop: "20px",
          padding: "12px 20px",
          cursor:
            !file || uploading
              ? "not-allowed"
              : "pointer",
        }}
      >
        {uploading
          ? "Uploading..."
          : "UPLOAD IMAGE"}
      </button>

      {message && (
        <p
          style={{
            marginTop: "20px",
            wordBreak: "break-all",
          }}
        >
          {message}
        </p>
      )}
    </main>
  );
}