import React from 'react';

const EmptyState = ({
  icon: Icon,
  iconClassName = 'mx-auto text-gray-400 mb-4',
  title,
  subtitle,
  className = 'text-center py-12',
}) => {
  return (
    <div className={className}>
      {Icon && <Icon className={iconClassName} size={48} />}
      <p className="text-xl text-gray-500 mb-2">{title}</p>
      {subtitle && <p className="text-gray-400">{subtitle}</p>}
    </div>
  );
};

export default EmptyState;
