"use client";

import { useState, useMemo } from "react";
import { requestProductAction } from "@/app/actions";
import { ProductCart, type Product } from "@/app/products/cart-client";

export function SearchClient({
  initialProducts,
  categories
}: {
  initialProducts: Product[];
  categories: string[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    product_name: "",
    category: "",
    description: ""
  });

  // Real-time filter
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.seller_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesCategory = selectedCategory === "" || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, initialProducts]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("product_name", requestFormData.product_name);
    formData.append("category", requestFormData.category);
    formData.append("description", requestFormData.description);

    try {
      await requestProductAction(formData);
      setRequestFormData({ product_name: "", category: "", description: "" });
      setShowRequestForm(false);
      alert("Product request submitted! Admin will review it soon.");
    } catch (error) {
      alert("Error: " + (error instanceof Error ? error.message : "Failed to submit request"));
    }
  };

  return (
    <>
      <form className="card form-grid" onSubmit={(e) => e.preventDefault()}>
        <label>
          Search (Real-time)
          <input
            type="text"
            placeholder="SKU, chemical, category, seller..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
        </label>
        <label>
          Category
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
        <div style={{ display: "flex", gap: "10px" }}>
          <small style={{ color: "var(--ink-2)", marginTop: "auto" }}>
            Found: <strong>{filteredProducts.length}</strong> product{filteredProducts.length !== 1 ? "s" : ""}
          </small>
        </div>
      </form>

      {filteredProducts.length === 0 ? (
        <div className="card stack" style={{ textAlign: "center", padding: "40px" }}>
          <p className="muted" style={{ fontSize: "1rem", marginBottom: "20px" }}>
            😟 No products found matching your search.
          </p>
          {!showRequestForm ? (
            <button
              onClick={() => setShowRequestForm(true)}
              style={{ width: "fit-content", margin: "0 auto" }}
            >
              Request Product From Admin
            </button>
          ) : (
            <form className="card stack" onSubmit={handleRequestSubmit} style={{ marginTop: "20px", maxWidth: "400px", margin: "20px auto" }}>
              <h3>Request a Product</h3>
              <label>
                Product Name *
                <input
                  type="text"
                  placeholder="e.g., Acetone, Sodium Nitrate..."
                  value={requestFormData.product_name}
                  onChange={(e) =>
                    setRequestFormData({ ...requestFormData, product_name: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Category
                <input
                  type="text"
                  placeholder="e.g., Solvents, Reagents..."
                  value={requestFormData.category}
                  onChange={(e) =>
                    setRequestFormData({ ...requestFormData, category: e.target.value })
                  }
                />
              </label>
              <label>
                Description (Optional)
                <textarea
                  placeholder="Purity, quantity needed, specifications..."
                  value={requestFormData.description}
                  onChange={(e) =>
                    setRequestFormData({ ...requestFormData, description: e.target.value })
                  }
                  rows={3}
                />
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit">Submit Request</button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setShowRequestForm(false);
                    setRequestFormData({ product_name: "", category: "", description: "" });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <ProductCart products={filteredProducts} />
      )}
    </>
  );
}
