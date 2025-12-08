import React from "react";

const CourseSelectionGuide = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-teal-700">
        Course Selection Guide
      </h2>
      <p className="text-gray-700 leading-relaxed">
        Selecting the right courses is key to achieving your academic and career
        goals. This guide walks you through the process of choosing, scheduling,
        and managing your courses efficiently.
      </p>

      <section>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Step 1: Review Your Curriculum
        </h3>
        <p className="text-gray-700">
          Begin by reviewing your degree curriculum to understand the required
          and elective courses. Make sure you meet prerequisites before
          enrolling in advanced subjects.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Step 2: Check the Academic Calendar
        </h3>
        <p className="text-gray-700">
          Plan your semester by checking the official calendar for registration
          periods, deadlines, and holidays. Staying organized prevents late
          registration fees.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Step 3: Meet with Your Advisor
        </h3>
        <p className="text-gray-700">
          Schedule an appointment with your academic advisor. They can help
          ensure your chosen courses align with your graduation requirements and
          personal interests.
        </p>
      </section>

      <p className="text-gray-700">
        Need help? Visit{" "}
        <a
          href="https://example.com/advising"
          target="_blank"
          className="text-teal-600 hover:underline"
        >
          Academic Advising Services
        </a>{" "}
        for more info.
      </p>
    </div>
  );
};

export default CourseSelectionGuide;
