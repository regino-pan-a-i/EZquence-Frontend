'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  FaChartLine,
  FaBoxes,
  FaShoppingCart,
  FaSyncAlt,
  FaBars,
  FaTimes,
} from 'react-icons/fa';

// ==========================================
// EDITABLE CONFIGURATION
// ==========================================
// Modify these constants to customize your landing page content

// Brand Configuration
// Change brand name, colors (use Tailwind classes)
const BRAND_CONFIG = {
  brandName: 'EZquence',
  // Primary color for buttons and accents (Tailwind classes)
  primaryColor: 'bg-blue-600 hover:bg-blue-700 text-white',
  // Secondary color for outline buttons (Tailwind classes)
  secondaryColor: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950',
  // To replace the SVG logo with an image:
  // 1. Add your logo to /public/logo.png (or .jpg, .svg)
  // 2. Uncomment the Image import at top: import Image from 'next/image';
  // 3. Replace the <svg> element below with: <Image src="/logo.png" alt="Logo" width={64} height={64} />
};

// Hero Section Content
const HERO_CONTENT = {
  title: 'Streamline Your Manufacturing Operations',
  subtitle: 'Intelligent Sequencing for Modern Production',
  description:
    'EZquence is a comprehensive manufacturing management system that helps you optimize production workflows, track inventory in real-time, and manage orders efficiently. Built for manufacturers who demand precision and control.',
};

// Features Section
// Add or remove features as needed. Each feature needs: title, description, and iconName
const FEATURES = [
  {
    title: 'Real-Time Analytics',
    description:
      'Monitor production metrics and performance indicators with interactive dashboards. Make data-driven decisions with comprehensive reporting tools.',
    iconName: 'FaChartLine',
  },
  {
    title: 'Inventory Control',
    description:
      'Track materials, products, and supplies with precision. Automated alerts keep you informed about stock levels and reorder points.',
    iconName: 'FaBoxes',
  },
  {
    title: 'Order Management',
    description:
      'Streamline order processing from placement to fulfillment. Track order status, manage priorities, and ensure timely delivery.',
    iconName: 'FaShoppingCart',
  },
  {
    title: 'Production Workflow',
    description:
      'Optimize production sequences and resource allocation. Manage work orders, track progress, and improve operational efficiency.',
    iconName: 'FaSyncAlt',
  },
];

// Footer Content
const FOOTER_CONTENT = {
  copyrightText: `© ${new Date().getFullYear()} ${BRAND_CONFIG.brandName}. All rights reserved.`,
};

// ==========================================
// END EDITABLE CONFIGURATION
// ==========================================

// Icon mapping helper
const getIcon = (iconName: string) => {
  const iconClass = 'h-8 w-8';
  switch (iconName) {
    case 'FaChartLine':
      return <FaChartLine className={iconClass} />;
    case 'FaBoxes':
      return <FaBoxes className={iconClass} />;
    case 'FaShoppingCart':
      return <FaShoppingCart className={iconClass} />;
    case 'FaSyncAlt':
      return <FaSyncAlt className={iconClass} />;
    default:
      return <FaChartLine className={iconClass} />;
  }
};

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand Name */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center">
                {/* Logo SVG - Replace with Image component if you have a custom logo */}
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-gray-700 dark:text-gray-200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="font-semibold text-xl text-gray-900 dark:text-gray-100">
                {BRAND_CONFIG.brandName}
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/marketplace"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                Marketplace
              </Link>
              <Link
                href="/login"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href="/login?mode=signup"
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
              >
                Sign Up
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <FaTimes className="h-6 w-6" />
              ) : (
                <FaBars className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-neutral-800">
              <div className="flex flex-col gap-3">
                <Link
                  href="/marketplace"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors py-2"
                >
                  Marketplace
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors py-2"
                >
                  Login
                </Link>
                <Link
                  href="/login?mode=signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors text-center"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Large Logo */}
          <div className="flex justify-center mb-8">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-600 dark:to-blue-800 flex items-center justify-center shadow-lg">
              {/* Logo SVG - Replace with Image component if you have a custom logo */}
              <svg
                viewBox="0 0 24 24"
                className="h-12 w-12 text-white"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7l10 5 10-5-10-5z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Hero Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {HERO_CONTENT.title}
          </h1>

          {/* Hero Subtitle */}
          <p className="text-xl sm:text-2xl text-blue-600 dark:text-blue-400 font-semibold mb-6">
            {HERO_CONTENT.subtitle}
          </p>

          {/* Hero Description */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            {HERO_CONTENT.description}
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-md hover:shadow-lg ${BRAND_CONFIG.primaryColor}`}
            >
              Get Started
            </Link>
            <Link
              href="/login?mode=signup"
              className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${BRAND_CONFIG.secondaryColor}`}
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Powerful Features for Modern Manufacturing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to manage your production operations efficiently
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow border border-gray-200 dark:border-neutral-700"
              >
                {/* Feature Icon */}
                <div className="mb-4 text-blue-600 dark:text-blue-400">
                  {getIcon(feature.iconName)}
                </div>

                {/* Feature Title */}
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {feature.title}
                </h3>

                {/* Feature Description */}
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-neutral-950 border-t border-gray-200 dark:border-neutral-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>{FOOTER_CONTENT.copyrightText}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
