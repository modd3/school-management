import { Link } from 'react-router-dom';
import { FaTachometerAlt } from 'react-icons/fa';

export default function DashboardLink() {
  return (
    <div className="mb-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-semibold transition"
      >
        <FaTachometerAlt /> Dashboard
      </Link>
    </div>
  );
}