import React from 'react';
import { Check, X } from 'lucide-react';
import { handleJoinRequest } from '../../lib/communities/joinRequests';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '../../types/notifications';

interface NotificationActionsProps {
  notification: Notification;
  onAction: (notificationId: string) => void;
}

export function NotificationActions({ notification, onAction }: NotificationActionsProps) {
  const navigate = useNavigate();

  if (!['join_request', 'field_invitation'].includes(notification.type)) return null;

  const handleJoinRequestAction = async (approved: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent notification click
    try {
      await handleJoinRequest(notification.data.request_id, approved);
      onAction(notification.id);
    } catch (error) {
      console.error('Error handling join request:', error);
    }
  };

  const handleFieldInvitationAction = async (accepted: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Update invitation status and remove notification
      const { error: updateError } = await supabase
        .from('field_invitations')
        .update({ status: accepted ? 'accepted' : 'rejected' })
        .eq('id', notification.data.invitation_id)
        .eq('status', 'pending');

      if (updateError) throw updateError;

      // Remove the notification from database
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notification.id);

      if (deleteError) throw deleteError;

      // Remove notification from UI
      onAction(notification.id);
      
      // If accepted, navigate to the field page
      if (accepted) {
        navigate(`/agriculture/${notification.data.field_id}`);
      }
    } catch (error) {
      console.error('Error handling field invitation:', error);
      alert('Failed to process invitation. The invitation may no longer be valid.');
    }
  };

  if (notification.type === 'field_invitation') {
    return (
      <div className="flex space-x-2 mt-2 transform transition-all duration-200">
        <span
          onClick={(e) => handleFieldInvitationAction(true, e)}
          className="flex items-center px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-md cursor-pointer"
        >
          <Check className="h-4 w-4 mr-1" />
          Accept
        </span>
        <span
          onClick={(e) => handleFieldInvitationAction(false, e)}
          className="flex items-center px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
        >
          <X className="h-4 w-4 mr-1" />
          Decline
        </span>
      </div>
    );
  }

  return (
    <div 
      className="flex space-x-2 mt-2 transform transition-all duration-200"
    >
      <span
        onClick={(e) => handleJoinRequestAction(true, e)}
        className="flex items-center px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-md cursor-pointer"
      >
        <Check className="h-4 w-4 mr-1" />
        Approve
      </span>
      <span
        onClick={(e) => handleJoinRequestAction(false, e)}
        className="flex items-center px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
      >
        <X className="h-4 w-4 mr-1" />
        Reject
      </span>
    </div>
  );
}