import React from 'react'
import {Link} from 'react-router-dom'
import './Navbar.css'
import '../../public/logo1.svg'

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className='link-holder'>
                <Link to="/"><button className="navbar-button">Home</button></Link>
                <Link to="/create"><button className="navbar-button">Create</button></Link>
                <Link to="/songs"><button className="navbar-button">My Songs</button></Link>
            </div>
            <div className='logo'>
                <img className='navbar-img' src = "logo1.svg"></img>
                <h2 className='logo-h2'>Quaver</h2>
            </div>
            
            
        </nav>
    )
}

export default Navbar