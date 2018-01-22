import React, { Component } from 'react';
import { Loading } from './Loading';
import '../assets/stylesheets/application.css';
import '../assets/javascripts/show-alert.js';

const brand1_wallet = "0x6aA997cA79541b50bC138E8644fef75Ce694fE62";
const brand2_wallet = "0x03535193C277141C614b8081ae46f2477C44d680";
const brand3_wallet = "0x16320d623B047d4b901e08C123f60Aa3e84587d9";

class BrandsMagic extends Component {
    constructor(props) {
        super(props);
        this.state = {
            confirmation_code_plain: '',
            confirmed_class: '',
            loading: false,
        };
    }

    componentDidMount = () => {
        console.log('BrandsMagic.componentDidMount');

        var wallet = this.props.my_web3 && this.props.my_web3.eth.accounts[0];
        if (!wallet) {
            window.show_alert('warning', 'MetaMask account', 'Please unlock your account in MetaMask and refresh the page first');
            return;
        }
    }

    on_change = (event) => {
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    check_wallet_is brands = (current_wallet, brands1_wallet,brands2_wallet,brands3_wallet) => {
        console.log('check_wallet_same, current_wallet: ' + current_wallet);
        console.log('check_wallet_same, initial_wallet: ' + brands1_wallet);
         console.log('check_wallet_same, initial_wallet: ' + brands2_wallet);
          console.log('check_wallet_same, initial_wallet: ' + brands3_wallet);
        if (!current_wallet) {
            return 'MetaMask account should be unlocked';
        }
        if (current_wallet.trim().toLowerCase() !== brands1_wallet || brands2_wallet || brands3_wallet) {
            return 'You Are Not A Brand! ';
        }
        return '';
    }

    check_user_exists = (opts, callback) => {
        var contract = this.props.contract;
        var wsame = this.check_wallet_same(this.props.my_web3.eth.accounts[0], opts.wallet);
        if (wsame) return callback(wsame);

        console.log('calling contract.check_user_exists');
        contract.user_exists(opts.wallet, { from: opts.wallet }, (err, result) => {
            if (err) {
                console.log('Error calling contract.check_user_exists:', err);
                return callback(err);
            }

            console.log('contract.check_user_exists result =', result);
            return callback(null, result);
        });
    }

    find_address = (opts, callback) => {
        var contract = this.props.contract;
        var wsame = this.check_wallet_same(this.props.my_web3.eth.accounts[0], opts.wallet);
        if (wsame) return callback(wsame);

        console.log('calling contract.user_address_by_confirmation_code');

        contract.user_address_by_confirmation_code(opts.wallet, this.props.my_web3.sha3(opts.params.confirmation_code_plain), (err, result) => {
            if (err) {
                console.log('Error calling contract.user_address_by_confirmation_code:', err);
                return callback(err);
            }

            console.log('contract.user_address_by_confirmation_code result =', result);
            var address_details = {};
            address_details.found = result[0];
            address_details.confirmed = result[2];
            if (!address_details.found) {
                return callback(null, address_details);
            }

            // TODO: check wallet here + handle possible errors
            console.log('calling contract.user_address');
            contract.user_address(opts.wallet, result[1], (err, result) => {
                if (err) {
                    console.log('Error calling contract.user_address:', err);
                    return callback(err);
                }
                console.log('***** RESULT=', result);
                address_details.country = result[0];
                address_details.email = result[1];
                address_details.brand = result[2];
                address_details.tweak = result[3];
                return callback(null, address_details);
            });
        });
    }

    confirm_address = (opts, callback) => {
        var contract = this.props.contract;

        contract.confirm_address.estimateGas(opts.params.confirmation_code_plain, opts.v, opts.r, opts.s, { from: opts.wallet }, (err, result) => {
            if (err) {
                console.log('Estimate gas callback error:', err);
                return callback(err);
            }

            var egas = result;
            console.log('Estimated gas: ' + egas);
            var ugas = Math.floor(1.1*egas);
            console.log('Will set gas = ' + ugas);

            var wsame = this.check_wallet_same(this.props.my_web3.eth.accounts[0], opts.wallet);
            if (wsame) return callback(wsame);

            console.log('calling contract.confirm_address');
            contract.confirm_address(opts.params.confirmation_code_plain, opts.v, opts.r, opts.s, { from: opts.wallet, gas: ugas }, (err, tx_id) => {
                if (err) {
                    console.log('Error calling contract.confirm_address:', err);
                    return callback(err);
                }
                console.log('tx_id = ' + tx_id);

                return callback(null, tx_id);
            });
        });
    }

    confirm_clicked = () => {
        var confirmation_code_plain = this.state.confirmation_code_plain.trim();

        if (!confirmation_code_plain) {
            window.show_alert('warning', 'Verification', 'Please enter the confirmation code first');
            return;
        }

        var wallet = this.props.my_web3 && this.props.my_web3.eth.accounts[0];
        if (!wallet) {
            window.show_alert('warning', 'MetaMask account', 'Please unlock your account in MetaMask and refresh the page first');
            return;
        }

        this.setState({
            loading: true
        });
        console.log('Using account ' + wallet);
        this.check_user_exists({ wallet: wallet }, (err, exists) => {
            if (err) {
                this.setState({
                    loading: false
                });
                window.show_alert('error', 'Checking if user exists', [['Error', err.message]]);
                return;
            }

            if (!exists) {
                this.setState({
                    loading: false
                });
                window.show_alert('warning', 'Checking if user exists', 'There are no addresses registered under your current MetaMask account');
                return;
            }

            window.$.ajax({
                type: 'post',
                url: './api/prepareConTx',
                data: {
                    wallet: wallet,
                    confirmation_code_plain: this.state.confirmation_code_plain
                },
                success: (res) => {
                    if (!res) {
                        console.log('Empty response from server');
                        this.setState({
                            loading: false
                        });
                        window.show_alert('error', 'Preparing confirmation transaction', [['Error', 'Empty response from server']]);
                        return;
                    }
                    console.log(res);

                    if (!res.ok) {
                        console.log('Error: ' + res.err);
                        this.setState({
                            loading: false
                        });
                        window.show_alert('error', 'Preparing confirmation transaction', [['RequestID', res.x_id], ['Error', res.err]]);
                        return;
                    }

                    if (!res.result) {
                        console.log('Invalid response: missing result');
                        this.setState({
                            loading: false
                        });
                        window.show_alert('error', 'Preparing confirmation transaction', [['RequestID', res.x_id], ['Error', 'Missing result field']]);
                        return;
                    }

                    console.log('calling find_address');
                    this.find_address(res.result, (err, address_details) => {
                        if (err) {
                            console.log('Error occured in find_address: ', err);
                            this.setState({
                                loading: false
                            });
                            window.show_alert('error', 'Finding address to confirm', [['Error', err.message]]);
                            return;
                        }

                        if (!address_details.found) {
                            this.setState({
                                loading: false,
                                confirmed_class: 'postcard-form_error'
                            });
                            window.show_alert('error', 'Finding address to confirm', [
                                ['This confirmation code does not correspond to any of your registered addresses.'],
                                ['Please double check confirmation code and account selected in MetaMask']
                            ]);
                            return;
                        }

                        if (address_details.confirmed) {
                            this.setState({
                                loading: false
                            });
                            window.show_alert('warning', 'Finding address to confirm', [
                                ['This confirmation code corresponds to address that is already confirmed'],
                                ['Country', address_details.country.toUpperCase()],
                                ['Email', address_details.email.toUpperCase()],
                                ['Brand', address_details.brand.toUpperCase()],
                                ['Tweak', address_details.address.toUpperCase()],
                               /* ['ZIP code', address_details.zip.toUpperCase()] */
                            ]);
                            return;
                        }

                        console.log('calling confirm_address');
                        this.confirm_address(res.result, (err, tx_id) => {
                            this.setState({
                                loading: false
                            });
                            if (err) {
                                console.log('Error occured in confirm_address: ', err);
                                window.show_alert('error', 'Confirming address', [['Error', err.message]]);
                            }
                            else if (tx_id) {
                                console.log('Transaction mined: ' + tx_id);
                                window.show_alert('success', 'Address confirmed!', [
                                    ['Transaction to confirm address was mined'],
                                    ['Transaction ID', tx_id],
                                    ['Country', address_details.country.toUpperCase()],
                                    ['Email', address_details.email.toUpperCase()],
                                    ['Brand', address_details.brand.toUpperCase()],
                                    ['Tweak', address_details.address.toUpperCase()]
                                   /* ['ZIP code', address_details.zip.toUpperCase()] */
                                ]);
                            }
                            else {
                                console.log('JSON RPC unexpected response: err is empty but tx_id is also empty');
                                window.show_alert('error', 'Confirming address', 'Error is empty but tx_id is also empty');
                            }
                        });
                    });
                },
                error: (xhr, ajaxOptions, thrownError) => {
                    console.log('Server returned error: ' + xhr.statusText + ' (' + xhr.status + ')');
                    this.setState({
                        loading: false
                    });
                    window.show_alert('error', 'Preparing confirmation transaction', [['Error', xhr.statusText + ' (' + xhr.status + ')']]);
                }
            });
        });
    }

    render = () => {
        return (
            <div>
            <section className="content postcard-container table">
                <div className="table-cell">
                    <div className="postcard-inner">
                        <div className="postcard">
                            <p className="postcard-title">Enter your unique code here:</p>
                            <form action="" className="postcard-form">
                                <input type="text" className={'postcard-input ' + this.state.confirmed_class} name="confirmation_code_plain" value={this.state.confirma$
                                <input type="text" className={'postcard-input ' + this.state.confirmed_class} name="tweakers_address" value={this.state.tweakers_adress$
                                <button type="button" className="postcard-button" onClick={this.confirm_clicked}></button>
                            </form>
                            <p>
                                Type code from the postcard. Letter case is irrelevant.
                            </p>
                        </div>
                        <h1 className="title">Verify your access</h1>
                        <p className="description">
                            Enter confirmation code and tweakers address you received, sign the transaction and finalize the verification process.
                        </p>
                    </div>
                </div>
            </section>
            <Loading show={this.state.loading}></Loading>
            </div>
        );
    }
};

export default BrandsMagic;

