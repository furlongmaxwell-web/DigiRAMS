"use client"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const columnWidths = ["w-32", "w-48", "w-24", "w-40", "w-20"]

export function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columnWidths.map((width, i) => (
            <TableHead key={i}>
              <Skeleton className={`h-4 ${width}`} />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 8 }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {columnWidths.map((width, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton className={`h-4 ${width}`} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
