import { useEffect, useState } from 'react';
import { listDraftPosts } from '../lib/api.js';
import PostSummary from '../components/PostSummary.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

/**
 * Archive - lists drafts (unpublished posts).
 *
 * A draft is a real post with `published: false`. Publishing one is a single
 * update from the post detail page, which moves it to Home.
 */
export default function Archive() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setStatus('loading');
      try {
        const data = await listDraftPosts({ limit: 50 });

        if (cancelled) return;
        setPosts(data.posts);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setError(err);
        setStatus('ready');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>Archive</h1>
          <p className="page__sub">
            {status === 'loading'
              ? 'Loading…'
              : `${posts.length} draft${posts.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {status === 'loading' ? (
        <p className="muted">Loading drafts…</p>
      ) : posts.length === 0 ? (
        <div className="empty">
          <h2>Nothing archived</h2>
          <p className="muted">Posts you save as drafts will appear here.</p>
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
