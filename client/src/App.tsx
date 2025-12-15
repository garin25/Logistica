import React, { useEffect, useState } from 'react';
import LogisticsApp from './components/LogisticsApp';
import Login from './components/auth/Login';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('logistics_user');
    const storedToken = localStorage.getItem('logistics_token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    if (window.confirm('¿Desea cerrar sesión?')) {
      localStorage.removeItem('logistics_user');
      localStorage.removeItem('logistics_token');
      setUser(null);
    }
  };

  if (loading) return null;

  if (!user) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <>
      <LogisticsApp onLogout={handleLogout} />
    </>
  );
}

export default App;