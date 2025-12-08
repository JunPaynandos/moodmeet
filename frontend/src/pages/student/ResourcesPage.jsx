import React, { useState } from "react";
import Navbar from "../partials/Navbar";
import Breadcrumbs from "../partials/Breadcrumbs";

// Import your resource components
import StudentHandbook from "../resources/StudentHandbook";
import CourseSelectionGuide from "../resources/CourseSelectionGuide";
import AppointmentFAQ from "../resources/AppointmentFAQ";
import AcademicCalendar from "../resources/AcademicCalendar";
import MeetTheCounselors from "../resources/MeetTheCounselors";
import CounselingServicesOverview from "../resources/CounselingServicesOverview";

const ResourcesPage = () => {
  const [selectedResource, setSelectedResource] = useState(null);

  const studentResources = [
    {
      section: "Guides",
      items: [
        { title: "Student Handbook", component: <StudentHandbook /> },
        { title: "Course Selection Guide", component: <CourseSelectionGuide /> },
      ],
    },
    {
      section: "FAQs",
      items: [
        { title: "How to Book an Appointment", component: <AppointmentFAQ /> },
        { title: "Academic Calendar", component: <AcademicCalendar /> },
      ],
    },
    {
      section: "Counseling Info",
      items: [
        { title: "Meet the Counselors", component: <MeetTheCounselors /> },
        { title: "Counseling Services Overview", component: <CounselingServicesOverview /> },
      ],
    },
  ];

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="px-4 sm:px-6 lg:px-0 mt-12 mb-12">
          <div className="max-w-2xl pl-4 sm:pl-6 lg:pl-0 lg:-ml-8">
            <Breadcrumbs items={[{ label: "Resources" }]} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-teal-700 mb-8">📚 Student Resources</h1>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* LEFT PANEL */}
          <div className="lg:w-2/5 border-r border-gray-200 pr-6">
            {studentResources.map((resourceSection) => (
              <div key={resourceSection.section} className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  {resourceSection.section}
                </h2>
                <ul className="list-disc list-inside space-y-2">
                  {resourceSection.items.map((item) => (
                    <li key={item.title}>
                      <button
                        onClick={() => setSelectedResource(item)}
                        className={`text-left text-teal-600 hover:text-teal-800 underline ${
                          selectedResource?.title === item.title ? "font-semibold" : ""
                        }`}
                      >
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* RIGHT PANEL */}
          <div className="lg:w-3/5">
            {selectedResource ? (
              <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
                {selectedResource.component}
              </div>
            ) : (
              <div className="p-6 text-gray-500 italic">
                ← Click a resource on the left to view its content.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;
