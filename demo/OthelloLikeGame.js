var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var SVG_NS = "http://www.w3.org/2000/svg";
var MASU = 6;
var OthelloLikeGame;
(function (OthelloLikeGame) {
    var GameBoardView = (function (_super) {
        __extends(GameBoardView, _super);
        function GameBoardView(element) {
                _super.call(this);
            if(!element) {
                this.element = element = document.createElement("div");
            }
            var svgElem = this.svgElem = document.createElementNS(SVG_NS, "svg");
            svgElem.setAttribute("viewBox", "0 0 " + String(100 * MASU) + " " + String(100 * MASU));
            svgElem.setAttribute("style", "width: 500px; height: 500px; background-color: #999999;");
            element.appendChild(svgElem);
            var that = this;
            for(var i = 0; i < MASU; ++i) {
                for(var j = 0; j < MASU; ++j) {
                    var rectElem = this.createBoxElem(i, j);
                    rectElem.addEventListener("click", (function createListener(x, y) {
                        return function (evt) {
                            return that.emitEvent("click", {
                                detail: {
                                    x: x,
                                    y: y
                                }
                            });
                        }
                    })(i, j), false);
                    svgElem.appendChild(rectElem);
                }
            }
            this.boardstatechangeListener = function (evt) {
                that.putsStonesAccordingToGameStatus();
            };
        }
        GameBoardView.prototype.bindModel = function (game) {
            if(this.game) {
                this.unbindModel();
            }
            this.game = game;
            this.putsStonesAccordingToGameStatus();
            this.game.addEventListener("boardstatechange", this.boardstatechangeListener);
        };
        GameBoardView.prototype.unbindModel = function () {
            if(!this.game) {
                return;
            }
            this.game.removeEventListener("boardstatechange", this.boardstatechangeListener);
            this.game = null;
        };
        GameBoardView.prototype.createBoxElem = function (posX, posY) {
            var rectElem = document.createElementNS(SVG_NS, "rect");
            rectElem.setAttribute("x", String(100 * posX));
            rectElem.setAttribute("y", String(100 * posY));
            rectElem.setAttribute("width", "100");
            rectElem.setAttribute("height", "100");
            rectElem.setAttribute("fill", "#00CCCC");
            rectElem.setAttribute("stroke", "#FFFF99");
            return rectElem;
        };
        GameBoardView.prototype.createStoneElem = function (x, y, type) {
            var stoneElem = document.createElementNS(SVG_NS, "rect");
            stoneElem.setAttribute("x", String(100 * x + 30));
            stoneElem.setAttribute("y", String(100 * y + 30));
            stoneElem.setAttribute("width", "40");
            stoneElem.setAttribute("height", "40");
            if(type === SquareStatus.FIRST) {
                stoneElem.setAttribute("fill", "#000000");
            } else {
                stoneElem.setAttribute("fill", "#FFFFFF");
            }
            stoneElem.setAttribute("stroke", "#666666");
            return stoneElem;
        };
        GameBoardView.prototype.putsStonesAccordingToGameStatus = function () {
            if(this.stones) {
                this.stones.forEach(function (elem) {
                    elem.parentNode.removeChild(elem);
                });
            }
            if(!this.game) {
                return;
            }
            this.stones = [];
            for(var x = 0; x < MASU; ++x) {
                for(var y = 0; y < MASU; ++y) {
                    var v = this.game.getSquareStatus(x, y);
                    if(v === SquareStatus.EMPTY) {
                        continue;
                    }
                    this.svgElem.appendChild(this.createStoneElem(x, y, v));
                }
            }
        };
        return GameBoardView;
    })(MVCBaseSample.AbstView);
    OthelloLikeGame.GameBoardView = GameBoardView;    
    var GameStatusView = (function () {
        function GameStatusView(element) {
            this.element = element;
            if(!element) {
                this.element = element = document.createElement("div");
            }
            var turnInfoElem = this.turnInfoElem = document.createElement("div");
            element.appendChild(turnInfoElem);
            var that = this;
            this.turnchangeListener = function (evt) {
                that.turnInfoElem.textContent = (evt.target.isTurnFirst ? '先攻' : '後攻');
            };
        }
        GameStatusView.prototype.bindModel = function (game) {
            if(this.game) {
                this.unbindModel();
            }
            this.game = game;
            this.turnInfoElem.textContent = (game.isTurnFirst ? '先攻' : '後攻');
            this.game.addEventListener("turnchange", this.turnchangeListener);
        };
        GameStatusView.prototype.unbindModel = function () {
            if(!this.game) {
                return;
            }
            this.game.removeEventListener("turnchange", this.turnchangeListener);
            this.game = null;
        };
        return GameStatusView;
    })();
    OthelloLikeGame.GameStatusView = GameStatusView;    
    var SquareStatus = (function () {
        function SquareStatus(name) {
            this.name = name;
        }
        SquareStatus.EMPTY = new SquareStatus("空");
        SquareStatus.FIRST = new SquareStatus("先攻の石");
        SquareStatus.SECOND = new SquareStatus("後攻の石");
        return SquareStatus;
    })();
    OthelloLikeGame.SquareStatus = SquareStatus;    
    var GameStatus = (function (_super) {
        __extends(GameStatus, _super);
        function GameStatus() {
                _super.call(this);
            this._isTurnFirst = true;
            this.board = [];
            for(var i = 0; i < MASU; ++i) {
                this.board.push([]);
            }
            for(var i = 0; i < MASU; ++i) {
                for(var j = 0; j < MASU; ++j) {
                    this.board[i][j] = SquareStatus.EMPTY;
                }
            }
        }
        Object.defineProperty(GameStatus.prototype, "isTurnFirst", {
            get: function () {
                return this._isTurnFirst;
            },
            enumerable: true,
            configurable: true
        });
        GameStatus.prototype.getSquareStatus = function (x, y) {
            return this.board[x][y];
        };
        GameStatus.prototype.put = function (x, y, isTurnFirst) {
            if(this._isTurnFirst !== isTurnFirst) {
                return false;
            }
            if(this.board[x][y] !== SquareStatus.EMPTY) {
                return false;
            }
            var that = this;
            var ccol = (isTurnFirst ? SquareStatus.FIRST : SquareStatus.SECOND);
            this.board[x][y] = ccol;
            [
                -1, 
                0, 
                1
            ].forEach(function (dx) {
                [
                    -1, 
                    0, 
                    1
                ].forEach(function (dy) {
                    if(dx === 0 && dy === 0) {
                        return;
                    }
                    var cx = x;
                    var cy = y;
                    var doTurnOver = false;
                    var targets = [];
                    while(true) {
                        cx += dx;
                        cy += dy;
                        if(cx < 0 || cy < 0 || MASU <= cx || MASU <= cy) {
                            break;
                        }
                        if(that.board[cx][cy] === SquareStatus.EMPTY) {
                            break;
                        } else {
                            if(that.board[cx][cy] === ccol) {
                                doTurnOver = true;
                                break;
                            } else {
                                targets.push([
                                    cx, 
                                    cy
                                ]);
                            }
                        }
                    }
                    if(doTurnOver) {
                        targets.forEach(function (xy) {
                            return that.board[xy[0]][xy[1]] = ccol;
                        });
                    }
                });
            });
            this.emitEvent("boardstatechange", {
                target: this
            });
            this._isTurnFirst = !this._isTurnFirst;
            this.emitEvent("turnchange", {
                target: this
            });
            return true;
        };
        return GameStatus;
    })(MVCBaseSample.AbstModel);
    OthelloLikeGame.GameStatus = GameStatus;    
})(OthelloLikeGame || (OthelloLikeGame = {}));
