import { HighlightedCode } from '../components/highlighted-code';
import externalLinkIcon from '../assets/external-link.svg?no-inline';
import { GETTING_STARTED_CODE } from '../docs';

export function GettingStartedPage() {
  return (
    <section class="page getting-started-page" aria-labelledby="page-title">
      <header class="page-intro">
        <p class="overline">Getting started</p>
        <h1 id="page-title" tabindex={-1}>
          TxtFSM
        </h1>
        <p>
          Convert semi-structured command output into predictable rows and objects using
          TextFSM-compatible templates.
        </p>

        <p class="license-note">
          TxtFSM includes a TypeScript adaptation of portions of Google TextFSM and is distributed
          under the{' '}
          <a href="https://github.com/yuyosy/txtfsm/blob/main/LICENSE">Apache License 2.0</a>, the
          same license as the original project. See the repository’s{' '}
          <a href="https://github.com/yuyosy/txtfsm/blob/main/NOTICE">NOTICE</a> for attribution.
        </p>
      </header>

      <div class="getting-started-section getting-started-layout">
        <div class="getting-started-left">
          <section class="getting-started-overview" aria-labelledby="overview-title">
            <h2 id="overview-title">What is TxtFSM?</h2>
            <p>
              TxtFSM is a TypeScript implementation of{' '}
              <a href="https://github.com/google/textfsm">Google TextFSM</a>, adapted in part from
              the original project. It is designed for line-oriented text such as network device
              command output and runs in both browser and Node.js environments.
            </p>
            <ul class="feature-list">
              <li>Define parsing rules separately from application code.</li>
              <li>Return positional rows or objects keyed by template values.</li>
              <li>Reuse a compiled parser or use one-off helper functions.</li>
            </ul>
          </section>

          <aside class="compatibility-summary" aria-labelledby="compatibility-title">
            <h3 id="compatibility-title">Supported syntax and compatibility</h3>
            <p>
              TxtFSM aims to match Google TextFSM 2.1.0 for supported syntax. It supports multiple
              states, the <code>Required</code>, <code>Filldown</code>, <code>Fillup</code>,{' '}
              <code>List</code>, and <code>Key</code> value options, and the <code>Record</code>,{' '}
              <code>NoRecord</code>, <code>Clear</code>, <code>Clearall</code>, <code>Next</code>,{' '}
              <code>Continue</code>, and <code>Error</code> rule actions.
            </p>
            <p>
              JavaScript and Python regular expressions differ. See the{' '}
              <a href="https://github.com/yuyosy/txtfsm#compatibility">compatibility notes</a> for
              details.
            </p>
          </aside>

          <section class="install-section" aria-labelledby="install-title">
            <h2 id="install-title">Install</h2>
            <div class="install-options">
              <div class="install-option">
                <h3>npm</h3>
                <pre class="install-command">
                  <code>npm install txtfsm</code>
                </pre>
              </div>
              <div class="install-option">
                <h3>JSR</h3>
                <pre class="install-command">
                  <code>npx jsr add @txtfsm/txtfsm</code>
                </pre>
              </div>
            </div>
            <p class="runtime-note">
              Node.js 22.12.0 or later is the supported range. Earlier versions may work, but have
              not been verified.
            </p>
            <div class="package-links" aria-label="Package registries">
              <a
                href="https://www.npmjs.com/package/txtfsm"
                target="_blank"
                rel="noopener noreferrer"
              >
                npm <img src={externalLinkIcon} alt="" aria-hidden="true" />
              </a>
              <a href="https://jsr.io/@txtfsm/txtfsm" target="_blank" rel="noopener noreferrer">
                JSR <img src={externalLinkIcon} alt="" aria-hidden="true" />
              </a>
            </div>
          </section>
        </div>

        <section class="quickstart-panel" aria-labelledby="quickstart-title">
          <h2 id="quickstart-title">Parse text</h2>
          <div class="getting-started-copy">
            <p>
              Use <code>parseTextToDicts</code> to parse one input with a template and get one
              object for each record. For repeated parsing, create a reusable <code>TxtFSM</code>{' '}
              instance.
            </p>
            <p>
              This example embeds its template in a JavaScript string. See{' '}
              <a href="#template-text">Template text in JavaScript</a> for the escaping details, or
              open <a href="#examples">Examples</a> for complete browser and file-loading examples.
            </p>
          </div>
          <div class="code-example getting-started-code">
            <div class="code-label">quick-start.ts</div>
            <HighlightedCode code={GETTING_STARTED_CODE} language="javascript" />
          </div>
        </section>
      </div>

      <section class="getting-started-section template-guide" aria-labelledby="template-text">
        <header class="getting-started-copy">
          <h2 id="template-text">Template text in JavaScript</h2>
          <p>
            JavaScript template literals evaluate <code>{'${...}'}</code> placeholders and process
            backslashes. When embedding a TextFSM template, escape placeholders as{' '}
            <code>{'\\${...}'}</code> and double regex backslashes such as <code>{'\\S'}</code> and{' '}
            <code>{'\\s'}</code>.
          </p>
        </header>

        <div class="template-diff" aria-labelledby="template-diff-title">
          <div class="template-diff-heading">
            <div>
              <h3 id="template-diff-title">Raw template and JavaScript string</h3>
              <p>
                Highlighted backslashes are required only when the template is embedded in
                JavaScript.
              </p>
            </div>
            <span>
              <i aria-hidden="true" /> Added escape
            </span>
          </div>
          <div class="template-diff-grid">
            <article>
              <div class="code-label">template.textfsm</div>
              <pre>
                <code>{`Value NAME (\\S+)
Value STATUS (up|down)

Start
  ^\${NAME}\\s+\${STATUS} -> Record`}</code>
              </pre>
            </article>
            <article>
              <div class="code-label">JavaScript template literal</div>
              <pre>
                <code>
                  {'const template = `Value NAME ('}
                  <mark>{'\\'}</mark>
                  {'\\S+)\n'}
                  {'Value STATUS (up|down)\n\n'}
                  {'Start\n  ^'}
                  <mark>{'\\'}</mark>
                  {'${NAME}'}
                  <mark>{'\\'}</mark>
                  {'\\s+'}
                  <mark>{'\\'}</mark>
                  {'${STATUS} -> Record`'}
                </code>
              </pre>
            </article>
          </div>
          <p class="template-raw-note">
            <code>String.raw</code> preserves regex backslashes, but it still evaluates{' '}
            <code>{'${...}'}</code> placeholders. Escaped placeholders also retain their backslash,
            so <code>String.raw</code> alone cannot preserve the complete template.
          </p>
        </div>
        <p class="template-source-note">
          To keep a template unchanged, load a <code>.textfsm</code> file as text in Node.js or read
          an HTML textarea’s <code>value</code> in the browser. The extension is a convention used
          by{' '}
          <a
            href="https://github.com/networktocode/ntc-templates"
            target="_blank"
            rel="noopener noreferrer"
          >
            NTC Templates
          </a>
          , not a requirement. See <a href="#examples">Examples</a> for both approaches, or try a
          template in the <a href="#playground">Playground</a>.
        </p>
      </section>
    </section>
  );
}
