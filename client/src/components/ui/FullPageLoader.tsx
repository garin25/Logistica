export const FullPageLoader = () => {
  return (
    // fixed inset-0 z-50: Cubre toda la pantalla y se pone encima de todo
    // bg-black/50: Fondo negro semitransparente (backdrop)
    // backdrop-blur-sm: Efecto borroso en el fondo (opcional)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-5 rounded-lg shadow-lg flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-gray-700 font-medium">Cargando...</span>
      </div>
    </div>
  );
};