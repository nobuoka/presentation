/// <reference path="./MVCBaseSample.ts" />

var SVG_NS = "http://www.w3.org/2000/svg";

// 升目の数
var MASU = 6;

/**
 * オセロ的なゲームの機能をまとめたモジュール
 */
module OthelloLikeGame {

    /**
     * オセロ的なゲームのボードを表す View
     * 石の表示もこの view が担当する.
     */
    export class GameBoardView extends MVCBaseSample.AbstView {
        /** この View に結びつけられた Model */
        private game: GameStatus;
        /** Model の変化のリスナ */
        private boardstatechangeListener: (evt: any) => void;
        /** ゲームボードを表示するために使う svg 要素 */
        private svgElem: SVGSVGElement;
        /** 配置されている石を表現するための SVG 要素一覧 */
        private stones: SVGElement[];
        /** この View に対応する HTML 要素 */
        public element: HTMLElement;

        constructor (element?: HTMLElement) {
            super();
            if (!element) this.element = element = document.createElement("div");

            var svgElem = this.svgElem = <SVGSVGElement>document.createElementNS(SVG_NS, "svg");
            svgElem.setAttribute("viewBox", "0 0 " + String(100*MASU) + " " + String(100*MASU));
            svgElem.setAttribute("style", "width: 500px; height: 500px; background-color: #999999;");
            element.appendChild(svgElem);

            var that = this;
            for (var i = 0; i < MASU; ++i) {
                for (var j = 0; j < MASU; ++j) {
                    var rectElem = this.createBoxElem(i, j);
                    rectElem.addEventListener("click", (function createListener(x, y) {
                        return (evt) => that.emitEvent("click", {detail: { x: x, y: y }});
                    })(i,j), false);
                    svgElem.appendChild(rectElem);
                }
            }
            this.boardstatechangeListener = function (evt) {
                that.putsStonesAccordingToGameStatus();
            };
        }
        /**
         * Model に結びつける
         * 既に結びつけられている場合は, このメソッドの中で先に unbind される.
         */
        public bindModel(game: GameStatus) {
            if (this.game) this.unbindModel();
            this.game = game;
            this.putsStonesAccordingToGameStatus();
            this.game.addEventListener("boardstatechange", this.boardstatechangeListener);
        }
        /**
         * Model から切り離す
         * 結びつけられていない場合は何もしない.
         */
        public unbindModel() {
            if (!this.game) return;
            this.game.removeEventListener("boardstatechange", this.boardstatechangeListener);
            this.game = null;
        }
        /**
         * 升目を表す SVG 要素を生成する
         */
        private createBoxElem(posX: number, posY: number) {
            var rectElem: Element = document.createElementNS(SVG_NS, "rect");
            rectElem.setAttribute("x", String(100 * posX));
            rectElem.setAttribute("y", String(100 * posY));
            rectElem.setAttribute("width", "100");
            rectElem.setAttribute("height", "100");
            rectElem.setAttribute("fill", "#00CCCC");
            rectElem.setAttribute("stroke", "#FFFF99");
            return rectElem;
        }
        /**
         * 指定した位置に指定した升目の状態 (先攻の石が置かれているか後攻の石が
         * 置かれているか) で表示される石を表す SVG 要素を生成する
         */
        private createStoneElem(x: number, y: number, type: SquareStatus) {
            var stoneElem = document.createElementNS(SVG_NS, "rect");
            stoneElem.setAttribute("x", String(100 * x + 30));
            stoneElem.setAttribute("y", String(100 * y + 30));
            stoneElem.setAttribute("width", "40");
            stoneElem.setAttribute("height", "40");
            if (type === SquareStatus.FIRST) {
                stoneElem.setAttribute("fill", "#000000");
            } else {
                stoneElem.setAttribute("fill", "#FFFFFF");
            }
            stoneElem.setAttribute("stroke", "#666666");
            return stoneElem;
        }
        /**
         * Model のデータを読んで, それに従ってボード上に石を配置する
         */
        private putsStonesAccordingToGameStatus() {
            if (this.stones)
                this.stones.forEach(function (elem) { elem.parentNode.removeChild(elem) });
            if (!this.game) return;
            this.stones = [];
            for (var x = 0; x < MASU; ++x) {
                for (var y = 0; y < MASU; ++y) {
                    var v = this.game.getSquareStatus(x,y);
                    if (v === SquareStatus.EMPTY) continue;
                    this.svgElem.appendChild(this.createStoneElem(x, y, v));
                }
            }
        }
    }

