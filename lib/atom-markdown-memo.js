'use babel';

import { CompositeDisposable } from 'atom';

const fs = require('fs');
const path = require('path');

const DIR_TYPE_ENTRY = 0
const DIR_TYPE_DRAFT = 1
const DIR_TYPE_DAILY = 2

export default {

  subscriptions: null,
  config: {
    entryDirectoryPath: {
      type: 'string',
      default: ''
    },
    draftDirectoryPath: {
      type: 'string',
      default: ''
    },
    dailyMemoDirectoryPath: {
      type: 'string',
      default: ''
    }
  },

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-markdown-memo:newFile': () => this.newFile(),
      'atom-markdown-memo:saveFile': () => this.saveFile(),
      'atom-markdown-memo:recordDailyMemo': () => this.report()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
    return {
    };
  },

  newFile() {
    if (
      !atom.config.get("atom-markdown-memo.draftDirectoryPath") ||
      !atom.config.get("atom-markdown-memo.entryDirectoryPath")
    ){
      atom.notifications.addError("no config");
      return;
    }

    atom.workspace.open(null).then((editor) => {
      let body;
      const title = "untitled";
      const now = new Date();

      body  = "---\n";
      body += "title: " + title + "\n";
      body += "created: " + this.formatTimestamp(now) + "\n";
      body += "updated: " + this.formatTimestamp(now) + "\n";
      body += "draft: true\n";
      body += "---\n";

      const filepath = path.join(
        this.getDirectory(DIR_TYPE_DRAFT, now),
        this.formatFileName(title, now)
      );

      editor.setText(body);
      editor.saveAs(filepath);
      atom.notifications.addInfo("new file");
    });
  },

  saveFile(){
    if (
      !atom.config.get("atom-markdown-memo.draftDirectoryPath") ||
      !atom.config.get("atom-markdown-memo.entryDirectoryPath")
    ){
      atom.notifications.addError("no config");
      return;
    }

    const editor = atom.workspace.getActiveTextEditor();
    const text = editor.getText();
    let attr = this.parseText(text);

    if (!attr){
      atom.notifications.addInfo("no match");
      return;
    }

    const created = new Date(attr['created']);
    if (attr['updated']){
      editor.setText(
        text.replace(/^updated:\s*.*/m, "updated: " + this.formatTimestamp(new Date()))
      );
    }

    const title = attr['title'];
    const filepath = path.join(
      this.getDirectory(attr['draft'] == "true" ? DIR_TYPE_DRAFT : DIR_TYPE_ENTRY, created),
      this.formatFileName(title, created)
    );

    fs.renameSync(editor.getPath(), filepath);
    editor.saveAs(filepath);
    atom.notifications.addInfo("save file");
  },

  getDirectory(type, date){

    let dir;
    if (type == DIR_TYPE_ENTRY){
      dir = atom.config.get("atom-markdown-memo.entryDirectoryPath")
    } else if (type == DIR_TYPE_DRAFT){
      dir = atom.config.get("atom-markdown-memo.draftDirectoryPath")
    } else if (type == DIR_TYPE_DAILY){
      dir = atom.config.get("atom-markdown-memo.dailyMemoDirectoryPath")
    }

    return dir.replace(/%./g, (match) => {
      switch(match){
        case '%Y':
          return date.getFullYear().toString();
        case '%m':
          return (date.getMonth()+1).toString().padStart(2, '0');
        case '%d':
          return date.getDate().toString().padStart(2, '0');
        case '%H':
          return date.getHours().toString().padStart(2, '0');
        case '%M':
          return date.getMinutes().toString().padStart(2, '0');
        case '%S':
          return date.getSeconds().toString().padStart(2, '0');
        case '%%':
          return '%';
      }
      return match;
    });
  },

  parseText(text) {
    const match = text.match(/^--- *\n([^]*?)\n--- */m);
    if (!match){
      return null;
    }

    let attr = {};
    match[1]
      .split(/\n/)
      .map((s) => {
        const m = s.match(/^([^:]+):\s*(.*)\s*/);
        if (m){
          return [ m[1], m[2] ];
        }
        return [];
      })
      .filter((s) => s.length)
      .forEach((s) => attr[ s[0] ] = s[1]);

    return attr;
  },

  formatTimestamp(date) {
    return date.getFullYear().toString()
      + "/" + (date.getMonth()+1).toString().padStart(2, '0')
      + "/" + date.getDate().toString().padStart(2, '0')
      + " " + date.getHours().toString().padStart(2, '0')
      + ":" + date.getMinutes().toString().padStart(2, '0')
      + ":" + date.getSeconds().toString().padStart(2, '0');
  },

  formatFileName(title, date) {
    return date.getFullYear().toString()
      + (date.getMonth()+1).toString().padStart(2, '0')
      + date.getDate().toString().padStart(2, '0')
      + "_" + date.getHours().toString().padStart(2, '0')
      + date.getMinutes().toString().padStart(2, '0')
      + date.getSeconds().toString().padStart(2, '0')
      + "_" + title.replace(path.sep, "") + ".md";
  },

  report(){
    if (
      !atom.config.get("atom-markdown-memo.dailyMemoDirectoryPath")
    ){
      atom.notifications.addError("no config");
      return;
    }

    const now = new Date();
    const datestr = now.getFullYear().toString()
      + "-"
      + (now.getMonth()+1).toString().padStart(2, '0')
      + "-"
      + now.getDate().toString().padStart(2, '0');

    const filepath = path.join(
      this.getDirectory(DIR_TYPE_DAILY, now),
      datestr  + ".md"
    );

    atom.workspace.open(filepath).then((editor) => {
      let text = editor.getText();
      if (text == ""){
        text  = "---\n";
        text += "title: DailyReport " + datestr + "\n";
        text += "created: " + this.formatTimestamp(now) + "\n";
        text += "---\n";

        editor.setText(text);
        editor.saveAs(filepath);
        atom.notifications.addInfo("new file");
      }

      const header = "# "
        + now.getFullYear().toString()
        + "-"
        + (now.getMonth()+1).toString().padStart(2, '0')
        + "-"
        + now.getDate().toString().padStart(2, '0')
        + " "
        + now.getHours().toString().padStart(2, '0')
        + ":"
        + now.getMinutes().toString().padStart(2, '0')
        + ":"
        + now.getSeconds().toString().padStart(2, '0');
      text += "\n"+header+"\n";
      editor.setText(text);
      editor.moveDown(Number.MAX_SAFE_INTEGER);

      atom.notifications.addInfo("add");
    });
  }
};
