import React from 'react';
import { Cookie, Shield, Globe, Database, Clock, Settings } from 'lucide-react';
import { Meta } from '../components/Meta';

export function CookiePolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Meta 
        title="Cookie Policy | Mindful Family"
        description="Learn about how Mindful Family uses cookies and how you can control them."
      />

      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center mb-8">
          <Cookie className="h-8 w-8 text-accent-text mr-3" />
          <h1 className="text-3xl font-bold text-content">Cookie Policy</h1>
        </div>

        <div className="prose max-w-none">
          <p className="text-content/80 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-12">
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-accent-text" />
                What Are Cookies
              </h2>
              <p className="text-content/80">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
                They are widely used to make websites work more efficiently and provide a better user experience.
              </p>
            </section>

            {/* How We Use Cookies */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-accent-text" />
                How We Use Cookies
              </h2>
              <p className="text-content/80 mb-4">
                We use cookies for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-content/80 space-y-2">
                <li>To enable certain functions of the Service</li>
                <li>To provide analytics</li>
                <li>To store your preferences</li>
                <li>To enable advertisements delivery</li>
              </ul>
            </section>

            {/* Types of Cookies */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4 flex items-center">
                <Database className="h-5 w-5 mr-2 text-accent-text" />
                Types of Cookies We Use
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-content mb-2">Essential Cookies</h3>
                  <p className="text-content/80">
                    These cookies are necessary for the website to function and cannot be switched off in our systems.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-content mb-2">Performance Cookies</h3>
                  <p className="text-content/80">
                    These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-content mb-2">Functional Cookies</h3>
                  <p className="text-content/80">
                    These cookies enable the website to provide enhanced functionality and personalisation.
                  </p>
                </div>
              </div>
            </section>

            {/* Cookie Duration */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-accent-text" />
                How Long Do Cookies Last
              </h2>
              <div className="space-y-2 text-content/80">
                <p>Cookies on our website may be set with the following durations:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Session Cookies: These cookies are temporary and expire once you close your browser</li>
                  <li>Persistent Cookies: These cookies remain on your device for a set period or until you delete them</li>
                </ul>
              </div>
            </section>

            {/* Managing Cookies */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-accent-text" />
                Managing Cookies
              </h2>
              <div className="space-y-4 text-content/80">
                <p>
                  Most web browsers allow you to manage your cookie preferences. You can set your browser to refuse cookies, or delete certain cookies. Generally you have the following options:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Enable or disable cookies entirely</li>
                  <li>Delete specific cookies</li>
                  <li>Block cookies from particular sites</li>
                  <li>Block third-party cookies</li>
                  <li>Clear all cookies when you close your browser</li>
                </ul>
                <p className="mt-4">
                  Please note that if you choose to block cookies, some features of our website may not function correctly.
                </p>
              </div>
            </section>

            {/* Updates */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Changes to This Policy</h2>
              <p className="text-content/80">
                We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last updated" date at the top of this policy.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Contact Us</h2>
              <p className="text-content/80">
                If you have any questions about our Cookie Policy, please contact us at:
              </p>
              <div className="mt-4 bg-accent-base/10 rounded-lg p-4">
                <p className="text-content/80">
                  Email: support@mindful.family<br />
                  Address: [Your Business Address]
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}