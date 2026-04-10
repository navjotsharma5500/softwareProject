/**
 * @file EmptyState.jsx
 * @description Generic empty-state placeholder used when lists have no items.
 *
 * @component
 */
import React from 'react';

/**
 * Displays an icon, a title, and an optional subtitle in a centred layout.
 * Used as the zero-results state for item lists, claim lists, etc.
 *
 * @component
 * @param {object}          props
 * @param {React.ElementType} props.icon            - Lucide icon component to render.
 * @param {string}          [props.iconClassName]   - Tailwind classes for the icon element.
 * @param {string}          props.title             - Primary empty-state message.
 * @param {string}          [props.subtitle]        - Secondary explanatory text.
 * @param {string}          [props.className]       - Wrapper div Tailwind classes.
 * @returns {JSX.Element}
 */
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
