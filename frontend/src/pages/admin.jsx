/**
 * @file admin.jsx
 * @description Admin dashboard page with tabbed views for managing found
 * items, pending claims, approved claims, and rejected claims.
 *
 * Features:
 * - Active tab persisted via `useFormPersistence` (`admin_active_tab`).
 * - Item list with search (debounced), category filter, and pagination
 *   (page persisted).
 * - Item CRUD: create, edit, delete via modal forms.
 * - Claim management: approve / reject with confirmation.
 * - CSV export (`adminApi.exportItemsCsv`).
 * - Image lightbox for item photos.
 *
 * @component
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, CheckCircle, XCircle, Package, Users,
  RefreshCw, AlertCircle, Download, ArrowLeft, FileText, Shield,
} from 'lucide-react';
import Pagination from '../components/admin/Pagination';
import ClaimsTab from '../components/admin/ClaimsTab';
import ItemFilters from '../components/admin/ItemFilters';
import ItemForm from '../components/admin/ItemForm';
import ItemsTable from '../components/admin/ItemsTable';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminApi } from '../utils/api';
import axios from 'axios';
import { CATEGORY_DISPLAY_NAMES } from '../utils/constants';
import useFormPersistence from '../hooks/useFormPersistence.jsx';
import useDebounce from '../hooks/useDebounce';
import useCooldown from '../hooks/useCooldown';
import ImageLightbox from '../components/ImageLightbox';

/**
 * Admin dashboard page.
 *
 * @component
 * @returns {JSX.Element}
 */
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
  const [lightboxIndex, _setLightboxIndex] = useState(0);
  
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
  
  // Local search inputs (unthrottled) + debounced values
  const [itemSearchInput, setItemSearchInput] = useState(itemFilters.search || '');
  const [claimSearchInput, setClaimSearchInput] = useState(claimFilters.search || '');
  const debouncedItemSearch = useDebounce(itemSearchInput, 300);
  const debouncedClaimSearch = useDebounce(claimSearchInput, 300);

  // Sync debounced search â†’ filter state (skip first render to avoid page reset on mount)
  const isFirstItemSearch = useRef(true);
  useEffect(() => {
    if (isFirstItemSearch.current) { isFirstItemSearch.current = false; return; }
    setItemFilters((prev) => ({ ...prev, search: debouncedItemSearch }));
    setItemsPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedItemSearch]);

  const isFirstClaimSearch = useRef(true);
  useEffect(() => {
    if (isFirstClaimSearch.current) { isFirstClaimSearch.current = false; return; }
    setClaimFilters((prev) => ({ ...prev, search: debouncedClaimSearch }));
    setClaimsPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedClaimSearch]);

  // Form state for create/edit
  const [formData, setFormData, formControls] = useFormPersistence('admin_item_form', {
    itemId: '', name: '', category: '', foundLocation: '', dateFound: '', description: '',
  });
  const [remarkText, setRemarkText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  // Rate limiting via useCooldown
  const [refreshCooldown, triggerRefresh] = useCooldown(2000);
  const [csvCooldown, triggerCsv] = useCooldown(5000);
  const [approveCooldown, triggerApprove] = useCooldown(1000);
  const [rejectCooldown, triggerReject] = useCooldown(1000);

  useEffect(() => {
    if (activeTab === 'items') fetchItems();
    else fetchClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, itemsPage, claimsPage, itemFilters, claimFilters]);

  // Sync external filter changes back to local search inputs
  useEffect(() => { setItemSearchInput(itemFilters.search || ''); }, [itemFilters.search]);
  useEffect(() => { setClaimSearchInput(claimFilters.search || ''); }, [claimFilters.search]);

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
    if (!triggerRefresh()) {
      toast.warning('Please wait before refreshing again');
      return;
    }
    setRefreshing(true);
    try {
      if (activeTab === 'items') { await fetchItems(); toast.success('Items refreshed!'); }
      else { await fetchClaims(); toast.success('Claims refreshed!'); }
    } catch {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownloadCsv = async () => {
    if (!triggerCsv()) {
      toast.warning('Please wait before downloading again');
      return;
    }
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
    if (!triggerApprove()) {
      toast.warning('Please wait before approving another claim');
      return;
    }
    try {
      await adminApi.approveClaim(claimId, remarkText);
      toast.success('Claim approved successfully!');
      setShowModal(false);
      setRemarkText('');
      setSelectedItem(null);
      if (claims.length === 1 && claimsPage > 1) {
        setClaimsPage(1);
      } else {
        await fetchClaims();
      }
      await fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve claim');
    }
  };

  const handleRejectClaim = async (claimId) => {
    if (!triggerReject()) {
      toast.warning('Please wait before rejecting another claim');
      return;
    }
    try {
      await adminApi.rejectClaim(claimId, remarkText);
      toast.success('Claim rejected successfully!');
      setShowModal(false);
      setRemarkText('');
      setSelectedItem(null);
      if (claims.length === 1 && claimsPage > 1) {
        setClaimsPage(1);
      } else {
        await fetchClaims();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject claim');
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

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage lost and found items and claims</p>
          </div>

          {/* Tabs */}
          <div className="rounded-xl shadow-md mb-8 bg-white">
            <div className="flex border-b overflow-x-auto border-gray-200">
              {[
                { key: 'items', icon: <Package size={20} />, label: 'All Items' },
                { key: 'claims', icon: <Users size={20} />, label: 'Pending Claims' },
                { key: 'approved-claims', icon: <CheckCircle size={20} />, label: 'Approved Claims' },
                { key: 'rejected-claims', icon: <XCircle size={20} />, label: 'Rejected Claims' },
              ].map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); key === 'items' ? setItemsPage(1) : setClaimsPage(1); }}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                    activeTab === key
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {icon}{label}
                </button>
              ))}
              <button
                onClick={() => navigate('/admin/reports')}
                className="flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap text-gray-600 hover:text-gray-900"
              >
                <AlertCircle size={20} /> Reports
              </button>
              <button
                onClick={() => navigate('/admin/users')}
                className="flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap text-gray-600 hover:text-gray-900"
              >
                <Shield size={20} /> Users
              </button>
            </div>
          </div>

          {/* Items Tab */}
          {activeTab === 'items' && (
            <div className="rounded-xl shadow-md p-6 bg-white">
              <ItemFilters
                showItemFilters={showItemFilters}
                onToggle={() => setShowItemFilters((prev) => !prev)}
                itemSearchInput={itemSearchInput}
                onSearchChange={setItemSearchInput}
                itemFilters={itemFilters}
                onFilterChange={(key, value) => setItemFilters({ ...itemFilters, [key]: value })}
                onClearFilters={() => {
                  setItemFilters({ search: '', category: '', location: '', status: '' });
                  setItemSearchInput('');
                }}
              />

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  All Items {itemsPagination.total ? `(${itemsPagination.total})` : ''}
                </h2>
                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3 sm:ml-4">
                  <button
                    onClick={() => navigate('/admin/reports')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Reports
                  </button>
                  <button
                    onClick={handleDownloadCsv}
                    disabled={downloadingCsv || csvCooldown}
                    className={`flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold ${
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
                    className={`flex items-center justify-center p-2 rounded-lg font-semibold transition-all bg-gray-100 hover:bg-gray-200 text-gray-700 ${
                      refreshing || refreshCooldown ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="Refresh items"
                  >
                    <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={openCreateModal}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Plus size={20} /> Add New Item
                  </button>
                </div>
              </div>

              <ItemsTable
                items={items}
                loading={loading}
                CATEGORY_DISPLAY_NAMES={CATEGORY_DISPLAY_NAMES}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
                itemsPage={itemsPage}
                itemsPagination={itemsPagination}
                onSetPage={setItemsPage}
              />
            </div>
          )}

          {/* Claims Tabs */}
          {(activeTab === 'claims' || activeTab === 'approved-claims' || activeTab === 'rejected-claims') && (
            <ClaimsTab
              status={
                activeTab === 'claims' ? 'pending'
                : activeTab === 'approved-claims' ? 'approved'
                : 'rejected'
              }
              claims={claims}
              loading={loading}
              claimsPagination={claimsPagination}
              claimsPage={claimsPage}
              setClaimsPage={setClaimsPage}
              claimSearchInput={claimSearchInput}
              handleClaimSearchChange={setClaimSearchInput}
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
          <ItemForm
            showModal={showModal}
            onClose={() => setShowModal(false)}
            modalType={modalType}
            formData={formData}
            setFormData={setFormData}
            selectedItem={selectedItem}
            submitting={submitting}
            onCreateItem={handleCreateItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            remarkText={remarkText}
            setRemarkText={setRemarkText}
            approveCooldown={approveCooldown}
            rejectCooldown={rejectCooldown}
            onApproveClaim={handleApproveClaim}
            onRejectClaim={handleRejectClaim}
          />
        </div>
      </div>

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
