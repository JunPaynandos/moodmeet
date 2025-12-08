import React from "react";

const AppointmentFAQ = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-teal-700">
        How to Book an Appointment
      </h2>
      <p className="text-gray-700 leading-relaxed">
        Booking an appointment with a counselor or advisor is quick and easy.
        Follow these steps to reserve your slot and prepare for your meeting.
      </p>

      <section>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Step-by-Step Guide
        </h3>
        <ol className="list-decimal list-inside text-gray-700 space-y-1">
          <li>Log in to your student portal.</li>
          <li>Click “Counseling Appointments” under Student Services.</li>
          <li>Select your preferred counselor and available time.</li>
          <li>Confirm your booking and check your email for a confirmation.</li>
        </ol>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Frequently Asked Questions
        </h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          {/* <li>
            <strong>Can I reschedule?</strong> — Yes, up to 24 hours before your
            appointment.
          </li> */}
          <li>
            <strong>Is it free?</strong> — All counseling services are free for
            registered students.
          </li>
          <li>
            <strong>Do I need to bring anything?</strong> — Bring your student
            ID and any documents related to your concern.
          </li>
        </ul>
      </section>
    </div>
  );
};

export default AppointmentFAQ;
