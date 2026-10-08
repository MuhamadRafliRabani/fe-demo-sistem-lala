"use client";

import { Skeleton } from "./ui/skeleton";
import {
  Table,
  TableRow,
  TableCell,
  TableBody,
  TableHeader,
  TableHead,
} from "./ui/table";

export const TableSkeleton = ({
  rows = 5,
  columns = [],
  includeAction = false,
}) => {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={`skeleton-${rowIndex}`}>
          {columns.map((col, index) => (
            <TableCell key={col.id || index}>
              <div className="h-4 w-[100px] bg-muted animate-pulse rounded" />
            </TableCell>
          ))}
          {includeAction && (
            <TableCell>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </TableCell>
          )}
        </TableRow>
      ))}
    </TableBody>
  );
};
