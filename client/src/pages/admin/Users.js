import React from 'react';
import UserManagement from '../../components/admin/UserManagement';

const Users = () => {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">User Management</h1>
          <p className="text-muted">Manage application users</p>
        </div>
      </div>
      
      <UserManagement />
    </>
  );
};

export default Users;
