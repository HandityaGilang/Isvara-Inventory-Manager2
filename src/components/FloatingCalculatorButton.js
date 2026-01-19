import React from 'react';
import { Calculator } from 'lucide-react';

const FloatingCalculatorButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
      title="Buka Kalkulator Profit"
    >
      <Calculator size={24} />
    </button>
  );
};

export default FloatingCalculatorButton;