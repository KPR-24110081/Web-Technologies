// Import React Router components used for navigation
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

// Import the navigation bar component
import Navbar from "./components/Navbar";

// Import page components
import Home from "./pages/Home";
import About from "./pages/About";
import Academics from "./pages/Academics";
import Programs from "./pages/Programs";
import Departments from "./pages/Departments";
import Admissions from "./pages/Admissions";
import Apply from "./pages/Apply";
import Eligibility from "./pages/Eligibility";
import Research from "./pages/Research";
import CampusLife from "./pages/CampusLife";
import Hostels from "./pages/Hostels";
import Clubs from "./pages/Clubs";
import Placements from "./pages/Placements";
import Recruiters from "./pages/Recruiters";
import Contact from "./pages/Contact";


// Main React component
export default function App() {

  return (

    // BrowserRouter enables client-side routing
    <BrowserRouter>

      {/* Navigation bar appears on every page */}
      <Navbar />

      {/* Define all application routes */}
      <Routes>

        {/* Home Page */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* About Us */}
        <Route
          path="/about"
          element={<About />}
        />


        {/* Academics */}
        <Route
          path="/academics"
          element={<Academics />}
        />

        <Route
          path="/academics/programs"
          element={<Programs />}
        />

        <Route
          path="/academics/departments"
          element={<Departments />}
        />


        {/* Admissions */}
        <Route
          path="/admissions"
          element={<Admissions />}
        />

        <Route
          path="/admissions/apply"
          element={<Apply />}
        />

        <Route
          path="/admissions/eligibility"
          element={<Eligibility />}
        />


        {/* Research */}
        <Route
          path="/research"
          element={<Research />}
        />


        {/* Campus Life */}
        <Route
          path="/campus-life"
          element={<CampusLife />}
        />

        <Route
          path="/campus-life/hostels"
          element={<Hostels />}
        />

        <Route
          path="/campus-life/clubs"
          element={<Clubs />}
        />


        {/* Placements */}
        <Route
          path="/placements"
          element={<Placements />}
        />

        <Route
          path="/placements/recruiters"
          element={<Recruiters />}
        />


        {/* Contact Us */}
        <Route
          path="/contact"
          element={<Contact />}
        />

      </Routes>

    </BrowserRouter>
  );
}