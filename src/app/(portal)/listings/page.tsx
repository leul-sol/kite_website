"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shell/PageHeader";
import ListingTable from "@/components/Listings/ListingTable";
import ListingEditor from "@/components/Listings/ListingEditor";
import { useT } from "@/i18n/I18nProvider";

export default function ListingsPage() {
  const [showEditor, setShowEditor] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const { t } = useT();

  return <div className="fade-in">
    <PageHeader title={t("nav.listings")} description={t("lst.description")}
      actions={<Button onClick={() => setShowEditor(true)}><Plus className="size-4" />{t("lst.add")}</Button>} />
    <ListingTable refreshSignal={refreshSignal} onCreate={() => setShowEditor(true)} />
    {showEditor && <ListingEditor onClose={() => setShowEditor(false)} onPublished={() => setRefreshSignal(v => v + 1)} />}
  </div>;
}
