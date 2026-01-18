import { FaBriefcase, FaUserTie, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const DashboardStats = ({ applications }) => {
  // Calculate stats dynamically from the applications array
  const totalApps = applications.length;
  const interviews = applications.filter(app => app.status === 'Interview').length;
  const offers = applications.filter(app => app.status === 'Offer').length;
  const rejected = applications.filter(app => app.status === 'Rejected').length;

  // Configuration for the cards to keep JSX clean
  const stats = [
    { 
      id: 1, 
      label: 'Total Applications', 
      value: totalApps, 
      icon: <FaBriefcase />, 
      color: 'bg-blue-100 text-blue-600' 
    },
    { 
      id: 2, 
      label: 'Interviews', 
      value: interviews, 
      icon: <FaUserTie />, 
      color: 'bg-yellow-100 text-yellow-600' 
    },
    { 
      id: 3, 
      label: 'Offers', 
      value: offers, 
      icon: <FaCheckCircle />, 
      color: 'bg-green-100 text-green-600' 
    },
    { 
      id: 4, 
      label: 'Rejected', 
      value: rejected, 
      icon: <FaTimesCircle />, 
      color: 'bg-red-100 text-red-600' 
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <div key={stat.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
          </div>
          <div className={`p-3 rounded-full ${stat.color} text-xl`}>
            {stat.icon}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;