/**
 * Visual, color-coded breakdown of a parsed URL.
 * Each "segment" of the URL maps to a WHATWG URL component.
 */
export default function UrlBreakdown({ components }) {
  if (!components) return null;

  return (
    <div className="url-slab" aria-label="URL structure breakdown">
      {components.protocol && (
        <span className="seg protocol">
          <span className="seg-label">protocol</span>
          {components.protocol}
        </span>
      )}
      {components.hostname && (
        <span className="seg host">
          <span className="seg-label">hostname</span>
          {components.hostname}
        </span>
      )}
      {components.port && (
        <span className="seg port">
          <span className="seg-label">port</span>
          :{components.port}
        </span>
      )}
      {components.pathname && (
        <span className="seg path">
          <span className="seg-label">pathname</span>
          {components.pathname}
        </span>
      )}
      {components.search && (
        <span className="seg query">
          <span className="seg-label">query</span>
          {components.search}
        </span>
      )}
      {components.hash && (
        <span className="seg hash">
          <span className="seg-label">hash</span>
          {components.hash}
        </span>
      )}
    </div>
  );
}