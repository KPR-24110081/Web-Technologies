import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../lib/api.js';
import PostForm from '../components/PostForm.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

/**
 * Create - form for adding a new post. On success it navigates to the new post.
 */
export default function Create() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError(null);

    try {
      const data = await createPost(payload);
      navigate(`/post/${data.post.id}`);
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  }

  return (
    <div className="page page--narrow">
      <h1>Create a post</h1>
      <p className="page__sub">Save it as a draft or publish it straight away.</p>

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      <PostForm
        onSubmit={handleSubmit}
        submitting={submitting}
        fieldErrors={error?.details ?? {}}
        onCancel={() => navigate(-1)}
        submitLabel="Create post"
      />
    </div>
  );
}
