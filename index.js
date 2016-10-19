
const stdin = process.stdin;
stdin.resume()
stdin.setEncoding('utf8');
const chalk = require('chalk');
const fs = require('fs');
const cX = chalk.bold.magenta;
const cO = chalk.bold.blue;

var currentGame = null;
var games = [];
var state = 'start';
var confirm = 0;
var warn = 1;
var error = 2;
var defaults = {
  boardSize: {val: 3, check: n => Number.isInteger(+n), options: 'integers', max: 5},
  turnLimit: {val: 'none', check: n => n === 'none' || Number.isInteger(+n), options: 'integers or \'none\''},
  winCondition: {val: 3, check: n => Number.isInteger(+n), options: 'integers', max: 5}
}
var options = {};
var input = '';

//may want to construct settings class to hold settings preferences as well

class Game {
  constructor ({boardSize = defaults.boardSize.val, turnLimit = defaults.turnLimit.val, winCondition = defaults.winCondition.val}) {
    this.lastSaved = null;
    this.saveId = null;
    this.turnLimit = turnLimit;
    this.turns = 1;
    this.state = 'start';
    this.x = '';
    this.o = '';
    this.xDef = cX('X');
    this.oDef = cO('O');
    this.currentPlayer = null;
    this.winCondition = winCondition;
    this.board = new Board(boardSize, this.xDef, this.oDef);
  }
  turn () { 
    switch(this.state) {
      case 'start': 
        this.state = 'xSelect';
        respond('Input :save or :s at any time to save.')
        respond(`Please input a name for ${this.xDef}:`);
        break;
      case 'xSelect': 
        if(input.length > 0 || this.x.length > 0) {
          this.x = input || this.x;
          this.state = 'oSelect';
          respond(`Please input a name for ${this.oDef}:`);
        }
        break;
      case 'oSelect': 
        if(input.length > 0 || this.o.length > 0) {
          this.o = input || this.o;
          this.state = 'confirmSelection';
          if(this.x === this.o) {
            this.x += '|X';
            this.o += '|O';
          }
          this.x = cX(this.x);
          this.o = cO(this.o);
          respond(`Player '${this.x}' is ${this.xDef} and player '${this.o}' is ${this.oDef}. Ok? `);
        }
        break;
      case 'confirmSelection': 
        confirmInput(() => {
          respond('Ok, game start!\n');
          this.state = 'takeTurn';
          this.board.render(true);
          this.currentPlayer = Math.floor(Math.random * 2) > 0 ? 
            this.x : this.o;
          respond(`${this.currentPlayer} turn ${Math.floor(this.turns)}. Please select a tile to claim.`);
        }, () => {
          this.state = 'xSelect';
          respond(`Please input a name for ${cX('X')}:`);
        });
        break;
      case 'takeTurn': 
        if(this.board.claimTile(this.currentPlayer === this.x ? 
          this.xDef : this.oDef, this.xDef, this.oDef)) {
          this.board.render();
          let won = this.board.checkWinner(this.winCondition);
          this.turns += 0.5;
          if(!won && this.turns >= this.turnLimit + 1) {
            won = 'tie';
          }
          if(won) {
            console.log(`${won === 'tie' ? 
              chalk.green.bold(`The game ends in a tie`)
              : `${this.currentPlayer} ${chalk.green.bold('wins')}`
              } ${chalk.green.bold(`after ${Math.floor(this.turns)} turns! Good game!`)}`);
            respond('Play again?');
            state = 'start';
          } else {
            this.currentPlayer = this.currentPlayer === this.x ? 
              this.o : this.x;
            respond(`${this.currentPlayer} turn ${Math.floor(this.turns)}.`);
          }
        }
        break;
      default: 
        respond('You\'ve met a terrible fate, haven\'t you.', error);
        done();
    }
  }
}

class Board {
  constructor (n, xDef, oDef) {
    this.size = n;
    this.length = n * n;
    this.matrix = [];
    this.remaining = this.length;
    this.xDef = xDef;
    this.oDef = oDef;
  }
  claimTile (v) {
    input = +input;
    if(Number.isInteger(input) && input <= this.length && input > 0) {
      let r = Math.floor(--input / this.size);
      let c = input % this.size;
      if(this.matrix[r][c] === this.xDef || this.matrix[r][c] === this.oDef) {
        respond('That tile is already claimed. Please select another tile.', warn);
      } else {
        this.matrix[r][c] = v;
        this.remaining--;
        return true;
      }
    } else {
      respond(`That tile does not exist, ${this.currentPlayer}. Please try again.`, warn);
    }
    return false;
  }
  checkWinner(win) {
    let matrix = this.matrix;
    let size = this.size;
    for(let i = 0; i < size; i++) {
      for(let j = 0; j < size; j++) {
        let ld = 1;
        let rd = 1;
        let r = 1;
        let c = 1;
        for(let w = 1; w < win; w++) {
          if(i + w < size) {
            if(matrix[i][j] === matrix[i+w][j-w]) ld++;
            else ld = 1;
            if(matrix[i][j] === matrix[i+w][j+w]) rd++;
            else rd = 1;
            if(matrix[i][j] === matrix[i+w][j]) c++;
            else c = 1;
          }
          if(matrix[i][j] === matrix[i][j+w]) r++;
          else r = 1;
          if(rd === win || ld === win || r === win || c === win) {
            return true;
          }
        }
      }
    }
    return this.remaining ? false : 'tie';
  }
  render(reset = false) {
    if(reset) {
      this.matrix = [];
      let index = 0;
      for(let i = 0; i < this.size; i++) {
        let row = [];
        for(let i = 0; i < this.size; i++) {
          row.push(++index);
        }
        this.matrix.push(row);
      }
    }
    let board = '';
    let drawHorizontal = function(row) {
      board += '-';
      for(let i = 0; i < row.length; i++) {
        board += '----';
      }
      board += '\n';
    }
    this.matrix.forEach((row, rIndex) => {
      if(rIndex === 0) {
        drawHorizontal(row); 
      } 
      row.forEach((cell, cIndex) => {
        if(cIndex === 0) {
          board += '|';
        }
        board += ` ${(Number.isInteger(+cell) && +cell > 9) ? cell : cell + ' '}|`
        if(cIndex === row.length - 1) {
          board += '\n';
        }
      })
      drawHorizontal(row);
    });
    console.log(chalk.white.bold(board));
  }
}

