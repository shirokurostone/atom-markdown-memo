'use babel';

import AtomMarkdownMemoView from './atom-markdown-memo-view';
import { CompositeDisposable } from 'atom';

export default {

  atomMarkdownMemoView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.atomMarkdownMemoView = new AtomMarkdownMemoView(state.atomMarkdownMemoViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.atomMarkdownMemoView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-markdown-memo:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.atomMarkdownMemoView.destroy();
  },

  serialize() {
    return {
      atomMarkdownMemoViewState: this.atomMarkdownMemoView.serialize()
    };
  },

  toggle() {
    console.log('AtomMarkdownMemo was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
