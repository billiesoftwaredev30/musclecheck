// components/LogProductModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./LogProductModal.module.css";
import { GymRatesResponse, logProductSale } from "@/lib/api";
import { X, Coffee, CupSoda, GlassWater, Loader2, Minus, Plus, ShoppingCart } from "lucide-react";
import { useToast } from "./Toast";

interface LogProductModalProps {
  open: boolean;
  rates: GymRatesResponse | null;
  onClose: () => void;
  onSaleLogged: () => void;
}

type ProductType = "Bottled Water" | "Black Coffee" | "Coffee w/ Creamer" | "Cucumber Lemonade";

export default function LogProductModal({ open, rates, onClose, onSaleLogged }: LogProductModalProps) {
  const [mounted, setMounted] = useState(false);
  const toast = useToast();

  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash">("cash");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setSelectedProduct(null);
      setQuantity(1);
      setPaymentMethod("cash");
    }
  }, [open]);

  if (!mounted || !open || !rates) return null;

  const products: { name: ProductType; price: number; icon: React.ReactNode }[] = [
    { name: "Bottled Water", price: rates.rate_bottled_water, icon: <GlassWater size={28} /> },
    { name: "Black Coffee", price: rates.rate_black_coffee, icon: <Coffee size={28} /> },
    { name: "Coffee w/ Creamer", price: rates.rate_coffee_creamer, icon: <Coffee size={28} /> },
    { name: "Cucumber Lemonade", price: rates.rate_cucumber_lemonade, icon: <CupSoda size={28} /> },
  ];

  const currentProduct = products.find(p => p.name === selectedProduct);
  const totalAmount = currentProduct ? currentProduct.price * quantity : 0;

  const handleSubmit = async () => {
    if (!selectedProduct || quantity < 1) return;
    
    setLoading(true);
    try {
      const now = new Date();
      await logProductSale({
        product_name: selectedProduct,
        quantity: quantity,
        date: now.toISOString().split("T")[0],
        time_sold: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
        amount_paid: totalAmount,
        payment_method: paymentMethod
      });
      toast.success(`${quantity}x ${selectedProduct} sold`);
      onSaleLogged();
      onClose();
    } catch (err: any) {
      toast.error("Sale failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            <ShoppingCart size={20} style={{ color: "var(--accent-fuchsia)" }} />
            Log Product Sale
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.productGrid}>
          {products.map((p) => (
            <div 
              key={p.name}
              className={selectedProduct === p.name ? styles.productCardActive : styles.productCard}
              onClick={() => setSelectedProduct(p.name)}
            >
              <div className={styles.productIcon}>{p.icon}</div>
              <div className={styles.productName}>{p.name}</div>
              <div className={styles.productPrice}>₱{p.price}</div>
            </div>
          ))}
        </div>

        {selectedProduct && (
          <>
            <div className={styles.quantityRow}>
              <span className={styles.quantityLabel}>Quantity</span>
              <div className={styles.quantityControls}>
                <button 
                  className={styles.qtyBtn} 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus size={14} />
                </button>
                <span className={styles.qtyValue}>{quantity}</span>
                <button 
                  className={styles.qtyBtn} 
                  onClick={() => setQuantity(q => q + 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Payment Method</label>
              <select
                className={styles.select}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as "cash" | "gcash")}
              >
                <option value="cash">Cash</option>
                <option value="gcash">GCash</option>
              </select>
            </div>

            <div className={styles.summary}>
              <span className={styles.totalLabel}>Total Amount</span>
              <span className={styles.totalAmount}>₱{totalAmount}</span>
            </div>

            <button 
              className={styles.submitBtn} 
              onClick={handleSubmit} 
              disabled={loading}
            >
              {loading ? <Loader2 size={18} className="spin" /> : <ShoppingCart size={18} />}
              {loading ? "Recording..." : "Record Sale"}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
