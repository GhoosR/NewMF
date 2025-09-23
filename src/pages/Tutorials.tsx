import React from 'react';
import { ListPlus, Users, Calendar, Building2, Leaf, FileCheck, UserPlus, ClipboardList, Map, MessageSquare, Video, CheckCircle, ArrowRight, Sprout, Plane as Plant, Tractor, Bell, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Meta } from '../components/Meta';

export function Tutorials() {
  const tutorials = [
    {
      title: "Creating Your First Listing",
      icon: ListPlus,
      sections: [
        {
          title: "Practitioner Listing",
          steps: [
            "Click the 'Add Listing' button in the navigation",
            "Select 'Practitioner' as your listing type",
            "Fill in your professional details and credentials",
            "Add photos and certification documents",
            "Submit for review - approval usually takes 24-48 hours"
          ]
        },
        {
          title: "Event Listing",
          steps: [
            "Choose 'Event' from the listing options",
            "Enter event details, date, time, and location",
            "Set ticket prices and capacity if applicable",
            "Add event images and description",
            "Publish your event to reach attendees"
          ]
        },
        {
          title: "Venue Listing",
          steps: [
            "Select 'Venue' as your listing type",
            "Provide venue details and amenities",
            "Upload high-quality venue photos",
            "Set availability and pricing",
            "Submit for review and approval"
          ]
        }
      ]
    },
    {
      title: "Using the Agriculture Tool",
      icon: Tractor,
      sections: [
        {
          title: "Setting Up Your Field",
          steps: [
            "Navigate to the Agriculture section",
            "Click 'Create Field' to start",
            "Enter field name and location details",
            "Invite team members for collaboration",
            "Set up your first growing area"
          ]
        },
        {
          title: "Managing Tasks",
          steps: [
            "Use the calendar view to schedule tasks",
            "Add planting, watering, or harvesting tasks",
            "Assign tasks to team members",
            "Track task completion status",
            "Get notifications for upcoming tasks"
          ]
        },
        {
          title: "Team Collaboration",
          steps: [
            "Invite members using email or username",
            "Set member permissions and roles",
            "Share updates and notes",
            "Coordinate activities through the calendar",
            "Track team progress and contributions"
          ]
        },
        {
          title: "Using Plant Information",
          steps: [
            "Access the plant database",
            "Learn about growing conditions",
            "View planting and harvesting times",
            "Check companion planting guides",
            "Get crop-specific care instructions"
          ]
        }
      ]
    },
    {
      title: "Community Features",
      icon: Users,
      sections: [
        {
          title: "Creating a Community",
          steps: [
            "Click 'Create Community' in Communities section",
            "Choose between public or private community",
            "Set up community details and guidelines",
            "Add a description and profile image",
            "Start inviting members"
          ]
        },
        {
          title: "Managing Members",
          steps: [
            "Review and approve join requests",
            "Assign moderator roles",
            "Set up community guidelines",
            "Monitor member activity",
            "Handle member communications"
          ]
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F3F7EE] to-white">
      <Meta 
        title="Platform Tutorials | Mindful Family"
        description="Learn how to use Mindful Family's features with our comprehensive tutorials. Step-by-step guides for creating listings, managing fields, and more."
      />

      {/* Hero Section */}
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl lg:text-5xl font-gelica text-content leading-tight mb-6">
            How to Use Mindful Family
          </h1>
          <p className="text-xl text-content/70 max-w-3xl mx-auto">
            Step-by-step guides to help you make the most of our platform. Learn how to create listings,
            manage agricultural projects, and build your wellness community.
          </p>
        </div>
      </div>

      {/* Tutorials Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-16">
          {tutorials.map((tutorial, index) => {
            const Icon = tutorial.icon;
            return (
              <div 
                key={index}
                className="bg-white rounded-xl p-8 shadow-sm"
              >
                <div className="flex items-center mb-8">
                  <div className="p-3 bg-accent-base/10 rounded-lg">
                    <Icon className="h-8 w-8 text-accent-text" />
                  </div>
                  <h2 className="text-2xl font-semibold text-content ml-4">
                    {tutorial.title}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {tutorial.sections.map((section, sIndex) => (
                    <div 
                      key={sIndex}
                      className="bg-accent-base/5 rounded-xl p-6"
                    >
                      <h3 className="font-medium text-content mb-4">
                        {section.title}
                      </h3>
                      <ol className="space-y-3">
                        {section.steps.map((step, stepIndex) => (
                          <li 
                            key={stepIndex}
                            className="flex items-start text-content/70"
                          >
                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-accent-text/10 text-accent-text text-sm mr-3">
                              {stepIndex + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-gelica font-bold text-content mb-4">
              Need More Help?
            </h2>
            <p className="text-lg text-content/70">
              Our support team is here to help you get the most out of Mindful Family
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-accent-base/5 rounded-xl p-8">
              <MessageSquare className="h-8 w-8 text-accent-text mb-4" />
              <h3 className="text-xl font-semibold text-content mb-2">
                Community Support
              </h3>
              <p className="text-content/70">
                Join our community discussions to get help from other members and share your experiences.
              </p>
            </div>

            <div className="bg-accent-base/5 rounded-xl p-8">
              <Video className="h-8 w-8 text-accent-text mb-4" />
              <h3 className="text-xl font-semibold text-content mb-2">
                Video Guides
              </h3>
              <p className="text-content/70">
                Watch our detailed video tutorials for visual step-by-step instructions on using platform features.
              </p>
            </div>

            <div className="bg-accent-base/5 rounded-xl p-8">
              <Bell className="h-8 w-8 text-accent-text mb-4" />
              <h3 className="text-xl font-semibold text-content mb-2">
                Support Team
              </h3>
              <p className="text-content/70">
                Contact our dedicated support team for personalized assistance with any questions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-b from-white to-[#F3F7EE]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-gelica font-bold text-content mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-content/70 mb-8">
            Join Mindful Family today and put these tutorials into practice.
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('show-auth'))}
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-accent-text hover:bg-accent-text/90 transition-colors"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}