    /**
     * ゲームの状態 (簡単のため先攻か後攻かのみ) を表す View
     */
    export class GameStatusView {
        private game: GameStatus;
        private turnInfoElem: HTMLElement;
        private turnchangeListener: (evt: any) => void;
        constructor (public element: HTMLElement) {
            if (!element) this.element = element = document.createElement("div");

            var turnInfoElem = this.turnInfoElem = document.createElement("div");
            element.appendChild(turnInfoElem);
            var that = this;
            this.turnchangeListener = function (evt) {
                that.turnInfoElem.textContent = (evt.target.isTurnFirst ? '先攻' : '後攻');
            };
        }
        /**
         * Model に結びつける
         * 既に結びつけられている場合は, このメソッドの中で先に unbind される.
         */
        public bindModel(game: GameStatus) {
            if (this.game) this.unbindModel();
            this.game = game;
            this.turnInfoElem.textContent = (game.isTurnFirst ? '先攻' : '後攻');
            this.game.addEventListener("turnchange", this.turnchangeListener);
        }
        /**
         * Model から切り離す
         * 結びつけられていない場合は何もしない.
         */
        public unbindModel() {
            if (!this.game) return;
            this.game.removeEventListener("turnchange", this.turnchangeListener);
            this.game = null;
        }
    }

    /**
     * 升目の状態を表すクラス
     */
    export class SquareStatus {
        constructor(public name: string) {};
        /** 升目が空であることを表す */
        public static EMPTY = new SquareStatus("空");
        /** 升目に先攻の石が置かれていることを表す */
        public static FIRST = new SquareStatus("先攻の石");
        /** 升目に後攻の石が置かれていることを表す */
        public static SECOND = new SquareStatus("後攻の石");
    }

    export class GameStatus extends MVCBaseSample.AbstModel {
        /** 先攻かどうか */
        private _isTurnFirst: bool;
        get isTurnFirst () { return this._isTurnFirst };
        /** ボードの状態を表す */
        private board: SquareStatus[][];

        constructor () {
            super();
            this._isTurnFirst = true;
            this.board = [];
            for (var i = 0; i < MASU; ++i) this.board.push([]);
            for (var i = 0; i < MASU; ++i) {
                for (var j = 0; j < MASU; ++j) {
                    this.board[i][j] = SquareStatus.EMPTY;
                }
            }
        }
        /**
         * 指定の升目の状態を返す
         */
        public getSquareStatus(x: number, y: number) {
            return this.board[x][y];
        }
        /**
         * 指定の位置に石を置く
         * 石を配置できた場合は真を, できなかった場合は偽を返す.
         * 簡単のため, 石を配置できなかった場合の理由などは返さない.
         *
         * 石を配置した後の, 挟んだ別の色の石の裏返し処理やターンの交代も
         * このメソッドが責任をもつ.
         */
        public put(x, y, isTurnFirst): bool {
            if (this._isTurnFirst !== isTurnFirst) {
                return false;
            }
            if (this.board[x][y] !== SquareStatus.EMPTY) {
                return false;
            }
            var that = this;
            var ccol = (isTurnFirst ? SquareStatus.FIRST : SquareStatus.SECOND);

            // ボード上の各升目の状態変更
            this.board[x][y] = ccol;
            [ -1, 0, 1 ].forEach(function (dx) {
                [ -1, 0, 1 ].forEach(function (dy) {
                    if (dx === 0 && dy === 0) return;
                    var cx = x;
                    var cy = y;
                    var doTurnOver = false;
                    var targets = [];
                    while (true) {
                        cx += dx;
                        cy += dy;
                        if (cx < 0 || cy < 0 || MASU <= cx || MASU <= cy) {
                            break;
                        }
                        if (that.board[cx][cy] === SquareStatus.EMPTY) {
                            break;
                        } else if (that.board[cx][cy] === ccol) {
                            doTurnOver = true;
                            break;
                        } else {
                            targets.push([cx,cy]);
                        }
                    }
                    if (doTurnOver) {
                        targets.forEach((xy) => that.board[xy[0]][xy[1]] = ccol);
                    }
                });
            });
            this.emitEvent("boardstatechange", { target: this });

            // ターン交代
            this._isTurnFirst = !this._isTurnFirst;
            this.emitEvent("turnchange", { target: this });

            return true;
        }
    }

}
