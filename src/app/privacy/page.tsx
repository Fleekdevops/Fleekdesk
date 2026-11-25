import Link from "next/link";

const H = ({ children }: { children: React.ReactNode }) => <h2 className="mt-6 text-lg font-semibold">{children}</h2>;

export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl space-y-3 px-5 py-8 text-sm leading-relaxed text-slate-800">
      <Link href="/" className="text-emerald-700 underline">← FleekDesk</Link>
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="text-slate-500">Last updated: [DATE]. Template — have a Kenyan lawyer review before launch.</p>

      <H>1. Who we are</H>
      <p>FleekDesk is operated by [LEGAL NAME / BUSINESS], [ADDRESS], Kenya (&quot;we&quot;). We are a data controller under the Kenya Data Protection Act, 2019 (&quot;DPA&quot;). ODPC registration no.: [NUMBER]. Contact: [EMAIL].</p>

      <H>2. What we collect</H>
      <ul className="list-disc space-y-1 pl-5">
        <li><b>Account data:</b> email, password (hashed), plan status, usage count, time you accepted this policy.</li>
        <li><b>Transcripts you paste:</b> processed to generate results. We do not store transcripts; we store only the structured result you choose to save.</li>
        <li><b>Client records you save:</b> your clients&apos; names, phone numbers, budgets, preferred areas, financing status, objections and notes. These are personal data of third parties that you upload.</li>
      </ul>

      <H>3. Your responsibilities as an agent</H>
      <p>You are responsible for having a lawful basis, normally the client&apos;s informed consent, before recording a call, transcribing a voice note or entering a client&apos;s details here. Tell clients that the call is recorded and that their details may be processed with AI tools. We ask you to confirm this each time you analyze a transcript. Do not upload sensitive data (e.g. ID numbers, health or children&apos;s data) that is not needed.</p>

      <H>4. Why we use it</H>
      <p>To provide the service (analysis, client list, follow-up drafts), manage billing and access, keep the service secure, and meet legal obligations. We do not sell personal data or use it for advertising.</p>

      <H>5. Who processes it</H>
            <ul className="list-disc space-y-1 pl-5">
        <li><b>Google (Gemini API)</b> (AI processing of transcripts)</li>
        <li><b>Supabase</b> (database and authentication), hosted in Switzerland (Zurich)</li>
        <li><b>Vercel</b> (hosting), functions run in Frankfurt, Germany</li>
      </ul>
      <p>These providers may process data outside Kenya. We transfer data only with appropriate safeguards as required by the DPA and rely on your consent where needed. Please review each provider&apos;s data terms.</p>

      <H>6. Retention</H>
      <p>Saved client records and your account are kept until you delete them or delete your account. Deleting your account removes your profile and all saved records. Backups may persist for up to [30] days.</p>

      <H>7. Your rights</H>
      <p>Under section 26 of the DPA you may be informed of use of your data, access it, object to processing, correct it, and have it deleted. In the app, go to <b>Account</b> to <b>download your data</b> or <b>delete everything</b> instantly. Clients whose details you saved can ask you, or us, to access or erase their data; we will assist. You may complain to the Office of the Data Protection Commissioner (odpc.go.ke).</p>

      <H>8. Security</H>
      <p>Data is encrypted in transit, access is restricted per user by database row-level security, and transcripts are not logged. No system is perfectly secure; we will notify you and the ODPC of a breach as the DPA requires.</p>

      <H>9. Changes</H>
      <p>We will post updates here and notify you of material changes.</p>
    </main>
  );
}
