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
  Sprout,
  Apple,
  Leaf,
  Video
} from 'lucide-react';

export const socialItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: MessageSquare, label: 'Communities', path: '/communities' },
  { icon: Video, label: 'Live Stream', path: '/live-stream' },
];

export const discoverItems = [
  { icon: Users, label: 'Practitioners', path: '/practitioners' },
  { icon: Calendar, label: 'Events', path: '/events' },
  { icon: Building2, label: 'Venues', path: '/venues' },
  { icon: Briefcase, label: 'Jobs', path: '/jobs' },
];

export const learnItems = [
  { icon: BookOpen, label: 'Courses', path: '/courses' },
  { icon: Newspaper, label: 'Blogs', path: '/blogs' },
  { icon: UtensilsCrossed, label: 'Recipes', path: '/recipes' },
];

export const toolsItems = [
  { icon: Sprout, label: 'Crops Calendar', path: '/tools/crops-calendar' },
  { icon: Apple, label: 'Nutrition', path: '/tools/nutrition' },
  { icon: Leaf, label: 'Plant Identifier', path: '/tools/plant-identifier' },
];