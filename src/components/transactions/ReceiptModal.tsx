"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Printer } from "@phosphor-icons/react";
import { formatDateTime } from "@/lib/calculations";
import { formatBDT } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/payment-methods";
import type { Transaction } from "@/lib/types";

interface ReceiptModalProps {
    open: boolean;
    onClose: () => void;
    transaction: Transaction;
    borrowerName: string;
    borrowerPhone?: string;
    borrowerAddress?: string;
    outstanding?: number;
}

export function ReceiptModal({
    open,
    onClose,
    transaction,
    borrowerName,
    borrowerPhone,
    borrowerAddress,
    outstanding,
}: ReceiptModalProps) {
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open || typeof document === "undefined") return null;

    const isBorrowed = transaction.type === "borrowed";

    const handlePrint = () => {
        window.print();
    };

    const receiptContent = (
        <div id="receipt-print-area" ref={printRef}>
            <div style={{ textAlign: "center", borderBottom: "1px dashed #d1d5db", paddingBottom: "1rem", marginBottom: "1rem" }}>
                <p style={{ fontSize: "10px", letterSpacing: "0.2em", color: "#6b7280", textTransform: "uppercase", margin: 0 }}>
                    SHOFI TRADERS
                </p>
                <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1f2937", margin: "0.125rem 0 0" }}>
                    বাকির খাতা
                </p>
                {transaction.receiptNo && (
                    <p style={{ fontSize: "11px", color: "#6b7280", margin: "0.25rem 0 0" }}>
                        রসিদ নং: {transaction.receiptNo}
                    </p>
                )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6b7280", marginBottom: "1rem" }}>
                <span>তারিখ</span>
                <span style={{ color: "#1f2937", fontWeight: 500 }}>
                    {formatDateTime(transaction.date)}
                </span>
            </div>

            <div style={{ backgroundColor: "#f9fafb", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem" }}>
                <p style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.25rem" }}>
                    কাস্টমার
                </p>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937", margin: 0 }}>{borrowerName}</p>
                {borrowerPhone && (
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: "0.125rem 0 0" }}>
                        ফোন: {borrowerPhone}
                    </p>
                )}
                {borrowerAddress && (
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: "0.125rem 0 0" }}>
                        ঠিকানা: {borrowerAddress}
                    </p>
                )}
            </div>

            <div style={{ backgroundColor: "#f9fafb", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem" }}>
                <p style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.25rem" }}>
                    হিসাবের বিবরণ
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        borderRadius: "9999px",
                        border: isBorrowed ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                        background: isBorrowed ? "rgba(59, 130, 246, 0.1)" : "rgba(16, 185, 129, 0.1)",
                        color: isBorrowed ? "#3b82f6" : "#10b981",
                        padding: "0.125rem 0.5rem",
                        fontSize: "11px",
                        fontWeight: 500,
                    }}>
                        {isBorrowed ? "বাকি নেওয়া" : "টাকা জমা"}
                    </span>
                    <span style={{
                        fontSize: "1.125rem",
                        fontWeight: 700,
                        color: isBorrowed ? "#3b82f6" : "#10b981",
                        fontVariantNumeric: "tabular-nums",
                    }}>
                        {isBorrowed ? "+" : "−"}
                        {formatBDT(transaction.amount)}
                    </span>
                </div>
                {transaction.paymentMethod && (
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: "0.5rem 0 0" }}>
                        মাধ্যম: <span style={{ color: "#1f2937", fontWeight: 500 }}>
                            {paymentMethodLabel(transaction.paymentMethod)}
                        </span>
                    </p>
                )}
                {transaction.note && (
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: "0.25rem 0 0" }}>
                        নোট: <span style={{ color: "#1f2937" }}>{transaction.note}</span>
                    </p>
                )}
            </div>

            {typeof outstanding === "number" && (
                <div style={{ backgroundColor: "#f9fafb", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem" }}>
                    <p style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.25rem" }}>
                        মোট হিসাব
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>মোট পাওয়া</span>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#1f2937", fontVariantNumeric: "tabular-nums" }}>
                            {formatBDT(outstanding)}
                        </span>
                    </div>
                </div>
            )}

            <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px dashed #d1d5db" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div style={{ fontSize: "10px", color: "#6b7280" }}>
                        <p style={{ margin: 0 }}>স্বাক্ষর</p>
                        <div style={{ marginTop: "1.5rem", width: "6rem", borderBottom: "1px solid #d1d5db" }} />
                    </div>
                    <div style={{ fontSize: "10px", color: "#6b7280", textAlign: "right" }}>
                        <p style={{ margin: 0 }}>গ্রাহকের স্বাক্ষর</p>
                        <div style={{ marginTop: "1.5rem", width: "6rem", borderBottom: "1px solid #d1d5db", marginLeft: "auto" }} />
                    </div>
                </div>
            </div>

            <p style={{ textAlign: "center", fontSize: "9px", color: "#6b7280", marginTop: "1.5rem", marginBottom: 0 }}>
                এই রসিদটি কম্পিউটার জেনারেটেড
            </p>
        </div>
    );

    return createPortal(
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          body > *:not(.receipt-print-root) {
            display: none !important;
          }
          .receipt-print-root {
            display: block !important;
            position: static !important;
          }
          .receipt-modal-shell {
            display: none !important;
          }
        }
      `}} />

            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm receipt-modal-shell"
                onClick={onClose}
            >
                <div
                    className="relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl receipt-modal-shell"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-base-200 bg-white px-5 py-3 rounded-t-2xl receipt-modal-shell">
                        <h2 className="text-sm font-semibold text-ink">রসিদ</h2>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="btn btn-ghost btn-sm rounded-lg text-primary hover:bg-primary/10"
                            >
                                <Printer size={16} weight="regular" />
                                <span className="text-xs">প্রিন্ট</span>
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-ghost btn-sm btn-square rounded-lg"
                            >
                                <X size={16} weight="regular" />
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-6 receipt-modal-shell">
                        {receiptContent}
                    </div>
                </div>
            </div>

            <div
                className="receipt-print-root"
                style={{
                    display: "none",
                    maxWidth: "420px",
                    margin: "0 auto",
                    padding: "2rem 1.5rem",
                }}
            >
                {receiptContent}
            </div>
        </>,
        document.body
    );
}