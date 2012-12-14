/**
 * MVC のサンプルのために書いてみたモジュール
 */
module MVCBaseSample {
    export interface IEventEmitter {
        emitEvent(type: string, evt: any);
        addEventListener(type: string, listerner: (evt: any) => void);
        removeEventListener(type: string, listerner: (evt: any) => void);
    }
    export interface IView extends IEventEmitter {
        bindModel(model: IModel);
        unbindModel();
    }
    export interface IModel extends IEventEmitter {
    }

    // 素朴な実装
    function emitEvent(type: string, evt: any) {
        if (!this._eventListeners[type]) return;
        this._eventListeners[type].forEach((l) => l(evt));
    }
    function addEventListener(type: string, listener: (evt: any) => void) {
        if (!this._eventListeners[type]) this._eventListeners[type] = [];
        this._eventListeners[type].push(listener);
    }
    function removeEventListener(type: string, listener: (evt: any) => void) {
        if (!this._eventListeners[type]) return;
        this._eventListeners[type] =
            this._eventListeners[type].filter((l) => l !== listener);
        if (this._eventListeners[type].length === 0)
            delete this._eventListeners[type];
    }

    export class AbstView implements IView {
        private _eventListeners: {
            [type: string]: {(evt: any);}[];
        };
        constructor() {
            this._eventListeners = {};
        }
        // とりあえず今の実装だと各 View が bindModel を実装する
        // ようになっている. ここら辺も Base 側でやった方がいいのかなー
        // と思ったりするけど, View 側に持たせた方が自由度は高くなって
        // よい気がする.
        bindModel(model) {
            throw new Error("not implemented");
        }
        unbindModel() {
            throw new Error("not implemented");
        }
        // クラス定義の下で実装
        emitEvent(type, evt) {}
        addEventListener(type, listener) {}
        removeEventListener(type, listerner) {}
    }
    AbstView.prototype.emitEvent = emitEvent;
    AbstView.prototype.addEventListener = addEventListener;
    AbstView.prototype.removeEventListener = removeEventListener;

    export class AbstModel implements IModel {
        private _eventListeners: {
            [type: string]: {(evt: any);}[];
        };
        constructor() {
            this._eventListeners = {};
        }
        // クラス定義の下で実装
        emitEvent(type, evt) {}
        addEventListener(type, listener) {}
        removeEventListener(type, listerner) {}
    }
    AbstModel.prototype.emitEvent = emitEvent;
    AbstModel.prototype.addEventListener = addEventListener;
    AbstModel.prototype.removeEventListener = removeEventListener;
}
