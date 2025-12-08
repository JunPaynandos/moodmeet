import React from "react";

const StudentHandbook = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-teal-700">Student Handbook</h2>
      <p className="text-gray-700 leading-relaxed">
        Welcome to the official Student Handbook. This document provides you
        with essential information about university policies, academic
        regulations, and student life. It serves as your go-to guide throughout
        your academic journey.
      </p>

      <section>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Academic Policies
        </h3>
        <p className="text-gray-700 leading-relaxed">
          The university is committed to maintaining the highest standards of
          academic integrity. Plagiarism, cheating, and other forms of academic
          misconduct are strictly prohibited. Students are encouraged to review
          the Code of Conduct available in the online portal.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Student Responsibilities
        </h3>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Attend all classes and complete assignments on time.</li>
          <li>Respect faculty, staff, and fellow students.</li>
          <li>Maintain the integrity of campus facilities.</li>
          <li>Participate actively in campus programs.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Important Contacts
        </h3>
        <p className="text-gray-700">
          For more details, visit the Student Services Office or email{" "}
          <a
            href="mailto:student.affairs@example.com"
            className="text-teal-600 hover:underline"
          >
            student.affairs@example.com
          </a>
          .
        </p>
      </section>
    </div>
  );
};

export default StudentHandbook;
