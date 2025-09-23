import React from 'react';
import { Shield, Lock, Scale, AlertCircle, FileText, Mail } from 'lucide-react';
import { Meta } from '../components/Meta';

export function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Meta 
        title="Terms of Service | Mindful Family"
        description="Read our Terms of Service to understand your rights and responsibilities when using Mindful Family's wellness platform."
      />

      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center mb-8">
          <Scale className="h-8 w-8 text-accent-text mr-3" />
          <h1 className="text-3xl font-bold text-content">Terms of Service</h1>
        </div>

        <div className="prose max-w-none">
          <p className="text-content/80 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-12">
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-accent-text" />
                Introduction
              </h2>
              <p className="text-content/80">
                Welcome to Mindful Family. By accessing or using our platform at mindfulfamily.co (the "Service"), 
                you agree to be bound by these Terms of Service. Please read these terms carefully before using our Service.
              </p>
            </section>

            {/* Definitions */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Definitions</h2>
              <ul className="list-disc pl-6 text-content/80 space-y-2">
                <li><strong>"Service"</strong> refers to the Mindful Family platform</li>
                <li><strong>"Users"</strong> includes all individuals who access or use our Service</li>
                <li><strong>"Practitioners"</strong> refers to wellness professionals who offer services through our platform</li>
                <li><strong>"Content"</strong> includes text, images, videos, and other materials posted on our Service</li>
                <li><strong>"Professional Members"</strong> refers to users with an active professional subscription</li>
              </ul>
            </section>

            {/* Account Terms */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Account Terms</h2>
              <div className="space-y-4 text-content/80">
                <p>
                  You must be at least 18 years old to use this Service. You are responsible for maintaining 
                  the security of your account and password.
                </p>
                <h3 className="font-medium text-content">Professional Membership</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Professional membership requires a valid subscription</li>
                  <li>Professional members can create listings, host events, and offer services</li>
                  <li>Professional status may require verification of credentials</li>
                  <li>Subscription can be cancelled at any time</li>
                </ul>
              </div>
            </section>

            {/* Content Guidelines */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Content Guidelines</h2>
              <div className="space-y-4 text-content/80">
                <p>All content posted to the Service must:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Be accurate and not misleading</li>
                  <li>Respect intellectual property rights</li>
                  <li>Not contain harmful or malicious content</li>
                  <li>Not promote unauthorized medical claims</li>
                  <li>Comply with all applicable laws and regulations</li>
                </ul>
              </div>
            </section>

            {/* Practitioner Obligations */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Practitioner Obligations</h2>
              <div className="space-y-4 text-content/80">
                <p>Practitioners using our platform must:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Maintain valid certifications and qualifications</li>
                  <li>Provide accurate information about services and pricing</li>
                  <li>Maintain appropriate insurance coverage</li>
                  <li>Respond to client inquiries in a timely manner</li>
                  <li>Comply with professional standards and ethics</li>
                </ul>
              </div>
            </section>

            {/* Payments and Fees */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Payments and Fees</h2>
              <div className="space-y-4 text-content/80">
                <p>
                  Professional membership and certain features require payment. All payments are processed 
                  securely through Stripe.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Professional membership is billed monthly or annually</li>
                  <li>Payments are non-refundable unless required by law</li>
                  <li>Currency is displayed in EUR unless otherwise specified</li>
                  <li>Users are responsible for applicable taxes</li>
                </ul>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Intellectual Property</h2>
              <div className="space-y-4 text-content/80">
                <p>
                  The Service and its original content (excluding content provided by users) remain the property 
                  of Mindful Family. Users retain ownership of their content but grant us a license to use it 
                  on the platform.
                </p>
              </div>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Termination</h2>
              <div className="space-y-4 text-content/80">
                <p>
                  We reserve the right to terminate or suspend access to our Service immediately, without prior 
                  notice, for conduct that we believe violates these Terms of Service or is harmful to other 
                  users, our platform, or third parties, or for any other reason at our sole discretion.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Limitation of Liability</h2>
              <div className="space-y-4 text-content/80">
                <p>
                  Mindful Family shall not be liable for any indirect, incidental, special, consequential, or 
                  punitive damages resulting from your use or inability to use the Service.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                    <span className="font-medium text-amber-800">Important Notice</span>
                  </div>
                  <p className="text-amber-800">
                    We do not verify all claims or credentials of practitioners. Users are responsible for 
                    verifying the qualifications of any practitioner they choose to work with.
                  </p>
                </div>
              </div>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Changes to Terms</h2>
              <div className="space-y-4 text-content/80">
                <p>
                  We reserve the right to modify or replace these terms at any time. We will provide notice 
                  of any changes by posting the new Terms of Service on this page and updating the "Last updated" 
                  date.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-accent-text" />
                Contact Us
              </h2>
              <p className="text-content/80">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="mt-4 bg-accent-base/10 rounded-lg p-4">
                <p className="text-content/80">
                  Email: legal@mindfulfamily.co<br />
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