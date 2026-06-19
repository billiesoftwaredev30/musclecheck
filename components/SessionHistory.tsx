// components/SessionHistory.tsx
"use client";

import React, { useState } from "react";
import styles from "./SessionHistory.module.css";
import { DailySessionResponse, bulkDeleteSessions } from "@/lib/api";
import { ClipboardList, Check, Trash2, Plus, Camera, CalendarOff } from "lucide-react";
import ConfirmModal from "./ConfirmModal";

interface SessionHistoryProps {
  sessions: DailySessionResponse[];
  onDelete?: (id: number) => void;
  onBulkDelete?: () => void;
  onLogEntry?: () => void;
  onFaceCheckIn?: () => void;
  hasFaces?: boolean;
  loadingDelete?: boolean;
}

export default function SessionHistory({ sessions, onDelete, onBulkDelete, onLogEntry, onFaceCheckIn, hasFaces = false, loadingDelete }: SessionHistoryProps) {
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number }>({ open: false, id: 0 });
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loadingBulk, setLoadingBulk] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(sessions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedSessions = sessions.slice(startIndex, startIndex + pageSize);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [sessions]);

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(deleteModal.id);
    }
    setDeleteModal({ open: false, id: 0 });
  };

  const handleConfirmBulkDelete = async () => {
    setLoadingBulk(true);
    try {
      await bulkDeleteSessions(selectedIds);
      setSelectedIds([]);
      if (onBulkDelete) {
        onBulkDelete();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBulk(false);
      setBulkDeleteModal(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === sessions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sessions.map(s => s.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>
          <ClipboardList size={18} style={{ color: "var(--accent-cyan)" }} />
          Daily Session Log
        </h3>

        <div className={styles.actionsRow}>
          {selectedIds.length > 0 && onDelete && (
            <button className={styles.btnDanger} onClick={() => setBulkDeleteModal(true)}>
              <Trash2 size={14} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          {hasFaces && onFaceCheckIn && (
            <button className={styles.btnFace} onClick={onFaceCheckIn}>
              <Camera size={14} /> Face Check-In
            </button>
          )}
          {onLogEntry && (
            <button className={styles.btnPrimary} onClick={onLogEntry}>
              <Plus size={15} /> Log Entry
            </button>
          )}
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {sessions.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <CalendarOff size={22} />
            </div>
            <span className={styles.emptyText}>No check-ins recorded today</span>
            <span className={styles.emptySubtext}>Click &ldquo;Log Entry&rdquo; to record the first session</span>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                {onDelete && (
                  <th className={styles.th} style={{ width: "36px", textAlign: "center" }}>
                    <input type="checkbox" checked={selectedIds.length === sessions.length && sessions.length > 0} onChange={toggleSelectAll} />
                  </th>
                )}
                <th className={styles.th} style={{ width: "40px" }}>No.</th>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Time In</th>
                <th className={styles.th}>Assist</th>
                <th className={styles.th} style={{ textAlign: "center" }}>Member</th>
                <th className={styles.th} style={{ textAlign: "center" }}>Non-Mem</th>
                <th className={styles.th} style={{ textAlign: "center" }}>Coach</th>
                <th className={styles.th} style={{ textAlign: "right" }}>Amount</th>
                <th className={styles.th} style={{ textAlign: "center" }}>Payment</th>
                {onDelete && <th className={styles.th} style={{ textAlign: "center" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedSessions.map((session, index) => (
                <tr key={session.id} className={styles.tr}>
                  {onDelete && (
                    <td className={styles.tdCenter}>
                      <input type="checkbox" checked={selectedIds.includes(session.id)} onChange={() => toggleSelect(session.id)} />
                    </td>
                  )}
                  <td className={styles.tdMuted}>{startIndex + index + 1}</td>
                  <td className={styles.tdBold}>{session.client_name}</td>
                  <td className={styles.td}>{session.time_in}</td>
                  <td className={styles.td}>
                    <span className={styles.assistText}>
                      {session.client_assist === "NONE" ? "—" : session.client_assist}
                    </span>
                  </td>
                  <td className={styles.tdCenter}>
                    {session.is_member && (
                      <div className={styles.checkCircle}><Check size={10} strokeWidth={3} /></div>
                    )}
                  </td>
                  <td className={styles.tdCenter}>
                    {!session.is_member && (
                      <div className={styles.checkCircleWarning}><Check size={10} strokeWidth={3} /></div>
                    )}
                  </td>
                  <td className={styles.tdCenter}>
                    {session.deduct_coaching && (
                      <span className={styles.badgeCoaching}>DEDUCTED</span>
                    )}
                  </td>
                  <td className={styles.tdAmount}>
                    ₱{session.amount_paid.toLocaleString()}
                  </td>
                  <td className={styles.tdCenter}>
                    <span className={session.payment_method === "gcash" ? styles.badgeGcash : styles.badgeCash}>
                      {session.payment_method.toUpperCase()}
                    </span>
                  </td>
                  {onDelete && (
                    <td className={styles.tdCenter}>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => setDeleteModal({ open: true, id: session.id })}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            Showing {startIndex + 1}–{Math.min(startIndex + pageSize, sessions.length)} of {sessions.length} check-ins
          </span>
          <div className={styles.paginationControls}>
            <button
              className={styles.paginationBtn}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className={styles.paginationCurrent}>
              {currentPage} / {totalPages}
            </span>
            <button
              className={styles.paginationBtn}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteModal.open}
        variant="danger"
        title="Delete Session"
        description="Are you sure you want to delete this session? This action cannot be undone."
        confirmLabel="Delete Session"
        loading={loadingDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ open: false, id: 0 })}
      />

      <ConfirmModal
        open={bulkDeleteModal}
        variant="danger"
        title="Delete Multiple Sessions"
        description={`Are you sure you want to delete ${selectedIds.length} sessions? This action cannot be undone.`}
        confirmLabel="Delete All Selected"
        loading={loadingBulk}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkDeleteModal(false)}
      />
    </div>
  );
}
