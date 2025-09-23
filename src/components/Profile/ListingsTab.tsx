@@ .. @@
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {(activeType === 'all' || activeType === 'practitioners') &&
               practitioners.map((practitioner) => (
-                <Link key={practitioner.id} to={`/practitioners/${practitioner.id}`}>
+                <Link key={practitioner.id} to={`/practitioners/${practitioner.slug}`}>
                   <PractitionerCard practitioner={practitioner} />
                 </Link>
               ))}
             
             {(activeType === 'all' || activeType === 'events') &&
               events.map((event) => (
-                <Link key={event.id} to={`/events/${event.id}`}>
+                <Link key={event.id} to={`/events/${event.slug}`}>
                   <EventCard event={event} />
                 </Link>
               ))}
 
             {(activeType === 'all' || activeType === 'venues') &&
               venues.map((venue) => (
-                <Link key={venue.id} to={`/venues/${venue.id}`}>
+                <Link key={venue.id} to={`/venues/${venue.slug}`}>
                   <VenueCard venue={venue} />
                 </Link>
               ))}
 
             {(activeType === 'all' || activeType === 'jobs') &&
               jobs.map((job) => (
-                <Link key={job.id} to={`/jobs/${job.id}`}>
+                <Link key={job.id} to={`/jobs/${job.slug}`}>
                   <JobCard job={job} />
                 </Link>
               ))}
           </div>
         )}