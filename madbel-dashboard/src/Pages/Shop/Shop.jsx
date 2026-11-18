import React, { useEffect, useMemo, useState } from "react";
import { Edit, Package, Plus, Search, Trash2 } from "lucide-react";
import {
  adminCreateProduct,
  adminDeleteProduct,
  adminListProducts,
  adminToggleProductStatus,
  adminUpdateProduct,
} from "../../services/shopApi";

const ITEMS_PER_PAGE = 8;

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add"); // "add" | "edit"
  const [currentProduct, setCurrentProduct] = useState({
    id: "",
    name: "",
    category: "",
    price: "",
    stock: "100",
    description: "",
    isActive: true,
  });
  const [deletingProduct, setDeletingProduct] = useState(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await adminListProducts({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: search.trim() || undefined,
      });
      const rows = Array.isArray(res?.data) ? res.data : [];
      setProducts(rows);
      setTotalItems(res?.meta?.totalItems ?? rows.length);
    } catch {
      setProducts([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [currentPage, search]);

  const handleOpenAdd = () => {
    setModalType("add");
    setCurrentProduct({
      id: "",
      name: "",
      category: "General",
      price: "",
      stock: "100",
      description: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setModalType("edit");
    setCurrentProduct({
      id: p.id || p._id,
      name: p.name || "",
      category: p.category || "General",
      price: String(p.price || ""),
      stock: String(p.stock || "100"),
      description: p.description || "",
      isActive: Boolean(p.isActive),
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentProduct.name.trim()) {
      alert("Product name is required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: currentProduct.name.trim(),
        category: currentProduct.category.trim() || "General",
        price: parseFloat(currentProduct.price) || 0.0,
        stock: parseInt(currentProduct.stock, 10) || 0,
        description: currentProduct.description.trim(),
        isActive: currentProduct.isActive,
      };

      if (modalType === "add") {
        await adminCreateProduct(payload);
      } else {
        await adminUpdateProduct({
          productId: currentProduct.id,
          body: payload,
        });
      }

      setIsModalOpen(false);
      await loadProducts();
    } catch (err) {
      alert(err?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      await adminToggleProductStatus({
        productId,
        status: !currentStatus,
      });
      setProducts((prev) =>
        prev.map((p) =>
          (p.id === productId || p._id === productId)
            ? { ...p, isActive: !currentStatus }
            : p
        )
      );
    } catch (err) {
      alert(err?.message || "Failed to update product status");
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      const pid = deletingProduct.id || deletingProduct._id;
      await adminDeleteProduct({ productId: pid });
      setDeletingProduct(null);
      await loadProducts();
    } catch (err) {
      alert(err?.message || "Failed to delete product");
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  return (
    <div className="w-full p-6 bg-gray-50 min-h-screen">
      <div className="overflow-hidden bg-white border rounded-2xl border-slate-100 shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-[#17b4c9] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Package className="text-white w-7 h-7" />
            <h1 className="text-2xl font-semibold text-white">Product Inventory</h1>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-white rounded-md border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#17b4c9] bg-white rounded-md hover:bg-slate-50 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Price</th>
                <th className="px-6 py-3 font-medium">Stock</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    Loading inventory...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No products found in inventory.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const pid = p.id || p._id;
                  return (
                    <tr key={pid} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-lg text-slate-400">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{p.name}</div>
                          {p.description ? (
                            <div className="text-xs text-gray-400 truncate max-w-xs">{p.description}</div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                          {p.category || "General"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        ${parseFloat(p.price || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        {p.stock ?? 100}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(pid, p.isActive)}
                          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                            p.isActive
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          {p.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(p)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
            <span>
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} items
            </span>
            <div className="flex gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {modalType === "add" ? "Add Product" : "Edit Product"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={currentProduct.name}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#17b4c9]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={currentProduct.price}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#17b4c9]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={currentProduct.category}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#17b4c9]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={currentProduct.description}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#17b4c9]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={currentProduct.isActive}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, isActive: e.target.checked })}
                  className="rounded text-[#17b4c9] focus:ring-[#17b4c9]"
                />
                <label htmlFor="isActiveToggle" className="text-sm font-medium text-gray-700">
                  Active (visible in store)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#17b4c9] hover:bg-[#159eb0] rounded-lg disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Delete Product?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-800">{deletingProduct.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
