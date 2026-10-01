"use client";

import { useOptimistic } from "react";
import {
    BorrowerTable,
    BorrowerCardList,
} from "@/components/borrowers/BorrowerTable";


export function BorrowerList({ initialBorrowers }: Props) {
    const [optimisticBorrowers, addOptimisticBorrower] = useOptimistic(
        initialBorrowers,
        (state, newBorrower: BorrowerWithStats) => [newBorrower, ...state]
    );

    return (
        <>

        </>
    );
}
