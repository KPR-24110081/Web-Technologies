import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/create', label: 'Create' },
  { to: '/archive', label: 'Archive' },
];

/**
 * Top navigation shared by every page.
 */
export default function NavBar() {
  return (
    <header className="nav">
      <div className="nav__inner">
        <NavLink className="nav__brand" to="/">
          Post<span>Management</span>
        </NavLink>

        <nav className="nav__links" aria-label="Main">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav__link${isActive ? ' nav__link--active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
