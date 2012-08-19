#!perl
use strict;
use warnings;
use utf8;

use FindBin;
use lib "$FindBin::Bin/modules/Plack-Middleware-WebSocket/lib";

use Plack::Builder;
use Plack::Request;
use AnyEvent;
use AnyEvent::Handle;
use WebSocket::ServerAgent;

my $DATA = do { local $/; scalar <DATA> };

my $app = sub {
    my $env = shift;
    my $req = Plack::Request->new($env);
    my $res = $req->new_response(200);

    if (not $env->{'psgi.streaming'}) {
        die 'this handler does not support psgi.streaming';
    }

    use Encode;
    if ($req->path eq '/') {
        my $data = $DATA;
        $data =~ s/\{\{\{HOST\}\}\}/$env->{HTTP_HOST}/g;
        $res->content_type('text/html; charset=utf-8');
        $res->content( Encode::encode("utf-8",$data) );
    }
    elsif ($req->path eq '/echo') {
        if ( my $fh = $env->{'websocket.impl'}->handshake ) {
            return start_ws_echo( $fh );
        }
        $res->code($env->{'websocket.impl'}->error_code);
    }
    else {
        $res->code(404);
    }

    return $res->finalize;
};

use List::MoreUtils qw( firstidx );
my $agents = [];
sub start_ws_echo {
    my ($fh) = @_;

    my $agent = WebSocket::ServerAgent->new( $fh );
    push @$agents, $agent;
    return sub {
        my $respond = shift;
        $agent->onclose( sub {
            # 配列からの削除
            my $idx = firstidx { $_ == $agent } @$agents;
            splice @$agents, $idx, 1;
            warn '[DEBUG] on close!!!';
            warn '  num of rest agents : ' . ( scalar @$agents );
            # 循環参照を断つ
            undef $agent;
        } );
        $agent->onmessage( sub {
            my ( $message ) = @_;
            warn '[DEBUG] on message: ' . $message;

            for ( @$agents ) {
                my $agent = $_;
                $agent->send_text( $message );
            }

            # close if message is 'close'
            if ( $message eq 'close' ) {
                warn '[DEBUG] to be closed...';
                $agent->close();
            }
        } );
        return;
    };
}

builder {
    enable 'WebSocket';
    $app;
};

__DATA__
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Plack::Middleware::WebSocket</title>
  <script type="text/javascript">
    /**
     * 移動物体を表すオブジェクトのコンストラクタ (JS にクラスはないが,
     * Mover クラスのコンストラクタだと思えばよい)
     * 移動物体そのものの DOM オブジェクトを生成し, body 直下に配置する.
     * 初期速度は (0,0).
     * @param posX 初期位置の x 座標
     * @param poxY 初期位置の y 座標
     * @param posRat 位置の変化速度に関係するパラメータ. この値が大きいと
     *     マウスへの追従が遅く, この値が小さいと, マウスへの追従が速い.
     *     省略した場合は 2
     * @param verRat 速度の変化速度に関係するパラメータ. 省略した場合は 3
     * @param limitVerMag 制動に関するパラメータ. 小さいほど制動がかかる.
     *     省略した場合は 0.6
     */
    function Mover( posX, posY, posRat, verRat, limitVerMag ) {
        var elem = document.createElement("div");
        elem.style.width = "10px";
        elem.style.height = "10px";
        elem.style.border = "solid 1px #000000";
        elem.style.position = "fixed";
        document.body.appendChild( elem );
        this._elem = elem;
        this._rat = posRat || 2;
        this._verRat = verRat || 3;
        this._limitVerMag = limitVerMag || 0.6;
        this.__setPos( posX, posY );
        this.setTargetPosition( posX, posY );
        this.setVerocity( 0, 0 );
    }
    /** 目標地点を設定する */
    Mover.prototype.setTargetPosition = function ( posX, posY ) {
        this._targetPosX = posX;
        this._targetPosY = posY;
    };
    /**
     * 速度を設定する
     * 意図的に速度を変化させることができる. 目標地点を設定すれば自動的に
     * 速度が変化するので, 通常はこのメソッドを使用する必要はない.
     */
    Mover.prototype.setVerocity = function ( verX, verY ) {
        this._curVerX = verX;
        this._curVerY = verY;
    };
    /** 現在位置を { x: 現在位置の x 座標, y: 現在位置の y 座標 } というオブジェクトで返す */
    Mover.prototype.getPosition = function () {
        return { x: this._curX, y: this._curY };
    };
    /** 目標地点に向かって 1 段階進む */
    Mover.prototype.step = function () {
        this.__setPos( this._curX + this._curVerX, this._curY + this._curVerY );
        var dx = this._targetPosX - this._curX;
        var dy = this._targetPosY - this._curY;
        var nextVerX = dx / this._rat;
        var nextVerY = dy / this._rat;
        var vx = this._curVerX + ( nextVerX - this._curVerX ) / this._verRat;
        var vy = this._curVerY + ( nextVerY - this._curVerY ) / this._verRat;
        var mag = this._limitVerMag;
        var scp = dx * vx + dy * vy; // 積
        var len2 = dx * dx + dy * dy; // 長さの 2 乗
        if ( scp > mag * len2 ) {
            vx = vx * mag * len2 / scp;
            vy = vy * mag * len2 / scp;
        }
        this.setVerocity( vx, vy );
    };
    /** 位置を設定する; private メソッド */
    Mover.prototype.__setPos = function ( posX, posY ) {
        this._curX = posX;
        this._curY = posY;
        this._elem.style.left = Math.round(posX) + "px";
        this._elem.style.top = Math.round(posY) + "px";
    };
    var movers = [];
    function setTargetPos( posObj ) {
        var x = posObj.x;
        var y = posObj.y;
            movers.forEach( function (e,i,arr) {
                var dis = Math.random() * Math.sqrt( movers.length * 10 );
                var ang = Math.random() * 2 * Math.PI;
                e.setTargetPosition(
                  x + dis * Math.cos( ang ),
                  y + dis * Math.sin( ang )
                );
            } );
    }

    (function () {
        var timerId = void 0;

        window.addEventListener( "DOMContentLoaded", function onDOMContentLoaded( evt ) {
            window.removeEventListener( "DOMContentLoaded", onDOMContentLoaded, false );
            for ( var i = 0; i < 50; ++ i ) {
                movers.push( new Mover(Math.random()*200,Math.random()*200,
                    Math.random()*2.5+1.1,
                    Math.random()*4+9.0,
                    Math.random()*0.2+0.5 ) );
            }
            timerId = setInterval( function () {
                movers.forEach( function (e,i,arr) { e.step() } );
            }, 40 );
        }, false );
        window.addEventListener( "unload", function onUnload( evt ) {
            window.removeEventListener( "unload", onUnload, false );
            clearInterval( timerId );
            timerId = void 0;
        }, false );
    }).call( this );
  </script>

    <style type="text/css">
