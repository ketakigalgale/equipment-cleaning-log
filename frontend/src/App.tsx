import { useState } from "react";
import { EquipmentDetailPage } from "./pages/EquipmentDetailPage";
import { EquipmentListPage } from "./pages/EquipmentListPage";
import { ActorProvider, useActor } from "./context/ActorContext";
import { Equipment } from "./types";

function ActorBar() {
  const { actor, setActor } = useActor();
  return (
    <label className="actor-bar">
      Current user
      <input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Your name" />
    </label>
  );
}

function AppShell() {
  const [selected, setSelected] = useState<Equipment | null>(null);
  const [listVersion, setListVersion] = useState(0);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Equipment Cleaning Log</h1>
        <ActorBar />
      </header>
      <main className="app-main">
        <EquipmentListPage
          key={listVersion}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
        />
        <section className="detail-pane">
          {selected ? (
            <EquipmentDetailPage
              equipment={selected}
              onEquipmentUpdated={(equipment) => {
                setSelected(equipment);
                setListVersion((v) => v + 1);
              }}
            />
          ) : (
            <p className="empty-state">Select a piece of equipment to view its cleaning records.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ActorProvider>
      <AppShell />
    </ActorProvider>
  );
}
