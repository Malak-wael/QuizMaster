import React from 'react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login'); // Assumes login route exists
  };

  return (
    <div>
      <h1>Student Dashboard</h1>
      {/* Other content */}
      <button onClick={logout}>Logout</button>
    </div>
  );
};
export default StudentDashboard;