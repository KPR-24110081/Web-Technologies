/**
 * Red banner for request errors. Renders nothing when there is no error.
 */
export default function ErrorBanner({ error, onDismiss }) {
  if (!error) return null;

  const details = error.details
    ? Object.entries(error.details).map(([field, message]) => `${field}: ${message}`)
    : [];

  return (
    <div className="banner banner--error" role="alert">
      <div className="banner__body">
        <strong>{error.message}</strong>
        {details.length > 0 && (
          <ul>
            {details.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>
      {onDismiss && (
        <button type="button" className="banner__close" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
