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
                  You must be at least 18 years old to use this Service. Users between 13-17 years old may use the Service only with parental consent and supervision. You are responsible for maintaining 
                  the security of your account and password.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="font-medium text-blue-800">Age Verification</span>
                  </div>
                  <p className="text-blue-800">
                    By creating an account, you represent and warrant that you meet the age requirements and have the legal capacity to enter into this agreement.
                  </p>
                </div>
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

            {/* Medical Disclaimer */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Medical and Wellness Disclaimer</h2>
              <div className="space-y-4 text-content/80">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="font-medium text-red-800">Important Medical Notice</span>
                  </div>
                  <p className="text-red-800 mb-2">
                    <strong>Mindful Family is not a medical service provider.</strong> The information, content, and services provided through our platform are for informational and educational purposes only.
                  </p>
                  <ul className="list-disc pl-6 text-red-800 space-y-1">
                    <li>Our platform does not provide medical advice, diagnosis, or treatment</li>
                    <li>Wellness services offered by practitioners are not a substitute for professional medical care</li>
                    <li>Always consult with qualified healthcare professionals for medical concerns</li>
                    <li>Do not delay seeking professional medical advice because of information on our platform</li>
                    <li>In case of medical emergency, contact emergency services immediately</li>
                  </ul>
                </div>
                <p>
                  Practitioners on our platform are independent service providers. We do not endorse, recommend, or guarantee the quality of services provided by any practitioner. Users are responsible for evaluating practitioners and their services.
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

            {/* Dispute Resolution */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Dispute Resolution</h2>
              <div className="space-y-4 text-content/80">
                <p>
                  Any disputes arising from these Terms or your use of the Service will be resolved through binding arbitration rather than in court, except that you may assert claims in small claims court if your claims qualify.
                </p>
                <h3 className="font-medium text-content">Arbitration Process</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Disputes will be resolved through individual arbitration, not class action</li>
                  <li>Arbitration will be conducted by a neutral arbitrator</li>
                  <li>You may opt out of arbitration within 30 days of account creation</li>
                  <li>Arbitration will be conducted in English</li>
                </ul>
              </div>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-xl font-semibold text-content mb-4">Governing Law</h2>
              <div className="space-y-4 text-content/80">
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the European Union and applicable national laws, without regard to conflict of law principles.
                </p>
                <p>
                  For users in the European Union, these Terms are subject to EU consumer protection laws and regulations.
                </p>
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
                <p>
                  For material changes, we will provide additional notice through email or prominent notice on our Service at least 30 days before the changes take effect.
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
                  Email: support@mindful.family<br />
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}