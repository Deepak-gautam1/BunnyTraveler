// components/trip/PhotoGallery.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import RestrictedPhotoModal from "@/components/trip/RestrictedPhotoModal";

// Add the TripPhoto interface
interface TripPhoto {
  id: string;
  trip_id: number;
  url: string;
  thumb_url: string;
  uploaded_by: string;
  caption?: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface PhotoGalleryProps {
  tripId: number;
  isParticipant: boolean;
  tripCreatorId: string; // Add this to know the trip creator
}

export default function PhotoGallery({
  tripId,
  isParticipant,
  tripCreatorId,
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<TripPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<TripPhoto | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  const { user, isAuthenticated } = useAuth();

  // Check if user has access to view photos
  useEffect(() => {
    checkPhotoAccess();
  }, [user, tripId, isParticipant]);

  // Debug the access state
  useEffect(() => {
    console.log("📸 PhotoGallery Debug:", {
      tripId,
      isParticipant,
      isAuthenticated,
      hasAccess,
      userId: user?.id,
      tripCreatorId,
      uploadSectionVisible: isParticipant && hasAccess,
    });
  }, [tripId, isParticipant, isAuthenticated, hasAccess, user, tripCreatorId]);

  const checkPhotoAccess = async () => {
    if (!user || !isAuthenticated) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    // Trip creator always has access
    if (user.id === tripCreatorId) {
      setHasAccess(true);
      fetchPhotos();
      return;
    }

    // Check if user is a participant
    try {
      const { data, error } = await supabase
        .from("trip_participants")
        .select("user_id")
        .eq("trip_id", tripId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking participation:", error);
        setHasAccess(false);
      } else {
        const isParticipantInDb = !!data;
        setHasAccess(isParticipantInDb);

        if (isParticipantInDb) {
          fetchPhotos();
        }
      }
    } catch (error) {
      console.error("Error checking photo access:", error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async () => {
    if (!hasAccess) return;

    try {
      const { data, error } = await supabase
        .from("trip_photos")
        .select(
          `
          *,
          profiles (
            full_name,
            avatar_url
          )
        `
        )
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
      // If access is denied, clear photos
      setPhotos([]);
    }
  };

  // Upload photo function
  const uploadPhoto = async (file: File, caption?: string) => {
    if (!user || !isAuthenticated) {
      console.error("Upload failed: User not authenticated");
      return;
    }

    console.log("Starting photo upload:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      tripId,
      userId: user.id,
    });

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `trip-photos/${tripId}/${fileName}`;

      console.log("Uploading to path:", filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("trip-photos")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      console.log("Storage upload successful:", uploadData);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("trip-photos").getPublicUrl(filePath);

      console.log("Generated public URL:", publicUrl);

      // Save to database
      const photoData = {
        trip_id: tripId,
        url: publicUrl,
        thumb_url: publicUrl,
        uploaded_by: user.id,
        caption: caption || null,
        file_size: file.size,
        mime_type: file.type,
      };

      console.log("Inserting to database:", photoData);

      const { data: dbData, error: dbError } = await supabase
        .from("trip_photos")
        .insert(photoData)
        .select();

      if (dbError) {
        console.error("Database insert error:", dbError);
        throw dbError;
      }

      console.log("Database insert successful:", dbData);

      // Refresh photos
      fetchPhotos();

      console.log("✅ Photo upload completed successfully");
    } catch (error) {
      console.error("❌ Photo upload failed:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadPhoto(file);
    }
  };

  // Restricted access view
  if (!isAuthenticated) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Lock size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 font-medium">
          Please log in to view trip photos
        </p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Lock size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 font-medium">
          Photos are only visible to trip participants
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Join this trip to view and share photos with other travelers
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Section - only for participants */}
      {isParticipant && hasAccess && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Share Photos</h3>
            <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
              <Camera size={20} />
              Upload Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
          {uploading && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Uploading...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Camera size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No photos shared yet</p>
          {isParticipant && hasAccess && (
            <p className="text-sm text-gray-500 mt-2">
              Be the first to share a memory!
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square cursor-pointer group"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.thumb_url}
                alt={photo.caption || "Trip photo"}
                className="w-full h-full object-cover rounded-lg group-hover:opacity-90 transition-opacity"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg" />

              {/* Photo info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs font-medium">
                  {photo.profiles?.full_name || "Anonymous"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Modal with restricted download */}
      {selectedPhoto && (
        <RestrictedPhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onDelete={fetchPhotos}
          canDelete={user?.id === selectedPhoto.uploaded_by}
          hasDownloadAccess={hasAccess}
        />
      )}
    </div>
  );
}
