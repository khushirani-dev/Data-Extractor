import React from 'react';
import { FaBuilding, FaUsers, FaMapMarkerAlt } from 'react-icons/fa';

const Statistics = ({ stats }) => {
  const { total = 0, byType = [], byCity = [] } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Institutions</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{total}</p>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
            <FaBuilding className="text-blue-500 dark:text-blue-300 text-2xl" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Types</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {byType.map((item) => (
                <span key={item.type} className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {item.type}: {item.count}
                </span>
              ))}
            </div>
          </div>
          <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
            <FaUsers className="text-green-500 dark:text-green-300 text-2xl" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Top Cities</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {byCity.slice(0, 3).map((item) => (
                <span key={item.city} className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {item.city}: {item.count}
                </span>
              ))}
            </div>
          </div>
          <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
            <FaMapMarkerAlt className="text-purple-500 dark:text-purple-300 text-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;