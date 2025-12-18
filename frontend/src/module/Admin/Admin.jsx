import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import SidebarLayout from "./admin-components/SidebarLayout";
import ErrorBoundary from "./admin-components/ErrorBoundary";
import Login from "./admin-pages/Login";
import EmailLogin from "./admin-pages/EmailLogin";
import Register from "./admin-pages/Register";
import Dashboard from "./admin-pages/Dashboard";
import Products from "./admin-pages/Products";
import Orders from "./admin-pages/Orders";
import Categories from "./admin-pages/Categories";
import Users from "./admin-pages/Users";
import UserAnalytics from "./admin-pages/UserAnalytics";
import HeroCarousel from "./admin-pages/HeroCarousel";
import ComboDeals from "./admin-pages/ComboDeals";
import EditComboDeal from "./admin-pages/EditComboDeal";
import CouponManagement from "./admin-pages/CouponManagement";
import Blogs from "./admin-pages/Blogs";
import Announcements from "./admin-pages/Announcements";
import WishlistManagement from "./admin-pages/WishlistManagement";
import PaymentHistory from "./admin-pages/PaymentHistory";
import RefundManagement from "./admin-pages/RefundManagement";
import RevenueSettlement from "./admin-pages/RevenueSettlement";
import CustomerSupport from "./admin-pages/CustomerSupport";
import Settings from "./admin-pages/Settings";
import AdminProfile from "./admin-pages/AdminProfile";
import DataPage from "./admin-pages/DataPage";
import EditProduct from "./admin-pages/EditProduct";
import EditCategories from "./admin-pages/EditCategories";
import EditHeroCarousel from "./admin-pages/EditHeroCarousel";
import EditBlog from "./admin-pages/EditBlog";
import AdminForgotPassword from "./admin-pages/AdminForgotPassword";
import AdminOTPVerification from "./admin-pages/AdminOTPVerification";
import ProtectedRoute from "./admin-components/ProtectedRoute";

const Admin = () => {
  return (
    <ErrorBoundary>
      <Routes>
          {/* Public routes */}
          <Route path="login" element={<EmailLogin />} />
          <Route path="login-otp" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<AdminForgotPassword />} />
          <Route path="verify-otp" element={<AdminOTPVerification />} />

          {/* Protected routes - Now accessible without authentication */}
          <Route path="" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="products/new" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
          <Route path="products/edit/:id" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
          <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="categories/edit/:id" element={<ProtectedRoute><EditCategories /></ProtectedRoute>} />
          <Route path="categories/edit/new" element={<ProtectedRoute><EditCategories /></ProtectedRoute>} />
          <Route path="hero-carousel" element={<ProtectedRoute><HeroCarousel /></ProtectedRoute>} />
          <Route path="hero-carousel/edit/:id" element={<ProtectedRoute><EditHeroCarousel /></ProtectedRoute>} />
          <Route path="hero-carousel/new" element={<ProtectedRoute><EditHeroCarousel /></ProtectedRoute>} />
          <Route path="combo-deals" element={<ProtectedRoute><ComboDeals /></ProtectedRoute>} />
          <Route path="combo-deals/edit/:id" element={<ProtectedRoute><EditComboDeal /></ProtectedRoute>} />
          <Route path="combo-deals/new" element={<ProtectedRoute><EditComboDeal /></ProtectedRoute>} />
          <Route path="coupons" element={<ProtectedRoute><CouponManagement /></ProtectedRoute>} />
          <Route path="blogs" element={<ProtectedRoute><Blogs /></ProtectedRoute>} />
          <Route path="blogs/new" element={<ProtectedRoute><EditBlog /></ProtectedRoute>} />
          <Route path="blogs/edit/:id" element={<ProtectedRoute><EditBlog /></ProtectedRoute>} />
          <Route path="announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
          <Route path="wishlist" element={<ProtectedRoute><WishlistManagement /></ProtectedRoute>} />
          <Route path="data" element={<ProtectedRoute><DataPage /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="profile" element={<ProtectedRoute><AdminProfile /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="user-analytics" element={<ProtectedRoute><UserAnalytics /></ProtectedRoute>} />
          <Route path="payment-history" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
          <Route path="refund-management" element={<ProtectedRoute><RefundManagement /></ProtectedRoute>} />
          <Route path="revenue-settlement" element={<ProtectedRoute><RevenueSettlement /></ProtectedRoute>} />
          <Route path="customer-support" element={<ProtectedRoute><CustomerSupport /></ProtectedRoute>} />

          {/* Catch all route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
    </ErrorBoundary>
  );
};

export default Admin;

