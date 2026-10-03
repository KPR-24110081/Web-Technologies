import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deletePost, getPost, updatePost } from '../lib/api.js';
import { formatDate, formatRelative } from '../lib/format.js';
import PostForm from '../components/PostForm.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

/**
 * Post - view a single post, edit it, publish/unpublish it, or delete it.
 */
export default function Post() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  // Reload whenever the route id changes.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setStatus('loading');
      setEditing(false);
      setError(null);
      setNotice('');

      try {
        const data = await getPost(id);
        if (cancelled) return;

        setPost(data.post);
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
  }, [id]);

  async function handleUpdate(payload) {
    setSaving(true);
    setError(null);

    try {
      const data = await updatePost(id, payload);
      setPost(data.post);
      setEditing(false);
      setNotice('Post updated.');
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  /** Publish/unpublish without entering edit mode. */
  async function togglePublished() {
    setSaving(true);
    setError(null);

    try {
      const data = await updatePost(id, { published: !post.published });
      setPost(data.post);
      setNotice(post.published ? 'Moved back to drafts.' : 'Post published.');
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;

    setSaving(true);
    setError(null);

    try {
      await deletePost(id);
      navigate(post.published ? '/' : '/archive', { replace: true });
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  }

  // -- loading / not found -------------------------------------------------
  if (status === 'loading') {
    return <div className="page"><p className="muted">Loading post…</p></div>;
  }

  if (!post) {
    return (
      <div className="page page--narrow">
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
        <div className="empty">
          <h2>Post not found</h2>
          <p className="muted">
            It may have been deleted. <Link to="/">Back to Home →</Link>
          </p>
        </div>
      </div>
    );
  }

  // -- edit mode -----------------------------------------------------------
  if (editing) {
    return (
      <div className="page page--narrow">
        <h1>Edit post</h1>
        <ErrorBanner error={error} onDismiss={() => setError(null)} />

        <PostForm
          initialValues={post}
          onSubmit={handleUpdate}
          submitting={saving}
          fieldErrors={error?.details ?? {}}
          onCancel={() => setEditing(false)}
          submitLabel="Save changes"
        />
      </div>
    );
  }

  // -- read mode -----------------------------------------------------------
  return (
    <div className="page page--article">
      <nav className="crumbs">
        <Link to={post.published ? '/' : '/archive'}>
          {post.published ? '← All posts' : '← Archive'}
        </Link>
      </nav>

      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      {notice && <div className="banner banner--success">{notice}</div>}

      <article>
        <header className="article__head">
          <span className={`badge ${post.published ? 'badge--live' : 'badge--draft'}`}>
            {post.published ? 'Published' : 'Draft'}
          </span>

          <h1 className="article__title">{post.title}</h1>

          <p className="article__byline">
            by <strong>{post.author || 'Anonymous'}</strong> ·{' '}
            <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
            {post.updatedAt && post.updatedAt !== post.createdAt && (
              <> · edited {formatRelative(post.updatedAt)}</>
            )}
          </p>

          {post.tags?.length > 0 && (
            <ul className="tags">
              {post.tags.map((tag) => (
                <li key={tag} className="tag">
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </header>

        <div className="article__body">
          {post.content.split('\n').map((paragraph, index) =>
            paragraph.trim() ? <p key={index}>{paragraph}</p> : null,
          )}
        </div>
      </article>

      <footer className="article__actions">
        <button className="button button--primary" type="button" onClick={() => setEditing(true)} disabled={saving}>
          Edit
        </button>

        <button className="button" type="button" onClick={togglePublished} disabled={saving}>
          {post.published ? 'Move to drafts' : 'Publish'}
        </button>

        <button className="button button--danger" type="button" onClick={handleDelete} disabled={saving}>
          Delete
        </button>
      </footer>
    </div>
  );
}
