"use client";

import styles from "./Landing.module.css";
import FadeIn from "./FadeIn";

const bentoItems = [
  { 
    title: "Premium Furniture", 
    desc: "Luxury seating, tables, and lounge setups for high-end events.", 
    label: "Categories", 
    className: styles.itemLarge,
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2070&auto=format&fit=crop"
  },
  { 
    title: "Bespoke Decor", 
    desc: "Hand-picked details that define your event's character.", 
    label: "Inventory",
    className: styles.itemWide,
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop"
  },
  { 
    title: "Elite Logistics", 
    desc: "Seamless delivery and white-glove setup service.", 
    label: "Services"
  },
  { 
    title: "Verified Partners", 
    desc: "Only the most reliable and premium providers join our network.", 
    label: "Network"
  },
];

export default function BentoGrid() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionContent}>
        <FadeIn>
          <h2 className={styles.sectionTitle}>Curated Excellence</h2>
        </FadeIn>
        
        <div className={styles.bentoGrid}>
          {bentoItems.map((item, i) => (
            <FadeIn key={i} delay={i * 0.1} fullWidth={true}>
              <div className={`${styles.bentoItem} ${item.className || ''}`}>
                {item.image && <img src={item.image} className={styles.bentoImage} alt="" />}
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>{item.label}</span>
                  <h3 className={styles.itemTitle}>{item.title}</h3>
                  <p className={styles.itemDesc}>{item.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
