import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ChangePasswordModal from '../common/ChangePasswordModal';
import { AuthContext } from '../../context/AuthContext';

const Layout = () => {

  const { showChangePasswordModal, setShowChangePasswordModal, user } = useContext(AuthContext);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>

      {showChangePasswordModal && (
        <ChangePasswordModal
          isFirstLogin={user?.isFirstLogin}
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}
    </div>
  );
};

export default Layout;