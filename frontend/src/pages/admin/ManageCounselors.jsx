import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/counselors";

export default function ManageCounselors() {
  const [counselors, setCounselors] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    contact: ""
  });

  const fetchCounselors = async () => {
    const res = await axios.get(API);
    setCounselors(res.data);
  };

  useEffect(() => {
    fetchCounselors();
  }, []);

  const createCounselor = async () => {
    await axios.post(API, formData);
    fetchCounselors();
  };

  const updateCounselor = async (id, updated) => {
    await axios.put(`${API}/${id}`, updated);
    fetchCounselors();
  };

  const deleteCounselor = async (id) => {
    await axios.delete(`${API}/${id}`);
    fetchCounselors();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Manage Counselors</h1>

      {/* Create Form */}
      <div className="bg-white p-6 rounded shadow w-full md:w-1/2">
        <h2 className="text-xl font-semibold mb-4">Add New Counselor</h2>

        <input
          type="text"
          placeholder="First Name"
          className="input mb-2"
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
        />
        <input
          type="text"
          placeholder="Last Name"
          className="input mb-2"
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          className="input mb-2"
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          className="input mb-2"
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <input
          type="text"
          placeholder="Contact Number"
          className="input mb-2"
          onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
        />

        <button
          className="bg-purple-600 text-white px-4 py-2 rounded mt-3"
          onClick={createCounselor}
        >
          Add Counselor
        </button>
      </div>

      {/* Counselor Table */}
      <div className="mt-10 bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Counselor List</h2>

        <table className="w-full table-auto border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 border">Name</th>
              <th className="p-3 border">Email</th>
              <th className="p-3 border">Contact</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>

          <tbody>
            {counselors.map((c) => (
              <tr key={c._id}>
                <td className="border p-3">{c.firstName} {c.lastName}</td>
                <td className="border p-3">{c.email}</td>
                <td className="border p-3">{c.contact}</td>
                <td className="border p-3 flex gap-2">

                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                    onClick={() => updateCounselor(c._id, { contact: "Updated Contact" })}
                  >
                    Edit
                  </button>

                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    onClick={() => deleteCounselor(c._id)}
                  >
                    Delete
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
}
