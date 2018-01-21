import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import '../assets/stylesheets/application.css';

class Header extends Component {
    render() {
        return (
            <header className="header">
            <div className="container">
                <Link to="/"><a href="#" className="logo" title="Just TweakiT!"></a></Link>
                {window.location.pathname !== '/confirm' ? <Link to="/confirm"><a href="#" className="button button_verify">TweakiT!</a></Link> : ''}
            </div>
            </header>
        );
    }
}

export default Header;
