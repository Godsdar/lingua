import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEtymologyTree, VIRTUAL_ROOT_ID } from './etymologyTree.ts';

interface Node {
  lang: string;
  langName: string;
  word: string;
}

const n = (lang: string, word: string): Node => ({ lang, langName: lang.toUpperCase(), word });

test('empty input returns the virtual root with no children', () => {
  const tree = buildEtymologyTree([], []);
  assert.equal(tree.id, VIRTUAL_ROOT_ID);
  assert.deepEqual(tree.children, []);
});

test('a shared ancestor is a single trunk that diverges into source and target', () => {
  const source = [n('ine', '*wódr̥'), n('gem', '*watōr'), n('en', 'water')];
  const target = [n('ine', '*wódr̥'), n('gem', '*watōr'), n('ru', 'вода')];

  const tree = buildEtymologyTree(source, target);
  assert.equal(tree.children.length, 1);

  const trunk = tree.children[0];
  assert.equal(trunk.word, '*wódr̥');
  assert.equal(trunk.role, 'trunk');
  assert.equal(trunk.isRoot, true);

  const divergence = trunk.children[0];
  assert.equal(divergence.word, '*watōr');
  assert.equal(divergence.isDivergence, true);
  assert.equal(divergence.isLeaf, false);

  assert.equal(divergence.children.length, 2);
  assert.deepEqual(divergence.children.map(c => c.word).sort(), ['water', 'вода']);
  assert.deepEqual(divergence.children.map(c => c.role).sort(), ['source', 'target']);
  for (const leaf of divergence.children) {
    assert.equal(leaf.isLeaf, true);
    assert.equal(leaf.isRoot, false);
  }
});

test('normalization treats leading asterisks and case as the same ancestor', () => {
  const source = [n('ine', '*Root'), n('en', 'word')];
  const target = [n('ine', 'root'), n('ru', 'слово')];
  const tree = buildEtymologyTree(source, target);
  const trunk = tree.children[0];
  assert.equal(trunk.isDivergence, true);
  assert.deepEqual(trunk.children.map(c => c.word).sort(), ['word', 'слово']);
});

test('unrelated words stay as two separate chains', () => {
  const source = [n('en', 'hello')];
  const target = [n('ru', 'привет')];
  const tree = buildEtymologyTree(source, target);
  assert.equal(tree.children.length, 2);
  assert.equal(tree.children[0].role, 'source');
  assert.equal(tree.children[1].role, 'target');
});
