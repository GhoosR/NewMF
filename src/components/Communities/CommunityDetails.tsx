// Previous imports remain the same...

export function CommunityDetails() {
  // Previous state and other code remains the same...

  const handleJoin = async () => {
    if (!community) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (community.type === 'private') {
        try {
          await createJoinRequest(community.id);
          // Show success message
          alert('Join request sent successfully');
        } catch (err: any) {
          // Show error message
          alert(err.message);
        }
      } else {
        const { error } = await supabase
          .from('community_members')
          .insert([{
            community_id: community.id,
            user_id: user.id,
            role: 'member'
          }]);

        if (error) throw error;
      }

      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Rest of the component remains the same...
}