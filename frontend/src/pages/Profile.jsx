import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { format } from 'date-fns';

const Profile = () => {
  const { user, setShowChangePasswordModal } = useContext(AuthContext);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>

      <div className="card max-w-2xl">
        {/* Profile header with change password button */}
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="btn-secondary text-sm"
          >
            Change Password
          </button>
        </div>

        {/* Rest of profile content */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Name</label>
            <p className="font-medium text-gray-800">{user?.name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Email / Username</label>
            <p className="font-medium text-gray-800">{user?.email || user?.username}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Role</label>
            <p className="font-medium text-gray-800">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;