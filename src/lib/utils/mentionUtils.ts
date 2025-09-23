/**
 * Utility functions for handling user mentions in content
 */

/**
 * Renders content with clickable user mentions
 * Converts @username to clickable links
 */
export function renderContentWithMentions(content: string): string {
  if (!content) return '';
  
  // Replace @username with clickable links
  return content.replace(
    /@(\w+)/g, 
    '<a href="/profile/$1/listings" class="text-accent-text hover:text-accent-text/80 font-medium hover:underline transition-colors">@$1</a>'
  );
}

/**
 * Extract mentioned usernames from content
 */
export function extractMentions(content: string): string[] {
  const mentionMatches = content.match(/@(\w+)/g);
  if (!mentionMatches) return [];
  
  return mentionMatches.map(match => match.substring(1));
}

/**
 * Get user IDs from mentioned usernames
 */
export async function getMentionedUserIds(usernames: string[]): Promise<string[]> {
  if (usernames.length === 0) return [];
  
  try {
    const { supabase } = await import('../supabase');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id')
      .in('username', usernames);

    if (error) throw error;
    
    return users?.map(user => user.id) || [];
  } catch (err) {
    console.error('Error fetching mentioned user IDs:', err);
    return [];
  }
}