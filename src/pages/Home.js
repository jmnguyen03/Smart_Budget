import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container home">
      <h1>Smart Budget 🎓</h1>
      <p>Stop guessing. Start predicting.</p>
      <p>The first expense tracker designed for students that tells you when you'll run out of money.</p>
      
      <div className="actions">
        <Link to="/login"><button>Get Started</button></Link>
      </div>
    </div>
  );
}