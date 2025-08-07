// src/components/trips/PostTripReviewModal.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Upload, X, Camera, Loader2 } from "lucide-react";

interface PostTripReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: {
    id: number;
    title: string;
    destination: string;
  };
  onReviewSubmitted?: () => void;
}

const PostTripReviewModal = ({
  isOpen,
  onClose,
  trip,
  onReviewSubmitted,
}: PostTripReviewModalProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);

  // ✅ NEW: Image compression function
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        // ✅ Optimal dimensions for web
        const maxWidth = 800;
        const maxHeight = 600;

        let { width, height } = img;

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              console.log(
                `🗜️ Compressed ${file.name}: ${Math.round(
                  file.size / 1024
                )}KB → ${Math.round(blob.size / 1024)}KB`
              );
              resolve(compressedFile);
            }
          },
          "image/jpeg",
          0.7 // ✅ 70% quality for optimal size/quality balance
        );
      };

      img.onerror = () => {
        console.error("Failed to load image for compression");
        resolve(file); // Return original file if compression fails
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // ✅ UPDATED: Handle photo upload with compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (photos.length + files.length > 2) {
      toast({
        title: "Photo limit exceeded",
        description: "Maximum 2 photos allowed per review",
        variant: "destructive",
      });
      return;
    }

    // Validate file types and sizes BEFORE compression
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload only image files",
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        // ✅ Increased to 10MB since we'll compress anyway
        toast({
          title: "File too large",
          description: "Please upload images smaller than 10MB",
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setCompressing(true);

    try {
      // ✅ Compress images before adding to state
      const compressedFiles = await Promise.all(
        validFiles.map(async (file) => {
          if (file.type.startsWith("image/")) {
            return await compressImage(file);
          }
          return file;
        })
      );

      setPhotos((prev) => [...prev, ...compressedFiles].slice(0, 2));

      toast({
        title: "Photos optimized! ✨",
        description: `${compressedFiles.length} photo${
          compressedFiles.length > 1 ? "s" : ""
        } compressed and ready to upload`,
      });
    } catch (error) {
      console.error("Error compressing images:", error);
      toast({
        title: "Compression failed",
        description: "Using original images",
        variant: "destructive",
      });
      setPhotos((prev) => [...prev, ...validFiles].slice(0, 2));
    } finally {
      setCompressing(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotosToStorage = async (): Promise<string[]> => {
    if (photos.length === 0) return [];

    setUploading(true);
    const photoUrls: string[] = [];

    try {
      for (const photo of photos) {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${trip.id}/${Date.now()}-${Math.random()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from("trip-photos")
          .upload(fileName, photo, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from("trip-photos").getPublicUrl(fileName);

        photoUrls.push(publicUrl);
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      throw new Error("Failed to upload photos");
    } finally {
      setUploading(false);
    }

    return photoUrls;
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Comment required",
        description: "Please share your experience",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Upload photos first
      const photoUrls = await uploadPhotosToStorage();

      // Submit review
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from("trip_reviews").insert({
        trip_id: trip.id,
        user_id:user?.id,
        rating,
        comment: comment.trim() || "No comment provided",
        photo_urls: photoUrls,
        photo_count: photoUrls.length,
      });

      if (error) throw error;

      toast({
        title: "Review submitted! 🌟",
        description: "Thank you for sharing your experience",
      });

      // ✅ Call the callback if provided
      onReviewSubmitted?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-accent" />
            Share Your {trip.destination} Experience
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Rate your overall experience
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-muted-foreground">
                {rating === 5
                  ? "Amazing!"
                  : rating === 4
                  ? "Great!"
                  : rating === 3
                  ? "Good"
                  : rating === 2
                  ? "Okay"
                  : "Poor"}
              </p>
            )}
          </div>

          {/* Comment Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share your experience</label>
            <Textarea
              placeholder="Tell us about your trip highlights, what you enjoyed most, and any tips for future travelers..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Add photos (max 2)</label>

            {/* Photo Preview - ✅ OPTIMIZED: Smaller display */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 max-w-[300px]">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg" // ✅ Smaller height
                      style={{
                        maxWidth: "140px", // ✅ Constrain width
                        maxHeight: "100px", // ✅ Constrain height
                      }}
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {/* ✅ NEW: Show file size */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-1 py-0.5 rounded-b-lg">
                      {Math.round(photo.size / 1024)}KB
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {photos.length < 2 && (
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-accent transition-colors">
                <div className="text-center">
                  {compressing ? (
                    <>
                      <Loader2 className="w-6 h-6 mx-auto mb-2 text-accent animate-spin" />
                      <span className="text-sm text-accent">
                        Optimizing photos...
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Upload{" "}
                        {photos.length === 0 ? "photos" : "another photo"}
                      </span>
                      <span className="text-xs text-gray-500 block mt-1">
                        Auto-optimized for web
                      </span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={compressing}
                />
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={submitting || uploading || compressing}
            >
              Later
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={
                submitting ||
                uploading ||
                compressing ||
                rating === 0 ||
                !comment.trim()
              }
            >
              {compressing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Optimizing...
                </>
              ) : submitting || uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploading ? "Uploading..." : "Submitting..."}
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostTripReviewModal;
