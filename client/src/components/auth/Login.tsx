import React, { useState } from 'react';
import { Truck, Lock, Mail, Loader2, User, Building2, AlertCircle,Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from "sonner";

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estado para visibilidad de contraseña
  const [showPassword, setShowPassword] = useState(false);

  // Estados del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacionPassword, setConfirmacionPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [nombreAgencia, setNombreAgencia] = useState('');

  // Función de Validación Manual
  const validateForm = () => {
    // 1. Validar Email con Regex simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, ingresa un email válido.');
      return false;
    }

    // 2. Validar longitud de contraseña
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return false;
    }

    // 3. Validaciones exclusivas de Registro
    if (isRegistering) {
      if (!nombre.trim()) {
        setError('El nombre es obligatorio.');
        return false;
      }
      if (!nombreAgencia.trim()) {
        setError('El nombre de la agencia es obligatorio.');
        return false;
      }
      if (password !== confirmacionPassword) {
        setError('Las contraseñas no coinciden.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ejecutar validación antes de llamar a la API
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isRegistering) {
        // --- FLUJO DE REGISTRO ---
        await api.register({ nombre, email, password, nombreAgencia });


        toast.success("¡Cuenta creada! Por favor inicia sesión.");
        // Limpiar campos y cambiar a login
        setError('');
        setPassword('');
        setConfirmacionPassword('');
        setIsRegistering(false);

      } else {
        // --- FLUJO DE LOGIN ---
        const data = await api.login(email, password);
        localStorage.setItem('logistics_token', data.token);
        localStorage.setItem('logistics_user', JSON.stringify(data.user));
        toast.success(`Bienvenido de nuevo`);
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error. Intenta nuevamente.');
      toast.error(err.message || "Ocurrió un error inesperado");
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
  
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium border border-red-100 flex items-center justify-center gap-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tu Nombre</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
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
                      type="text"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
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
                  type="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                  placeholder="admin@ejemplo.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Input Password Principal */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"} // Aquí cambia el tipo
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                />
                {/* Botón Ojo */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Input Confirmar Password (Separado para que no rompa el diseño) */}
            {isRegistering && (
              <div className="space-y-1 animate-in slide-in-from-top-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Confirmar Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"} // Usa el mismo estado de visibilidad o crea otro
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                    placeholder="••••••••"
                    value={confirmacionPassword} onChange={e => setConfirmacionPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Crear Cuenta' : 'Ingresar')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button" // Importante type="button" para no enviar form
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
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