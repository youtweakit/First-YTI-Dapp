var path = require('path');
var Web3 = require('web3');

//var server_config = require('../web-dapp/server-config');

var rpc = 'https://sokol.poa.network';
var network = new Web3.providers.HttpProvider(rpc);
var utils_config = {
    owner: '$TEST',
    //owner: '0x00a329c0648769a73afac7f9381e08fb43dbea72',
    source_file: path.join(__dirname, '../contract/Main.sol'),
    contract_name: 'YTIhackdapp.sol',
    network: network,
    contract_output: path.join(__dirname, '../web-dapp/src/contract-output.json'),
};

module.exports = function () {
    //return Object.assign({}, utils_config, server_config);
    return utils_config;
}
