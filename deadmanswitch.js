
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"
import { collection, addDoc, setDoc, doc, getDoc } from "firebase/firestore"; 
import { getAuth, signInAnonymously } from "firebase/auth";
import MetaMaskOnboarding from '@metamask/onboarding';
// eslint-disable-next-line camelcase
import {
  // encrypt,
  // recoverPersonalSignature,
  // recoverTypedSignatureLegacy,
  // recoverTypedSignature,
  recoverTypedSignature_v4 as recoverTypedSignatureV4,
} from 'eth-sig-util';
import { ethers } from 'ethers';
import { toChecksumAddress } from 'ethereumjs-util';
import {
  hstBytecode,
  hstAbi,
  piggybankBytecode,
  piggybankAbi,
  collectiblesAbi,
  collectiblesBytecode,
  failingContractAbi,
  failingContractBytecode,
} from './constants.json';



// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDSTHvolTk94qDW053Z2rz1BwonNo67550",
  authDomain: "spectibles.firebaseapp.com",
  projectId: "spectibles",
  storageBucket: "spectibles.appspot.com",
  messagingSenderId: "609799237141",
  appId: "1:609799237141:web:6eab5bdd97e9828967281c",
  measurementId: "G-GQKFHV2JC0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore();


const auth = getAuth();
signInAnonymously(auth)
  .then(() => {
    // Signed in..
    console.log("signed in");
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    // ...
    console.log("nope:" +error);
  });






let ethersProvider;
let hstFactory;
// let piggybankFactory;
// let collectiblesFactory;
// let failingContractFactory;

const currentUrl = new URL(window.location.href);
const forwarderOrigin =
  currentUrl.hostname === 'localhost' ? 'http://localhost:9010' : undefined;

const { isMetaMaskInstalled } = MetaMaskOnboarding;

// Dapp Status Section
// const networkDiv = document.getElementById('network');
var networkDiv = null;
// const chainIdDiv = document.getElementById('chainId');
var chainIdDiv = null;
// const accountsDiv = document.getElementById('accounts');
var accountsDiv = null;
// const warningDiv = document.getElementById('warning');

// Basic Actions Section
const onboardButton = document.getElementById('connectButton');

const signTypedDataV4 = document.getElementById('signTypedDataV4');
const signTypedDataV4Result = document.getElementById('signTypedDataV4Result');
// const signTypedDataV4Verify = document.getElementById('signTypedDataV4Verify');
// const signTypedDataV4VerifyResult = document.getElementById('signTypedDataV4VerifyResult');



const mailingNameDiv = document.getElementById('nameInput');
const mailingStreetDiv = document.getElementById('streetInput');
const mailingCityDiv = document.getElementById('cityInput');
const mailingStateDiv = document.getElementById('stateInput');
const mailingZipDiv = document.getElementById('zipInput');
const mailingPhoneDiv = document.getElementById('phoneInput');
const mailingEmailDiv = document.getElementById('emailInput');

var storedContactInfo = null;
var msgParams = null;


