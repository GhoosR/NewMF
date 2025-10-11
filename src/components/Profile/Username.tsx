import { Link } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import { BadgeDisplay } from '../Badges/BadgeDisplay';
import { useUserBadge } from '../../hooks/useUserBadge';

interface UsernameProps {
  username: string;
  userId?: string;
  className?: string;
  verified?: boolean;
}

export function Username({ username, userId, className = '', verified = false }: UsernameProps) {
  const { badge } = useUserBadge(userId);

  if (!userId) {
    return (
      <span className={`${className} flex items-center gap-1`}>
        {username}
        {verified && <BadgeCheck className="inline-block text-[#feb800] fill-[#feb800] stroke-white" size={16} />}
      </span>
    );
  }

  if (!username) {
    return (
      <span className={`${className} flex items-center gap-1`}>
        Anonymous
        {verified && <BadgeCheck className="inline-block text-[#feb800] fill-[#feb800] stroke-white" size={16} />}
      </span>
    );
  }

  return (
    <Link to={`/profile/${username}/listings`} className={`${className} flex items-center gap-1`}>
      <span className="flex items-center gap-1">
        {username}
        {verified && <BadgeCheck className="inline-block text-[#feb800] fill-[#feb800] stroke-white" size={16} />}
        <BadgeDisplay badge={badge} size="sm" />
      </span>
    </Link>
  );
}