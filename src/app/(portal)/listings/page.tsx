"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shell/PageHeader";
import ListingTable from "@/components/Listings/ListingTable";
import ListingEditor from "@/components/Listings/ListingEditor";

export default function ListingsPage() {
  const [showEditor, setShowEditor] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  return <div className="fade-in">
    <PageHeader title="Listings" description="Rentals and services customers can book. Keep photos and prices up to date."
      actions={<Button onClick={() => setShowEditor(true)}><Plus className="size-4" />Add listing</Button>} />
    <ListingTable refreshSignal={refreshSignal} onCreate={() => setShowEditor(true)} />
    {showEditor && <ListingEditor onClose={() => setShowEditor(false)} onPublished={() => setRefreshSignal(v => v + 1)} />}
  </div>;
}
