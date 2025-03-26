import React from 'react';
import {NavLink, useLocation} from "react-router-dom";
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/home';
  return (
    <nav>
        <h1>Agency Check</h1>
            <ul>
                <li><NavLink to="/welcome">Home</NavLink></li>
                {isHomePage ? (
                <li><NavLink to="/login">Logout</NavLink></li>
                ) : (
                <li><NavLink to="/login">Login</NavLink></li>
                )}
            </ul>
        </nav>
);
};

export default Navbar;