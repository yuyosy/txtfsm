import { HighlightedCode } from '../components/highlighted-code';
import externalLinkIcon from '../assets/external-link.svg?no-inline';
import { GETTING_STARTED_CODE } from '../docs';

export function GettingStartedPage() {
  return (
    <section class="page getting-started-page" aria-labelledby="page-title">
      <header class="page-intro">
        <p class="overline">Introduction</p>
        <h1 id="page-title" tabindex={-1}>
          TxtFSM for TypeScript
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

      <div class="getting-started-layout">
        <article class="prose">
          <h2>What is TxtFSM?</h2>
          <p>
            TxtFSM is a TypeScript implementation of{' '}
            <a href="https://github.com/google/textfsm">Google TextFSM</a>, adapted in part from the
            original project. It is designed for line-oriented text such as network device command
            output and runs in both browser and Node.js environments.
          </p>
          <ul class="feature-list">
            <li>Define parsing rules separately from application code.</li>
            <li>Return positional rows or objects keyed by template values.</li>
            <li>Reuse a compiled parser or use one-off helper functions.</li>
          </ul>
          <h2>Install</h2>
          <pre class="install-command">
            <span>npm install txtfsm</span>
          </pre>
          <div class="package-links" aria-label="Package registries">
            <a href="https://www.npmjs.com/package/txtfsm" target="_blank" rel="noopener noreferrer">
              npm <img src={externalLinkIcon} alt="" aria-hidden="true" />
            </a>
            <a href="https://jsr.io/@txtfsm/txtfsm" target="_blank" rel="noopener noreferrer">
              JSR <img src={externalLinkIcon} alt="" aria-hidden="true" />
            </a>
          </div>
          <h2>Parse text</h2>
          <p>
            Pass a template and source text to <code>parseTextToDicts</code> for one-off parsing. It
            returns one object for every matched record.
          </p>
          <p>
            Use <code>TxtFSM</code> directly when the same template will parse multiple inputs.
          </p>
          <h2>Template text in JavaScript</h2>
          <p>
            An unescaped <code>{'${...}'}</code> inside a JavaScript template literal is always
            evaluated as an expression. The example escapes it as <code>{'\\${...}'}</code> and
            doubles regular-expression backslashes. TextFSM patterns such as <code>{'\\S'}</code>{' '}
            and <code>{'\\s'}</code> must therefore be written as <code>{'\\\\S'}</code> and{' '}
            <code>{'\\\\s'}</code> in a JavaScript string.
          </p>
          <p>
            A tagged <code>String.raw</code> template keeps regular-expression backslashes, so that
            doubling is unnecessary. It still evaluates <code>{'${...}'}</code>, however, and{' '}
            <code>{'\\${...}'}</code> remains backslashed in the raw result. <code>String.raw</code>{' '}
            alone therefore cannot preserve the complete TextFSM source unchanged.
          </p>
          <p>
            To keep a TextFSM template unchanged, load a <code>.textfsm</code> file as text in
            Node.js, or read an HTML textarea’s <code>value</code> in the browser. The{' '}
            <code>.textfsm</code> extension is a common convention used by{' '}
            <a
              href="https://github.com/networktocode/ntc-templates"
              target="_blank"
              rel="noopener noreferrer"
            >
              NTC Templates
            </a>
            ; it is not required when passing template text directly to TxtFSM.
          </p>
        </article>
        <div class="code-example getting-started-code">
          <div class="code-label">quick-start.ts</div>
          <HighlightedCode code={GETTING_STARTED_CODE} language="javascript" />
        </div>
      </div>

      <section class="template-diff" aria-labelledby="template-diff-title">
        <div class="template-diff-heading">
          <div>
            <h2 id="template-diff-title">Raw template and JavaScript string</h2>
            <p>
              Highlighted backslashes are required only when the template is embedded in JavaScript.
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
          With <code>String.raw</code>, regex tokens can remain <code>{'\\S'}</code> and{' '}
          <code>{'\\s'}</code>, but TextFSM placeholders still require separate handling.
        </p>
      </section>
    </section>
  );
}
