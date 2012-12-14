var MVCBaseSample;
(function (MVCBaseSample) {
    function emitEvent(type, evt) {
        if(!this._eventListeners[type]) {
            return;
        }
        this._eventListeners[type].forEach(function (l) {
            return l(evt);
        });
    }
    function addEventListener(type, listener) {
        if(!this._eventListeners[type]) {
            this._eventListeners[type] = [];
        }
        this._eventListeners[type].push(listener);
    }
    function removeEventListener(type, listener) {
        if(!this._eventListeners[type]) {
            return;
        }
        this._eventListeners[type] = this._eventListeners[type].filter(function (l) {
            return l !== listener;
        });
        if(this._eventListeners[type].length === 0) {
            delete this._eventListeners[type];
        }
    }
    var AbstView = (function () {
        function AbstView() {
            this._eventListeners = {
            };
        }
        AbstView.prototype.bindModel = function (model) {
            throw new Error("not implemented");
        };
        AbstView.prototype.unbindModel = function () {
            throw new Error("not implemented");
        };
        AbstView.prototype.emitEvent = function (type, evt) {
        };
        AbstView.prototype.addEventListener = function (type, listener) {
        };
        AbstView.prototype.removeEventListener = function (type, listerner) {
        };
        return AbstView;
    })();
    MVCBaseSample.AbstView = AbstView;    
    AbstView.prototype.emitEvent = emitEvent;
    AbstView.prototype.addEventListener = addEventListener;
    AbstView.prototype.removeEventListener = removeEventListener;
    var AbstModel = (function () {
        function AbstModel() {
            this._eventListeners = {
            };
        }
        AbstModel.prototype.emitEvent = function (type, evt) {
        };
        AbstModel.prototype.addEventListener = function (type, listener) {
        };
        AbstModel.prototype.removeEventListener = function (type, listerner) {
        };
        return AbstModel;
    })();
    MVCBaseSample.AbstModel = AbstModel;    
    AbstModel.prototype.emitEvent = emitEvent;
    AbstModel.prototype.addEventListener = addEventListener;
    AbstModel.prototype.removeEventListener = removeEventListener;
})(MVCBaseSample || (MVCBaseSample = {}));
