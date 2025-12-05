import React, { useContext } from 'react';
import { FaBell, FaSignOutAlt } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Welcome, {user?.name || user?.username}
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
            {user?.role}
          </span>
          
          <button className="p-2 text-gray-600 hover:text-gray-800 relative">
            <FaBell className="text-xl" />
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </button>
          
          <button
            onClick={logout}
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaSignOutAlt className="mr-2" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;