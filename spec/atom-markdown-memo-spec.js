'use babel';

import AtomMarkdownMemo from '../lib/atom-markdown-memo';

describe('AtomMarkdownMemo', () => {
  let workspaceElement, activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('atom-markdown-memo');
  });

  describe('tests for methods', () => {
    it('formatFileName', () => {
      const date = new Date(2006, 1-1, 2, 15, 4, 5);
      expect(AtomMarkdownMemo.formatFileName('untitled', date)).toEqual('20060102_150405_untitled.md');
    });

    it('formatTimestamp', () => {
      const date = new Date(2006, 1-1, 2, 15, 4, 5);
      expect(AtomMarkdownMemo.formatTimestamp(date)).toEqual('2006/01/02 15:04:05');
    });

    it('getDirectory', () => {
      atom.config.set("atom-markdown-memo.draftDirectoryPath", "/tmp/draft/%Y-%m-%d_%H-%M-%S-%%/");
      atom.config.set("atom-markdown-memo.entryDirectoryPath", "/tmp/entry/%Y-%m-%d_%H-%M-%S-%%/");
      const date = new Date(2006, 1-1, 2, 15, 4, 5);

      expect(AtomMarkdownMemo.getDirectory(true, date)).toEqual("/tmp/draft/2006-01-02_15-04-05-%/");
      expect(AtomMarkdownMemo.getDirectory(false, date)).toEqual("/tmp/entry/2006-01-02_15-04-05-%/");
    });

    it ('parseText', ()=>{
      expect(AtomMarkdownMemo.parseText("")).toEqual(null);
      expect(AtomMarkdownMemo.parseText("---\n")).toEqual(null);
      expect(AtomMarkdownMemo.parseText("---\n\n---\n")).toEqual({});
      expect(AtomMarkdownMemo.parseText("---\nkey: value\n---\n")).toEqual({key:"value"});
      expect(AtomMarkdownMemo.parseText("---\nkey: value1: value2\n---\n")).toEqual({key:"value1: value2"});
      expect(AtomMarkdownMemo.parseText("---\nkey\n---\n")).toEqual({});
      expect(AtomMarkdownMemo.parseText(
        "---\n"
        + "key1: value1\n"
        + "---\n"
        + "key2: value3\n"
        + "---\n"
        + "key3: value3\n"
        + "---\n")).toEqual({key1:"value1"});
      expect(AtomMarkdownMemo.parseText(
        "---\n"
        + "title: untitled\n"
        + "created: 2006-01-02 15:04:05\n"
        + "updated: 2011-06-07 08:09:10\n"
        + "draft: false\n"
        + "---\n")).toEqual(
          {title:"untitled", created:"2006-01-02 15:04:05", updated:"2011-06-07 08:09:10", draft: "false"}
        );
    });
  });
});
