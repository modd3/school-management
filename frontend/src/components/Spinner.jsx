// components/Spinner.jsx
import React from 'react';

export default function Spinner({ message = "Loading..." }) {
  return (
    <div className="flex flex-col justify-center items-center h-64 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-blue-600 animate-pulse"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>
      <p className="text-blue-600 text-sm animate-pulse">{message}</p>
    </div>
  );
}
// Usage example:
// <Spinner message="Fetching data, please wait..." />
// This component can be used in any part of your application where you need to show a loading spinner. 
// You can customize the message by passing a `message` prop, or it will default to "Loading...". 
// The spinner uses Tailwind CSS classes for styling, so make sure you have Tailwind set up in your project.