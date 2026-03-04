import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import Pagination from './Pagination';

/**
 * Items table with edit / delete row actions.
 * Props:
 *   items            – array of item objects
 *   loading          – boolean
 *   CATEGORY_DISPLAY_NAMES – map
 *   onEdit           – (item) => void
 *   onDelete         – (item) => void
 *   itemsPage        – number
 *   itemsPagination  – pagination meta object
 *   onSetPage        – (updater) => void
 */
const ItemsTable = ({
  items,
  loading,
  CATEGORY_DISPLAY_NAMES,
  onEdit,
  onDelete,
  itemsPage,
  itemsPagination,
  onSetPage,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Item ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date Found</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-gray-900">{item.itemId}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {CATEGORY_DISPLAY_NAMES[item.category] || item.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{item.foundLocation}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {new Date(item.dateFound).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.isClaimed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {item.isClaimed ? 'Claimed' : 'Available'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length > 0 && (
        <Pagination
          page={itemsPage}
          pagination={itemsPagination}
          onPrev={() => onSetPage((prev) => prev - 1)}
          onNext={() => onSetPage((prev) => prev + 1)}
        />
      )}
    </>
  );
};

export default ItemsTable;
