import { useCallback, useRef, useState } from "react";
import PromptModal from "../components/ui/PromptModal";

/**
 * Promise-based prompt: `const value = await ask({ title, label })`.
 * Resolves with the trimmed string, or null when the user cancels.
 *
 *   const { ask, PromptDialog } = usePrompt();
 *   ...
 *   const reason = await ask({ title: "Reject leave", label: "Reason", required: true });
 *   if (reason === null) return;
 *   ...
 *   return (<>{...page}<PromptDialog /></>);
 */
export default function usePrompt() {
  const [config, setConfig] = useState(null);
  const resolver = useRef(null);

  const ask = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolver.current = resolve;
      setConfig(options);
    });
  }, []);

  const finish = (value) => {
    resolver.current?.(value);
    resolver.current = null;
    setConfig(null);
  };

  const PromptDialog = useCallback(
    () => (
      <PromptModal
        open={!!config}
        {...(config || {})}
        onSubmit={(v) => finish(v)}
        onClose={() => finish(null)}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config],
  );

  return { ask, PromptDialog };
}
