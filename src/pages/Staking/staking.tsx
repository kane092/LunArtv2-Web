import React, { useEffect, useState } from 'react';
import { useConnectedWallet } from '@terra-money/wallet-provider'
import { MsgExecuteContract } from '@terra-money/terra.js';
import { useTerraWebapp } from 'hooks/context';
import NftFooter from '../Nft/NftFooter';
import NftHeader from '../Nft/NftHeader';
import Modal from '../../components/Modal';
import RewardIcon from '../../assets/icons/rewards.svg'
import { Helmet } from 'react-helmet';
import { approve, provide_liquidity, farm_staking } from 'utils/msgGenerator';
import './staking.scss'
import unFarmWarn from '../../assets/icons/unFarmWarn.svg';
import timeLeft from '../../assets/images/time-left.png';

const InfoIcon = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16C5.87827 16 3.84344 15.1571 2.34315 13.6569C0.842855 12.1566 0 10.1217 0 8C0 5.87827 0.842855 3.84344 2.34315 2.34315C3.84344 0.842855 5.87827 0 8 0C10.1217 0 12.1566 0.842855 13.6569 2.34315C15.1571 3.84344 16 5.87827 16 8ZM9 4C9 4.26522 8.89464 4.51957 8.70711 4.70711C8.51957 4.89464 8.26522 5 8 5C7.73478 5 7.48043 4.89464 7.29289 4.70711C7.10536 4.51957 7 4.26522 7 4C7 3.73478 7.10536 3.48043 7.29289 3.29289C7.48043 3.10536 7.73478 3 8 3C8.26522 3 8.51957 3.10536 8.70711 3.29289C8.89464 3.48043 9 3.73478 9 4ZM7 7C6.73478 7 6.48043 7.10536 6.29289 7.29289C6.10536 7.48043 6 7.73478 6 8C6 8.26522 6.10536 8.51957 6.29289 8.70711C6.48043 8.89464 6.73478 9 7 9V12C7 12.2652 7.10536 12.5196 7.29289 12.7071C7.48043 12.8946 7.73478 13 8 13H9C9.26522 13 9.51957 12.8946 9.70711 12.7071C9.89464 12.5196 10 12.2652 10 12C10 11.7348 9.89464 11.4804 9.70711 11.2929C9.51957 11.1054 9.26522 11 9 11V8C9 7.73478 8.89464 7.48043 8.70711 7.29289C8.51957 7.10536 8.26522 7 8 7H7Z" fill="#E6DBDB" fill-opacity="0.75" />
</svg>


)
const Staking: React.FC = (props: any) => {
  const { connect, balances, pair, pairAddress, uusdPairInfo, tokenPairInfo, address, uLP, farm } = useTerraWebapp();
  const connectedWallet = useConnectedWallet()
  const [sidebarActive, setSidebar] = useState(false);
  const [uusdAmount, setUusdAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [notEnoughBalance, setNotEnoughBalance] = useState(false);
  const [stakeModal, setStakeModal] = useState(false);
  const [unstakeModal, setUnstakeModal] = useState(false);
  const [unstakeConfirmed, setUnstakeConfirmed] = useState(false);

  const handleSidebar = (status: any) => {
    setSidebar(status);
  };
  function handleSearch(e: any) {
    if (e.key === 'Enter' && e.target.value) {
      props.history.push({
        pathname: '/nftExplore',
        state: { search: e.target.value },
      });
    }
  }

  // useEffect(() => {
  //   connect(ConnectType.EXTENSION);
  // }, [connect]);

  const onChangeUusdAmount = (amount: string) => {
    setUusdAmount(amount);
    const _amount = Number(amount);
    const _tokenAmount = pair ? (Number(tokenPairInfo.amount) / Number(uusdPairInfo.amount) * _amount).toFixed(6) : "";
    setTokenAmount(_tokenAmount);
    if ((Number(balances.uusd) < Number(amount) || Number(balances.loop) < Number(_tokenAmount)) && !notEnoughBalance) setNotEnoughBalance(true);
    else if (notEnoughBalance) setNotEnoughBalance(false);
  }
  
  const onChangeTokenAmount = (amount: string) => {
    setTokenAmount(amount);
    const _amount = Number(amount);
    const _uusdAmount = pair? (Number(uusdPairInfo.amount) / Number(tokenPairInfo.amount) * _amount).toFixed(6) : "";
    setUusdAmount(_uusdAmount);
    if ((Number(balances.uusd) < Number(_uusdAmount) || Number(balances.loop) < Number(_amount)) && !notEnoughBalance) setNotEnoughBalance(true);
    else if (notEnoughBalance) setNotEnoughBalance(false);
  }

  const handleFarm = () => {
    const tokenAddress = tokenPairInfo.info.token.contract_addr;
    const msgs: MsgExecuteContract[] = [];
    const expectedULPTokenAmount = (Math.floor((Number(pair.total_share) * Number(uusdAmount) * Math.pow(10, 6) / Number(uusdPairInfo.amount)))).toFixed(0);
    msgs.push(approve(address, tokenAddress, (Number(tokenAmount) * Math.pow(10, 6)).toFixed(0), pairAddress));
    msgs.push(provide_liquidity(address, tokenAddress, (Math.floor(Number(tokenAmount) * Math.pow(10, 6))).toFixed(0), "uusd", (Number(uusdAmount) * Math.pow(10, 6)).toFixed(0), pairAddress));
    msgs.push(farm_staking(address, uLP, expectedULPTokenAmount, farm));
    if (connectedWallet) connectedWallet.post({
      msgs: msgs
    }).then(console.log).catch(console.log)
  }

  const closeStakeModal = () => {
    setStakeModal(false);
  };

  const closeUnstakeModal = () => {
    setUnstakeModal(false);
  };

  const userConfirmed = (status: string) => {
    setUnstakeConfirmed(false);
  }

  return (
    <>
      <Helmet>
        <title>Staking</title>
      </Helmet>
      <div className='staking-page'>
        <NftHeader handleSidebar={handleSidebar} />
        <div className={sidebarActive ? 'sidebarActiveBg' : ''}>
          <div className='bgSet'>
         <div className='container'>
         <div className="farm-heading"><p className="farm-heading-title">Staking</p><p className="farm-head-sub">Stake your Arts tokens and let them compund automatically</p></div>

         <div className='stakingSet'>
            <section>
              <div className='stakingSetHeader'>
                <label>
                  <span><img src="/lunartImages/stking.png" alt=""/></span>
                  <h6><p><b>18 Month</b> ART Stake</p><div>10.5K Arts<i>/day</i></div></h6>
                  <div className='aprValues'>169.74% APR</div>
                </label>
              </div>
              <div className='stakingValues'>
                <ul>
                  <li><label>Next reward <img src="/lunartImages/info.png" alt=""/></label><b>0</b></li>
                  <li><label>your rewards <img src="/lunartImages/info.png" alt=""/></label><b>0</b></li>
                  <li><label>total arts <img src="/lunartImages/info.png" alt=""/></label><b>0</b></li>
                </ul>
                <section><button onClick={ () => setUnstakeModal(true)}><b>-</b> Unstake</button><button onClick={ () => setStakeModal(true)}><b>+</b> Stake</button></section>
              </div>
            </section>
         </div>
         </div>
          </div>
        </div>
        <Modal
          isOpen={stakeModal}
          title=''
          onClose={closeStakeModal}
        >
          <div className='stakingModal'>
            <div className="card-wrapper">
              <div className="card-content-wrapper">
                <div className="card-heading">
                  <p className='title'><span>12 Months</span> ART Stake</p>
                  <p className="sub-title">Min 12 month staking period before you're able to claim rewards. You can still withdraw after 24hrs, before the 12 month stake period is over without rewards.</p>
                </div> 
                <div className="card-content-margin">
                  <div className="card-content-row">
                    <div className="farm-form-text">
                      Balance:&nbsp;
                      <span className="farm-form-text white-text">{balances.uusd || "0.00"}</span>
                      &nbsp;
                      <span className="farm-form-text">ARTS</span>
                    </div>
                  </div>
                  <div className="input-box">
                    <span ><img src={RewardIcon} /><span>UST</span></span>
                    <input type="text" placeholder='0.00' value={uusdAmount} onChange={e => onChangeUusdAmount(e.target.value)} disabled={pair === undefined} />
                    <button onClick={() => onChangeUusdAmount((Number(balances.uusd) - 0.5).toString())}>max</button>
                  </div>
                  <div className="card-content-row">
                    <div className="farm-form-text">
                      Value:&nbsp;
                      <span className="farm-form-text white-text">34.56</span>
                      &nbsp;
                      <span className="farm-form-text">UST</span>
                    </div>
                  </div>
                  <button className="farm-button mt-36" disabled={notEnoughBalance}>
                    {/* <img src={CartIcon} />  */}
                    Stake
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
        <Modal
          isOpen={unstakeModal}
          title=''
          onClose={closeUnstakeModal}
        >
          <div className='stakingModal'>
            <div className="card-wrapper">
              <div className="card-content-wrapper">
                <div className="card-heading card-content-margin">
                  <p className='title'>Unstake ARTS</p>
                  <div className="flex-line mt-36">
                    <img src={unFarmWarn} />
                    <span className="farm-form-text mt-0 ml-10 warn-text">Your min 12 month staking period is not over. <br />Unstake without rewards?</span>
                  </div>
                </div> 
                <div className="card-content-margin mt-20">
                  <div className="posotion-relative">
                    <div className="gradient-background">
                      <span>Time Left</span>
                    </div>
                    <div className="gradient-content">
                      <span>Time Left</span>
                      <span className="text-primary"><img src={timeLeft} className="mr-5" />09<span className="text-white">D &middot; </span>17:03:56</span>
                    </div>
                  </div>
                  <div className="card-content-row mt-20">
                    <div className="farm-form-text">
                      Balance:&nbsp;
                      <span className="farm-form-text white-text">{balances.uusd || "0.00"}</span>
                      &nbsp;
                      <span className="farm-form-text">ARTS</span>
                    </div>
                  </div>
                  <div className="input-box">
                    <span ><img src={RewardIcon} /><span>UST</span></span>
                    <input type="text" placeholder='0.00' value={uusdAmount} onChange={e => onChangeUusdAmount(e.target.value)} disabled={pair === undefined} />
                    <button onClick={() => onChangeUusdAmount((Number(balances.uusd) - 0.5).toString())}>max</button>
                  </div>
                  <div className="card-content-row">
                    <div className="farm-form-text">
                      Value:&nbsp;
                      <span className="farm-form-text white-text">34.56</span>
                      &nbsp;
                      <span className="farm-form-text">UST</span>
                    </div>
                  </div>
                  <div className="flex-line farm-form-text mb-16 mt-36">
                    <label className="checkbox">
                      <input type="checkbox" className="checkbox" onChange={(e) => userConfirmed(e.target.value)} />
                    </label>
                    <span className="mt-0 ml-10">I'am sure I want to unstake everything without rewards.</span>
                  </div>
                  <button className="farm-button" disabled={notEnoughBalance}>
                    {/* <img src={CartIcon} />  */}
                    Unstake
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
        <NftFooter />
      </div>
    </>
  );
};

export default Staking;
