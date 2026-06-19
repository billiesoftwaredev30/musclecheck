// components/ClientManager.tsx
"use client";

import React, { useState, useEffect } from "react";
import styles from "./ClientManager.module.css";
import GlassCard from "./GlassCard";
import ConfirmModal from "./ConfirmModal";
import RegisterClientModal from "./RegisterClientModal";
import EditClientModal from "./EditClientModal";
import ActivateSubModal from "./ActivateSubModal";
import { useToast } from "./Toast";
import {
  ClientResponse,
  SubscriptionResponse,
  GymRatesResponse,
  createClient,
  addSubscription,
  fetchSubscriptions,
  updateSubscription,
  deleteSubscription,
  deleteClient,
  bulkDeleteClients,
} from "@/lib/api";
import {
  Users,
  UserPlus,
  Search,
  Sparkles,
  CheckCircle2,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  Eye,
  Save,
  UsersRound,
} from "lucide-react";

interface ClientManagerProps {
  clients: ClientResponse[];
  rates: GymRatesResponse | null;
  onClientsUpdated: () => void;
}

export default function ClientManager({ clients, rates, onClientsUpdated }: ClientManagerProps) {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  const [selectedClient, setSelectedClient] = useState<ClientResponse | null>(null);
  const [clientToEdit, setClientToEdit] = useState<ClientResponse | null>(null);

  // Subscription view/edit states
  const [viewingSubsForClient, setViewingSubsForClient] = useState<number | null>(null);
  const [clientSubs, setClientSubs] = useState<SubscriptionResponse[]>([]);
  const [editingSub, setEditingSub] = useState<SubscriptionResponse | null>(null);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState<"cash" | "gcash">("gcash");

  const [loading, setLoading] = useState(false);

  // Modal state
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: "client" | "subscription";
    id: number;
    name: string;
  }>({ open: false, type: "client", id: 0, name: "" });

  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]);
  const [loadingBulk, setLoadingBulk] = useState(false);

  const filteredClients = clients.filter((c) =>
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredClients.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (currentPage > 1 && startIndex >= filteredClients.length) {
      setCurrentPage(Math.max(1, Math.ceil(filteredClients.length / pageSize)));
    }
  }, [filteredClients.length, startIndex, currentPage]);

  const loadSubscriptions = async (clientId: number) => {
    if (viewingSubsForClient === clientId) {
      setViewingSubsForClient(null);
      setClientSubs([]);
      return;
    }
    try {
      const subs = await fetchSubscriptions(clientId);
      setClientSubs(subs);
      setViewingSubsForClient(clientId);
      setEditingSub(null);
    } catch (err: any) {
      toast.error("Failed to load subscriptions");
    }
  };

  const startEditSub = (sub: SubscriptionResponse) => {
    setEditingSub(sub);
    setEditStartDate(sub.start_date);
    setEditEndDate(sub.end_date);
    setEditPaymentMethod(sub.payment_method as "cash" | "gcash");
  };

  const handleEditSub = async () => {
    if (!editingSub) return;
    setLoading(true);
    try {
      await updateSubscription(editingSub.id, {
        start_date: editStartDate,
        end_date: editEndDate,
        payment_method: editPaymentMethod,
      });
      setEditingSub(null);
      toast.success("Subscription updated!");
      if (viewingSubsForClient) {
        const subs = await fetchSubscriptions(viewingSubsForClient);
        setClientSubs(subs);
      }
      onClientsUpdated();
    } catch (err: any) {
      toast.error("Update failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteClientModal = (client: ClientResponse) => {
    setDeleteModal({ open: true, type: "client", id: client.id, name: client.full_name });
  };

  const openDeleteSubModal = (subId: number) => {
    setDeleteModal({ open: true, type: "subscription", id: subId, name: "" });
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      if (deleteModal.type === "client") {
        await deleteClient(deleteModal.id);
        toast.success("Client removed");
        setViewingSubsForClient(null);
        setSelectedClientIds(prev => prev.filter(id => id !== deleteModal.id));
      } else {
        await deleteSubscription(deleteModal.id);
        toast.success("Subscription deleted");
        if (viewingSubsForClient) {
          const subs = await fetchSubscriptions(viewingSubsForClient);
          setClientSubs(subs);
        }
      }
      onClientsUpdated();
    } catch (err: any) {
      toast.error("Delete failed", err.message);
    } finally {
      setLoading(false);
      setDeleteModal((prev) => ({ ...prev, open: false }));
    }
  };

  const handleConfirmBulkDelete = async () => {
    setLoadingBulk(true);
    try {
      await bulkDeleteClients(selectedClientIds);
      toast.success(`${selectedClientIds.length} clients removed`);
      setViewingSubsForClient(null);
      setSelectedClientIds([]);
      onClientsUpdated();
    } catch (err: any) {
      toast.error("Bulk delete failed", err.message);
    } finally {
      setLoadingBulk(false);
      setBulkDeleteModal(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedClientIds.length === filteredClients.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(filteredClients.map(c => c.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedClientIds.includes(id)) {
      setSelectedClientIds(selectedClientIds.filter(x => x !== id));
    } else {
      setSelectedClientIds([...selectedClientIds, id]);
    }
  };

  // Toast wrappers for modals
  const handleSuccess = (msg: string) => toast.success(msg);
  const handleError = (msg: string) => toast.error(msg);

  return (
    <div className={styles.container}>
      <div className={styles.flexLayout}>
        {/* Client Database Table */}
        <GlassCard className={styles.tableCard}>
          <div className={styles.searchRow}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h3 className={styles.title} style={{ margin: 0 }}>
                <Users size={18} style={{ color: "var(--accent-cyan)" }} />
                Client Database
              </h3>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {selectedClientIds.length > 0 && (
                  <button
                    onClick={() => setBulkDeleteModal(true)}
                    className={styles.actionButtonDanger}
                    style={{ padding: "7px 12px", fontSize: "0.8rem" }}
                  >
                    <Trash2 size={13} /> Delete ({selectedClientIds.length})
                  </button>
                )}
                <button
                  onClick={() => setRegisterModalOpen(true)}
                  className={styles.button}
                >
                  <UserPlus size={15} /> Register Client
                </button>
              </div>
            </div>
            <div style={{ position: "relative", width: "100%", maxWidth: "260px" }}>
              <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--foreground-muted)" }} />
              <input
                type="text"
                placeholder="Search clients..."
                className={styles.searchBar}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} style={{ width: "30px", textAlign: "center" }}>
                    <input type="checkbox" checked={selectedClientIds.length === filteredClients.length && filteredClients.length > 0} onChange={toggleSelectAll} />
                  </th>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th} style={{ textAlign: "center" }}>Coach Sessions</th>
                  <th className={styles.th}>Joined</th>
                  <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "48px 16px", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", color: "var(--foreground-muted)" }}>
                        <UsersRound size={28} style={{ opacity: 0.3 }} />
                        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>No clients found</span>
                        <span style={{ fontSize: "0.82rem", opacity: 0.7 }}>
                          {searchTerm ? "Try a different search term" : "Register your first client to get started"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedClients.map((client) => (
                    <React.Fragment key={client.id}>
                      <tr className={styles.tr}>
                        <td className={styles.td} style={{ textAlign: "center" }}>
                          <input type="checkbox" checked={selectedClientIds.includes(client.id)} onChange={() => toggleSelect(client.id)} />
                        </td>
                        <td className={styles.td} style={{ fontWeight: 600 }}>{client.full_name}</td>
                        <td className={styles.td}>
                          <span
                            className={`${styles.badge} ${
                              client.status === "subscriber" ? styles.badgeSubscriber
                              : client.status === "member" ? styles.badgeMember
                              : styles.badgeWalkIn
                            }`}
                          >
                            {client.status}
                          </span>
                        </td>
                        <td className={styles.td} style={{ textAlign: "center", fontWeight: 700, color: client.pt_sessions_remaining > 0 ? "var(--accent-cyan)" : "var(--foreground-muted)" }}>
                          {client.pt_sessions_remaining || "–"}
                        </td>
                        <td className={styles.td} style={{ color: "var(--foreground-muted)", fontSize: "0.78rem" }}>
                          {new Date(client.date_joined).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className={styles.td}>
                          <div className={styles.actionsCell}>
                            {client.status === "subscriber" ? (
                              <button className={styles.actionButtonEdit} onClick={() => loadSubscriptions(client.id)}>
                                <Eye size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                                {viewingSubsForClient === client.id ? "Hide" : "Subs"}
                              </button>
                            ) : (
                              <button
                                className={styles.actionButton}
                                onClick={() => setSelectedClient(client)}
                              >
                                + Sub
                              </button>
                            )}
                            <button className={styles.actionButtonEdit} onClick={() => setClientToEdit(client)}>
                              <Pencil size={12} />
                            </button>
                            <button className={styles.actionButtonDanger} onClick={() => openDeleteClientModal(client)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded subscription details row */}
                      {viewingSubsForClient === client.id && (
                        <tr>
                          <td colSpan={6} style={{ padding: "0 14px 14px" }}>
                            <div className={styles.subPanel}>
                              <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                                <CalendarDays size={14} style={{ color: "var(--accent-fuchsia)" }} />
                                Subscriptions for {client.full_name}
                              </div>
                              {clientSubs.length === 0 ? (
                                <p style={{ color: "var(--foreground-muted)", fontSize: "0.82rem", fontStyle: "italic" }}>
                                  No subscription records found.
                                </p>
                              ) : (
                                clientSubs.map((sub) => (
                                  <div key={sub.id} className={styles.subItem}>
                                    {editingSub?.id === sub.id ? (
                                      /* Inline Edit Form */
                                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                          <input
                                            type="date"
                                            className={styles.input}
                                            style={{ flex: 1, minWidth: "140px" }}
                                            value={editStartDate}
                                            onChange={(e) => setEditStartDate(e.target.value)}
                                          />
                                          <input
                                            type="date"
                                            className={styles.input}
                                            style={{ flex: 1, minWidth: "140px" }}
                                            value={editEndDate}
                                            onChange={(e) => setEditEndDate(e.target.value)}
                                          />
                                          <select
                                            className={styles.select}
                                            style={{ flex: 1, minWidth: "100px" }}
                                            value={editPaymentMethod}
                                            onChange={(e) => setEditPaymentMethod(e.target.value as any)}
                                          >
                                            <option value="gcash">GCash</option>
                                            <option value="cash">Cash</option>
                                          </select>
                                        </div>
                                        <div className={styles.subActions}>
                                          <button className={styles.actionButtonEdit} onClick={handleEditSub} disabled={loading}>
                                            <Save size={12} style={{ marginRight: "3px", verticalAlign: "middle" }} /> Save
                                          </button>
                                          <button className={styles.actionButtonDanger} onClick={() => setEditingSub(null)}>
                                            <X size={12} /> Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      /* Read-only view */
                                      <>
                                        <div className={styles.subMeta}>
                                          <span style={{ fontWeight: 600 }}>
                                            {sub.start_date} → {sub.end_date}
                                          </span>
                                          <span style={{ color: "var(--foreground-muted)", fontSize: "0.78rem" }}>
                                            ₱{sub.amount_paid.toLocaleString()} via {sub.payment_method.toUpperCase()} •{" "}
                                            <span style={{ color: sub.status === "active" ? "var(--success)" : "var(--foreground-muted)", fontWeight: 600 }}>
                                              {sub.status.toUpperCase()}
                                            </span>
                                          </span>
                                        </div>
                                        <div className={styles.subActions}>
                                          <button className={styles.actionButtonEdit} onClick={() => startEditSub(sub)}>
                                            <Pencil size={12} />
                                          </button>
                                          <button className={styles.actionButtonDanger} onClick={() => openDeleteSubModal(sub.id)}>
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))
                              )}
                              {/* Quick add another subscription */}
                              <button
                                className={styles.actionButton}
                                style={{ marginTop: "8px" }}
                                onClick={() => setSelectedClient(client)}
                              >
                                + Add New Subscription
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "12px 4px 4px", borderTop: "1px solid var(--glass-border)", flexWrap: "wrap", gap: "10px" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--foreground-muted)" }}>
                Showing {startIndex + 1}–{Math.min(startIndex + pageSize, filteredClients.length)} of {filteredClients.length} clients
              </span>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={styles.buttonGhost}
                  style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                >
                  Previous
                </button>
                <span style={{ fontSize: "0.82rem", color: "var(--foreground)", fontWeight: 700, padding: "0 4px" }}>
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={styles.buttonGhost}
                  style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModal.open}
        variant="danger"
        title={
          deleteModal.type === "client"
            ? "Delete Client"
            : "Delete Subscription"
        }
        description={
          deleteModal.type === "client" ? (
            <>Are you sure you want to remove <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{deleteModal.name}</span> and all their subscription data? This action is permanent.</>
          ) : (
            "Are you sure you want to delete this subscription record? This action cannot be undone."
          )
        }
        confirmLabel={deleteModal.type === "client" ? "Delete Client" : "Delete Subscription"}
        loading={loading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal((prev) => ({ ...prev, open: false }))}
      />

      {/* Bulk Delete Modal */}
      <ConfirmModal
        open={bulkDeleteModal}
        variant="danger"
        title="Delete Multiple Clients"
        description={`Are you sure you want to remove ${selectedClientIds.length} clients and all their associated subscription data? This action is permanent.`}
        confirmLabel="Delete All Selected"
        loading={loadingBulk}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkDeleteModal(false)}
      />

      {/* Register Client Modal */}
      <RegisterClientModal
        open={registerModalOpen}
        rates={rates}
        onClose={() => setRegisterModalOpen(false)}
        onSuccess={handleSuccess}
        onError={handleError}
        onClientsUpdated={onClientsUpdated}
      />

      {/* Edit Client Modal */}
      <EditClientModal
        client={clientToEdit}
        onClose={() => setClientToEdit(null)}
        onSuccess={handleSuccess}
        onError={handleError}
        onClientsUpdated={onClientsUpdated}
      />

      {/* Activate Subscription Modal */}
      <ActivateSubModal
        client={selectedClient}
        rates={rates}
        onClose={() => setSelectedClient(null)}
        onSuccess={handleSuccess}
        onError={handleError}
        onClientsUpdated={onClientsUpdated}
      />
    </div>
  );
}
