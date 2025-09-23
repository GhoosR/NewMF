@@ .. @@
 import { ListingsTab } from './profile/ListingsTab';
 import { TimelineTab } from './profile/TimelineTab';
 import { MediaTab } from './profile/MediaTab';
 import { BookmarksTab } from './profile/BookmarksTab';
 import { CoursesTab } from './profile/CoursesTab';
@@ .. @@
               <Route path="timeline" element={<TimelineTab username={profile.username} />} />
               {isOwnProfile && <Route path="bookmarks" element={<BookmarksTab userId={profile.id} />} />}
               <Route path="media" element={<MediaTab userId={profile.id} />} />
-              <Route path="garden" element={<GardenTab userId={profile.id} />} />
               <Route path="recipes" element={<RecipesTab userId={profile.id} />} />
               <Route path="courses" element={<CoursesTab userId={profile.id} />} />
               {isOwnProfile && (
               )
               }