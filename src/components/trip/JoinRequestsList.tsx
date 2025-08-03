// src/components/trip/JoinRequestsList.tsx
import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  Mail,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ProfileHoverCard from "@/components/profile/ProfileHoverCard";
import { JoinRequest } from "@/hooks/useJoinRequestManagement";

// ✅ FIXED: Correct interface matching the working Gemini version
interface JoinRequestsListProps {
  joinRequests: JoinRequest[];
  loading: boolean;
  responseLoading: boolean;
  currentUser: User | null;
  tripCreatorId: string;
  onApproveRequest: (
    request: JoinRequest,
    message?: string
  ) => Promise<boolean>; // ✅ FIXED: Correct signature
  onRejectRequest: (request: JoinRequest, message?: string) => Promise<boolean>; // ✅ FIXED: Correct signature
  className?: string;
}

const JoinRequestsList = ({
  joinRequests,
  loading,
  responseLoading,
  currentUser,
  tripCreatorId,
  onApproveRequest,
  onRejectRequest,
  className = "",
}: JoinRequestsListProps) => {
  const [selectedRequest, setSelectedRequest] = useState<JoinRequest | null>(
    null
  );
  const [responseMessage, setResponseMessage] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [dialogOpen, setDialogOpen] = useState(false);

  const isCreator = currentUser?.id === tripCreatorId;
  const pendingRequests = joinRequests.filter(
    (req) => req.status === "pending"
  );
  const processedRequests = joinRequests.filter(
    (req) => req.status !== "pending"
  );

  const handleActionClick = (
    request: JoinRequest,
    action: "approve" | "reject"
  ) => {
    setSelectedRequest(request);
    setActionType(action);
    setResponseMessage("");
    setDialogOpen(true);
  };

  // ✅ FIXED: Correct function call matching Gemini's working version
  const handleConfirmAction = async () => {
    if (!selectedRequest) {
      console.error("No selected request");
      return;
    }

    console.log("Handling request:", selectedRequest);

    // ✅ Validate required fields
    if (
      !selectedRequest.id ||
      !selectedRequest.trip_id ||
      !selectedRequest.user_id
    ) {
      console.error("❌ Missing required fields in request:", selectedRequest);
      return;
    }

    let success = false;

    if (actionType === "approve") {
      // ✅ FIXED: Pass complete request object and optional message
      success = await onApproveRequest(
        selectedRequest,
        responseMessage.trim() || undefined
      );
    } else if (actionType === "reject") {
      // ✅ FIXED: Pass complete request object and optional message
      success = await onRejectRequest(
        selectedRequest,
        responseMessage.trim() || undefined
      );
    }

    if (success) {
      setDialogOpen(false);
      setSelectedRequest(null);
      setResponseMessage("");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600"
          >
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="text-green-600 bg-green-100 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Join Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading join requests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Only show to trip creators
  if (!isCreator) {
    return null;
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Join Requests ({joinRequests.length})
            </CardTitle>
            {pendingRequests.length > 0 && (
              <Badge
                variant="outline"
                className="text-yellow-600 border-yellow-600"
              >
                {pendingRequests.length} pending
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {joinRequests.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No join requests yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Requests will appear here when users want to join your trip
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                    Pending Requests ({pendingRequests.length})
                  </h4>
                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/10 border-yellow-200"
                      >
                        <div className="flex items-start gap-3">
                          <ProfileHoverCard
                            userId={request.user_id}
                            userName={
                              request.profiles?.full_name || "Anonymous"
                            }
                            userAvatar={
                              request.profiles?.avatar_url || undefined
                            }
                          >
                            <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                              <AvatarImage
                                src={request.profiles?.avatar_url || ""}
                                alt={request.profiles?.full_name || "User"}
                              />
                              <AvatarFallback>
                                {request.profiles?.full_name
                                  ?.charAt(0)
                                  .toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                          </ProfileHoverCard>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">
                                {request.profiles?.full_name || "Anonymous"}
                              </p>
                              {getStatusBadge(request.status)}
                            </div>

                            {request.message && (
                              <div className="bg-white dark:bg-gray-800 p-3 rounded border mb-3">
                                <p className="text-sm italic">
                                  "{request.message}"
                                </p>
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground mb-3">
                              Requested{" "}
                              {formatDistanceToNow(
                                new Date(request.requested_at),
                                { addSuffix: true }
                              )}
                            </p>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleActionClick(request, "approve")
                                }
                                disabled={responseLoading}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleActionClick(request, "reject")
                                }
                                disabled={responseLoading}
                                className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Processed Requests */}
              {processedRequests.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                    Previous Requests ({processedRequests.length})
                  </h4>
                  <div className="space-y-3">
                    {processedRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage
                              src={request.profiles?.avatar_url || ""}
                              alt={request.profiles?.full_name || "User"}
                            />
                            <AvatarFallback>
                              {request.profiles?.full_name
                                ?.charAt(0)
                                .toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">
                                {request.profiles?.full_name || "Anonymous"}
                              </p>
                              {getStatusBadge(request.status)}
                            </div>

                            {request.response_message && (
                              <p className="text-xs text-muted-foreground italic">
                                Response: "{request.response_message}"
                              </p>
                            )}

                            <p className="text-xs text-muted-foreground">
                              {request.status}{" "}
                              {formatDistanceToNow(
                                new Date(
                                  request.responded_at || request.requested_at
                                ),
                                { addSuffix: true }
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Join Request
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? `Approve ${
                    selectedRequest?.profiles?.full_name || "this user"
                  }'s request to join your trip?`
                : `Reject ${
                    selectedRequest?.profiles?.full_name || "this user"
                  }'s request to join your trip?`}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest?.message && (
            <div className="bg-muted p-3 rounded">
              <p className="text-sm">
                <strong>Their message:</strong>
              </p>
              <p className="text-sm italic">"{selectedRequest.message}"</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Response message (optional)
            </label>
            <Textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder={
                actionType === "approve"
                  ? "Welcome to the trip! Looking forward to the adventure..."
                  : "Thank you for your interest, but..."
              }
              className="min-h-[80px]"
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">
              {responseMessage.length}/300 characters
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={responseLoading}
              className={
                actionType === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {responseLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {actionType === "approve" ? "Approving..." : "Rejecting..."}
                </>
              ) : (
                <>
                  {actionType === "approve" ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  {actionType === "approve"
                    ? "Approve Request"
                    : "Reject Request"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JoinRequestsList;
