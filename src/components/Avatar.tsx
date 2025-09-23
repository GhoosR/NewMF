interface AvatarProps {
   url?: string;
   size?: 'sm' | 'md' | 'lg';
-  userId?: string;
   username?: string;
   onUpdate?: () => void;
   editable?: boolean;
}
 
export function Avatar({ 
   url, 
   size = 'md', 
-  userId,
   username,
   onUpdate,
   editable = false 
}: AvatarProps) {
  const content = (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100`}>
      {url ? (
        <img src={url} alt="Profile" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gray-100">
          <User className="h-1/2 w-1/2 text-gray-400" />
        </div>
      )}
    </div>
  );

  if (username && !editable) {
    return (
      <Link to={`/profile/${username}/listings`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}