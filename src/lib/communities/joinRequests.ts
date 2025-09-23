import { supabase } from '../supabase';
import { createNotification } from '../notifications';

export async function createJoinRequest(communityId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if request already exists
  const { data: existingRequest } = await supabase
    .from('community_join_requests')
    .select('status')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .single();

  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      throw new Error('You have already requested to join this community');
    } else if (existingRequest.status === 'rejected') {
      throw new Error('Your previous request was rejected');
    }
    return existingRequest;
  }

  // Get community details
  const { data: community } = await supabase
    .from('communities')
    .select('name, owner_id')
    .eq('id', communityId)
    .single();

  if (!community) throw new Error('Community not found');

  // Create join request
  const { data: request, error: requestError } = await supabase
    .from('community_join_requests')
    .insert([{
      community_id: communityId,
      user_id: user.id,
      status: 'pending'
    }])
    .select()
    .single();

  if (requestError) throw requestError;

  // Get user details for notification
  const { data: userData } = await supabase
    .from('users')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();

  // Create notification for community owner
  const { error: notificationError } = await supabase
    .from('notifications')
    .insert([{
      user_id: community.owner_id,
      type: 'join_request',
      title: 'New Join Request',
      message: `${userData?.username || 'Someone'} wants to join ${community.name}`,
      data: {
        request_id: request.id,
        community_id: communityId,
        community_name: community.name,
        user_id: user.id,
        user_username: userData?.username,
        user_avatar_url: userData?.avatar_url
      }
    }]);

  if (notificationError) throw notificationError;

  return request;
}

export async function handleJoinRequest(requestId: string, approved: boolean) {
  try {
    // Get request details
    const { data: request } = await supabase
      .from('community_join_requests')
      .select('*, community:communities(name, type)')
      .eq('id', requestId)
      .single();

    if (!request) throw new Error('Request not found');

    // Get admin user details
    const { data: { user: admin } } = await supabase.auth.getUser();
    if (!admin) throw new Error('Not authenticated');

    // Update request status
    const { error: updateError } = await supabase
      .from('community_join_requests')
      .update({ status: approved ? 'approved' : 'rejected' })
      .eq('id', requestId);

    if (updateError) throw updateError;

    if (approved) {
      // Add user as community member
      const { error: memberError } = await supabase
        .from('community_members')
        .insert([{
          community_id: request.community_id,
          user_id: request.user_id,
          role: 'member'
        }]);

      if (memberError) throw memberError;
    }

    // Create notification for the user
    await createNotification({
      userId: request.user_id,
      type: approved ? 'join_request_approved' : 'join_request_rejected',
      title: approved ? 'Join Request Approved' : 'Join Request Rejected',
      message: approved 
        ? `Your request to join ${request.community.name} has been approved. You can now participate in discussions.`
        : `Your request to join ${request.community.name} has been rejected.`,
      data: {
        community_id: request.community_id,
        community_name: request.community.name,
        sender_id: admin.id
      }
    });

    // Delete the original join request notification
    const { error: deleteNotificationError } = await supabase
      .from('notifications')
      .delete()
      .eq('type', 'join_request')
      .eq('data->request_id', requestId);

    if (deleteNotificationError) {
      console.error('Error deleting notification:', deleteNotificationError);
    }

    return true;
  } catch (error) {
    console.error('Error handling join request:', error);
    throw error;
  }
}