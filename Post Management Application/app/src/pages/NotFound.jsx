import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page page--narrow">
      <div className="empty">
        <h2>Page not found</h2>
        <p className="muted">
          That URL does not exist. <Link to="/">Back to Home →</Link>
        </p>
      </div>
    </div>
  );
}
