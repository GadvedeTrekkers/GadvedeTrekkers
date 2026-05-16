import { useEffect, useState } from "react";
import { saveAdminItems } from "../data/adminStorage";
import { productService } from "../services/product.service";

function showSyncFailure(action, err) {
  const message = err?.message || "Backend sync failed";
  window.alert(`${action} could not be synced to the backend.\n\n${message}\n\nThe local change has been reverted so all devices stay consistent.`);
}

export function useAdminData(key, seedData = []) {
  const [data, setData] = useState(() => {
    if (seedData.length === 0) return productService.getLocal(key);
    const stored = productService.getLocal(key);
    if (stored.length === 0) return productService.seedIfEmpty(key, seedData);
    return productService.hydrate(key, seedData);
  });

  useEffect(() => {
    let cancelled = false;

    productService.adminList(key)
      .then((remoteItems) => {
        if (cancelled || !Array.isArray(remoteItems)) return;
        setData(remoteItems);
      })
      .catch((err) => console.warn("useAdminData: remote fetch failed -", err.message));

    return () => {
      cancelled = true;
    };
  }, [key]);

  const persist = (next) => {
    setData(next);
    saveAdminItems(key, next);
  };

  const replaceWithRemote = (matchId, remote) => {
    setData((prev) => {
      const next = prev.map((entry) => (entry.id === matchId ? remote : entry));
      saveAdminItems(key, next);
      return next;
    });
  };

  const add = (item) => {
    const previous = data;
    const created = { ...item, active: true, id: Date.now().toString() };
    persist([...previous, created]);

    productService
      .save(key, created, (remote) => replaceWithRemote(created.id, remote))
      .catch((err) => {
        console.warn("useAdminData.add: backend sync failed -", err.message);
        persist(previous);
        showSyncFailure("This new item", err);
      });

    return created;
  };

  const update = (id, item) => {
    const previous = data;
    const updated = { ...item, id };
    persist(previous.map((entry) => (entry.id === id ? updated : entry)));

    productService
      .save(key, updated, (remote) => replaceWithRemote(id, remote))
      .catch((err) => {
        console.warn("useAdminData.update: backend sync failed -", err.message);
        persist(previous);
        showSyncFailure("This update", err);
      });

    return updated;
  };

  const remove = (id) => {
    const previous = data;
    const target = previous.find((entry) => entry.id === id);
    persist(previous.filter((entry) => entry.id !== id));

    productService
      .remove(key, target)
      .catch((err) => {
        console.warn("useAdminData.remove: backend sync failed -", err.message);
        persist(previous);
        showSyncFailure("This delete", err);
      });
  };

  const toggleActive = (id) => {
    const previous = data;
    const item = previous.find((entry) => entry.id === id);
    
    if (!item) {
      console.error("useAdminData.toggleActive: Item not found with id", id);
      return;
    }

    const next = previous.map((entry) =>
      entry.id === id ? { ...entry, active: !entry.active } : entry
    );
    persist(next);

    const updated = next.find((entry) => entry.id === id);
    console.log("useAdminData.toggleActive: Toggling status for", item.name || item.title, "to", updated.active);
    
    productService
      .save(key, updated)
      .then(() => {
        console.log("useAdminData.toggleActive: Successfully synced status change");
      })
      .catch((err) => {
        console.error("useAdminData.toggleActive: backend sync failed -", err.message);
        persist(previous);
        showSyncFailure("This status change", err);
      });
  };

  return { data, add, update, remove, toggleActive };
}
