import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const positions = [[23.7400, 86.4200]]; // Example: Jharia coal mine

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setFileUploaded(true);
        setShowMap(false); // reset map if new image uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle prediction
  const handlePredict = () => {
    setShowMap(true);
  };

  return (
    <div className="container">
      <div className="logos">
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount(count + 1)}>
          count is {count}
        </button>
      )}
    </div>
  );
}

export default App