#log {
  border: 1px solid #DDD;
  padding: 0.5em;
  max-height: 10em;
}
p {
  width: 42em;
}
    </style>
  </head>
  <body>
    <script type="text/javascript">
function log (msg) {
    var elem = document.getElementById("log");
    elem.textContent = msg + "\n" + elem.textContent;
}

var ws;
function onMouseClick( evt ) {
    var x = evt.clientX;
    var y = evt.clientY;
    ws.send( JSON.stringify({
        type: "set-target-point",
        value: { x: x, y: y }
    }) );
}
function onDOMContentLoaded() {
  document.removeEventListener( "DOMContentLoaded", onDOMContentLoaded, false );
  ws = new WebSocket('ws://{{{HOST}}}/echo');

  window.addEventListener( "click", onMouseClick, false );

  log('WebSocket start');

  ws.onopen = function () {
    log('connected');
  };

  ws.onmessage = function (ev) {
      var json;
      if ( json = JSON.parse( ev.data ) ) {
          if ( json["type"] === "set-target-point" ) {
              setTargetPos( json["value"] );
          } else {
              log('received: ' + ev.data);
          }
      } else {
          alert( json );
      }
  };

  ws.onerror = function (ev) {
    log('error: ' + ev.data);
  }

  ws.onclose = function (ev) {
    log('closed');
  }
}
function onUnload( evt ) {
    document.removeEventListener( "unload", onUnload, false );
    window.removeEventListener( "click", onMouseClick, false );
}
document.addEventListener( "DOMContentLoaded", onDOMContentLoaded, false );
document.addEventListener( "unload", onUnload, false );
    </script>

    <h1>Plack::Middleware::WebSocket のデモ</h1>
    <p>
      <span>ページ上をクリックすると, クリック位置の情報が WebSocket
        によってサーバーに送られます.</span>
      <span>サーバーは, 送られてきたクリック位置の情報を全クライアントに送信します.</span>
      <span>さらに, クライアントはサーバーからクリック位置が送られてくると,
        ページ上の四角いブロックをその位置に移動させます.</span>
    </p>
    <p>
      <span>よって, 他のクライアントでクリックされると,
        自分がクリックしなくてもブロックが移動します.</span>
      <span>このページを複数のブラウザウィンドウで表示させて試してください.</span>
    </p>
    <p>
      <span>Firefox 14, Chrome 21 で動作することを確認しました.</span>
      <span>IE 9 以下や Safari 5 以下などでは
        <a href="http://tools.ietf.org/html/rfc6455" title="RFC 6455 - The WebSocket Protocol">RFC 6455</a>
        に対応した WebSocket API が使えないため動作しないと思います.</span>
    </p>
    <pre id="log"></pre>
  </body>
</html>