const initialize = async () => {
  try {
    // We must specify the network as 'any' for ethers to allow network changes
    ethersProvider = new ethers.providers.Web3Provider(window.ethereum, 'any');
    
  } catch (error) {
    console.error(error);
  }

  let onboarding;
  try {
    onboarding = new MetaMaskOnboarding({ forwarderOrigin });
  } catch (error) {
    console.error(error);
  }

  let accounts;
  let accountButtonsInitialized = false;

  const accountButtons = [
    signTypedDataV4,
    // signTypedDataV4Verify,
  ];

  const isMetaMaskConnected = () => accounts && accounts.length > 0;

  const onClickInstall = () => {
    onboardButton.innerText = 'Onboarding in progress';
    onboardButton.disabled = true;
    onboarding.startOnboarding();
  };

  const onClickConnect = async () => {
    try {
      const newAccounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });
      console.log(newAccounts);
      handleNewAccounts(newAccounts);
    } catch (error) {
      console.error(error);
    }
  };


  const updateButtons = () => {
    const accountButtonsDisabled =
      !isMetaMaskInstalled() || !isMetaMaskConnected();
    if (accountButtonsDisabled) {
      for (const button of accountButtons) {
        button.disabled = true;
      }
    } else {
      signTypedDataV4.disabled = false;
    }

    if (isMetaMaskInstalled()) {
      // addEthereumChain.disabled = false;
      // switchEthereumChain.disabled = false;
      console.log("metamask installed")
    } else {
      onboardButton.innerText = 'Click here to install MetaMask!';
      onboardButton.onclick = onClickInstall;
      onboardButton.disabled = false;
    }

    if (isMetaMaskConnected()) {
      onboardButton.innerText = 'Connected';
      onboardButton.disabled = true;
      if (onboarding) {
        onboarding.stopOnboarding();
      }
    } else {
      onboardButton.innerText = 'Connect';
      onboardButton.onclick = onClickConnect;
      onboardButton.disabled = false;
    }
  };

  const initializeAccountButtons = () => {
    if (accountButtonsInitialized) {
      return;
    }
    accountButtonsInitialized = true;

  };

  signTypedDataV4Result.innerHTML = "Waiting...";


  /**
   * Sign Typed Data V4
   */
  signTypedDataV4.onclick = async () => {


    // const networkId = parseInt(networkDiv.innerHTML, 10);
    const networkId = parseInt(networkDiv, 10);

    // const chainId = parseInt(chainIdDiv.innerHTML, 16) || networkId;
    const chainId = parseInt(chainIdDiv, 16) || networkId;

    msgParams = {
      domain: {
        chainId: chainId.toString(),
        // name: 'Ether Mail',
        name: 'NFT Knox',
        // verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        version: '1',
      },
      // message: {
      //   contents: 'Hello, Bob!',
      //   from: {
      //     name: 'Cow',
      //     wallets: [
      //       '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
      //       '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
      //     ],
      //   },
      //   to: [
      //     {
      //       name: 'Bob',
      //       wallets: [
      //         '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
      //         '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
      //         '0xB0B0b0b0b0b0B000000000000000000000000000',
      //       ],
      //     },
      //   ],
      // },
      message: 
      {
        name: mailingNameDiv.value,
        street: mailingStreetDiv.value,
        city: mailingCityDiv.value,
        state: mailingStateDiv.value,
        zip: mailingZipDiv.value,
        phone: mailingPhoneDiv.value,
        email: mailingEmailDiv.value,
      },
      primaryType: 'ContactInfo',
      types: {
        // EIP712Domain: [
        //   { name: 'name', type: 'string' },
        //   { name: 'version', type: 'string' },
        //   { name: 'chainId', type: 'uint256' },
        //   // { name: 'verifyingContract', type: 'address' },
        // ],
        // Group: [
        //   { name: 'name', type: 'string' },
        //   { name: 'members', type: 'Person[]' },
        // ],
        // Mail: [
        //   { name: 'from', type: 'Person' },
        //   { name: 'to', type: 'Person[]' },
        //   { name: 'contents', type: 'string' },
        // ],
        // Person: [
        //   { name: 'name', type: 'string' },
        //   { name: 'wallets', type: 'address[]' },
        // ],
        ContactInfo: [
          { name: 'name', type: 'string' },
          { name: 'street', type: 'string' },
          { name: 'city', type: 'string' },
          { name: 'state', type: 'string' },
          { name: 'zip', type: 'string' },
          { name: 'phone', type: 'string' },
          { name: 'email', type: 'string' },

        ],
      },
    };
    try {
      const from = accounts[0];
      
      storedContactInfo = JSON.stringify(msgParams);
      console.log(storedContactInfo);

      const sign = await ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [from, JSON.stringify(msgParams)],
      });
      // signTypedDataV4Result.innerHTML = sign;
      // signTypedDataV4Verify.disabled = false;

      try {
        // const docRef = await addDoc(collection(db, "users"), from);
        // const docRef = await addDoc(collection(db, "users"), msgParams);
        // const docRef = doc(db, 'signed_contact_info', JSON.stringify(from));
        const docRef = doc(db, 'signed_contact_info', from);

        await setDoc(docRef, {
          from: from,
          // payload: JSON.stringify(msgParams),
          payload: msgParams,
          signature: sign
        });

        console.log("Document written with ID: ", docRef.id);

      } catch (e) {
        console.error("Error adding document: ", e);
      }

    } catch (err) {
      console.error(err);
      // signTypedDataV4Result.innerHTML = `Error: ${err.message}`;
    }

    console.log("verifying uploading data...");

    var verification_result =false;
    
    // verification_result =  await signTypedDataV4Verify.onclick();
    verification_result =  await signTypedDataV4Verify();


    if (verification_result) {
      console.log("Verification success: Database data signature checks out");
      signTypedDataV4Result.innerHTML = "Done!  Uploaded & Verified Your Signed Mailing Address.";
    }
    else
    {
      console.log("Verification failed: Database data signature DOES NOT check out");
      signTypedDataV4Result.innerHTML = "Hmm...Something went wrong.  Filed to Upload or Verify Your Signed Mailing Address.";
    }
  };

  /**
   *  Sign Typed Data V4 Verification
   */
  // signTypedDataV4Verify.onclick = async () => {
  const signTypedDataV4Verify = async () => {


    console.log("inside signTypedDataV4Verify");

    //not needed for now
    // // const networkId = parseInt(networkDiv.innerHTML, 10);
    // const networkId = parseInt(networkDiv, 10);

    // // const chainId = parseInt(chainIdDiv.innerHTML, 16) || networkId;
    // const chainId = parseInt(chainIdDiv, 16) || networkId;

    
    try {

      const from = accounts[0];
      const docRef = doc(db, "signed_contact_info", from );
      const docSnap = await getDoc(docRef);
      // const docSnap =  getDoc(docRef);
      

      if (docSnap.exists()) {
        console.log("Retrieved Document data:", docSnap.data());
      } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
        return;
      }

      console.log(docSnap.data().from);
      console.log(docSnap.data().signature);
      console.log(docSnap.data().payload);

      console.log("trying to recover address");


      const recoveredAddrfromFirebase = recoverTypedSignatureV4({
        data: docSnap.data().payload,
        // data: msgParams,
        sig: docSnap.data().signature,
      });

      console.log("recovered address from firebase");
      console.log(recoveredAddrfromFirebase);


      if (toChecksumAddress(recoveredAddrfromFirebase) === toChecksumAddress(docSnap.data().from)) {
        console.log(`Successfully verified signer as ${recoveredAddrfromFirebase} of this data structure\n ${JSON.stringify(msgParams, null, 4)}`);
        // signTypedDataV4VerifyResult.innerHTML = recoveredAddrfromFirebase;
        return true;
      } 
      else {
        console.log(`Failed to verify signer from Firebase when comparing ${recoveredAddrfromFirebase} to ${docSnap.data().from}`);
        return false;
      }

    } catch (err) {
      console.error(err);
      // signTypedDataV4VerifyResult.innerHTML = `Error: ${err.message}`;
      return false;
    }
  };

  function handleNewAccounts(newAccounts) {
    accounts = newAccounts;
    // accountsDiv.innerHTML = accounts;
    accountsDiv = accounts;

    // fromDiv.value = accounts;
    // gasPriceDiv.style.display = 'block';
    // maxFeeDiv.style.display = 'none';
    // maxPriorityDiv.style.display = 'none';
    if (isMetaMaskConnected()) {
      initializeAccountButtons();
    }
    updateButtons();
  }

  function handleNewChain(chainId) {
    // chainIdDiv.innerHTML = chainId;
    chainIdDiv = chainId;


    // if (chainId === '0x1') {
    //   warningDiv.classList.remove('warning-invisible');
    // } else {
    //   warningDiv.classList.add('warning-invisible');
    // }
  }

  function handleEIP1559Support(supported) {
    if (supported && Array.isArray(accounts) && accounts.length >= 1) {
      // sendEIP1559Button.disabled = false;
      // sendEIP1559Button.hidden = false;
      // sendButton.innerText = 'Send Legacy Transaction';
    } else {
      // sendEIP1559Button.disabled = true;
      // sendEIP1559Button.hidden = true;
      // sendButton.innerText = 'Send';
    }
  }

  function handleNewNetwork(networkId) {
    // networkDiv.innerHTML = networkId;
  }

  async function getNetworkAndChainId() {
    try {
      const chainId = await ethereum.request({
        method: 'eth_chainId',
      });
      handleNewChain(chainId);

      const networkId = await ethereum.request({
        method: 'net_version',
      });
      handleNewNetwork(networkId);

      const block = await ethereum.request({
        method: 'eth_getBlockByNumber',
        params: ['latest', false],
      });

      handleEIP1559Support(block.baseFeePerGas !== undefined);
    } catch (err) {
      console.error(err);
    }
  }

  updateButtons();

  if (isMetaMaskInstalled()) {
    ethereum.autoRefreshOnNetworkChange = false;
    getNetworkAndChainId();

    // ethereum.autoRefreshOnNetworkChange = false;
    // getNetworkAndChainId();

    ethereum.on('chainChanged', (chain) => {
      handleNewChain(chain);
      ethereum
        .request({
          method: 'eth_getBlockByNumber',
          params: ['latest', false],
        })
        .then((block) => {
          handleEIP1559Support(block.baseFeePerGas !== undefined);
        });
    });
    ethereum.on('networkChanged', handleNewNetwork);
    ethereum.on('accountsChanged', (newAccounts) => {
      ethereum
        .request({
          method: 'eth_getBlockByNumber',
          params: ['latest', false],
        })
        .then((block) => {
          handleEIP1559Support(block.baseFeePerGas !== undefined);
        });
      handleNewAccounts(newAccounts);
    });

    try {
      const newAccounts = await ethereum.request({
        method: 'eth_accounts',
      });
      handleNewAccounts(newAccounts);
    } catch (err) {
      console.error('Error on init when getting accounts', err);
    }
  }
};

window.addEventListener('DOMContentLoaded', initialize);

// utils

// function getPermissionsDisplayString(permissionsArray) {
//   if (permissionsArray.length === 0) {
//     return 'No permissions found.';
//   }
//   const permissionNames = permissionsArray.map((perm) => perm.parentCapability);
//   return permissionNames
//     .reduce((acc, name) => `${acc}${name}, `, '')
//     .replace(/, $/u, '');
// }

function stringifiableToHex(value) {
  return ethers.utils.hexlify(Buffer.from(JSON.stringify(value)));
}
