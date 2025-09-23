import type { Practitioner } from './practitioners';
import type { Event } from './events';
import type { Venue } from './venues';
import type { Job } from './jobs';
import type { Course } from './courses';
import type { Recipe } from './recipes';

export type AdminListing = (
  | (Practitioner & { type: 'practitioner' })
  | (Event & { type: 'event' })
  | (Venue & { type: 'venue' })
  | (Job & { type: 'job' })
  | (Course & { type: 'course' })
  | (Recipe & { type: 'recipe' })
);