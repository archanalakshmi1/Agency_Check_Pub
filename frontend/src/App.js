import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Welcome from "./pages/Welcome"
import Login from "./pages/Login"

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/welcome" element={<Welcome />}/>
          <Route path="/home" element={<Home />}/>
      </Routes>
    </Router>
  );
}

export default App;
