const BRAND = "#1a2b4a";
const ACCENT = "#c8a24a";

/** Renders the block list returned by POST /offer-letter/preview as an A4-ish sheet. */
export default function LetterPreview({ data }) {
  if (!data) return null;
  const { letterhead, addressee, subject, refNo, blocks } = data;
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <article className="mx-auto w-full max-w-[720px] bg-white text-[13px] leading-relaxed text-[#222] shadow-lg" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      <header className="px-10 py-6 text-white" style={{ background: BRAND, borderBottom: `4px solid ${ACCENT}` }}>
        <h2 className="text-xl font-bold">{letterhead.company}</h2>
        <p className="text-xs text-[#c9d4e5]">{letterhead.location}</p>
        <p className="mt-1 text-[10px] font-bold tracking-wide" style={{ color: ACCENT }}>PRIVATE &amp; CONFIDENTIAL</p>
      </header>

      <div className="space-y-5 px-10 py-7">
        <div className="flex justify-between text-xs text-[#444]">
          <span>Ref: {refNo}</span>
          <span>Date: {today}</span>
        </div>
        <div>
          <p className="font-bold text-[#111]">{addressee.name}</p>
          {addressee.email ? <p className="text-xs text-[#555]">{addressee.email}</p> : null}
        </div>
        <p className="rounded bg-[#f4f6fa] px-3 py-2 font-bold" style={{ color: BRAND }}>Subject: {subject}</p>

        {blocks.map((b, i) => {
          if (b.type === "heading") return <h3 key={i} className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND }}>{b.text}</h3>;
          if (b.type === "paragraph") return <p key={i}>{b.text}</p>;
          if (b.type === "bullets") return <ul key={i} className="list-disc space-y-1 pl-5">{b.items.map((it, k) => <li key={k}>{it}</li>)}</ul>;
          if (b.type === "ctc_table") {
            return (
              <div key={i}>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: BRAND }}>Annexure A - Compensation Structure (Annual)</h3>
                <table className="w-full text-xs">
                  <tbody>
                    {b.rows.map((r, k) => {
                      const head = k === 0, total = k === b.rows.length - 1;
                      return (
                        <tr key={k} style={head ? { background: BRAND, color: "#fff" } : total ? { background: "#e9e2cf" } : k % 2 === 0 ? { background: "#f4f6fa" } : undefined} className={head || total ? "font-bold" : ""}>
                          <td className="px-2 py-1.5">{r[0]}</td>
                          <td className="px-2 py-1.5 text-right">{r[1]}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          }
          if (b.type === "terms") {
            return (
              <div key={i}>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: BRAND }}>Key Terms of Employment</h3>
                <ol className="list-decimal space-y-1.5 pl-5 text-xs">{b.items.map((t, k) => <li key={k}>{t}</li>)}</ol>
              </div>
            );
          }
          return null;
        })}

        <div className="pt-2">
          <p>Sincerely,</p>
          <p className="mt-6 font-bold">{letterhead.hrName}</p>
          <p className="text-xs text-[#555]">Human Resources, {letterhead.company}</p>
        </div>
        <div className="rounded border border-[#ccc] p-4 text-xs">
          <p className="mb-2 font-bold" style={{ color: BRAND }}>CANDIDATE ACCEPTANCE</p>
          <p>I have read and understood the terms above and accept this offer of employment.</p>
          <div className="mt-4 flex justify-between"><span>Signature: ____________________</span><span>Date: ______________</span></div>
        </div>
      </div>
      <footer className="px-10 py-2 text-center text-[10px] text-[#c9d4e5]" style={{ background: BRAND }}>
        {letterhead.company} | {letterhead.location} | {refNo} | This is a system-generated document.
      </footer>
    </article>
  );
}
