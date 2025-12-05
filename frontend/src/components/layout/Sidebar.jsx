import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaHome, 
  FaSchool, 
  FaUserGraduate, 
  FaUser 
} from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  const menuItems = [
    { path: '/dashboard', icon: FaHome, label: 'Dashboard', roles: ['Admin', 'Principal', 'Teacher'] },
    { path: '/schools', icon: FaSchool, label: 'Schools', roles: ['Admin'] },
    { path: '/teachers', icon: FaUserGraduate, label: 'Teachers', roles: ['Admin', 'Principal'] },
    { path: '/profile', icon: FaUser, label: 'Profile', roles: ['Admin', 'Principal', 'Teacher'] },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <div className="bg-gray-800 text-white w-64 flex-shrink-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold">TMS</h1>
        <p className="text-gray-400 text-sm mt-1">Teacher Management</p>
      </div>
      
      <nav className="mt-6">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
                isActive ? 'bg-gray-700 text-white border-l-4 border-primary-500' : ''
              }`
            }
          >
            <item.icon className="mr-3" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;