const readline = require('readline');


module.exports = class LogWindow {
  constructor(title) {
    this.terminalWidth = process.stdout.columns;
    this.terminalHeight = process.stdout.rows;

    this.title = title;
    this.requests = 0;
    this.successes = 0;
    this.errors = 0;
    this.contentWidth = this.terminalWidth / 2;
    this.totalRequests = '???';
    this.start();

    
    process.stdout.on('resize', () => {
      this.terminalWidth = process.stdout.columns;
      this.terminalHeight = process.stdout.rows;
      this.contentWidth = this.terminalWidth - 50;
      this.update();
    });
  }

  start() {
    const width = this.contentWidth;
    const titleLength = this.title.length;
    const titleLine = '#' + this.title.padStart((width / 2) + (titleLength / 2), ' ').padEnd(this.contentWidth - 1, ' ') + '#';

    this._write('# '.repeat(width / 2 + 1));
    this._write('\n#' + '#'.padStart(width, ' '));
    this._write('\n');
    this._write(titleLine);
    this._write('\n#' + '#'.padStart(width, ' '));

    this._write('\n');
    this.writeRequestsCount(width);
    this._write('\n');
    this.writeSuccessesCount(width);
    this._write('\n');
    this.writeErrorsCount(width);

    this._write('\n#' + '#'.padStart(width, ' '));
    this._write('\n');
    this._write('# '.repeat(width / 2 + 1));
    
  }

  // Requests
  writeRequestsCount(width) {
    let percent = 0;
    if(this.totalRequests > 0)
      percent = Math.floor(100 * this.requests / this.totalRequests);

    this._write('#'.padEnd(width / 3.5, ' '));
    this._write('requests:'.padEnd(width / 4.5, ' '));
    this._write(`${this.requests} / ${this.totalRequests}`.padEnd(width / 4.5, ' '));
    this._write(`${percent}%`.padEnd(width / 3.5, ' '));
    this._write('#');
  }

  // Successes
  writeSuccessesCount(width) {
    let percent = 0;
    if(this.requests > 0)
      percent = Math.ceil(100 * this.successes / this.requests);
    
    this._write('#'.padEnd(width / 3.5, ' '));
    this._write('successes:'.padEnd(width / 4.5, ' '));
    this._write(`${this.successes}`.padEnd(width / 4.5, ' '));
    this._write(`${percent}%`.padEnd(width / 3.5, ' '));
    this._write('#');
  }

  // Errors
  writeErrorsCount(width) {
    let percent = 0;
    if(this.requests > 0)
      percent = 100 - Math.ceil(100 * this.successes / this.requests);
    
    this._write('#'.padEnd(width / 3.5, ' '));
    this._write('errors:'.padEnd(width / 4.5, ' '));
    this._write(`${this.errors}`.padEnd(width / 4.5, ' '));
    this._write(`${percent}%`.padEnd(width / 3.5, ' '));
    this._write('#');
  }

  // Redraw
  update(first = false, requests = 0, successes = 0, errors = 0) {
    const width = this.contentWidth;

    this.requests += requests;
    this.successes += successes;
    this.errors += errors;

    // clear lines
    readline.moveCursor(process.stdout, width * -1 - 2, -4);
    readline.clearLine(process.stdout);

    this.writeRequestsCount(width);
    this._write('\n');
    this.writeSuccessesCount(width);
    this._write('\n');
    this.writeErrorsCount(width);

    readline.moveCursor(process.stdout, width * -2, 2);

  }

  end() {
    this._write('\n\n');
    process.exitCode = 0;
  }

  _write(text) {
    process.stdout.write(text);
  }

  _clearLine() {
    readline.clearLine(process.stdout);
    readline.cursorTo(process.stdout, 0);
  }

};