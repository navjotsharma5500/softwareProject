import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Package, Users, RefreshCw, Search, Filter, FileText, AlertCircle, MapPin, Clock, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import { adminApi, userApi } from '../utils/api';
import { CATEGORIES, LOCATIONS, CATEGORY_DISPLAY_NAMES } from '../utils/constants';
import useFormPersistence from '../hooks/useFormPersistence.jsx';
import { useDarkMode } from '../context/DarkModeContext';

const Admin = () => {
  const { darkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState('items'); // items, claims, approved-claims, rejected-claims
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // create, edit, delete, viewClaims, approveClaim, userHistory
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState({ claims: [], reports: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Pagination state
  const [itemsPage, setItemsPage] = useFormPersistence('admin_items_page', 1);
  const [claimsPage, setClaimsPage] = useFormPersistence('admin_claims_page', 1);
  const [itemsPagination, setItemsPagination] = useState({});
  const [claimsPagination, setClaimsPagination] = useState({});

  // Persisted visibility for filter panels
  const [showItemFilters, setShowItemFilters] = useFormPersistence('admin_show_item_filters', true);
  const [showClaimFilters, setShowClaimFilters] = useFormPersistence('admin_show_claim_filters', true);
  
  // Persisted filter state for items
  const [itemFilters, setItemFilters] = useFormPersistence('admin_item_filters', {
    search: '',
    category: '',
    location: '',
    status: '' // all, available, claimed
  });

  // Persisted filter state for claims
  const [claimFilters, setClaimFilters] = useFormPersistence('admin_claim_filters', {
    search: '',
    status: 'all' // pending, approved, rejected, all
  });
  
  // Form state for create/edit
  const [formData, setFormData, formControls] = useFormPersistence('admin_item_form', {
    itemId: '',
    name: '',
    category: '',
    foundLocation: '',
    dateFound: '',
    description: ''
  });

  const [remarkText, setRemarkText] = useState('');

  useEffect(() => {
    if (activeTab === 'items') {
      fetchItems();
    } else if (activeTab === 'claims' || activeTab === 'approved-claims' || activeTab === 'rejected-claims') {
      fetchClaims();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, itemsPage, claimsPage, itemFilters, claimFilters]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {
        page: itemsPage,
        limit: 10,
        ...(itemFilters.search && { search: itemFilters.search }),
        ...(itemFilters.category && { category: itemFilters.category }),
        ...(itemFilters.location && { location: itemFilters.location }),
        ...(itemFilters.status === 'available' && { isClaimed: false }),
        ...(itemFilters.status === 'claimed' && { isClaimed: true }),
      };
      
      const response = await adminApi.getItems(params);
      setItems(response.data.items);
      setItemsPagination(response.data.pagination || {});
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const fetchClaims = async () => {
    setLoading(true);
    try {
      // Determine status based on activeTab
      let status = 'pending';
      if (activeTab === 'approved-claims') status = 'approved';
      if (activeTab === 'rejected-claims') status = 'rejected';
      if (claimFilters.status !== 'all') status = claimFilters.status;
      
      const params = {
        page: claimsPage,
        limit: 10,
        ...(claimFilters.search && { search: claimFilters.search }),
        ...(status && { status })
      };
      
      const response = await adminApi.getClaims(params);
      setClaims(response.data.claims);
      setClaimsPagination(response.data.pagination || {});
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'items') {
        await fetchItems();
        toast.success('Items refreshed!');
      } else if (activeTab === 'claims') {
        await fetchClaims();
        toast.success('Claims refreshed!');
      }
    } catch {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      // Don't send itemId - it's auto-generated by backend
      // eslint-disable-next-line no-unused-vars
      const { itemId, ...itemData } = formData;
      await adminApi.createItem(itemData);
      toast.success('Item created successfully');
      setShowModal(false);
      resetForm();
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create item');
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      await adminApi.updateItem(selectedItem._id, formData);
      toast.success('Item updated successfully');
      setShowModal(false);
      resetForm();
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update item');
    }
  };

  const handleDeleteItem = async () => {
    try {
      await adminApi.deleteItem(selectedItem._id);
      toast.success('Item deleted successfully');
      setShowModal(false);
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const handleApproveClaim = async (claimId) => {
    try {
      await adminApi.approveClaim(claimId, remarkText);
      toast.success('Claim approved! Check the "Approved Claims" tab to see it.');
      setShowModal(false);
      setRemarkText('');
      setSelectedItem(null);
      // Refresh current view
      await fetchClaims();
      // Also refresh items to show updated claimed status
      await fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve claim');
    }
  };

  const handleRejectClaim = async (claimId) => {
    try {
      await adminApi.rejectClaim(claimId, remarkText);
      toast.success('Claim rejected! Check the "Rejected Claims" tab to see it.');
      setShowModal(false);
      setRemarkText('');
      setSelectedItem(null);
      // Refresh current view
      await fetchClaims();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject claim');
    }
  };

  const openCreateModal = () => {
    resetForm();
    setModalType('create');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setFormData({
      itemId: item.itemId,
      name: item.name,
      category: item.category,
      foundLocation: item.foundLocation,
      dateFound: item.dateFound.split('T')[0],
      description: item.description || ''
    });
    setModalType('edit');
    setShowModal(true);
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setModalType('delete');
    setShowModal(true);
  };

  const openClaimModal = (claim, type) => {
    setSelectedItem(claim);
    setModalType(type);
    setShowModal(true);
  };

  const openUserHistoryModal = async (userId, userName) => {
    setSelectedUser({ id: userId, name: userName });
    setModalType('userHistory');
    setShowModal(true);
    setLoadingHistory(true);
    try {
      const response = await userApi.getUserHistory(userId);
      setUserHistory(response.data);
    } catch (error) {
      toast.error('Failed to load user history');
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const resetForm = () => {
    setFormData({
      itemId: '',
      name: '',
      category: '',
      foundLocation: '',
      dateFound: '',
      description: ''
    });
    setSelectedItem(null);
    if (formControls && typeof formControls.clear === 'function') formControls.clear();
  };

  return (
    <div className={`min-h-screen py-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Admin Dashboard</h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Manage lost and found items and claims</p>
        </div>

        {/* Tabs */}
        <div className={`rounded-xl shadow-md mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`flex border-b overflow-x-auto ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => { setActiveTab('items'); setItemsPage(1); }}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'items'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package size={20} />
              All Items
            </button>
            <button
              onClick={() => { setActiveTab('claims'); setClaimsPage(1); }}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'claims'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users size={20} />
              Pending Claims
            </button>
            <button
              onClick={() => { setActiveTab('approved-claims'); setClaimsPage(1); }}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'approved-claims'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircle size={20} />
              Approved Claims
            </button>
            <button
              onClick={() => { setActiveTab('rejected-claims'); setClaimsPage(1); }}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'rejected-claims'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <XCircle size={20} />
              Rejected Claims
            </button>
          </div>
        </div>
            
            {/* Items Tab */}
            {activeTab === 'items' && (
              <div className={`rounded-xl shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>

                {/* Filters for Items */}
                <div className="mb-2 flex items-center justify-between">
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Filters</h3>
                  <button
                    onClick={() => setShowItemFilters(prev => !prev)}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    {showItemFilters ? 'Hide Filters' : 'Show Filters'}
                  </button>
                </div>

                {showItemFilters && (
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
                      <input
                        type="text"
                        placeholder="Search items..."
                        value={itemFilters.search}
                        onChange={(e) => setItemFilters({...itemFilters, search: e.target.value})}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
                        }`}
                      />
                    </div>

                    <select
                      value={itemFilters.category}
                      onChange={(e) => setItemFilters({...itemFilters, category: e.target.value})}
                      className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                      }`}
                    >
                      <option value="">All Categories</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{CATEGORY_DISPLAY_NAMES[cat]}</option>
                      ))}
                    </select>

                    <select
                      value={itemFilters.location}
                      onChange={(e) => setItemFilters({...itemFilters, location: e.target.value})}
                      className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                      }`}
                    >
                      <option value="">All Locations</option>
                      {LOCATIONS.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>

                    <select
                      value={itemFilters.status}
                      onChange={(e) => setItemFilters({...itemFilters, status: e.target.value})}
                      className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                      }`}
                    >
                      <option value="">All Status</option>
                      <option value="available">Available</option>
                      <option value="claimed">Claimed</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                All Items {itemsPagination.total ? `(${itemsPagination.total})` : ''}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`p-2 rounded-lg font-semibold transition-all bg-gray-100 hover:bg-gray-200 text-gray-700 ${
                    refreshing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title="Refresh items"
                >
                  <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={openCreateModal}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={20} />
                  Add New Item
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Item ID</th>
                      <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Name</th>
                      <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Category</th>
                      <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Location</th>
                      <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Date Found</th>
                      <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Status</th>
                      <th className={`px-4 py-3 text-right text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {items.map((item) => (
                      <tr key={item._id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={`px-4 py-3 text-sm font-mono ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.itemId}</td>
                        <td className={`px-4 py-3 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.name}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs">
                            {CATEGORY_DISPLAY_NAMES[item.category]}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{item.foundLocation}</td>
                        <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {new Date(item.dateFound).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            item.isClaimed 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.isClaimed ? 'Claimed' : 'Available'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(item)}
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
            )}
            
            {/* Pagination Controls for Items */}
            {!loading && items.length > 0 && (
              <div className="mt-6 flex justify-between items-center">
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Page {itemsPage} of {Math.ceil((itemsPagination.total || 0) / 10)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setItemsPage(prev => prev - 1)}
                    disabled={!itemsPagination.hasPrev}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      itemsPagination.hasPrev
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setItemsPage(prev => prev + 1)}
                    disabled={!itemsPagination.hasNext}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      itemsPagination.hasNext
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Claims Tab */}
        {activeTab === 'claims' && (
          <div className={`rounded-xl shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Filters for Claims */}
            <div className="mb-2 flex items-center justify-between">
              <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Filters</h3>
              <button
                onClick={() => setShowClaimFilters(prev => !prev)}
                className="text-sm text-indigo-600 hover:underline"
              >
                {showClaimFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            {showClaimFilters && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
                  <input
                    type="text"
                    placeholder="Search by claimant name or item..."
                    value={claimFilters.search}
                    onChange={(e) => setClaimFilters({...claimFilters, search: e.target.value})}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Pending Claims {claimsPagination.total ? `(${claimsPagination.total})` : ''}
              </h2>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`p-2 rounded-lg font-semibold transition-all ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Refresh claims"
              >
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-xl text-gray-500">No pending claims</p>
              </div>
            ) : (
              <div className="space-y-4">
                {claims.map((claim) => (
                  <div
                    key={claim._id}
                    className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
                      darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {claim.item?.name}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Claimant:</span>
                            <button
                              onClick={() => openUserHistoryModal(claim.claimant?._id, claim.claimant?.name)}
                              className={`font-medium hover:underline text-blue-600 hover:text-blue-700 flex items-center gap-1`}
                            >
                              {claim.claimant?.name}
                              <FileText size={14} />
                            </button>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{claim.claimant?.email}</p>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Roll: {claim.claimant?.rollNo}</p>
                          </div>
                          <div>
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Item Details:</span>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>Category: {CATEGORY_DISPLAY_NAMES[claim.item?.category]}</p>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>Location: {claim.item?.foundLocation}</p>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                              Date: {new Date(claim.item?.dateFound).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Claimed on: {new Date(claim.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => openClaimModal(claim, 'approve')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle size={18} />
                        Approve
                      </button>
                      <button
                        onClick={() => openClaimModal(claim, 'reject')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircle size={18} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination Controls for Claims */}
            {!loading && claims.length > 0 && (
              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Page {claimsPage} of {Math.ceil((claimsPagination.total || 0) / 10)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setClaimsPage(prev => prev - 1)}
                    disabled={!claimsPagination.hasPrev}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      claimsPagination.hasPrev
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setClaimsPage(prev => prev + 1)}
                    disabled={!claimsPagination.hasNext}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      claimsPagination.hasNext
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Approved Claims Tab */}
        {activeTab === 'approved-claims' && (
          <div className={`rounded-xl shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Filters for Approved Claims */}
            <div className="mb-2 flex items-center justify-between">
              <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Filters</h3>
              <button
                onClick={() => setShowClaimFilters(prev => !prev)}
                className="text-sm text-indigo-600 hover:underline"
              >
                {showClaimFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            {showClaimFilters && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
                  <input
                    type="text"
                    placeholder="Search by claimant name or item..."
                    value={claimFilters.search}
                    onChange={(e) => setClaimFilters({...claimFilters, search: e.target.value})}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Approved Claims {claimsPagination.total ? `(${claimsPagination.total})` : ''}
              </h2>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`p-2 rounded-lg font-semibold transition-all ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Refresh approved claims"
              >
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className={`mx-auto mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} size={48} />
                <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No approved claims</p>
              </div>
            ) : (
              <div className="space-y-4">
                {claims.map((claim) => (
                  <div
                    key={claim._id}
                    className={`border rounded-lg p-6 ${
                      darkMode ? 'border-green-800 bg-green-900/20' : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {claim.item?.name}
                          </h3>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            Approved
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Claimant:</span>
                            <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{claim.claimant?.name}</p>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{claim.claimant?.email}</p>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Roll: {claim.claimant?.rollNo}</p>
                          </div>
                          <div>
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Item Details:</span>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>Category: {CATEGORY_DISPLAY_NAMES[claim.item?.category]}</p>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>Location: {claim.item?.foundLocation}</p>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                              Date: {new Date(claim.item?.dateFound).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Approved on: {new Date(claim.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination Controls for Approved Claims */}
            {!loading && claims.length > 0 && (
              <div className="mt-6 flex justify-between items-center">
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Page {claimsPage} of {Math.ceil((claimsPagination.total || 0) / 10)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setClaimsPage(prev => prev - 1)}
                    disabled={!claimsPagination.hasPrev}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      claimsPagination.hasPrev
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setClaimsPage(prev => prev + 1)}
                    disabled={!claimsPagination.hasNext}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      claimsPagination.hasNext
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rejected Claims Tab */}
        {activeTab === 'rejected-claims' && (
          <div className={`rounded-xl shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Filters for Rejected Claims */}
            <div className="mb-2 flex items-center justify-between">
              <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Filters</h3>
              <button
                onClick={() => setShowClaimFilters(prev => !prev)}
                className="text-sm text-indigo-600 hover:underline"
              >
                {showClaimFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            {showClaimFilters && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
                  <input
                    type="text"
                    placeholder="Search by claimant name or item..."
                    value={claimFilters.search}
                    onChange={(e) => setClaimFilters({...claimFilters, search: e.target.value})}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Rejected Claims {claimsPagination.total ? `(${claimsPagination.total})` : ''}
              </h2>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`p-2 rounded-lg font-semibold transition-all ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Refresh rejected claims"
              >
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center py-12">
                <XCircle className={`mx-auto mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} size={48} />
                <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No rejected claims</p>
              </div>
            ) : (
              <div className="space-y-4">
                {claims.map((claim) => (
                  <div
                    key={claim._id}
                    className={`border rounded-lg p-6 ${
                      darkMode ? 'border-red-800 bg-red-900/20' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {claim.item?.name}
                          </h3>
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                            Rejected
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Claimant:</span>
                            <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{claim.claimant?.name}</p>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{claim.claimant?.email}</p>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Roll: {claim.claimant?.rollNo}</p>
                          </div>
                          <div>
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Item Details:</span>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>Category: {CATEGORY_DISPLAY_NAMES[claim.item?.category]}</p>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>Location: {claim.item?.foundLocation}</p>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                              Date: {new Date(claim.item?.dateFound).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Rejected on: {new Date(claim.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination Controls for Rejected Claims */}
            {!loading && claims.length > 0 && (
              <div className="mt-6 flex justify-between items-center">
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Page {claimsPage} of {Math.ceil((claimsPagination.total || 0) / 10)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setClaimsPage(prev => prev - 1)}
                    disabled={!claimsPagination.hasPrev}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      claimsPagination.hasPrev
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setClaimsPage(prev => prev + 1)}
                    disabled={!claimsPagination.hasNext}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      claimsPagination.hasNext
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-xl shadow-2xl w-full max-h-[90vh] overflow-y-auto ${
              modalType === 'userHistory' ? 'max-w-6xl' : 'max-w-2xl'
            } ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {/* Create/Edit Item Modal */}
              {(modalType === 'create' || modalType === 'edit') && (
                <form onSubmit={modalType === 'create' ? handleCreateItem : handleUpdateItem} className="p-6">
                  <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {modalType === 'create' ? 'Add New Item' : 'Edit Item'}
                  </h3>
                  
                  <div className="space-y-4">
                    {modalType === 'edit' && (
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Item ID</label>
                        <input
                          type="text"
                          value={formData.itemId}
                          disabled
                          className={`w-full px-4 py-2 border rounded-lg ${
                            darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                          } opacity-60 cursor-not-allowed`}
                        />
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Item ID is auto-generated and cannot be changed</p>
                      </div>
                    )}

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Phone"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category *</label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="">Select Category</option>
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{CATEGORY_DISPLAY_NAMES[cat]}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Found Location *</label>
                      <select
                        required
                        value={formData.foundLocation}
                        onChange={(e) => setFormData({...formData, foundLocation: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="">Select Location</option>
                        {LOCATIONS.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date Found *</label>
                      <input
                        type="date"
                        required
                        max={new Date().toISOString().split('T')[0]}
                        value={formData.dateFound}
                        onChange={(e) => setFormData({...formData, dateFound: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date cannot be in the future</p>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description (optional)</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        rows="3"
                        placeholder="Additional details..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      {modalType === 'create' ? 'Create Item' : 'Update Item'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className={`px-4 py-2 border rounded-lg transition-colors ${
                        darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Delete Confirmation */}
              {modalType === 'delete' && (
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Delete Item</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete "{selectedItem?.name}"? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteItem}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Approve/Reject Claim */}
              {(modalType === 'approve' || modalType === 'reject') && (
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {modalType === 'approve' ? 'Approve Claim' : 'Reject Claim'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {modalType === 'approve' 
                      ? `Approve claim by ${selectedItem?.claimant?.name} for "${selectedItem?.item?.name}"?`
                      : `Reject claim by ${selectedItem?.claimant?.name} for "${selectedItem?.item?.name}"?`
                    }
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Remarks (optional)</label>
                    <textarea
                      value={remarkText}
                      onChange={(e) => setRemarkText(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      rows="3"
                      placeholder="Add remarks..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => modalType === 'approve' 
                        ? handleApproveClaim(selectedItem._id) 
                        : handleRejectClaim(selectedItem._id)
                      }
                      className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                        modalType === 'approve'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {modalType === 'approve' ? 'Approve' : 'Reject'}
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* User History Modal - Enhanced */}
              {modalType === 'userHistory' && selectedUser && (
                <div className={`p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  {/* Header */}
                  <div className={`mb-6 pb-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h2 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      User Activity History
                    </h2>
                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedUser.name}
                    </p>
                  </div>
                  
                  {loadingHistory ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
                      <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading history...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Lost Item Reports Section */}
                      <div className={`rounded-lg border p-6 ${
                        darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            <AlertCircle size={24} className="text-orange-500" />
                            Lost Item Reports
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            darkMode ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {userHistory.reports?.length || 0}
                          </span>
                        </div>
                        
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                          {userHistory.reports && userHistory.reports.length > 0 ? (
                            userHistory.reports.map((report) => (
                              <div key={report._id} className={`p-5 rounded-lg border transition-all hover:shadow-md ${
                                darkMode ? 'border-gray-600 bg-gray-800 hover:bg-gray-750' : 'border-gray-200 bg-white hover:bg-gray-50'
                              }`}>
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <h4 className={`font-bold text-lg mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {report.itemDescription}
                                    </h4>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-semibold">
                                        {CATEGORY_DISPLAY_NAMES[report.category]}
                                      </span>
                                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                        report.status === 'active' ? 'bg-green-100 text-green-800' :
                                        report.status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {report.status.toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className={`space-y-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-red-500" />
                                    <span><strong>Location:</strong> {report.location}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-blue-500" />
                                    <span><strong>Lost on:</strong> {new Date(report.dateLost).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-purple-500" />
                                    <span><strong>Reported:</strong> {new Date(report.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}</span>
                                  </div>
                                </div>
                                
                                {report.additionalDetails && (
                                  <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      <strong>Details:</strong> {report.additionalDetails}
                                    </p>
                                  </div>
                                )}
                                
                                {report.photos && report.photos.length > 0 && (
                                  <div className="mt-3 flex gap-2">
                                    {report.photos.map((photo, idx) => (
                                      <img
                                        key={idx}
                                        src={photo}
                                        alt={`Report photo ${idx + 1}`}
                                        className="w-16 h-16 object-cover rounded border-2 border-gray-300"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-12">
                              <AlertCircle className={`mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} size={48} />
                              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>No lost item reports</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Claim Requests Section */}
                      <div className={`rounded-lg border p-6 ${
                        darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            <Package size={24} className="text-blue-500" />
                            Claim Requests
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {userHistory.claims?.length || 0}
                          </span>
                        </div>
                        
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                          {userHistory.claims && userHistory.claims.length > 0 ? (
                            userHistory.claims.map((claim) => (
                              <div key={claim._id} className={`p-5 rounded-lg border transition-all hover:shadow-md ${
                                darkMode ? 'border-gray-600 bg-gray-800 hover:bg-gray-750' : 'border-gray-200 bg-white hover:bg-gray-50'
                              }`}>
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <h4 className={`font-bold text-lg mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {claim.item?.name}
                                    </h4>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                                        {CATEGORY_DISPLAY_NAMES[claim.item?.category]}
                                      </span>
                                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                        claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        claim.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {claim.status.toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className={`space-y-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-green-500" />
                                    <span><strong>Found at:</strong> {claim.item?.foundLocation}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-teal-500" />
                                    <span><strong>Item ID:</strong> {claim.item?.itemId}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-orange-500" />
                                    <span><strong>Claimed on:</strong> {new Date(claim.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}</span>
                                  </div>
                                </div>
                                
                                {claim.remarks && (
                                  <div className={`mt-3 pt-3 border-t ${
                                    claim.status === 'approved' 
                                      ? darkMode ? 'border-green-800 bg-green-900/20' : 'border-green-200 bg-green-50'
                                      : claim.status === 'rejected'
                                      ? darkMode ? 'border-red-800 bg-red-900/20' : 'border-red-200 bg-red-50'
                                      : darkMode ? 'border-gray-700' : 'border-gray-200'
                                  } p-3 rounded`}>
                                    <p className={`text-sm font-semibold mb-1 ${
                                      claim.status === 'approved' ? 'text-green-700 dark:text-green-400' :
                                      claim.status === 'rejected' ? 'text-red-700 dark:text-red-400' :
                                      darkMode ? 'text-gray-400' : 'text-gray-700'
                                    }`}>
                                      Admin Remarks:
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      {claim.remarks}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-12">
                              <Package className={`mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} size={48} />
                              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>No claim requests</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary Stats */}
                  {!loadingHistory && (
                    <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className={`p-4 rounded-lg text-center ${
                          darkMode ? 'bg-orange-900/20' : 'bg-orange-50'
                        }`}>
                          <p className={`text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                            {userHistory.reports?.length || 0}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Reports</p>
                        </div>
                        <div className={`p-4 rounded-lg text-center ${
                          darkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                        }`}>
                          <p className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            {userHistory.claims?.length || 0}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Claims</p>
                        </div>
                        <div className={`p-4 rounded-lg text-center ${
                          darkMode ? 'bg-green-900/20' : 'bg-green-50'
                        }`}>
                          <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                            {userHistory.claims?.filter(c => c.status === 'approved').length || 0}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Approved</p>
                        </div>
                        <div className={`p-4 rounded-lg text-center ${
                          darkMode ? 'bg-red-900/20' : 'bg-red-50'
                        }`}>
                          <p className={`text-2xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                            {userHistory.claims?.filter(c => c.status === 'rejected').length || 0}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rejected</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => setShowModal(false)}
                      className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                        darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
