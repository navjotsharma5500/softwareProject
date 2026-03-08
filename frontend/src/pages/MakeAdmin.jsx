import React, { useState } from "react";
import { adminApi } from "../utils/api";
import { ArrowLeft, ShieldCheck, ShieldOff, Loader2, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ConfirmModal from "../components/ConfirmModal";

const MakeAdmin = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("make"); // "make" | "remove"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isRemove = tab === "remove";

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setEmail("");
    setCode("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim().toLowerCase().endsWith("@thapar.edu")) {
      toast.error("Email must be a @thapar.edu address.");
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      const res = isRemove
        ? await adminApi.removeAdmin(email, code)
        : await adminApi.makeAdmin(email, code);
      toast.success(res.data.message);
      setEmail("");
      setCode("");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/admin/")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          {isRemove ? (
            <ShieldOff className="w-7 h-7 text-red-500 shrink-0" />
          ) : (
            <ShieldCheck className="w-7 h-7 text-green-500 shrink-0" />
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Manage Admin Privileges
          </h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          {isRemove
            ? "Revoke admin access from an existing admin user."
            : "Grant admin access to an existing user account."}
        </p>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => handleTabChange("make")}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition-colors ${
              !isRemove
                ? "bg-green-600 text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Grant Admin
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("remove")}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition-colors ${
              isRemove
                ? "bg-red-600 text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            <ShieldOff className="w-4 h-4" />
            Revoke Admin
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block mb-1.5 text-sm font-medium text-gray-700"
            >
              User Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              pattern=".+@thapar\.edu"
              title="Must be a @thapar.edu email address"
              className={`w-full border px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 transition-shadow ${
                isRemove
                  ? "border-gray-300 focus:ring-red-400"
                  : "border-gray-300 focus:ring-green-400"
              }`}
              placeholder="user@thapar.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="admin-code"
              className="block mb-1.5 text-sm font-medium text-gray-700"
            >
              Authorization Code
            </label>
            <div className="relative">
              <input
                id="admin-code"
                type={showCode ? "text" : "password"}
                autoComplete="current-password"
                className={`w-full border px-3 py-2.5 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 transition-shadow ${
                  isRemove
                    ? "border-gray-300 focus:ring-red-400"
                    : "border-gray-300 focus:ring-green-400"
                }`}
                placeholder="Enter secret code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowCode((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
                aria-label={showCode ? "Hide code" : "Show code"}
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              isRemove
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : isRemove ? (
              <>
                <ShieldOff className="w-4 h-4" />
                Revoke Admin
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Grant Admin
              </>
            )}
          </button>
        </form>
      </div>
    </div>

    <ConfirmModal
      isOpen={confirmOpen}
      variant={isRemove ? "danger" : "success"}
      title={isRemove ? "Revoke Admin Access?" : "Grant Admin Access?"}
      subtitle={email}
      description={
        isRemove
          ? "This will remove all admin privileges from this user. They will no longer be able to access the admin dashboard."
          : "This will grant full admin privileges to this user. They will have access to the admin dashboard and all management features."
      }
      confirmLabel={isRemove ? "Yes, Revoke" : "Yes, Grant"}
      confirmIcon={isRemove ? ShieldOff : ShieldCheck}
      cancelLabel="Cancel"
      onConfirm={handleConfirm}
      onCancel={() => setConfirmOpen(false)}
    />
    </>
  );
};

export default MakeAdmin;
