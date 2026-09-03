"use client";

import { useState } from "react";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import { Plus, ListNumbers } from "@phosphor-icons/react";
import type { EditableInvoice } from "@/lib/types";

export default function InvoicesPage() {
    const [tab, setTab] = useState<"new" | "history">("new");
    const [editingInvoice, setEditingInvoice] = useState<EditableInvoice | null>(null);

    const handleEdit = (invoice: EditableInvoice) => {
        setEditingInvoice(invoice);
        setTab("new");
    };

    const handleExitEdit = () => {
        setEditingInvoice(null);
        setTab("history");
    };

    const handleNew = () => {
        setEditingInvoice(null);
        setTab("new");
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink md:text-3xl">
                        Invoices
                    </h1>
                    <p className="mt-0.5 text-sm text-ink-soft">
                        Create and manage professional delivery challans for Shofi Traders.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex rounded-lg border border-base-300 bg-base-200/50 p-0.5">
                    <button
                        onClick={handleNew}
                        className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-all ${tab === "new"
                            ? "bg-white text-primary shadow-sm"
                            : "text-ink-soft hover:text-ink"
                            }`}
                    >
                        <Plus size={16} />
                        New Invoice
                    </button>
                    <button
                        onClick={() => setTab("history")}
                        className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-all ${tab === "history"
                            ? "bg-white text-primary shadow-sm"
                            : "text-ink-soft hover:text-ink"
                            }`}
                    >
                        <ListNumbers size={16} />
                        History
                    </button>
                </div>
            </header>

            {/* Tab Content */}
            {tab === "new" ? (
                <InvoiceForm
                    key={editingInvoice?._id ?? "new"}
                    initialInvoice={editingInvoice}
                    onExitEdit={handleExitEdit}
                />
            ) : (
                <InvoiceList onEdit={handleEdit} />
            )}
        </div>
    );
}
