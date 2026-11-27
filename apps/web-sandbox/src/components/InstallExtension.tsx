import { Download, ExternalLink, ShieldCheck, MousePointer2, ScanLine } from 'lucide-react';

export function InstallExtension() {
  return <section className="install-page" aria-labelledby="install-title">
    <div className="install-copy"><span className="eyebrow">CLEARVIEW / CHROME EXTENSION</span><h1 id="install-title">Bring the inspector<br />to your own pages.</h1><p>Review visible charges, inspect accessibility findings, and choose reversible changes in a side panel beside the page.</p>
      <a className="primary-button download-extension" href="/downloads/clearview-extension.zip" download><Download size={19} />Download extension ZIP</a><small>Developer preview · Chrome desktop · No account</small>
      <div className="local-guarantee"><ShieldCheck size={20} /><div><strong>Your page stays in your browser.</strong><p>The extension reads the tab you open it on. It does not upload the page or contact a remote analysis service.</p></div></div>
    </div>
    <div className="install-steps"><h2>Install once. Inspect any permitted tab.</h2><ol>
      <li><span>01</span><div><h3>Extract the download</h3><p>Unzip the extension into a folder you can keep. The folder must contain <code>manifest.json</code>.</p></div></li>
      <li><span>02</span><div><h3>Load it in Chrome</h3><p>Open <code>chrome://extensions</code>, enable Developer mode, then choose <strong>Load unpacked</strong> and select that folder.</p></div></li>
      <li><span>03</span><div><h3>Open the page you want to inspect</h3><p><MousePointer2 size={15} />Select ClearView from Chrome’s extensions menu. This grants access to that tab.</p></div></li>
      <li><span>04</span><div><h3>Scan, review, then choose changes</h3><p><ScanLine size={15} />Use source links to check the evidence. Review changes before applying them. Export a report to reopen it here.</p></div></li>
    </ol><p className="install-note">Chrome blocks extensions on internal and some protected pages. This preview is loaded unpacked; it is not a Chrome Web Store listing.</p><a className="text-link" href="https://github.com/KnigguKniggu-droid/clearview" target="_blank" rel="noreferrer">Review the source <ExternalLink size={15} /></a></div>
  </section>;
}
