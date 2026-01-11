// import React from "react";

// const MeetTheCounselors = () => {
//   const counselors = [
//     {
//       name: "Dr. Sarah Thompson",
//       specialty: "Career Guidance & Personal Development",
//       bio: "Dr. Thompson has over 10 years of experience helping students align their academic goals with their professional aspirations.",
//     },
//     {
//       name: "Mr. James Li",
//       specialty: "Academic Counseling",
//       bio: "James specializes in supporting students with time management, study skills, and academic planning.",
//     },
//     {
//       name: "Ms. Aisha Rivera",
//       specialty: "Mental Health & Wellness",
//       bio: "Aisha provides individual counseling for stress management, anxiety, and self-care techniques.",
//     },
//   ];

//   return (
//     <div className="space-y-8">
//       <h2 className="text-3xl font-bold text-teal-700">👩‍🏫 Meet the Counselors</h2>
//       <p className="text-gray-700 leading-relaxed">
//         Our counseling team is dedicated to supporting you academically and
//         personally. Each counselor specializes in different areas to help you
//         reach your full potential.
//       </p>

//       <div className="grid gap-6 sm:grid-cols-2">
//         {counselors.map((counselor) => (
//           <div
//             key={counselor.name}
//             className="p-5 border rounded-lg shadow-sm bg-white hover:shadow-md transition"
//           >
//             <h3 className="text-xl font-semibold text-teal-700 mb-1">
//               {counselor.name}
//             </h3>
//             <p className="text-sm text-gray-500 mb-2">{counselor.specialty}</p>
//             <p className="text-gray-700 text-sm leading-relaxed">
//               {counselor.bio}
//             </p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default MeetTheCounselors;

import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL, SOCKET_URL } from "../../config.js";

function MeetTheCounselors() {
  const [counselors, setCounselors] = useState([]);

  const fetchCounselors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/counselors`);
      console.log("Fetched counselors:", response.data);
      setCounselors(response.data.counselors || response.data || []);
    } catch (error) {
      console.error("Error fetching counselors:", error);
    }
  };

  useEffect(() => {
    fetchCounselors();
  }, []);

  // Static info for specialty + bio
  const staff = [
    {
      specialty: "Career Guidance & Personal Development",
      bio: "Mr. Alejo have 4 years of experience helping students align their academic goals with their professional aspirations.",
    },
    {
      specialty: "Academic Counseling",
      bio: "Mood specializes in supporting students with time management, study skills, and academic planning.",
    },
    // {
    //   specialty: "Mental Health & Wellness",
    //   bio: "Aisha provides individual counseling for stress management, anxiety, and self-care techniques.",
    // },
  ];

  // Merge backend counselor data with static staff info
  const mergedCounselors = counselors.map((counselor, index) => ({
    name: `${counselor.firstName} ${counselor.lastName}`,
    image: counselor.image,
    email: counselor.email,
    specialty: staff[index]?.specialty,
    bio: staff[index]?.bio,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Meet the Counselors</h1>
      <p className="text-gray-700 leading-relaxed mb-6">
        Our counseling team is dedicated to supporting you academically and
        personally. Each counselor specializes in different areas to help you
        reach your full potential.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {mergedCounselors.map((counselor, index) => (
          <div
            key={index}
            className="p-5 border rounded-lg shadow-sm bg-white hover:shadow-md transition"
          >
            {counselor.image && (
              <img
                src={counselor.image}
                alt={counselor.name}
                className="w-20 h-20 rounded-full mb-1 object-cover"
              />
            )}

            <h3 className="text-xl font-semibold text-teal-700 mb-1">
              {counselor.name}
            </h3>

            {counselor.email && (
              <p className="text-xs text-gray-500 mt-1 mb-3">{counselor.email}</p>
            )}

            {counselor.specialty && (
              <p className="text-sm text-gray-500 mb-2">{counselor.specialty}</p>
            )}

            {counselor.bio && (
              <p className="text-gray-700 text-sm leading-relaxed">{counselor.bio}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MeetTheCounselors;
