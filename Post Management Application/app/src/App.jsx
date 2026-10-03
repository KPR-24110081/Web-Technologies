import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import Home from './pages/Home.jsx';
import Create from './pages/Create.jsx';
import Post from './pages/Post.jsx';
import Archive from './pages/Archive.jsx';
import NotFound from './pages/NotFound.jsx';

/**
 * App shell: navigation plus the client-side routes.
 */
export default function App() {
  return (
    <>
      <NavBar />

      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/post/:id" element={<Post />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="footer">
        React · Express · MongoDB — full-stack REST demo
      </footer>
    </>
  );
}
