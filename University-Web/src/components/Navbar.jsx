// Import useState to manage the dropdown menu state
import { useState } from "react";

// Import Link for navigation without reloading the webpage
import { Link } from "react-router-dom";


// Reusable MenuItem component
// Props are used to receive the menu item information
function MenuItem({ item }) {

  // Stores whether the dropdown is currently open
  const [open, setOpen] = useState(false);


  // Handle dropdown click
  const handleClick = () => {
    setOpen(!open);
  };


  return (
    <li className="menu-item">

      {/* 
        If the menu has children, display it as a dropdown.
        Otherwise, display it as a normal navigation link.
      */}

      {item.children ? (

        <>

          {/* Main menu button */}
          <button
            className="menu-button"
            onClick={handleClick}
          >
            {item.label}

            {/* Display arrow when the menu contains dropdown items */}
            <span>
              {open ? "▲" : "▼"}
            </span>

          </button>


          {/* 
            Display dropdown items only when
            the dropdown state is true
          */}
          {open && (

            <ul className="dropdown">

              {item.children.map((child) => (

                <li key={child.path}>

                  {/* 
                    Link changes the URL and displays
                    the corresponding React component.
                  */}
                  <Link
                    to={child.path}
                    onClick={() => setOpen(false)}
                  >
                    {child.label}
                  </Link>

                </li>

              ))}

            </ul>

          )}

        </>

      ) : (

        // Normal menu item without dropdown
        <Link to={item.path}>
          {item.label}
        </Link>

      )}

    </li>
  );
}



// Main Navbar component
export default function Navbar() {

  /*
    Menu data is stored in an array.

    Each object represents one main navigation item.

    The children property contains dropdown items.
  */
  const menuItems = [

    {
      label: "About Us",
      path: "/about"
    },


    {
      label: "Academics",
      path: "/academics",

      children: [

        {
          label: "Programs",
          path: "/academics/programs"
        },

        {
          label: "Departments",
          path: "/academics/departments"
        }

      ]
    },


    {
      label: "Admissions",
      path: "/admissions",

      children: [

        {
          label: "Apply Now",
          path: "/admissions/apply"
        },

        {
          label: "Eligibility",
          path: "/admissions/eligibility"
        }

      ]
    },


    {
      label: "Research",
      path: "/research"
    },


    {
      label: "Campus Life",
      path: "/campus-life",

      children: [

        {
          label: "Hostels",
          path: "/campus-life/hostels"
        },

        {
          label: "Clubs & Activities",
          path: "/campus-life/clubs"
        }

      ]
    },


    {
      label: "Placements",
      path: "/placements",

      children: [

        {
          label: "Placement Overview",
          path: "/placements"
        },

        {
          label: "Recruiters",
          path: "/placements/recruiters"
        }

      ]
    },


    {
      label: "Contact Us",
      path: "/contact"
    }

  ];


  return (

    <nav className="navbar">

      {/* University website title/logo */}
      <h2 className="logo">
        University Portal
      </h2>


      {/* Main navigation menu */}
      <ul className="nav-menu">

        {/*
          map() creates a MenuItem component
          for every item in the menuItems array.

          The item object is passed as a prop.
        */}
        {menuItems.map((item) => (

          <MenuItem
            key={item.label}
            item={item}
          />

        ))}

      </ul>

    </nav>
  );
}