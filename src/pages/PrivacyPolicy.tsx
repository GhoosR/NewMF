import React from 'react';
import { Shield, Lock, Database, UserCheck, Mail, AlertCircle } from 'lucide-react';
import { Meta } from '../components/Meta';

export function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Meta 
        title="Privacy Policy | Mindful Family"
        description="Learn how Mindful Family protects and handles your personal data in compliance with GDPR regulations."
      />

      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center mb-8">
          <Shield className="h-8 w-8 text-accent-text mr-3" />
          <h1 className="text-3xl font-bold text-content">Privacy Policy</h1>
        </div>

        <div className="prose max-w-none">
          <p className="text-content/80 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-12">
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-accent-text" />
                Introduction
              </h2>
              <p className="text-content/80">
                Mindful Family ("we", "our", or "us") is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, process, and store your personal information when you use our platform at mindfulfamily.co (the "Service").
              </p>
            </section>

            {/* Data Collection */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4 flex items-center">
                <Database className="h-5 w-5 mr-2 text-accent-text" />
                Information We Collect
              </h2>
              <div className="space-y-4">
                <h3 className="font-medium text-content">Personal Information</h3>
                <ul className="list-disc pl-6 text-content/80 space-y-2">
                  <li>Account information (name, email, username)</li>
                  <li>Profile information (avatar, bio, professional credentials)</li>
                  <li>Contact details for practitioners and venue owners</li>
                  <li>Payment information (processed securely through Stripe)</li>
                  <li>Content you create (posts, comments, recipes, courses)</li>
                  <li>Communications through our messaging system</li>
                </ul>

                <h3 className="font-medium text-content">Automatically Collected Information</h3>
                <ul className="list-disc pl-6 text-content/80 space-y-2">
                  <li>Device information (IP address, browser type, device type)</li>
                  <li>Usage data (pages visited, actions taken, time spent)</li>
                  <li>Location data (country, region - with your consent)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </section>

            {/* Use of Data */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4 flex items-center">
                <UserCheck className="h-5 w-5 mr-2 text-accent-text" />
                How We Use Your Information
              </h2>
              <p className="text-content/80 mb-4">We use your personal data for the following purposes:</p>
              <ul className="list-disc pl-6 text-content/80 space-y-2">
                <li>Providing and maintaining our Service</li>
                <li>Processing your transactions and bookings</li>
                <li>Verifying practitioner credentials and certifications</li>
                <li>Facilitating communication between users</li>
                <li>Sending service-related notifications</li>
                <li>Improving and personalizing our Service</li>
                <li>Ensuring platform safety and security</li>
                <li>Complying with legal obligations</li>
              </ul>
            </section>

            {/* Legal Basis */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Legal Basis for Processing</h2>
              <p className="text-content/80 mb-4">We process your personal data under the following legal bases:</p>
              <ul className="list-disc pl-6 text-content/80 space-y-2">
                <li><strong>Contract:</strong> Processing necessary for the performance of our contract with you</li>
                <li><strong>Consent:</strong> Processing based on your explicit consent</li>
                <li><strong>Legal Obligations:</strong> Processing required to comply with our legal obligations</li>
                <li><strong>Legitimate Interests:</strong> Processing necessary for our legitimate business interests</li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Data Sharing and Third Parties</h2>
              <p className="text-content/80 mb-4">We share your information with:</p>
              <ul className="list-disc pl-6 text-content/80 space-y-2">
                <li>Stripe - for payment processing</li>
                <li>Supabase - for database and authentication services</li>
                <li>Other users - when you interact through our platform</li>
                <li>Service providers - for hosting, analytics, and support</li>
              </ul>
              <p className="text-content/80 mt-4">
                We ensure all third-party service providers comply with GDPR and maintain appropriate security measures.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Data Retention</h2>
              <p className="text-content/80">
                We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy. When you delete your account, we will delete or anonymize your personal data within 30 days, except where we are legally required to retain certain information.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Your Data Protection Rights</h2>
              <p className="text-content/80 mb-4">Under GDPR, you have the following rights:</p>
              <ul className="list-disc pl-6 text-content/80 space-y-2">
                <li>Right to access your personal data</li>
                <li>Right to rectify inaccurate personal data</li>
                <li>Right to erasure ("right to be forgotten")</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
                <li>Right to withdraw consent</li>
              </ul>
            </section>

            {/* Security */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Security Measures</h2>
              <p className="text-content/80">
                We implement appropriate technical and organizational measures to protect your personal data, including:
              </p>
              <ul className="list-disc pl-6 text-content/80 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Staff training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Children's Privacy Protection</h2>
              <div className="space-y-4 text-content/80">
                <p>
                  Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="font-medium text-blue-800">COPPA Compliance</span>
                  </div>
                  <p className="text-blue-800">
                    We comply with the Children's Online Privacy Protection Act (COPPA) and do not knowingly collect personal information from children under 13 without verifiable parental consent.
                  </p>
                </div>
                <p>
                  Users between 13-17 years old may use our Service with parental consent and supervision. Parents can contact us to review, modify, or delete their child's personal information.
                </p>
              </div>
            </section>

            {/* Data Breach Notification */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Data Breach Notification</h2>
              <div className="space-y-4 text-content/80">
                <p>
                  In the event of a data breach that may result in a high risk to your rights and freedoms, we will notify you and the relevant supervisory authority within 72 hours of becoming aware of the breach, as required by GDPR.
                </p>
                <h3 className="font-medium text-content">Notification Process</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We will notify affected users via email within 72 hours</li>
                  <li>We will provide clear information about the nature of the breach</li>
                  <li>We will explain the likely consequences and measures taken</li>
                  <li>We will provide contact information for further inquiries</li>
                </ul>
              </div>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">International Data Transfers</h2>
              <p className="text-content/80">
                Your data may be transferred to and processed in countries outside the European Economic Area (EEA). We ensure appropriate safeguards are in place through Standard Contractual Clauses and adequacy decisions.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-accent-text" />
                Contact Us & Data Protection Officer
              </h2>
              <p className="text-content/80 mb-4">
                For any questions about this Privacy Policy or to exercise your rights, please contact our Data Protection Officer at:
              </p>
              <div className="mt-4 bg-accent-base/10 rounded-lg p-4">
                <p className="text-content/80">
                  <strong>Data Protection Officer:</strong><br />
                  Email: privacy@mindful.family<br />
                  General Support: support@mindful.family<br />
                  Address: [Your Business Address]<br />
                  Response Time: We will respond to all inquiries within 30 days
                </p>
              </div>
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium text-green-800">Supervisory Authority</span>
                </div>
                <p className="text-green-800">
                  You have the right to lodge a complaint with your local data protection supervisory authority if you believe we have not handled your personal data in accordance with applicable data protection laws.
                </p>
              </div>
            </section>

            {/* Updates */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-accent-text" />
                Changes to This Policy
              </h2>
              <p className="text-content/80">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this page. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}