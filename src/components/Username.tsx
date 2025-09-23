interface UsernameProps {
  username: string;
  className?: string;
  verified?: boolean;
}

export function Username({ username, className = '', verified = false }: UsernameProps) {
  return (
    <Link to={`/profile/${username}/listings`} className={className || ''}>
      <span className="flex items-center gap-1">
        {username}
        {verified && <BadgeCheck className="inline-block text-[#feb800] fill-[#feb800] stroke-white" size={16} />}
      </span>
    </Link>
  );
}