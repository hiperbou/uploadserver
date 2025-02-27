# uploadserver
Javascript server to upload files from another computer

## Run with NodeJS

    npm install
    node server [PORT]

There's also an advanced version that allows to select the destination folder or download uploaded files.

    node server2 [PORT]


## Run with Bun

    bun install
    bun server.js [PORT]


    bun server2.js [PORT]


## Run with Deno

Edit server.js and server2.js to uncomment Deno imports and comment nodejs imports

    npm install
    deno --allow-env --allow-read --allow-write --allow-net --allow-sys server.js [PORT]

    
    deno --allow-env --allow-read --allow-write --allow-net --allow-sys server2.js [PORT]
