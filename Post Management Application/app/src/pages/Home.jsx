import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPublishedPosts } from '../lib/api.js';
import PostSummary from '../components/PostSummary.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

/**
 * Home - lists every published post with a search box.
 */
export default function Home() {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // Debounce so each keystroke does not fire a request.
    const timer = setTimeout(async () => {
      setStatus('loading');
      try {
        const data = await listPublishedPosts({ q: search.trim(), limit: 50 });

        if (cancelled) return;
        setPosts(data.posts);
        setTotal(data.pagination.total);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setError(err);
        setStatus('ready');
      }
    }, search ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>Latest posts</h1>
          <p className="page__sub">
            {status === 'loading'
              ? 'Loading…'
              : `${total} published post${total === 1 ? '' : 's'}`}
          </p>
        </div>

        <input
          className="search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search posts…"
          aria-label="Search published posts"
        />
      </div>

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {status === 'loading' ? (
        <p className="muted">Loading posts…</p>
      ) : posts.length === 0 ? (
        <div className="empty">
          <h2>{search ? 'No matching posts' : 'No posts yet'}</h2>
          <p className="muted">
            {search ? (
              <>Try a different search term.</>
            ) : (
              <>
                Create your first post to get started. <Link to="/create">Write a post →</Link>
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="list">
          {posts.map((post) => (
            <PostSummary key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
