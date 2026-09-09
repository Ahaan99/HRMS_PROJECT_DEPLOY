import { useClientAuth } from "../../context/ClientAuthContext";

// Modules that are always available regardless of Master Control settings
const ALWAYS_ON = [
  "OVERVIEW",
  "PROPOSALS",
  "SOP_LIBRARY",
  "LEAVE_APPROVALS",
  "OFFER_LETTERS",
  "EMPLOYEE_SEARCH",
];

export default function FeatureGuard({ featureKey, children }) {
  const { enabledFeatures } = useClientAuth();

  if (ALWAYS_ON.includes(featureKey)) return children;
  if (!enabledFeatures?.includes(featureKey)) return null;

  return children;
}
