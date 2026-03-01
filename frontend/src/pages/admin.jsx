import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Package, Users, RefreshCw, Search, Filter, AlertCircle, MapPin, Clock, Calendar, MessageSquare, Star, Download, ArrowLeft, FileText } from 'lucide-react';
import Pagination from '../components/admin/Pagination';
import ClaimsTab from '../components/admin/ClaimsTab';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminApi } from '../utils/api';
import axios from 'axios';
import { CATEGORIES, LOCATIONS, CATEGORY_DISPLAY_NAMES } from '../utils/constants';
import useFormPersistence from '../hooks/useFormPersistence.jsx';
import ImageLightbox from '../components/ImageLightbox';

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useFormPersistence('admin_active_tab', 'items'); // items, claims, approved-claims, rejected-claims
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // create, edit, delete, viewClaims, approveClaim
  const [lightboxImages, setLightboxImages] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
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
  
  // Local search input states to avoid API spam
  const [itemSearchInput, setItemSearchInput] = useState(itemFilters.search || '');
  const [claimSearchInput, setClaimSearchInput] = useState(claimFilters.search || '');
  const itemSearchTimeoutRef = useRef(null);
  const claimSearchTimeoutRef = useRef(null);
  
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
  const [submitting, setSubmitting] = useState(false);
  
  // Use ref to track submission state synchronously (prevents race conditions)
  const isSubmittingRef = useRef(false);
  
  // Rate limiting for admin operations
  const lastRefreshTime = useRef(0);
  const lastCsvDownloadTime = useRef(0);
  const lastApproveTime = useRef(0);
  const lastRejectTime = useRef(0);
  const [refreshCooldown, setRefreshCooldown] = useState(false);
  const [csvCooldown, setCsvCooldown] = useState(false);
  const [approveCooldown, setApproveCooldown] = useState(false);
  const [rejectCooldown, setRejectCooldown] = useState(false);

  useEffect(() => {
    if (activeTab === 'items') {
      fetchItems();
    } else if (activeTab === 'claims' || activeTab === 'approved-claims' || activeTab === 'rejected-claims') {
      fetchClaims();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, itemsPage, claimsPage, itemFilters, claimFilters]);
  
  // Sync search inputs with filter state
  useEffect(() => {
    setItemSearchInput(itemFilters.search || '');
  }, [itemFilters.search]);
  
  useEffect(() => {
    setClaimSearchInput(claimFilters.search || '');
  }, [claimFilters.search]);
  
  // Debounced search handlers
  const handleItemSearchChange = (value) => {
    setItemSearchInput(value);
    if (itemSearchTimeoutRef.current) {
      clearTimeout(itemSearchTimeoutRef.current);
    }
    itemSearchTimeoutRef.current = setTimeout(() => {
      setItemFilters({ ...itemFilters, search: value });
      setItemsPage(1);
    }, 300);
  };
  
  const handleClaimSearchChange = (value) => {
    setClaimSearchInput(value);
    if (claimSearchTimeoutRef.current) {
      clearTimeout(claimSearchTimeoutRef.current);
    }
    claimSearchTimeoutRef.current = setTimeout(() => {
      setClaimFilters({ ...claimFilters, search: value });
      setClaimsPage(1);
    }, 300);
  };

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
      // Ignore cancellation errors (both AbortError and Axios CanceledError)
      if (error.name === 'AbortError' || axios.isCancel(error)) {
        return; // Silently ignore cancelled requests
      }
      toast.error(error.response?.data?.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const fetchClaims = async () => {
    setLoading(true);
    try {
      // Determine status based on activeTab - tab takes priority over filter
      let status = '';
      if (activeTab === 'claims') status = 'pending';
      else if (activeTab === 'approved-claims') status = 'approved';
      else if (activeTab === 'rejected-claims') status = 'rejected';
      else if (claimFilters.status !== 'all') status = claimFilters.status;
      
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
      // Ignore cancellation errors (both AbortError and Axios CanceledError)
      if (error.name === 'AbortError' || axios.isCancel(error)) {
        return; // Silently ignore cancelled requests
      }
      toast.error(error.response?.data?.message || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    const now = Date.now();
    const REFRESH_COOLDOWN = 2000; // 2 seconds
    
    // Check if still in cooldown
    if (now - lastRefreshTime.current < REFRESH_COOLDOWN) {
      toast.warning('Please wait before refreshing again');
      return;
    }
    
    lastRefreshTime.current = now;
    setRefreshCooldown(true);
    setRefreshing(true);
    
    try {
      if (activeTab === 'items') {
        await fetchItems();
        toast.success('Items refreshed!');
      } else if (activeTab === 'claims' || activeTab === 'approved-claims' || activeTab === 'rejected-claims') {
        await fetchClaims();
        toast.success('Claims refreshed!');
      }
    } catch {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
      // Remove cooldown after delay
      setTimeout(() => setRefreshCooldown(false), REFRESH_COOLDOWN);
    }
  };

  const handleDownloadCsv = async () => {
    const now = Date.now();
    const CSV_COOLDOWN = 5000; // 5 seconds
    
    // Check if still in cooldown
    if (now - lastCsvDownloadTime.current < CSV_COOLDOWN) {
      toast.warning('Please wait before downloading again');
      return;
    }
    
    lastCsvDownloadTime.current = now;
    setCsvCooldown(true);
    setDownloadingCsv(true);
    
    try {
      const response = await adminApi.downloadCsv();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `lost_found_data_${timestamp}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('CSV file downloaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download CSV');
    } finally {
      setDownloadingCsv(false);
      // Remove cooldown after delay
      setTimeout(() => setCsvCooldown(false), CSV_COOLDOWN);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Check ref first (synchronous check)
    if (isSubmittingRef.current || submitting) {
      console.log('Duplicate submission blocked');
      return;
    }
    
    // Immediately set both ref and state
    isSubmittingRef.current = true;
    setSubmitting(true);
    
    try {
      // Don't send itemId - it's auto-generated by backend
      // eslint-disable-next-line no-unused-vars
      const { itemId, ...itemData } = formData;
      await adminApi.createItem(itemData);
      toast.success('Item created successfully!');
      setShowModal(false);
      resetForm();
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create item');
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    
    // Check ref first (synchronous check)
    if (isSubmittingRef.current || submitting) {
      console.log('Duplicate update blocked');
      return;
    }
    
    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      await adminApi.updateItem(selectedItem._id, formData);
      toast.success('Item updated successfully!');
      setShowModal(false);
      resetForm();
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update item');
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    // Check ref first (synchronous check)
    if (isSubmittingRef.current || submitting) {
      console.log('Duplicate deletion blocked');
      return;
    }
    
    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      await adminApi.deleteItem(selectedItem._id);
      toast.success('Item deleted successfully!');
      setShowModal(false);
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleApproveClaim = async (claimId) => {
    const now = Date.now();
    const APPROVE_COOLDOWN = 1000; // 1 second
    
    // Check if still in cooldown
    if (now - lastApproveTime.current < APPROVE_COOLDOWN) {
      toast.warning('Please wait before approving another claim');
      return;
    }
    
    lastApproveTime.current = now;
    setApproveCooldown(true);
    
    try {
      await adminApi.approveClaim(claimId, remarkText);
      toast.success('Claim approved successfully!');
      setShowModal(false);
      setRemarkText('');
      setSelectedItem(null);
      
      // If this was the last claim on the current page, go to page 1
      if (claims.length === 1 && claimsPage > 1) {
        setClaimsPage(1);
      } else {
        // Refresh current view
        await fetchClaims();
      }
      
      // Also refresh items to show updated claimed status
      await fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve claim');
    } finally {
      // Remove cooldown after delay
      setTimeout(() => setApproveCooldown(false), APPROVE_COOLDOWN);
    }
  };

  const handleRejectClaim = async (claimId) => {
    const now = Date.now();
    const REJECT_COOLDOWN = 1000; // 1 second
    
    // Check if still in cooldown
    if (now - lastRejectTime.current < REJECT_COOLDOWN) {
      toast.warning('Please wait before rejecting another claim');
      return;
    }
    
    lastRejectTime.current = now;
    setRejectCooldown(true);
    
    try {
      await adminApi.rejectClaim(claimId, remarkText);
      toast.success('Claim rejected successfully!');
      setShowModal(false);
      setRemarkText('');
      setSelectedItem(null);
      
      // If this was the last claim on the current page, go to page 1
      if (claims.length === 1 && claimsPage > 1) {
        setClaimsPage(1);
      } else {
        // Refresh current view
        await fetchClaims();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject claim');
    } finally {
      // Remove cooldown after delay
      setTimeout(() => setRejectCooldown(false), REJECT_COOLDOWN);
    }
  };

  const openCreateModal = () => {
    resetForm();
    isSubmittingRef.current = false; // Ensure ref is reset
    setSubmitting(false);
    setModalType('create');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    isSubmittingRef.current = false; // Ensure ref is reset
    setSubmitting(false);
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
    isSubmittingRef.current = false; // Ensure ref is reset
    setSelectedItem(item);
    setSubmitting(false);
    setModalType('delete');
    setShowModal(true);
  };

  const openClaimModal = (claim, type) => {
    setSelectedItem(claim);
    setModalType(type);
    setShowModal(true);
  };

  const openUserHistoryModal = (userId, userName) => {
    navigate(`/admin/user/${userId}`, { state: { userName, fromTab: activeTab } });
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
    setSubmitting(false);
    isSubmittingRef.current = false; // Reset ref too
    if (formControls && typeof formControls.clear === 'function') formControls.clear();
  };

  return (
    <>
      <div className="min-h-screen py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage lost and found items and claims</p>
          </div>

          {/* Tabs */}
          <div className="rounded-xl shadow-md mb-8 bg-white">
            <div className="flex border-b overflow-x-auto border-gray-200">
              <button
                onClick={() => { setActiveTab('items'); setItemsPage(1); }}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'items'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package size={20} />
                All Items
              </button>
              <button
                onClick={() => { setActiveTab('claims'); setClaimsPage(1); }}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'claims'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users size={20} />
                Pending Claims
              </button>
              <button
                onClick={() => { setActiveTab('approved-claims'); setClaimsPage(1); }}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'approved-claims'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CheckCircle size={20} />
                Approved Claims
              </button>
              <button
                onClick={() => { setActiveTab('rejected-claims'); setClaimsPage(1); }}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'rejected-claims'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <XCircle size={20} />
                Rejected Claims
              </button>
              <button
                onClick={() => navigate('/admin/reports')}
                className="flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap text-gray-600 hover:text-gray-900"
              >
                <AlertCircle size={20} />
                Reports
              </button>
            </div>
          </div>
              
          {/* Items Tab */}
          {activeTab === 'items' && (
            <div className="rounded-xl shadow-md p-6 bg-white">

              {/* Filters for Items */}
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Filters</h3>
                <button
                  onClick={() => setShowItemFilters(prev => !prev)}
                  className="text-sm text-gray-900 hover:underline"
                >
                  {showItemFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
              </div>

              {showItemFilters && (
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search items..."
                        value={itemSearchInput}
                        onChange={(e) => handleItemSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent border-gray-300"
                      />
                    </div>

                    <input
                      type="text"
                      list="filter-category-options"
                      value={itemFilters.category}
                      onChange={(e) => setItemFilters({...itemFilters, category: e.target.value})}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent border-gray-300"
                      placeholder="All Categories"
                    />
                    <datalist id="filter-category-options">
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>

                    <input
                      type="text"
                      list="filter-location-options"
                      value={itemFilters.location}
                      onChange={(e) => setItemFilters({...itemFilters, location: e.target.value})}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent border-gray-300"
                      placeholder="All Locations"
                    />
                    <datalist id="filter-location-options">
                      {LOCATIONS.map(loc => (
                        <option key={loc} value={loc} />
                      ))}
                    </datalist>

                    <select
                      value={itemFilters.status}
                      onChange={(e) => setItemFilters({...itemFilters, status: e.target.value})}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent border-gray-300"
                    >
                      <option value="">All Status</option>
                      <option value="available">Available</option>
                      <option value="claimed">Claimed</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setItemFilters({ search: '', category: '', location: '', status: '' });
                      setItemSearchInput('');
                    }}
                    className="px-4 py-2 rounded-lg font-semibold transition-all bg-gray-200 hover:bg-gray-300 text-gray-700"
                  >
                    Clear Filters
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  All Items {itemsPagination.total ? `(${itemsPagination.total})` : ''}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col sm:flex-row w-full gap-2 sm:gap-3">
                    <button onClick={() => navigate('/admin/reports')} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                      Reports
                    </button>
                    <button
                      onClick={handleDownloadCsv}
                      disabled={downloadingCsv || csvCooldown}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold ${
                        downloadingCsv || csvCooldown ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title="Download all data as CSV"
                    >
                      <Download size={20} className={downloadingCsv ? 'animate-spin' : ''} />
                      {downloadingCsv ? 'Downloading...' : 'Download CSV'}
                    </button>
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing || refreshCooldown}
                      className={`flex-1 sm:flex-none flex items-center justify-center p-2 rounded-lg font-semibold transition-all bg-gray-100 hover:bg-gray-200 text-gray-700 ${
                        refreshing || refreshCooldown ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title="Refresh items"
                    >
                      <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                    <button
                      onClick={openCreateModal}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Plus size={20} />
                      Add New Item
                    </button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              ) : (
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
                          <td className={`px-4 py-3 text-sm text-gray-900`}>{item.foundLocation}</td>
                          <td className={`px-4 py-3 text-sm text-gray-900`}>
                            {new Date(item.dateFound).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.isClaimed 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.isClaimed ? 'Claimed' : 'Available'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-2 text-gray-600 hover:bg-gray-50 rounded"
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
                <Pagination
                  page={itemsPage}
                  pagination={itemsPagination}
                  onPrev={() => setItemsPage(prev => prev - 1)}
                  onNext={() => setItemsPage(prev => prev + 1)}
                />
              )}
            </div>
          )}

          {/* Claims Tabs */}
          {(activeTab === 'claims' || activeTab === 'approved-claims' || activeTab === 'rejected-claims') && (
            <ClaimsTab
              status={activeTab === 'claims' ? 'pending' : activeTab === 'approved-claims' ? 'approved' : 'rejected'}
              claims={claims}
              loading={loading}
              claimsPagination={claimsPagination}
              claimsPage={claimsPage}
              setClaimsPage={setClaimsPage}
              claimSearchInput={claimSearchInput}
              handleClaimSearchChange={handleClaimSearchChange}
              showClaimFilters={showClaimFilters}
              setShowClaimFilters={setShowClaimFilters}
              onClearFilters={() => {
                setClaimFilters({ search: '', status: 'all' });
                setClaimSearchInput('');
              }}
              handleRefresh={handleRefresh}
              refreshing={refreshing}
              refreshCooldown={refreshCooldown}
              onApprove={(claim) => openClaimModal(claim, 'approve')}
              onReject={(claim) => openClaimModal(claim, 'reject')}
              onViewUser={openUserHistoryModal}
              CATEGORY_DISPLAY_NAMES={CATEGORY_DISPLAY_NAMES}
            />
          )}

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className={`rounded-xl shadow-2xl w-full max-h-[90vh] overflow-y-auto max-w-2xl bg-white`}>
                {/* Create/Edit Item Modal */}
                {(modalType === 'create' || modalType === 'edit') && (
                  <form onSubmit={modalType === 'create' ? handleCreateItem : handleUpdateItem} className="p-6">
                    <h3 className={`text-2xl font-bold mb-6 text-gray-900`}>
                      {modalType === 'create' ? 'Add New Item' : 'Edit Item'}
                    </h3>
                    
                    <div className="space-y-4">
                      {modalType === 'edit' && (
                        <div>
                          <label className={`block text-sm font-medium mb-2 text-gray-700`}>Item ID</label>
                          <input
                            type="text"
                            value={formData.itemId}
                            disabled
                            className="w-full px-4 py-2 border rounded-lg bg-gray-100 border-gray-300 text-gray-900 opacity-60 cursor-not-allowed"
                          />
                          <p className={`text-xs mt-1 text-gray-500`}>Item ID is auto-generated and cannot be changed</p>
                        </div>
                      )}

                      <div>
                        <label className={`block text-sm font-medium mb-2 text-gray-700`}>Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 bg-white border-gray-300 text-gray-900"
                          placeholder="Phone"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 text-gray-700`}>Category *</label>
                        <input
                          type="text"
                          list="admin-category-options"
                          required
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 bg-white border-gray-300 text-gray-900"
                          placeholder="Select or type a category"
                        />
                        <datalist id="admin-category-options">
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat} />
                          ))}
                        </datalist>
                        <p className="text-xs mt-1 text-gray-500">Select from list or type your own</p>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 text-gray-700`}>Found Location *</label>
                        <input
                          type="text"
                          list="admin-location-options"
                          required
                          value={formData.foundLocation}
                          onChange={(e) => setFormData({...formData, foundLocation: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 bg-white border-gray-300 text-gray-900"
                          placeholder="Select or type a location"
                        />
                        <datalist id="admin-location-options">
                          {LOCATIONS.map(loc => (
                            <option key={loc} value={loc} />
                          ))}
                        </datalist>
                        <p className="text-xs mt-1 text-gray-500">Select from list or type your own</p>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 text-gray-700`}>Date Found *</label>
                        <input
                          type="date"
                          required
                          max={new Date().toISOString().split('T')[0]}
                          value={formData.dateFound}
                          onChange={(e) => setFormData({...formData, dateFound: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 bg-white border-gray-300 text-gray-900"
                        />
                        <p className={`text-xs mt-1 text-gray-500`}>Date cannot be in the future</p>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 text-gray-700`}>Description (optional)</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 bg-white border-gray-300 text-gray-900"
                          rows="3"
                          placeholder="Additional details..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        type="submit"
                        disabled={submitting}
                        className={`flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                          submitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-800'
                        }`}
                      >
                        {submitting && (
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {submitting ? 'Submitting...' : (modalType === 'create' ? 'Create Item' : 'Update Item')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        disabled={submitting}
                        className={`px-4 py-2 border rounded-lg transition-colors border-gray-300 text-gray-700 hover:bg-gray-50 ${
                          submitting ? 'opacity-50 cursor-not-allowed' : ''
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
                        disabled={submitting}
                        className={`flex-1 px-4 py-2 bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                          submitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-700'
                        }`}
                      >
                        {submitting && (
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {submitting ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setShowModal(false)}
                        disabled={submitting}
                        className={`px-4 py-2 border border-gray-300 text-gray-700 rounded-lg transition-colors ${
                          submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {(modalType === 'approve' || modalType === 'reject') && (
                  <div className="p-6">
                    <h3 className={`text-2xl font-bold mb-4 text-gray-900`}>
                      {modalType === 'approve' ? 'Approve Claim' : 'Reject Claim'}
                    </h3>
                    <p className={`mb-4 text-gray-600`}>
                      {modalType === 'approve' 
                        ? `Approve claim by ${selectedItem?.claimant?.name} for "${selectedItem?.item?.name}"?`
                        : `Reject claim by ${selectedItem?.claimant?.name} for "${selectedItem?.item?.name}"?`
                      }
                    </p>
                    <div className="mb-4">
                      <label className={`block text-sm font-medium mb-2 text-gray-700`}>Remarks (optional)</label>
                      <textarea
                        value={remarkText}
                        onChange={(e) => setRemarkText(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white border-gray-300 text-gray-900"
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
                        disabled={modalType === 'approve' ? approveCooldown : rejectCooldown}
                        className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                          modalType === 'approve'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                        } ${(modalType === 'approve' ? approveCooldown : rejectCooldown) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {modalType === 'approve' ? 'Approve' : 'Reject'}
                      </button>
                      <button
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 border rounded-lg transition-colors border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxImages && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxImages(null)}
        />
      )}
    </>
  );
};

export default Admin;