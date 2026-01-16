import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // If backend works or not
    axios.get('http://localhost:5001/')
      .then(res => setMessage(res.data))
      .catch(err => setMessage("It couldn't connect the backend ❌"));
  }, []);

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h1>Job Tracker Client 🚀</h1>
      <p>Frontend Durumu: ✅ It works</p>
      <p>Backend Mesajı: <strong>{message}</strong></p>
    </div>
  );
}

export default App;