import { useState } from "react";
import api from "../../api";
import Navbar from "../partials/Navbar";

export default function AssessmentForm({ studentId, counselorId, appointmentId }) {
  const [formData, setFormData] = useState({
    emotionalState: "",
    behavior: "",
    notes: "",
    recommendations: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/assessments", { ...formData, studentId, counselorId, appointmentId });
      alert("Assessment saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save assessment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
    < Navbar />
    <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto bg-white rounded-lg shadow relative top-[8rem]">
      <h2 className="text-xl font-semibold mb-4">Student Assessment</h2>
      <input name="emotionalState" placeholder="Emotional State" className="border p-2 w-full mb-3" onChange={handleChange} required />
      <input name="behavior" placeholder="Behavior" className="border p-2 w-full mb-3" onChange={handleChange} />
      <textarea name="notes" placeholder="Notes" className="border p-2 w-full mb-3" onChange={handleChange}></textarea>
      <textarea name="recommendations" placeholder="Recommendations" className="border p-2 w-full mb-3" onChange={handleChange}></textarea>
      <button type="submit" disabled={loading} className="bg-teal-600 text-white px-4 py-2 rounded">
        {loading ? "Saving..." : "Save Assessment"}
      </button>
    </form>
    </div>
  );
}
