import React from 'react';
import { Link } from 'react-router-dom';

interface DashboardLink {
  to?: string;
  onClick?: () => void;
  label: string;
  icon: React.ReactNode;
  isButton?: boolean;
  description?: string;
}

interface DashboardSectionProps {
  title: string;
  links: DashboardLink[];
  className?: string;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  links,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link, index) => (
          <div key={index}>
            {link.to ? (
              <Link
                to={link.to}
                className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-blue-600 text-xl group-hover:text-blue-700">
                    {link.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                      {link.label}
                    </h3>
                    {link.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {link.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ) : (
              <button
                onClick={link.onClick}
                className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-blue-600 text-xl group-hover:text-blue-700">
                    {link.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                      {link.label}
                    </h3>
                    {link.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {link.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardSection;
