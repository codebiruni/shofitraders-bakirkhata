"use client";

import { useOptimistic } from "react";
import {
    BorrowerTable,
    BorrowerCardList,
} from "@/components/borrowers/BorrowerTable";
import type { BorrowerWithStats } from "@/lib/types";

interface Props {
    initialBorrowers: BorrowerWithStats[];
}

export function BorrowerList({ initialBorrowers }: Props) {
    const [optimisticBorrowers, addOptimisticBorrower] = useOptimistic(
        initialBorrowers,
        (state, newBorrower: BorrowerWithStats) => [newBorrower, ...state]
    );

    return (
        <>
            <BorrowerTable borrowers={optimisticBorrowers} />
            <BorrowerCardList borrowers={optimisticBorrowers} />
        </>
    );
}
