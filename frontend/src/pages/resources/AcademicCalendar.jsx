import React from "react";

const AcademicCalendar = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-teal-700">Academic Calendar</h2>
      <p className="text-gray-700 leading-relaxed">
        Stay on top of your academic schedule with the key dates and deadlines
        listed below. All students are encouraged to check this calendar
        regularly as changes may occur.
      </p>

      <table className="w-full border border-gray-300 text-gray-700">
        <thead className="bg-teal-50">
          <tr>
            <th className="border px-4 py-2 text-left">Event</th>
            <th className="border px-4 py-2 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-4 py-2">Spring Registration Opens</td>
            <td className="border px-4 py-2">Jan 5, 2025</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">Classes Begin</td>
            <td className="border px-4 py-2">Jan 20, 2025</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">Midterm Exams</td>
            <td className="border px-4 py-2">Mar 10–14, 2025</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">Final Exams</td>
            <td className="border px-4 py-2">May 5–9, 2025</td>
          </tr>
        </tbody>
      </table>

      <p className="text-gray-700">
        View the complete and updated version at{" "}
        <a
          href="https://example.com/calendar"
          target="_blank"
          className="text-teal-600 hover:underline"
        >
          example.com/calendar
        </a>
        .
      </p>
    </div>
  );
};

export default AcademicCalendar;
