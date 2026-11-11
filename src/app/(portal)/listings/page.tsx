"use client";

import { useState } from "react";
import ListingTable from "@/components/Listings/ListingTable";
import ListingEditor from "@/components/Listings/ListingEditor";
import { Plus, Filter, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ListingsPage() {
  const [showEditor, setShowEditor] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  return (
    <div className="fade-in">
      <header style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <h1 className="h1">Inventory</h1>
          <p className="text-body">Manage your rental items and availability.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Export
          </button>
          <button onClick={() => setShowEditor(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add Listing
          </button>
        </div>
      </header>

      <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} /> Filters
        </button>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
          {['All Items', 'Active', 'Inactive', 'Low Stock'].map((filter, i) => (
            <button key={filter} style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', background: i === 0 ? 'var(--accent-primary)' : 'var(--glass-bg)', color: i === 0 ? '#000' : 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
              {filter}
            </button>
          ))}
        </div>
      </div>

      <ListingTable refreshSignal={refreshSignal} />

      <AnimatePresence>
        {showEditor && (
          <ListingEditor
            onClose={() => setShowEditor(false)}
            onPublished={() => setRefreshSignal((v) => v + 1)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
