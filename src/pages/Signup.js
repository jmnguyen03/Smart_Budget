import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    // 1. Validation
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }
    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    try {
      setLoading(true);
      // 2. Supabase Sign Up
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // 3. Success! Redirect to Dashboard
      if (data.user) {
        navigate('/dashboard');
      }
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container center-content">
      <div className="card auth-card">
        <h2>Create Account 🚀</h2>
        <p className="subtitle">Join Smart Budget today.</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label>Email</label>
            <input 
              name="email" 
              type="email" 
              placeholder="student@university.edu" 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              name="password" 
              type="password" 
              placeholder="••••••" 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input 
              name="confirmPassword" 
              type="password" 
              placeholder="••••••" 
              onChange={handleChange} 
              required 
            />
          </div>

          <button type="submit" disabled={loading} className="primary-btn">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="switch-auth">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}