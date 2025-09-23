@@ .. @@
                   <button
                     onClick={() => setShowUpgradeModal(true)}
                     className="hidden lg:inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90"
                   >
                     <Sparkles className="h-4 w-4 mr-2" />
-                    Upgrade to Pro
+                    Upgrade to Premium
                   </button>
                   {/* Mobile Upgrade Button */}
                   <button
                     onClick={() => setShowUpgradeModal(true)}
                     className="lg:hidden inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90"
                   >
                     <Sparkles className="h-4 w-4 mr-1" />
                     Upgrade
                   </button>