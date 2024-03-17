const { TextEditor } = require('atom');

class GoToCharacterView {
  constructor () {
    this.miniEditor = new TextEditor({ mini: true });
    this.miniEditor.element.addEventListener('blur', this.close.bind(this));
    this.message = document.createElement('div');
    this.message.classList.add('message');

    this.element = document.createElement('div');
    this.element.classList.add('go-to-character');
    this.element.appendChild(this.miniEditor.element);
    this.element.appendChild(this.message);

    this.panel = atom.workspace.addModalPanel({
      item: this,
      visible: false
    })

    atom.commands.add('atom-text-editor', 'go-to-character:toggle', () => {
      this.toggle();
      return false;
    });
    atom.commands.add(this.miniEditor.element, 'core:confirm', () => {
      this.navigate();
    });
    atom.commands.add(this.miniEditor.element, 'core:cancel', () => {
      this.close();
    });

    this.miniEditor.onWillInsertText(arg => {
      if (arg.text.match(/[^0-9:]/)) {
        arg.cancel();
      }
    });
    this.miniEditor.onDidChange(() => {
      this.navigate({ keepOpen: true });
    });
  }

  toggle () {
    this.panel.isVisible() ? this.close() : this.open();
  }

  close () {
    if (!this.panel.isVisible()) return;
    this.miniEditor.setText('');
    this.panel.hide();
    if (this.miniEditor.element.hasFocus()) {
      this.restoreFocus();
    }
  }

  navigate (options={}) {
    let characterInput = this.miniEditor.getText();
    const editor = atom.workspace.getActiveTextEditor();
    if (!options.keepOpen) {
      this.close();
    }
    if (!editor || !characterInput.length) return;

    const characterNumber = parseInt(characterInput, 10);
    let bufferPosition = editor.getBuffer()?.positionForCharacterIndex(characterNumber);
    if (!bufferPosition) {
      this.close();
      return;
    }
    editor.setCursorBufferPosition(bufferPosition);
    editor.unfoldBufferRow(bufferPosition.row);
    editor.scrollToBufferPosition(bufferPosition, {
      center: true
    })
  }

  storeFocusedElement () {
    this.previouslyFocusedElement = document.activeElement;
    return this.previouslyFocusedElement;
  }

  restoreFocus () {
    if (this.previouslyFocusedElement?.parentElement) {
      return this.previouslyFocusedElement.focus();
    }
    atom.views.getView(atom.workspace).focus();
  }

  open () {
    if (this.panel.isVisible() || !atom.workspace.getActiveTextEditor()) {
      return;
    }

    this.storeFocusedElement();
    this.panel.show();
    this.message.textContent = `Enter a character number to go there.`
    this.miniEditor.element.focus();
  }
}

module.exports = {
  activate () {
    return new GoToCharacterView();
  }
}
