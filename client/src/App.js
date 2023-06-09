import './App.css';
import react, { useEffect, useState} from 'react';
import {ethers} from 'ethers';
import artifact from './artifacts/contracts/Staking.sol/Staking.json';
import NavBar from './components/NavBar';
import StakeModal from './components/StakeModal';
import {Bank, PiggyBank, Coin} from 'react-bootstrap-icons';

import ethLogo from '../src/ethlogo.png';

const CONTRACT_ADDRESS = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'


function App() {
  //general
  const [provider, setProvider] =useState(undefined)
  const [signer, setSigner] = useState(undefined)
  const [contract, setContract] = useState(undefined)
  const [signerAddress, setSignerAddress] = useState(undefined)

  //assets
  const [assetIds, setassetIds] = useState([])
  const [assets, setAssets] = useState([])

  //staking
  const [showStakeModal, setShowStakeModal] = useState(false)
  const [stakingLength, setStakingLength] = useState(undefined)
  const [stakingPercent, setStakingPercent] = useState(undefined)
  const [amount, setAmount] = useState(0)

  //helper
  const toString = bytes32 => ethers.utils.parseBytes32String(bytes32)
  const toWei = ether => ethers.utils.parseEther(ether)
  const toEther = wei => ethers.utils.formatEther(wei)

  useEffect(() => {
    const onLoad = async() =>{
      const provider = await new ethers.providers.Web3Provider(window.ethereum)
      setProvider(provider)

      const contract = await new ethers.Contract(
        CONTRACT_ADDRESS,
        artifact.abi
      )
      setContract(contract)
    }
    onLoad()
  },[])

  const isConnected = () => signer !== undefined
 
  const getSigner = async () =>{
    provider.send("eth_requestAccounts", [])
    
    const signer = provider.getSigner()
    setSigner(signer)
    return signer
  }

  const getAssetIds = async (address, signer) =>{
    
    const assetIds = await contract.connect(signer).getPositionIdsForAddress(address)
    return assetIds
  }

  const calcDaysRemaining = (unlockDate) =>{
    const timeNow = Date.now() / 1000
    const secondsRemaining = unlockDate - timeNow
    return Math.max((secondsRemaining / 60 /60 / 24).toFixed(0), 0)
  }

  const getAssets = async (ids, signer) =>{
    const queriedAssets = await Promise.all(
      ids.map(id => contract.connect(signer).getPositionById(id))
    )

    queriedAssets.map(async asset => {
      const parsedAsset = {
        positionId: asset.positionId,
        percentInterest: Number(asset.percentInterest)/100,
        daysRemaining: calcDaysRemaining(Number(asset.unlockDate)),
        etherInterest: toEther(asset.weiInterest),
        etherStaked: toEther(asset.weiStaked),
        open: asset.open,
      }

      setAssets(prev => [...prev, parsedAsset])
    })

  }

  const connectAndLoad = async () =>{
    
    const signer = await getSigner(provider)
    setSigner(signer)

    const signerAddress = await signer.getAddress()
    setSignerAddress(signerAddress)
    

    const assetIds = await getAssetIds(signerAddress, signer)
    
    getAssets(assetIds, signer)
    

  }

  const openStakingModal = (stakingLength, stakingPercent) =>{
    setShowStakeModal(true)
    setStakingLength(stakingLength)
    setStakingPercent(stakingPercent)
  }

  const stakeEther = () => {
    const wei = toWei(amount)
    const data = { value: wei}
    contract.connect(signer).stakeEther(stakingLength, data)
  }

  const withdraw = positionId =>{
    contract.connect(signer).closePosition(positionId)
  }
//test
  return (
    <div className="App">
      <div>
        <NavBar
        isConnected={isConnected}
        connect = {connectAndLoad}
        />
      </div>

      <div className="appBody">
        <div className="marketContainer">
          <div className="subContainer">
            <span>
              <img className="logoImg" src={ethLogo}/>
            </span>
            <span className="marketHeader">Eth Staking Pool</span>
          </div>
          
          <div className="row">
            <div className="col-md-4">
              <div onClick={() => openStakingModal(30, '7%')} className="marketOption">
                <div className="glyphContainer hoverButton">
                  <span className="glyph">
                    <Coin/>
                  </span>
                </div>
                <div className="optiondata">
                  <span>1 month</span>
                  <span className="optionPercent">7%</span>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div onClick={() => openStakingModal(90, '10%')} className="marketOption">
                <div className="glyphContainer hoverButton">
                  <span className="glyph">
                    <Coin/>
                  </span>
                </div>
                <div className="optiondata">
                  <span>3 month</span>
                  <span className="optionPercent">10%</span>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div onClick={() => openStakingModal(180, '12%')} className="marketOption">
                <div className="glyphContainer hoverButton">
                  <span className="glyph">
                    <Coin/>
                  </span>
                </div>

                <div className="optiondata">
                  <span>6 monnth</span>
                  <span className="optionPercent">12%</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="assetContainer">
        <div className="subContainer">
          <span className="marketHeader">Staked Assets</span>

        </div>
        
          <div>
            <div className="row columnHeaders">
              <div className="col-md-2">Assets</div>
              <div className="col-md-2">Percent Interest</div>
              <div className="col-md-2">Staked</div>
              <div className="col-md-2">Interest</div>
              <div className="col-md-2">Days Remaining</div>
              <div className="col-md-2"></div>
            </div>
          </div>
        
        <br/>
        {console.log(assets.length,"Asset length")}
        {assets.length > 0 && assets.map((a, idx) => (
          
          <div className="row">
            <div className="col-md-2">
              <span>
              
                <img className="stakedLogoImg" src={ethLogo}/>
              </span>
              
            </div>
            <div className="col-md-2">
              {a.percentInterest} %
            </div>
            <div className="col-md-2">
              {a.etherStaked}
            </div>
            <div className="col-md-2">
              {a.etherInterest} %
            </div>
            <div className="col-md-2">
              {a.daysRemaining} %
            </div>
            <div className="col-md-2">
              {a.open ? (
                <div onClick={() => withdraw(a.positionId)} className="orangeMiniButton">Withdraw</div>
              ) : (
                <span>closed</span>
              )}
            </div> 
          </div> 
        ))}
      </div>
      <div>
       
      </div>

      {showStakeModal && (
        <StakeModal onClose={() => setShowStakeModal(false)}
        stakingLength={stakingLength}
        stakingPercent={stakingPercent}
        amount ={amount}
        setAmount = {setAmount}
        stakeEther = {stakeEther}
        />
      )}
      </div>
    
    
  );
}

export default App;
