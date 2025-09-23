@@ .. @@
 import { supabase } from '../lib/supabase';
 import { formatPrice } from '../lib/utils/formatters';
 import { LoadingSpinner } from '../components/LoadingSpinner';
+import { ServicePackageCard } from '../components/Packages/ServicePackageCard';
 import { 
   MapPin, 
   Globe, 
@@ .. @@
   Star,
   Calendar,
   MessageCircle,
-  ExternalLink
+  ExternalLink,
+  Package
 } from 'lucide-react';
 
 export function PractitionerProfile() {
   const { id } = useParams();
   const [practitioner, setPractitioner] = useState<any>(null);
+  const [packages, setPackages] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
-  const [activeTab, setActiveTab] = useState('overview');
+  const [activeTab, setActiveTab] = useState('overview');
 
   useEffect(() => {
     if (id) {
@@ .. @@
         .single();

       if (error) throw error;
       setPractitioner(data);
+      
+      // Load packages
+      const { data: packagesData } = await supabase
+        .from('service_packages')
+        .select('*')
+        .eq('practitioner_id', id)
+        .eq('is_active', true)
+        .order('created_at', { ascending: false });
+      
+      setPackages(packagesData || []);
     } catch (err: any) {
       console.error('Error loading practitioner:', err);
       setError(err.message);
@@ .. @@
           <div className="flex space-x-8 border-b border-accent-text/10">
             <button
               onClick={() => setActiveTab('overview')}
-              className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
+              className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                 activeTab === 'overview'
                   ? 'border-accent-text text-accent-text'
                   : 'border-transparent text-content/60 hover:text-content'
@@ -
             >
               Overview
             </button>
+            
+            {packages.length > 0 && (
+              <button
+                onClick={() => setActiveTab('packages')}
+                className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center ${
+                  activeTab === 'packages'
+                    ? 'border-accent-text text-accent-text'
+                    : 'border-transparent text-content/60 hover:text-content'
+                }`}
+              >
+                <Package className="h-4 w-4 mr-1" />
+                Packages ({packages.length})
+              </button>
+            )}
+            
             <button
               onClick={() => setActiveTab('reviews')}
-              className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
+              className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                 activeTab === 'reviews'
                   ? 'border-accent-text text-accent-text'
                   : 'border-transparent text-content/60 hover:text-content'
@@ .. @@
           </div>

           {/* Tab Content */}
-          <div className="mt-8">
+          <div className="mt-8">
             {activeTab === 'overview' && (
               <div className="space-y-8">
                 {/* About */}
@@ .. @@
               </div>
             )}

+            {activeTab === 'packages' && (
+              <div className="space-y-6">
+                <div>
+                  <h3 className="text-xl font-semibold text-content mb-2">Service Packages</h3>
+                  <p className="text-content/60">
+                    Choose from our specially designed service packages for the best value
+                  </p>
+                </div>
+                
+                <div className="grid gap-6 md:grid-cols-2">
+                  {packages.map((pkg) => (
+                    <ServicePackageCard
+                      key={pkg.id}
+                      package={pkg}
+                      onBook={() => {
+                        // TODO: Implement booking functionality
+                        alert('Booking functionality coming soon!');
+                      }}
+                    />
+                  ))}
+                </div>
+              </div>
+            )}
+
             {activeTab === 'reviews' && (
               <div className="text-center py-12">
                 <Star className="h-12 w-12 text-accent-text/40 mx-auto mb-4" />