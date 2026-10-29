import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './client/context/AuthContext.js';
import { ProtectedRoute } from './client/components/ProtectedRoute.js';
import { AppLayout } from './client/components/AppLayout.js';

// Pages
import { Login } from './client/pages/Login.js';
import { Register } from './client/pages/Register.js';
import { AccountPending } from './client/pages/AccountPending.js';
import { Unauthorized } from './client/pages/Unauthorized.js';
import { NotFound } from './client/pages/NotFound.js';
import { Overview } from './client/pages/Overview.js';
import { Merchants } from './client/pages/Merchants.js';
import { Orders } from './client/pages/Orders.js';
import { EscrowMilestones } from './client/pages/EscrowMilestones.js';
import { Payouts } from './client/pages/Payouts.js';
import { Transactions } from './client/pages/Transactions.js';
import { AuditLogs } from './client/pages/AuditLogs.js';
import { Settings } from './client/pages/Settings.js';

// Modals
import { OrderCreateModal } from './client/components/OrderCreateModal.js';
import { PayoutCreateModal } from './client/components/PayoutCreateModal.js';
import { MilestoneApproveModal } from './client/components/MilestoneApproveModal.js';

import { fetchMerchants, fetchOrders } from './client/services/api.js';
import { Merchant, Order, Milestone } from './client/types/fintech.js';

function DashboardRoutes() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Global Modal States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Global Payout Modal
  const [payoutModalState, setPayoutModalState] = useState<{
    isOpen: boolean;
    order?: Order | null;
    merchantId?: string | null;
  }>({ isOpen: false, order: null, merchantId: null });

  // Global Milestone Approval Modal
  const [milestoneModalState, setMilestoneModalState] = useState<{
    isOpen: boolean;
    milestone: Milestone | null;
    orderNumber?: string;
  }>({ isOpen: false, milestone: null });

  const loadData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [merchRes, ordRes] = await Promise.all([
        fetchMerchants().catch(() => []),
        fetchOrders().catch(() => []),
      ]);
      setMerchants(merchRes);
      setOrders(ordRes);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenPayout = (order?: Order, merchantId?: string) => {
    setPayoutModalState({
      isOpen: true,
      order: order || null,
      merchantId: merchantId || null,
    });
  };

  const handleOpenMilestoneApprove = (milestone: Milestone, orderNumber: string) => {
    setMilestoneModalState({
      isOpen: true,
      milestone,
      orderNumber,
    });
  };

  return (
    <AppLayout
      onOpenCreateOrder={() => setIsOrderModalOpen(true)}
      onRefreshData={loadData}
      isRefreshing={isRefreshing}
    >
      <Routes>
        <Route
          path="/"
          element={
            <Overview
              onOpenCreateOrder={() => setIsOrderModalOpen(true)}
              onOpenInitiatePayout={() => handleOpenPayout()}
            />
          }
        />
        <Route path="/overview" element={<Navigate to="/" replace />} />
        <Route
          path="/account-pending"
          element={
            <ProtectedRoute allowedRoles={['MERCHANT']}>
              <AccountPending />
            </ProtectedRoute>
          }
        />

        {/* Admin only: Sub-Merchants Directory */}
        <Route
          path="/merchants"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}>
              <Merchants
                onInitiatePayout={(merchantId) => handleOpenPayout(undefined, merchantId)}
              />
            </ProtectedRoute>
          }
        />

        {/* Orders & Splits (Isolated for sub-merchants) */}
        <Route
          path="/orders"
          element={
            <Orders
              onOpenCreateOrder={() => setIsOrderModalOpen(true)}
              onApproveMilestone={handleOpenMilestoneApprove}
              onInitiatePayout={(order, merchantId) => handleOpenPayout(order, merchantId)}
            />
          }
        />

        {/* Escrow & Milestones */}
        <Route
          path="/escrow"
          element={
            <EscrowMilestones
              onInitiatePayout={(order, merchantId) => handleOpenPayout(order, merchantId)}
            />
          }
        />

        {/* Payouts */}
        <Route
          path="/payouts"
          element={
            <Payouts
              merchants={merchants}
              orders={orders}
              preselectedOrder={payoutModalState.order}
              preselectedMerchantId={payoutModalState.merchantId}
              onClearPreselections={() =>
                setPayoutModalState({ isOpen: false, order: null, merchantId: null })
              }
            />
          }
        />

        {/* Double-Entry Ledger Transactions */}
        <Route path="/transactions" element={<Transactions />} />

        {/* Admin only: Audit Logs */}
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />

        {/* Admin only: System Architecture */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Global Modals */}
      <OrderCreateModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
        merchants={merchants}
      />

      <PayoutCreateModal
        isOpen={payoutModalState.isOpen}
        onClose={() =>
          setPayoutModalState({ isOpen: false, order: null, merchantId: null })
        }
        onSuccess={() => {
          loadData();
        }}
        merchants={merchants}
        orders={orders}
        preselectedOrder={payoutModalState.order}
        preselectedMerchantId={payoutModalState.merchantId}
      />

      <MilestoneApproveModal
        isOpen={milestoneModalState.isOpen}
        onClose={() =>
          setMilestoneModalState({ isOpen: false, milestone: null })
        }
        onSuccess={() => {
          loadData();
        }}
        milestone={milestoneModalState.milestone}
        orderNumber={milestoneModalState.orderNumber}
      />
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Entry Point */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Application Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardRoutes />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
