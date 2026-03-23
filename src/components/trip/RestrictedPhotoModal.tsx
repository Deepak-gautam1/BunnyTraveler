// components/trip/RestrictedPhotoModal.tsx
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Trash2, Download, Lock } from "lucide-react";

// TripPhoto matches DbTripPhoto (all DB nullable fields kept nullable)
import type { DbTripPhoto } from "@/types/database";

type TripPhoto = Omit<DbTripPhoto, "trip_id" | "uploaded_by"> & {
  trip_id: number;             // overridden to non-null (caller guarantees this)
  uploaded_by: string | null;  // keep nullable as per DB
  profiles?: { full_name: string | null; avatar_url?: string | null } | null;
};

interface RestrictedPhotoModalProps {
  photo: TripPhoto;
  onClose: () => void;
  onDelete: () => void;
  canDelete: boolean;
  hasDownloadAccess: boolean;
}

export default function RestrictedPhotoModal({
  photo,
  onClose,
  onDelete,
  canDelete,
  hasDownloadAccess,
}: RestrictedPhotoModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleRestrictedDownload = async () => {
    if (!hasDownloadAccess) {
      alert("Download is only available to trip participants");
      return;
    }

    setDownloading(true);
    try {
      // Use signed URL for secure download
      const filePath = extractFilePathFromUrl(photo.url);

      const { data, error } = await supabase.storage
        .from("trip-photos")
        .createSignedUrl(filePath, 300); // 5 minutes expiry

      if (error) {
        throw new Error(`Access denied: ${error.message}`);
      }

      // Download using signed URL
      await downloadWithFetch(data.signedUrl, `trip-photo-${photo.id}.jpg`);
    } catch {
      alert(
        "Download failed. You may not have permission to access this photo."
      );
    } finally {
      setDownloading(false);
    }
  };

  // ✅ ADD THIS MISSING FUNCTION
  const handleDelete = async () => {
    if (!canDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("trip_photos")
        .delete()
        .eq("id", photo.id);

      if (error) throw error;

      onDelete();
      onClose();
    } catch {
      alert("Failed to delete photo. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const extractFilePathFromUrl = (url: string): string => {
    const urlParts = url.split("/");
    const publicIndex = urlParts.findIndex((part) => part === "public");

    if (publicIndex !== -1 && publicIndex < urlParts.length - 1) {
      return urlParts.slice(publicIndex + 1).join("/");
    }

    return `trip-photos/${photo.trip_id}/${photo.id}.jpg`;
  };

  const downloadWithFetch = async (url: string, filename: string) => {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
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
            {/* Restricted download button */}
            <button
              onClick={handleRestrictedDownload}
              disabled={!hasDownloadAccess || downloading}
              className={`p-2 ${
                hasDownloadAccess
                  ? "text-gray-600 hover:text-gray-800"
                  : "text-gray-400 cursor-not-allowed"
              }`}
              title={
                hasDownloadAccess
                  ? "Download"
                  : "Download restricted to participants"
              }
            >
              {downloading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
              ) : hasDownloadAccess ? (
                <Download size={20} />
              ) : (
                <Lock size={20} />
              )}
            </button>

            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 text-red-600 hover:text-red-800"
                title="Delete"
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                ) : (
                  <Trash2 size={20} />
                )}
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

        {/* Caption and access info */}
        <div className="p-4 border-t">
          {photo.caption && (
            <p className="text-gray-800 mb-2">{photo.caption}</p>
          )}
          {!hasDownloadAccess && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Lock size={16} />
              <span>Download restricted to trip participants</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
