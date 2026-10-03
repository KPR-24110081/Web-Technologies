import { Link } from 'react-router-dom';
import { formatDate, truncate } from '../lib/format.js';

/**
 * Card preview of a single post, used in the Home and Archive lists.
 */
export default function PostSummary({ post }) {
  const isDraft = !post.published;

  return (
    <article className={`summary${isDraft ? ' summary--draft' : ''}`}>
      <div className="summary__meta">
        <span className={`badge ${isDraft ? 'badge--draft' : 'badge--live'}`}>
          {isDraft ? 'Draft' : 'Published'}
        </span>
        <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
        <span className="summary__author">by {post.author || 'Anonymous'}</span>
      </div>

      <h2 className="summary__title">
        <Link to={`/post/${post.id}`}>{post.title}</Link>
      </h2>

      <p className="summary__excerpt">{truncate(post.content, 180)}</p>

      {post.tags?.length > 0 && (
        <ul className="tags">
          {post.tags.map((tag) => (
            <li key={tag} className="tag">
              {tag}
            </li>
          ))}
        </ul>
      )}

      <Link className="summary__link" to={`/post/${post.id}`}>
        Read post →
      </Link>
    </article>
  );
}
