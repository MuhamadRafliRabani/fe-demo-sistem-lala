import React, { useState } from "react";
import { TableCell } from "./ui/table";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import Link from "next/link";
import { ScrollArea } from "./ui/scroll-area";

const ResultFileModalLink = ({ visibleCols, resultFile }) => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleOpenModal = () => {
    try {
      if (!resultFile) {
        setSelectedFiles([]);
      } else if (typeof resultFile === "string") {
        const parsed = JSON.parse(resultFile);
        setSelectedFiles(Array.isArray(parsed) ? parsed : [parsed]);
      } else if (Array.isArray(resultFile)) {
        setSelectedFiles(resultFile);
      } else {
        setSelectedFiles([resultFile]);
      }
      setOpenModal(true);
    } catch (e) {
      console.error("Error parsing resultFile:", e);
      setSelectedFiles([]);
      setOpenModal(true);
    }
  };

  return (
    <>
      {(!visibleCols || visibleCols.file) && (
        <TableCell>
          {resultFile ?
            <Button variant="link" onClick={handleOpenModal}>
              Lihat File
            </Button>
          : <span className="text-sm text-muted-foreground">
              Belum ada file
            </span>
          }
        </TableCell>
      )}

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Daftar File</DialogTitle>
            <DialogDescription>
              Berikut adalah file hasil pekerjaan.
            </DialogDescription>
          </DialogHeader>

          {selectedFiles.length === 0 && (
            <p className="text-sm text-muted-foreground">Tidak ada file.</p>
          )}

          <ScrollArea className="max-h-[400px] mt-4 pr-2">
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              {selectedFiles.map((file, i) => {
                const url =
                  typeof file === "string" ? file : (
                    file?.file || file?.url || ""
                  );
                return (
                  <Link
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-lg border bg-card hover:bg-accent/40 transition p-3 flex flex-col gap-2
          ${selectedFiles.length === 1 ? "col-span-2 lg:col-span-2" : ""}
        `}
                  >
                    <span className="text-sm font-semibold">File #{i + 1}</span>

                    <span className="text-xs text-muted-foreground break-all line-clamp-2">
                      {url}
                    </span>

                    <span className="text-xs text-blue-400 underline">
                      Buka
                    </span>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>

          <div className="flex justify-end mt-6">
            <Button onClick={() => setOpenModal(false)}>Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ResultFileModalLink;