function respond(output, type) {
  switch(type) {
    case error: 
      console.log(chalk.red(output));
      break;
    case warn: 
      console.log(chalk.yellow(output));
      break;
    case confirm: 
      console.log(chalk.green(output));
      break;
    default: 
      console.log(chalk.cyan(output));
  }
}

function confirmInput (yes, no) {
  if(['yes', 'y', 'ok'].indexOf(input) > -1) {
    yes && yes(input);
  }
  if(['no','n'].indexOf(input) > -1) {
    no && no(input);
  } 
}

function play() {
  state = 'playing';
  respond('Starting new game.');
  currentGame = new Game(options);
  options = {};
  currentGame.turn();
}

function done() {
  respond('Exiting game. Let\'s play again soon!', warn); 
  process.exit();
}
function checkInput(...args) {
  return args.indexOf(input.toLowerCase()) > -1;
}

fs.readFile('saves.json', 
  (err, data) => {err ? 
    respond(`No prior saves found.`, warn)
    : (() => {
      games = JSON.parse(data);
      respond(`Saves found. (${games.length} records)`);
      })();
      respond(`Shall we play a game?`); 
    });
stdin.on('data', function (userInput) {
  input = userInput.replace('\n', '');
  if(checkInput(':quit', ':q')) {
    done();
  } else if(checkInput(':reset',':r')) {
    state = 'start';
    respond(`Reset.\nShall we play a game?`); 
  } else if(checkInput(':save',':s')) {

    if(currentGame !== null) { 
      currentGame.lastSaved = Date.now();
      if(currentGame.saveId !== null) {
        games[currentGame.saveId] = currentGame;
      } else {
        currentGame.saveId = games.length;
        games.push(currentGame);
      }
      fs.writeFile('saves.json', 
        JSON.stringify(games), err => err ? 
          respond(`Error occured while attempting to save: ${err}`, error)
          : respond(`Game saved. SaveId: ${currentGame.saveId + 1}`, confirm)
      );
    } else {
      respond('No game is currently being played.', warn);
      state = "start";
      respond(`Shall we play a game?`); 
    }
  } else {
    switch(state) {
      case 'start': 
        currentGame = false;
        confirmInput(() => {
          respond('Input :quit or :q at any time to quit, :reset or :r to reset.');
          if(games.length > 0) {
            state = 'load';
            respond('Load a previous game?');
          } else {
            state = 'defaults';
            respond('Use defaults?')
          }
        }, done);
        break;
      case 'load': 
        confirmInput(() => {
          respond('Saved Games:');
          games.forEach((game, i) => console.log(`SaveId ${i + 1}: ${game.lastSaved}`));
          respond('Input the SaveId of the game you wish to load. Input \'back\' to go back.');
          state = 'loadSelect';
        }, () => {
          play();
        });
        break;
      case 'loadSelect': 
        if(checkInput('back')) {
          state = 'load';
          respond('Load a previous game?');
        } else {
          input = +input;
          if(Number.isInteger(input)) {
            if(input > 0 && input <= games.length) {
              currentGame = games[--input];
              state = 'playing';
              respond('Game loaded.', confirm);
            } else {
              respond(`SaveId '${input}' does not exist. Please select a valid save`, warn);
            } 
          }else {
            respond(`'${input}' is not valid. Please input a SaveId.`, warn)
          }
        }
        break;
      case 'defaults': 
        confirmInput(() => {
          play();
        }, () => {
          respond('Options:')
          for(let key in defaults) {
            console.log(`- ${key}: ${defaults[key].val} (${defaults[key].options}${defaults[key].hasOwnProperty('max') ? `, max: ${defaults[key].max}` : ''})`);
          }
          respond('Please set your desired options. Type \'done\' when finished.');
          console.log('input format: [option]=[value]')
          state = 'options';
        });
        break;
      case 'options': 
        if(checkInput('done')) {
          respond('Options set. Starting Game');
          play();
        } else {
          let keyVal = input.split('=');
          let key = keyVal[0];
          let val = keyVal[1];
          if(defaults.hasOwnProperty(key)) {
            if(defaults[key].check(val)) {
              options[key] = (defaults[key].hasOwnProperty('max') && defaults[key].max < val) ? defaults[key].max : val;
              respond(`${key} now set to '${options[key]}'.`, confirm);
            } else {
              respond(`Inputs for ${key} must be ${defaults[key].options}.`)
            }
          } else {
            respond(`${key} is not a valid option.`, warn)
          }
        }
        break;
      case 'playing': 
        currentGame.turn();
        break;
      default: 
        respond('You\'ve met a terrible fate, haven\'t you.', error);
        done();
    }
  }
  
});