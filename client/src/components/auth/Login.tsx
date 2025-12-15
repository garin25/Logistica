import React, { useState } from 'react';
import { Truck, Lock, Mail, Loader2, User, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estados del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [nombreAgencia, setNombreAgencia] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isRegistering) {
        // --- FLUJO DE REGISTRO ---
        await api.register({ nombre, email, password, nombreAgencia });
        
        // 1. Mostrar éxito
        setSuccessMsg('¡Cuenta creada con éxito! Ingresa tus datos.');
        // 2. Limpiar campos sensibles
        setPassword('');
        // 3. Cambiar a vista de Login automáticamente
        setIsRegistering(false);
        
      } else {
        // --- FLUJO DE LOGIN ---
        const data = await api.login(email, password);
        
        localStorage.setItem('logistics_token', data.token);
        localStorage.setItem('logistics_user', JSON.stringify(data.user));
        
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      console.error(err);
      // Mostramos el mensaje exacto que viene del backend ("Usuario no encontrado", etc)
      setError(err.message || 'Ocurrió un error. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        <div className="bg-blue-600 p-8 text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4 text-white backdrop-blur-sm shadow-lg">
              <Truck size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">Logística App</h1>
            <p className="text-blue-100 text-sm mt-1">
              {isRegistering ? 'Crea tu cuenta de agencia' : 'Gestiona tus viajes'}
            </p>
          </div>
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-blue-500/20 rotate-12 rounded-full blur-3xl"></div>
        </div>

        <div className="p-8">
          
          {/* Mensaje de Éxito al Registrarse */}
          {successMsg && (
            <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg text-sm text-center font-bold border border-green-200 flex items-center justify-center gap-2 animate-pulse">
              <CheckCircle2 size={18} /> {successMsg}
            </div>
          )}

          {/* Mensaje de Error */}
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium border border-red-100 flex items-center justify-center gap-2">
              <AlertCircle size={18}/> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {isRegistering && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tu Nombre</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" required={isRegistering}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="Juan Pérez"
                      value={nombre} onChange={e => setNombre(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre Agencia</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" required={isRegistering}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="Transportes Rápidos S.A."
                      value={nombreAgencia} onChange={e => setNombreAgencia(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                  placeholder="admin@ejemplo.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password" required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Crear Cuenta' : 'Ingresar')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
                onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError('');
                    setSuccessMsg('');
                }}
                className="text-sm text-blue-600 font-bold hover:text-blue-700 hover:underline transition-all"
            >
                {isRegistering 
                    ? '¿Ya tienes cuenta? Inicia Sesión' 
                    : '¿No tienes cuenta? Regístrate Gratis'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}