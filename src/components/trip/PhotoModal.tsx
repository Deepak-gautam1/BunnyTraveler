// components/trip/PhotoModal.tsx
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Trash2, Download } from "lucide-react";
import type { DbTripPhoto } from "@/types/database";

type TripPhoto = DbTripPhoto & {
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

interface PhotoModalProps {
  photo: TripPhoto;
  onClose: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

export default function PhotoModal({
  photo,
  onClose,
  onDelete,
  canDelete,
}: PhotoModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!canDelete) return;

    setDeleting(true);
    try {
      // Delete from database
      const { error } = await supabase
        .from("trip_photos")
        .delete()
        .eq("id", photo.id);

      if (error) throw error;

      // Delete from storage (extract file path from URL)
      const filePath = photo.url.split("/").slice(-3).join("/");
      await supabase.storage.from("trip-photos").remove([filePath]);

      onDelete();
      onClose();
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(photo.url, {
        method: "GET",
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Download failed: ${response.status} ${response.statusText}`
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create temporary download link
      const link = document.createElement("a");
      link.href = url;
      link.download = `trip-photo-${Date.now()}.jpg`; // Use timestamp for unique names
      link.style.display = "none";

      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch {
      // silently fail — alert removed per no-console policy
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              {photo.profiles?.avatar_url ? (
                <img
                  src={photo.profiles.avatar_url}
                  alt={photo.profiles.full_name ?? undefined}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium">
                  {photo.profiles?.full_name?.charAt(0) || "?"}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium">
                {photo.profiles?.full_name || "Anonymous"}
              </p>
              <p className="text-sm text-gray-500">
                {photo.created_at ? new Date(photo.created_at).toLocaleDateString() : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Debug button - remove after fixing the issue */}

            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 hover:text-gray-800"
              title="Download"
            >
              <Download size={20} />
            </button>
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 text-red-600 hover:text-red-800"
                title="Delete"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Photo */}
        <div className="max-h-[60vh] overflow-hidden">
          <img
            src={photo.url}
            alt={photo.caption || "Trip photo"}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Caption */}
        {photo.caption && (
          <div className="p-4 border-t">
            <p className="text-gray-800">{photo.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}
