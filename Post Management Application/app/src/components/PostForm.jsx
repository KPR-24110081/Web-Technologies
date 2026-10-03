import { useState } from 'react';

/**
 * Controlled form used both to create a post and to edit an existing one.
 *
 * @param {object} props
 * @param {object} [props.initialValues] post to pre-fill (edit mode)
 * @param {Function} props.onSubmit     receives the cleaned payload
 * @param {boolean} props.submitting   disables inputs while the request runs
 * @param {Function} [props.onCancel]   shows a Cancel button when provided
 * @param {object} props.fieldErrors    per-field messages from the API
 */
export default function PostForm({
  initialValues,
  onSubmit,
  submitting = false,
  onCancel,
  fieldErrors = {},
  submitLabel = 'Save post',
}) {
  const [values, setValues] = useState({
    title: initialValues?.title ?? '',
    content: initialValues?.content ?? '',
    author: initialValues?.author === 'Anonymous' ? '' : (initialValues?.author ?? ''),
    tags: (initialValues?.tags ?? []).join(', '),
    published: Boolean(initialValues?.published),
  });

  /** Tracks which fields the user has already touched, to avoid premature errors. */
  const [touched, setTouched] = useState({});

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setValues((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleBlur(event) {
    setTouched((current) => ({ ...current, [event.target.name]: true }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    // Validate locally so obvious mistakes never reach the network.
    const errors = {
      title: values.title.trim() ? '' : 'Title is required.',
      content: values.content.trim() ? '' : 'Content is required.',
    };

    setTouched({ title: true, content: true });
    if (errors.title || errors.content) return;

    onSubmit({
      title: values.title.trim(),
      content: values.content.trim(),
      author: values.author.trim() || 'Anonymous',
      tags: values.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      published: values.published,
    });
  }

  /** Prefers a local error, falling back to the server's field error. */
  function errorFor(name) {
    if (touched[name]) {
      const local = values[name]?.trim?.() ? '' : `${name === 'content' ? 'Content' : 'Title'} is required.`;
      if (local) return local;
    }
    return fieldErrors[name] ?? '';
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <label className="field">
        <span className="field__label">Title</span>
        <input
          className="field__input"
          type="text"
          name="title"
          value={values.title}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={200}
          placeholder="A clear, descriptive title"
          disabled={submitting}
          aria-invalid={Boolean(errorFor('title'))}
        />
        {errorFor('title') && <span className="field__error">{errorFor('title')}</span>}
      </label>

      <label className="field">
        <span className="field__label">Author</span>
        <input
          className="field__input"
          type="text"
          name="author"
          value={values.author}
          onChange={handleChange}
          maxLength={120}
          placeholder="Anonymous"
          disabled={submitting}
        />
      </label>

      <label className="field">
        <span className="field__label">Content</span>
        <textarea
          className="field__input field__input--area"
          name="content"
          value={values.content}
          onChange={handleChange}
          onBlur={handleBlur}
          rows={12}
          placeholder="Write your post…"
          disabled={submitting}
          aria-invalid={Boolean(errorFor('content'))}
        />
        {errorFor('content') && <span className="field__error">{errorFor('content')}</span>}
      </label>

      <label className="field">
        <span className="field__label">Tags</span>
        <input
          className="field__input"
          type="text"
          name="tags"
          value={values.tags}
          onChange={handleChange}
          placeholder="react, express, mongodb"
          disabled={submitting}
        />
        <span className="field__hint">Separate tags with commas.</span>
      </label>

      <label className="field field--inline">
        <input
          type="checkbox"
          name="published"
          checked={values.published}
          onChange={handleChange}
          disabled={submitting}
        />
        <span>Published (untick to keep as a draft)</span>
      </label>

      <div className="form__actions">
        <button className="button button--primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>

        {onCancel && (
          <button className="button" type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
