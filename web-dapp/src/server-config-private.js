'use strict';

module.exports = function (cfg_public) {
    return {
        lob_api_key: '*** LOB TEST OR PROD API KEY ***',
        rpc: 'https://sokol.poa.network',
        signer: '0x2c7241672be5032f3f8227D6A8B0FFE04088EEEB', // with 0x prefix
        signer_private_key: 'd194bb80c905679ad8033adfd4c7f634854050e32dc2fd73c9beff484b62571d', // without 0x prefix
        confirmation_page_url: 'https://youtweak.it', // used only for postcard
        // it is recommended to install and use redis for keeping session keys
        session_store: {
            "type": "redis",
            "params": { *** REDIS CONNECTION PARAMETERS *** }
        },
    };
};
