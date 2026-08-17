const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const workflowPath = path.join(__dirname, '..', '..', '.github', 'workflows', 'issue-359-diagnostic.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

test('issue 359 diagnostic workflow runs only from its temporary branch', () => {
  assert.match(workflow, /^on:\n {2}push:\n {4}branches:\n {6}- test\/issue-359-diagnostic-builds$/m);
  assert.match(workflow, /^ {4}paths:\n {6}- \.github\/workflows\/issue-359-diagnostic\.yml$/m);
  assert.doesNotMatch(workflow, /^ {2}(?:workflow_dispatch|pull_request|schedule):/m);
  assert.match(workflow, /ref: v0\.43\.0/);
  assert.match(workflow, /cancel-in-progress: false/);
});

test('issue 359 diagnostic workflow changes only the Koffi comparison version', () => {
  assert.match(workflow, /variant: electron-43\.4\.0-koffi-3\.1\.5\s+electron: 43\.4\.0\s+koffi: 3\.1\.5/);
  assert.match(workflow, /variant: electron-43\.4\.0-koffi-3\.1\.2\s+electron: 43\.4\.0\s+koffi: 3\.1\.2/);
  assert.match(workflow, /npm install --package-lock-only --ignore-scripts --save-dev --save-exact "electron@\$EXPECTED_ELECTRON"/);
  assert.match(workflow, /npm install --package-lock-only --ignore-scripts --save-exact "koffi@\$EXPECTED_KOFFI"/);
  assert.match(workflow, /manifest\.version !== '0\.43\.0'/);
  assert.match(workflow, /electronPackageVersion -ne '\$\{\{ matrix\.electron \}\}'/);
  assert.match(workflow, /koffiPackageVersion -ne '\$\{\{ matrix\.koffi \}\}'/);
});

test('issue 359 diagnostic workflow signs but never publishes its artifacts', () => {
  assert.equal(workflow.match(/signing-policy-slug: release-signing/g)?.length, 2);
  assert.match(workflow, /name: unsigned-windows-application-\$\{\{ matrix\.variant \}\}/);
  assert.match(workflow, /name: unsigned-windows-artifacts-\$\{\{ matrix\.variant \}\}/);
  assert.match(workflow, /name: issue-359-\$\{\{ matrix\.variant \}\}/);
  assert.match(workflow, /SHA-256 \$fileName/);
  assert.match(workflow, /retention-days: 14/);
  assert.doesNotMatch(workflow, /softprops\/action-gh-release|gh release|--publish (?!never)/);
});
