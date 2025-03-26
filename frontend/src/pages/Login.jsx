import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

function Login() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate=useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/login', { password });
      setMessage(response.data.message);
      setIsError(false);
      setTimeout(() => {
        navigate('/home');
      }, 1000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Login failed');
      setIsError(true);
    }
  };

  return (
    <div className="login-container">
      <div className="form-box">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" value="Admin" readOnly className="readonly-input" />
          <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          <button type="submit">Login</button>
        </form>
        {message && (
          <p className={`login-message ${isError ? 'error' : 'success'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;
