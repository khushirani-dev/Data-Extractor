import React from 'react';
import { FaBuilding, FaEnvelope, FaPhone, FaWhatsapp, FaGlobe } from 'react-icons/fa';

const ResultsTable = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No data available. Start scraping to collect institution data.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <FaBuilding className="inline mr-1" /> Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <FaEnvelope className="inline mr-1" /> Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <FaPhone className="inline mr-1" /> Phone
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <FaWhatsapp className="inline mr-1" /> WhatsApp
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Address
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <FaGlobe className="inline mr-1" /> Website
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                {item.name}
              </td>
              <td className="px-4 py-3 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium
                  ${item.type === 'coaching' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
                  ${item.type === 'school' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                  ${item.type === 'institution' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : ''}
                `}>
                  {item.type}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {item.email ? (
                  <a href={`mailto:${item.email}`} className="hover:text-blue-500">
                    {item.email}
                  </a>
                ) : '-'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {item.phone || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {item.whatsapp || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                {item.address || '-'}
              </td>
              <td className="px-4 py-3 text-sm">
                {item.website ? (
                  <a href={item.website} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-500 hover:text-blue-600 hover:underline">
                    Visit                  </a>
                ) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;