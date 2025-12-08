import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { useEffect } from "react";
import axios from "axios";
import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }


function App() {
  useEffect(() => {
    axios
      .get("http://localhost:5000/")
      .then((res) => console.log("✅ Backend says:", res.data))
      .catch((err) => console.error("❌ Error connecting backend:", err));
  }, []);

  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold text-blue-600">
        University Student Wellness System
      </h1>
      <p className="mt-4 text-gray-700">
        Open your browser console (F12) to see connection result.
      </p>
    </div>
  );
}


export default App
