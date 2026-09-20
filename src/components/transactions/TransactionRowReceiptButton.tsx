"use client";

import { useState } from "react";
import { Printer } from "@phosphor-icons/react";
import { ReceiptModal } from "@/components/transactions/ReceiptModal";
import type { TransactionWithBorrower } from "@/lib/types";

interface Props {
    transaction: TransactionWithBorrower;
}

export function TransactionRowReceiptButton({ transaction }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                aria-label="রসিদ প্রিন্ট"
                onClick={() => setOpen(true)}
                className="btn btn-ghost btn-xs rounded-md text-ink-soft hover:text-primary hover:bg-primary/10"
            >
                <Printer size={14} weight="regular" />
            </button>
            <ReceiptModal
                open={open}
                onClose={() => setOpen(false)}
                transaction={transaction}
                borrowerName={transaction.borrowerName}
                outstanding={transaction.outstanding}
            />
        </>
    );
}