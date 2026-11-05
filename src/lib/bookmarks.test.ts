import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBookmark,
  generateSlug,
  normalizeUrl,
  parseStoredBookmarks,
} from './bookmarks.ts';

test('URL with and without https:// normalises to the same value', () => {
  const a = normalizeUrl('www.example.com');
  const b = normalizeUrl('https://www.example.com');
  assert.equal(a, 'https://www.example.com');
  assert.equal(a, b);
});

test('invalid URLs are rejected', () => {
  for (const bad of ['', '   ', 'not a url', 'javascript:alert(1)', 'nodots', null, 42]) {
    assert.equal(normalizeUrl(bad), null);
  }
});

test('loading empty, corrupted, legacy or non-array values recovers', () => {
  assert.deepEqual(parseStoredBookmarks(null), []);
  assert.deepEqual(parseStoredBookmarks(''), []);
  assert.deepEqual(parseStoredBookmarks('{not json'), []);
  assert.deepEqual(parseStoredBookmarks('{"url":"a.com","slug":"mona-1"}'), []);
  assert.deepEqual(parseStoredBookmarks('"text"'), []);
  assert.deepEqual(parseStoredBookmarks('null'), []);
  assert.deepEqual(parseStoredBookmarks('["https://a.com"]'), []);
});

test('malformed entries are dropped, valid ones kept', () => {
  const raw = JSON.stringify([
    { url: 'example.com', slug: 'mona-7fk2' },
    { url: 5, slug: 'mona-1111' },
    { url: 'https://b.com', slug: 'bad' },
    null,
    { url: 'https://c.com' },
  ]);
  assert.deepEqual(parseStoredBookmarks(raw), [{ url: 'https://example.com', slug: 'mona-7fk2' }]);
});

test('bookmark formats as "<url> :: <slug>"', () => {
  assert.equal(
    formatBookmark({ url: 'https://www.example.com', slug: 'mona-7fk2' }),
    'https://www.example.com :: mona-7fk2',
  );
});

test('slug has mona- prefix and 4 base62 chars', () => {
  assert.match(generateSlug(), /^mona-[0-9a-zA-Z]{4}$/);
});
