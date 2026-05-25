import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // This listens for the exchange of the hash token for a real session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        navigate('/dashboard'); // Redirect to dashboard upon successful verification
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return <div>Verifying your account...</div>;
}