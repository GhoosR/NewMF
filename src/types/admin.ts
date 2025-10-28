import type { Practitioner } from './practitioners';
import type { Event } from './events';
import type { Venue } from './venues';
import type { Job } from './jobs';
import type { Course } from './courses';
import type { Recipe } from './recipes';

export type AdminListing = (
  | (Practitioner & { type: 'practitioner'; slug: string })
  | (Event & { type: 'event'; slug: string })
  | (Venue & { type: 'venue'; slug: string })
  | (Job & { type: 'job'; slug: string })
  | (Course & { type: 'course'; slug: string })
  | (Recipe & { type: 'recipe'; slug: string })
);