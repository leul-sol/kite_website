"use client";

import { useState } from "react";
import { X, ChevronRight, ChevronLeft, Upload } from "lucide-react";
import styles from "./Listings.module.css";
import { motion, AnimatePresence } from "framer-motion";

interface ListingEditorProps {
  onClose: () => void;
}

export default function ListingEditor({ onClose }: ListingEditorProps) {
  const [step, setStep] = useState(1);
  
  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={styles.modalOverlay}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)' }}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-card" 
        style={{ width: '100%', maxWidth: '800px', padding: 'var(--space-2xl)', position: 'relative' }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', color: 'var(--text-tertiary)' }}>
          <X size={24} />
        </button>

        <div className={styles.editorHeader}>
          <h2 className="h2">{step === 1 ? 'Basic Information' : step === 2 ? 'Media & Details' : 'Pricing & Inventory'}</h2>
        </div>

        <div className={styles.stepIndicator}>
          <span className={`${styles.step} ${step >= 1 ? styles.stepActive : ''}`}>1. Basics</span>
          <span className={`${styles.step} ${step >= 2 ? styles.stepActive : ''}`}>2. Media</span>
          <span className={`${styles.step} ${step >= 3 ? styles.stepActive : ''}`}>3. Terms</span>
        </div>

        <div style={{ minHeight: '350px' }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={styles.formGrid}
              >
                <div className="form-group full-width">
                  <label className="text-small">Listing Name</label>
                  <input type="text" className="input" placeholder='e.g., "Royal Velvet Ottoman"' style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', marginTop: '8px' }} />
                </div>
                <div>
                  <label className="text-small">Category</label>
                  <select style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', marginTop: '8px' }}>
                    <option>Furniture</option>
                    <option>Decor</option>
                    <option>Lighting</option>
                  </select>
                </div>
                <div>
                  <label className="text-small">Material</label>
                  <input type="text" className="input" placeholder="e.g., Velvet, Oak" style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', marginTop: '8px' }} />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2xl)', textAlign: 'center', cursor: 'pointer' }}>
                  <Upload size={48} style={{ color: 'var(--accent-primary)', marginBottom: 'var(--space-md)' }} />
                  <p className="text-body">Click or drag images to upload</p>
                  <p className="text-small">(Max 5 images, high resolution preferred)</p>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={styles.formGrid}
              >
                <div>
                  <label className="text-small">Daily Rate ($)</label>
                  <input type="number" className="input" placeholder="0.00" style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', marginTop: '8px' }} />
                </div>
                <div>
                  <label className="text-small">Initial Stock</label>
                  <input type="number" className="input" placeholder="10" style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', marginTop: '8px' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-2xl)' }}>
          <button className="btn-secondary" onClick={prevStep} disabled={step === 1} style={{ visibility: step === 1 ? 'hidden' : 'visible' }}>
            <ChevronLeft size={18} /> Previous
          </button>
          
          {step < 3 ? (
            <button className="btn-primary" onClick={nextStep} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button className="btn-primary" onClick={onClose} style={{ background: 'var(--success)', color: '#000' }}>
              Publish Listing
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
