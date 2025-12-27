import { Query } from "appwrite";
import { databases } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";

// In real app, separate collections or a single 'catalog_items' collection with 'type' field
// This is a placeholder service
const MOCK_DELAY = 500;

const MOCK_DATA = {
  brands: [
    { $id: "1", name: "Toyota", enabled: true },
    { $id: "2", name: "Ford", enabled: true },
  ],
  models: [
    { $id: "1", name: "Corolla", brandId: "1" },
    { $id: "2", name: "Ranger", brandId: "2" },
  ],
  types: [
    { $id: "1", name: "Sedan" },
    { $id: "2", name: "SUV" },
  ],
};

export async function listCatalog(category) {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_DATA[category] || []);
    }, MOCK_DELAY);
  });
}
