import { useClientAuth } from "../../context/ClientAuthContext";
import { canAccessFeature } from "../../config/access";

export default function FeatureGuard({ featureKey, children }) {
  const { client, enabledFeatures } = useClientAuth();
  return canAccessFeature(featureKey, { client, enabledFeatures }) ? children : null;
}
