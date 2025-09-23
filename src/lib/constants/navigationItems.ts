import { 
  Home, 
  MessageSquare,
  BookOpen,
  Newspaper,
  UtensilsCrossed,
  Users, 
  Calendar, 
  Building2, 
  Briefcase,
  Apple,
  Leaf,
  Video,
  Sprout
} from 'lucide-react';

export const socialItems = [
  { icon: Home, label: 'News Feed', path: '/' },
  { icon: MessageSquare, label: 'Communities', path: '/communities' },
  { icon: Video, label: 'Live Stream', path: '/live-stream' },
];

export const discoverItems = [
  { icon: Users, label: 'Practitioners', path: '/practitioners' },
  { icon: Calendar, label: 'Events & Retreats', path: '/events' },
  { icon: Building2, label: 'Venues', path: '/venues' },
  { icon: Briefcase, label: 'Jobs', path: '/jobs' },
];

export const learnItems = [
  { icon: BookOpen, label: 'Courses', path: '/courses' },
  { icon: UtensilsCrossed, label: 'Recipes', path: '/recipes' },
  { icon: Newspaper, label: 'Articles', path: '/articles' },
];

export const toolsItems = [
  { icon: Sprout, label: 'Agriculture', path: '/agriculture' },
  { icon: Apple, label: 'Nutrition', path: '/tools/nutrition' },
];