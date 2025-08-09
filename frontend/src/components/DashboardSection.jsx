// frontend/src/components/DashboardSection.jsx
import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react';
import { FaChevronDown } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const DashboardSection = ({ title, links = [] }) => {
  return (
    <Disclosure>
      {({ open }) => (
        <div className="w-full">
          <DisclosureButton className="w-full flex justify-between items-center px-4 py-3 text-left bg-blue-50 border border-blue-300 rounded hover:bg-blue-100 transition font-semibold text-blue-800">
            <span>{title}</span>
            <FaChevronDown
              className={`transform transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
            />
          </DisclosureButton>

          <Transition
            show={open}
            enter="transition duration-300 ease-out"
            enterFrom="transform scale-y-0 opacity-0 origin-top"
            enterTo="transform scale-y-100 opacity-100 origin-top"
            leave="transition duration-200 ease-in"
            leaveFrom="transform scale-y-100 opacity-100 origin-top"
            leaveTo="transform scale-y-0 opacity-0 origin-top"
          >
            <DisclosurePanel className="mt-2 space-y-2 px-4 py-2 bg-white border border-blue-100 rounded shadow-sm">
              {links.map((link, index) => (
                link.isButton ? (
                  <button
                    key={`${link.label}-${index}`}
                    onClick={link.onClick}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition"
                  >
                    {link.icon && <span className="text-blue-500">{link.icon}</span>}
                    <span>{link.label}</span>
                  </button>
                ) : (
                  <Link
                    key={`${link.label}-${index}`}
                    to={link.to}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition"
                  >
                    {link.icon && <span className="text-blue-500">{link.icon}</span>}
                    <span>{link.label}</span>
                  </Link>
                )
              ))}
            </DisclosurePanel>
          </Transition>
        </div>
      )}
    </Disclosure>
  );
};

export default DashboardSection;