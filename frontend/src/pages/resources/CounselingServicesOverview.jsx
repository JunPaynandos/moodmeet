import React from "react";

const CounselingServicesOverview = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-teal-700">
        Counseling Services Overview
      </h2>
      <p className="text-gray-700 leading-relaxed">
        The Counseling Center provides confidential support services for
        students facing academic, personal, or emotional challenges. Our goal is
        to help you thrive during your university journey.
      </p>

      <section>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Individual Counseling
        </h3>
        <p className="text-gray-700">
          One-on-one sessions with a professional counselor to discuss topics
          like stress, anxiety, academic difficulties, and personal concerns.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Group Workshops
        </h3>
        <p className="text-gray-700">
          Join our workshops on mindfulness, time management, and exam
          preparation. These sessions encourage peer connection and resilience.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Career Counseling
        </h3>
        <p className="text-gray-700">
          Receive personalized career advice, résumé reviews, and interview
          coaching to prepare for post-graduation success.
        </p>
      </section>

      <p className="text-gray-700">
        To schedule an appointment, visit{" "}
        <a
          href="https://example.com/counseling"
          target="_blank"
          className="text-teal-600 hover:underline"
        >
          example.com/counseling
        </a>{" "}
        or email{" "}
        <a
          href="mailto:counseling@example.com"
          className="text-teal-600 hover:underline"
        >
          counseling@example.com
        </a>
        .
      </p>
    </div>
  );
};

export default CounselingServicesOverview;
