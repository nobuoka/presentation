# Kyoto.pm Tech Talks 02 での LT 資料

Kyoto.pm Tech Talks 02 で行った WebSocket プロトコルに関する LT の発表資料です.

Kyoto.pm Tech Talks 02 の詳細は, 下記ページをご覧ください.

* <a href="http://kyoto.pm.org/entry/2012/07/29/195512">Kyoto.pm Tech Talks 02 を開催します! - kyotopm's blog</a>

## デモの実行方法

デモを実行するために, サーバーとして Twiggy が使える Plack
環境が整っている必要があります.
Plack::Middleware::WebSocket は, サブモジュールとして
demo/modules/Plack-Middleware-WebSocket に配置していますので,
別途用意する必要はありません.

以下のように plackup コマンドを使うことでデモ用のサーバーが立ち上がります.

````
$ plackup demo/app.psgi
````

デフォルトだと http://localhost:5000/ でアクセスできるはずですので,
最近の Firefox や Chrome で http://localhost:5000/ にアクセスしてください.
複数ウィンドウでこのページを開き, どれか 1 つのウィンドウで画面上をクリックすると,
すべてのウィンドウで四角いブロックが移動するはずです.

クリック位置の情報をクライアントとサーバー間でやりとりするために
WebSocket を使用しています.
