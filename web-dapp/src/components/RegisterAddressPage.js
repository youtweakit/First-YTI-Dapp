import React, { Component } from 'react';
import { Loading } from './Loading';
import '../assets/javascripts/show-alert.js';

class RegisterAddressPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            country: 'US',
            city: '',
            tweak:'',
            email:'',
         
            loading: false,
        };
    }

    componentDidMount = () => {
        console.log('RegisterAddressPage.componentDidMount');

        console.log('Add mySwipe');
        window.mySwipe = new window.Swipe(document.getElementById('slider'), {
            startSlide: 0,
            speed: 500,
            auto: 4000,
            disableScroll: true,
            callback: function(index, elem) {
                window.$('.how-to-navigation-i').removeClass('how-to-navigation-i_active')
                .eq(index).addClass('how-to-navigation-i_active');
            }
        });

        window.$('.how-to-navigation-i').on('click', function() {
            var index = window.$(this).index();
            window.mySwipe.slide(index);
        });

        var wallet = this.props.my_web3 && this.props.my_web3.eth.accounts[0];
        if (!wallet) {
            window.show_alert('warning', 'MetaMask account', 'Please unlock your account in MetaMask and refresh the page first');
            return;
        }
    }

    on_change = (event) => {
        console.log('on_change ' + event.target.name + ': ' + event.target.value);
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    check_wallet_same = (current_wallet, initial_wallet) => {
        console.log('check_wallet current_wallet: ' + current_wallet);
        console.log('check_wallet initial_wallet: ' + initial_wallet);
        if (!current_wallet) {
            return 'MetaMask account should be unlocked';
        }
        if (current_wallet.trim().toLowerCase() !== initial_wallet) {
            return 'MetaMask account was switched';
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

    check_address_exists = (opts, callback) => {
        var contract = this.props.contract;
        var wsame = this.check_wallet_same(this.props.my_web3.eth.accounts[0], opts.wallet);
        if (wsame) return callback(wsame);

        this.check_user_exists(opts, (err, exists) => {
            if (err) {
                window.show_alert('error', 'Checking if user exists: ', [['Error', err.message]]);
                return callback(err, false);
            }

            if (!exists) {
                console.log('No previously registered addresses found, continue');
                return callback(null, false);
            }

            console.log('call contract.user_address_by_address');
            contract.user_address_by_address(
                opts.wallet,
                opts.params.country,
                opts.params.email,
                opts.params.city,
                opts.params.tweak,
                
                { from: opts.wallet }, (err, result) => {

                if (err) {
                    console.log('Error calling contract.user_address_by_address:', err);
                    return callback(err);
                }

                console.log('contract.user_address_by_address result =', result);
                return callback(null, result[0]);
            });
        });
    }

    register_address = (opts, callback) => {
        var contract = this.props.contract;

        console.log('Calling contract.register_address.estimateGas');
        console.log('opts = ' + JSON.stringify(opts));

        opts.params.price_wei = new this.props.my_web3.BigNumber(opts.params.price_wei);
        console.log('Price for the postcard (in wei): ' + opts.params.price_wei);
        contract.register_address.estimateGas(
            opts.params.name,
            opts.params.country,
            opts.params.email,
            opts.params.city,
            opts.params.tweak,
           /* opts.params.zip,*/
            opts.params.price_wei,
            opts.confirmation_code_sha3,
            opts.v,
            opts.r,
            opts.s,
            { from: opts.wallet, value: opts.params.price_wei }, (err, result) => {

            if (err) {
                console.log('Estimate gas callback error:', err);
                return callback(err);
            }

            var egas = result;
            console.log('Estimated gas: ' + egas);
            var ugas = Math.floor(1.1*egas);
            console.log('Will set gas = ' + ugas);

            var wallet = this.props.my_web3 && this.props.my_web3.eth.accounts[0];
            console.log('Current wallet: ' + wallet);
            if (!wallet) {
                return callback('Account locked');
            }
            if (wallet.trim().toLowerCase() !== opts.wallet) {
                return callback('Account was switched');
            }

            console.log('Calling contract.register_address');
            contract.register_address(
                opts.params.name,
                opts.params.country,
                opts.params.email, 
                opts.params.city,
                opts.params.tweak,
               /* opts.params.zip,*/
                opts.params.price_wei,
                opts.confirmation_code_sha3,
                opts.v,
                opts.r,
                opts.s,
                { from: opts.wallet, value: opts.params.price_wei, gas: ugas }, (err, tx_id) => {

                if (err) {
                    console.log('Error calling contract.register_address:', err);
                    return callback(err);
                }
                console.log('contract.register_address, tx_id = ' + tx_id);

                return callback(null, tx_id);
            });
        });
    }

    order_clicked = () => {
        console.log('Form data:');
        console.log('name = ' + this.state.name);
        console.log('country = ' + this.state.country);
        console.log('state = ' + this.state.email); 
        console.log('city = ' + this.state.city);
        console.log('tweak = ' + this.state.tweak);
      /*  console.log('zip = ' + this.state.zip); */

        var wallet = this.props.my_web3 && this.props.my_web3.eth.accounts[0];
        if (!wallet) {
            window.show_alert('warning', 'MetaMask account', 'Please unlock your account in MetaMask and refresh the page first');
            return;
        }

        console.log('Using account ' + wallet);

        if (!this.state.name) {
            window.show_alert('warning', 'Verification', 'Please provide your NAME');
            return;
        }

        if (!this.state.country) {
            window.show_alert('warning', 'Verification', 'Please provide COUNTRY');
            return;
        }

        if (!this.state.state) {
            window.show_alert('warning', 'Verification', 'Please provide Email');
            return;
        } *

        if (!this.state.city) {
            window.show_alert('warning', 'Verification', 'Please provide CITY');
            return;
        }

        if (!this.state.tweak) {
            window.show_alert('warning', 'Verification', ' You are going Without Tweak???Crazy? )) ');
            return;
        }

       /*verification of zip code ubito deletom((( */

        this.setState({
            loading: true
        });

        window.$.ajax({
            type: 'post',
            url: './api/prepareRegTx',
            data: {
                wallet: wallet,
                name: this.state.name,
                country: this.state.country,
                state: this.state.email,
                city: this.state.city,
                tweak: this.state.tweak,
               /* zip: this.state.zip,*/
            },
            success: (res) => {
                if (!res) {
                    console.log('Empty response from server');
                    this.setState({
                        loading: false
                    });
                    window.show_alert('error', 'Preparing register transaction', [['Error', 'Empty response from server']]);
                    return;
                }
                console.log(res);

                if (!res.ok) {
                    console.log('Error: ' + res.err);
                    this.setState({
                        loading: false
                    });
                    window.show_alert('error', 'Preparing register transaction', [['Request ID', res.x_id], ['Error', res.err]]);
                    return;
                }

                if (!res.result) {
                    console.log('Invalid response: missing result');
                    this.setState({
                        loading: false
                    });
                    window.show_alert('error', 'Preparing register transaction', [['Request ID', res.x_id], ['Error', 'Missing result field']]);
                    return;
                }

                this.check_address_exists(res.result, (err, exists) => {
                    if (err) {
                        console.log('Error occured in check_address_exists: ', err);
                        this.setState({
                            loading: false
                        });
                        window.show_alert('error', 'Checking if Tweak exists', [['Error', err.message]]);
                        return;
                    }
                    if (exists) {
                        console.log('This address already exists');
                        this.setState({
                            loading: false
                        });
                        window.show_alert('error', 'Checking if tweak is unique', 'This tweak is already registered under your current MetaMask account');
                        return;
                    }

                    console.log('calling register_address');
                    this.register_address(res.result, (err, tx_id) => {
                        if (err) {
                            console.log('Error occured in register_address: ', err);
                            this.setState({
                                loading: false
                            });
                            window.show_alert('error', 'Register address', [['Error', err.message]]);
                        }
                        else if (tx_id) {
                            console.log('Transaction mined: ' + tx_id);
                            window.$.ajax({
                                type: 'post',
                                url: './api/notifyRegTx',
                                data: {
                                    wallet: wallet,
                                    tx_id: tx_id,
                                    session_key: res.result.session_key
                                },
                                success: (res) => {
                                    this.setState({
                                        loading: false
                                    });
                                    if (!res) {
                                        console.log('Empty response from server');
                                        window.show_alert('error', 'Tweaking', [
                                            ['Transaction to register tweak was mined, but tweak was not sent('],
                                            ['Transaction ID', tx_id],
                                            ['Error', 'empty response from server']
                                        ]);
                                        return;
                                    }
                                    if (!res.ok) {
                                        console.log('Not ok response from server: ' + res.err);
                                        window.show_alert('error', 'Tweaking', [
                                            ['Transaction to register tweak was mined, but tweak was not sent'],
                                            ['Request ID', res.x_id ],
                                            ['Transaction ID', tx_id],
                                            ['Error', res.err]
                                        ]);
                                        return;
                                    }
                                    window.show_alert('success', 'Tweak is registered!', [
                                        ['Transaction to register tweak was mined and Your Tweak send to Brand'],
                                        ['Transaction ID', tx_id],
                                      /*  ['Expected delivery date', res.result.expected_delivery_date], */
                                      /*  ['Mail type', res.result.mail_type] этот факиншит нужно проанализировать и вывернуть в нашу сторону*/ 
                                    ]);
                                },
                                error: (xhr, ajaxOptions, thrownError) => {
                                    console.log('Server returned error on notifyRegTx: ' + xhr.statusText + ' (' + xhr.status + ')');
                                    this.setState({
                                        loading: false
                                    });
                                    window.show_alert('error', 'Tweaking', [['Server error', xhr.statusText + ' (' + xhr.status + ')']]);
                                }
                            });
                        }
                        else {
                            console.log('JSON RPC unexpected response: err is empty but tx_id is also empty');
                            this.setState({
                                loading: false
                            });
                            window.show_alert('error', 'Register tweak', 'Error is empty but tx_id is also empty!');
                        }
                    });
                });
            },
            error: (xhr, ajaxOptions, thrownError) => {
                console.log('Server returned error on prepareRegTx: ' + xhr.statusText + ' (' + xhr.status + ')');
                this.setState({
                    loading: false
                });
                window.show_alert('error', 'Preparing register transaction', [['Server error', xhr.statusText + ' (' + xhr.status + ')']]);
            }
        });
    }

    render = () => {
        return (
            <div>
            <section className="content address table">
                <div className="table-cell table-cell_left">
                    <div className="address-content">
                        <h1 className="title">YouTweak.iT - Ideas sharing Dapp</h1>
                        <p className="description">
                            This DApps can be used both by Brands and by Tweakers! tweakers send ideas - Brand get verify and accept or don't accept Tweaks, but anyway Delivery of Tweak and Revenue is Guarantied!  
                        </p>
                        <form action="" className="address-form">
                            <div className="address-form-i">
                                <label for="" className="label">
                                    Name
                                    <span className="address-question">
                                        <span className="address-question-tooltip">
                                            <span className="text">
                                                Enter your full name
                                            </span>
                                        </span>
                                    </span>
                                </label>
                                <input type="text" className="input" name="name" value={this.state.name} onChange={this.on_change} />
                            </div>
                            <div className="address-form-i">
                                <div className="left">
                                    <label for="" className="label">
                                        Country
                                        <span className="address-question">
                                            <span className="address-question-tooltip">
                                                <span className="text">
                                                   Will make it WorldWide available!.
                                                </span>
                                            </span>
                                        </span>
                                    </label>
                                    /*<input type="text" className="input" readOnly={true} name="country" value={this.state.country} onChange={this.on_change} /> */
            <select className="input" name="state" style={{ 'backgroundColor': 'white' }} value={this.state.state} onChange={this.on_change}>
                                        <option value="US">U.S.A</option>
                                        <option value="JP">Japan</option>
                                        <option value="RU">Russian Federatio</option>
                                        <option value="CH">China</option>
                                        <option value="SP">Spain</option>
                                        <option value="GE">German</option>
                                        <option value="UK">United Kingdom</option>
                                        <option value="AZ">Azerbaidjan</option>
                                        <option value="AR">Armenia</option>
                                        <option value="SW">Sweden</option>
                                        <option value="CR">Croatia</option>
                                        <option value="PN">Papua New Genue</option>
                      
                                      
            </select>
                                </div>
                                <div className="right">
                                    <label for="" className="label">
                                        E-mail
                                        <span className="address-question">
                                            <span className="address-question-tooltip">
                                                <span className="text">
                                                    Provide contact Email
                                                </span>
                                            </span>
                                        </span>
                                    </label>
                                    {
                                    <input type="text" className="input" name="email" value={this.state.email} onChange={this.on_change} />
                                   }
                                   /* <select className="input" name="state" style={{ 'backgroundColor': 'white' }} value={this.state.state} onChange={this.on_change}>
                                        <option value="AA">U.S. Armed Forces – Americas</option>
                                        <option value="AE">U.S. Armed Forces – Europe</option>
                                        <option value="AK">Alaska</option>
                                        <option value="AL">Alabama</option>
                                        <option value="AP">U.S. Armed Forces – Pacific</option>
                                        <option value="AR">Arkansas</option>
                                        <option value="AS">American Somoa</option>
                                        <option value="AZ">Arizona</option>
                                        <option value="CA">California</option>
                                        <option value="CT">Connecticut</option>
                                        <option value="CO">Colorado</option>
                                        <option value="DC">District Of Columbia</option>
                                        <option value="DE">Delaware</option>
                                        <option value="FL">Florida</option>
                                        <option value="FM">Federated States of Micronesia</option>
                                        <option value="GA">Georgia</option>
                                        <option value="GU">Guam</option>
                                        <option value="HI">Hawaii</option>
                                        <option value="IA">Iowa</option>
                                        <option value="ID">Idaho</option>
                                        <option value="IL">Illinois</option>
                                        <option value="IN">Indiana</option>
                                        <option value="KS">Kansas</option>
                                        <option value="KY">Kentucky</option>
                                        <option value="LA">Louisiana</option>
                                        <option value="MA">Massachusetts</option>
                                        <option value="MD">Maryland</option>
                                        <option value="ME">Maine</option>
                                        <option value="MH">Marshall Islands</option>
                                        <option value="MI">Michigan</option>
                                        <option value="MN">Minnesota</option>
                                        <option value="MO">Missouri</option>
                                        <option value="MP">Northern Mariana</option>
                                        <option value="MS">Mississippi</option>
                                        <option value="MT">Montana</option>
                                        <option value="NC">North Carolina</option>
                                        <option value="ND">North Dakota</option>
                                        <option value="NE">Nebraska</option>
                                        <option value="NH">New Hampshire</option>
                                        <option value="NJ">New Jersey</option>
                                        <option value="NM">New Mexico</option>
                                        <option value="NV">Nevada</option>
                                        <option value="NY">New York</option>
                                        <option value="OH">Ohio</option>
                                        <option value="OK">Oklahoma</option>
                                        <option value="OR">Oregon</option>
                                        <option value="PA">Pennsylvania</option>
                                        <option value="PW">Palau</option>
                                        <option value="PR">Puerto Rico</option>
                                        <option value="RI">Rhode Island</option>
                                        <option value="SC">South Carolina</option>
                                        <option value="SD">South Dakota</option>
                                        <option value="TN">Tennessee</option>
                                        <option value="TX">Texas</option>
                                        <option value="UT">Utah</option>
                                        <option value="VA">Virginia</option>
                                        <option value="WA">Washington</option>
                                        <option value="WV">West Virginia</option>
                                        <option value="WY">Wyoming</option>
                                        <option value="WI">Wisconsin</option>
                                        <option value="VI">Virgin Islands</option>
                                        <option value="VT">Vermont</option>
                                    </select> 
                                </div>*/
                            </div>
                            <div className="address-form-i">
                                <div className="left">
                                    <label for="" className="label">
                                        City
                                        <span className="address-question">
                                            <span className="address-question-tooltip">
                                                <span className="text">
                                                    Enter full name of the city
                                                </span>
                                            </span>
                                        </span>
                                    </label>
                                    <input type="text" className="input" name="city" value={this.state.city} onChange={this.on_change} />
                                </div>
                                /* <div className="right">
                                   <label for="" className="label">
                                        ZIP
                                        <span className="address-question">
                                            <span className="address-question-tooltip">
                                                <span className="text">
                                                    Enter ZIP code
                                                </span>
                                            </span>
                                        </span>
                                    </label>
                                    <input type="text" className="input" name="zip" value={this.state.zip} onChange={this.on_change} />
                                </div> */
                            </div>
                            <div className="address-form-i">
                                <label for="" className="label">
                                    Tweak
                                    <span className="address-question">
                                        <span className="address-question-tooltip">
                                            <span className="text">
                                                Enter our Tweaking suggestion here
                                            </span>
                                        </span>
                                    </span>
                                </label>
                                <input type="text" className="input" name="tweak" value={this.state.tweak} onChange={this.on_change} />  
                                */
                            </div>
                            <button type="button" className="button button_order" onClick={this.order_clicked}>TweakiT!</button>
                        </form>
                        <div className="address-postcard">
                            <p className="address-postcard-title">Nothing to Tweak? Just send a feedback to belowed brand!</p>
                            <p className="address-postcard-description">
                                Your transaction will cost something about 1 cent in YTI! 
                            </p>
                        </div>
                    </div>
                </div>
                <div className="table-cell table-cell_right">
                    <div className="address-content">
                        <div className="how-to swipe" id="slider">
                            <div className="swipe-wrap">
                                <div className="how-to-i how-to-i_fill-form">
                                    <p className="how-to-title">
                                        <span>Step 1:</span>
                                        Fill form
                                    </p>
                                    <p className="how-to-description">
                                        Please check your inputs before submittion
                                    </p>
                                </div>
                                <div className="how-to-i how-to-i_sign-transaction">
                                    <p className="how-to-title">
                                        <span>Step 2:</span>
                                        Sign transaction
                                    </p>
                                    <p className="how-to-description">
                                        Sign transaction in MetaMask to add your data to smart contract and Tweak it!
                                    </p>
                                </div>
                                <div className="how-to-i how-to-i_get-postcard">
                                    <p className="how-to-title">
                                        <span>Step 3:</span>
                                        Get postcard
                                    </p>
                                    <p className="how-to-description">
                                        Check your mailbox for the postcard with confirmation code on it
                                    </p>
                                </div>
                                <div className="how-to-i how-to-i_type-code">
                                    <p className="how-to-title">
                                        <span>Step 4:</span>
                                        Type code
                                    </p>
                                    <p className="how-to-description">
                                        Open the webpage specified on the postcard and type in confirmation code
                                    </p>
                                </div>
                                <div className="how-to-i how-to-i_finalize-proof">
                                    <p className="how-to-title">
                                        <span>Step 5:</span>
                                        Finalize proof
                                    </p>
                                    <p className="how-to-description">
                                        Sign the second transaction to verify the code and finalize the process
                                    </p>
                                </div>
                            </div>
                            <div className="how-to-navigation">
                                <div className="how-to-navigation-i how-to-navigation-i_active"></div>
                                <div className="how-to-navigation-i"></div>
                                <div className="how-to-navigation-i"></div>
                                <div className="how-to-navigation-i"></div>
                                <div className="how-to-navigation-i"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Loading show={this.state.loading}></Loading>
            </div>
        );
    }
};

export default RegisterAddressPage;
