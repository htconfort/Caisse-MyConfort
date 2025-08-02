import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  styleType?: 'primary' | 'secondary' | 'danger';
}

const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false, styleType = 'primary' }) => {
  const buttonClass = `button ${styleType}`;

  return (
    <button className={buttonClass} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};

export default Button;