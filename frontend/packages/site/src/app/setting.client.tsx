'use client'

import { useState } from "react"
import Deposit from "./deposit.client";

function Step11(props:any){
    const handleMaxChargeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        props.setMaxCharge(e.target.value)
    };

    const handleChargeThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        props.setChargeThreshold(e.target.value)
    };
    return (
        <>
            <label>max value</label>
            <input type="number" max={1} min={0} value={props.maxCharge} onChange={handleMaxChargeChange} />
            <label>chargeThreshold</label>
            <input type="number" max={1} min={0} value={props.chargeThreshold} onChange={handleChargeThresholdChange} />
        </>
    )
}

function Step3(props:any){
    return (
        <>
            <p>Congratulations!</p>
            <p>Your account has been initiated for auto-charging.</p>
            <p>🎉</p>
        </>
    )
}

export default function Setting(props:any) {
    const [maxCharge,setMaxCharge] = useState(1)
    const [chargeThreshold,setChargeThreshold] = useState(0.5)
    const [deposit,setDeposit] = useState(1)
    const handleConnecting = () => {
        props.setFirstSettingStatus(props.firstSettingStatus + 1)
    }
    return (
        <div>
            <h2>Masterhack</h2>
            <h2>
                { props.firstSettingStatus <= 1 ? "1" : "✅" }
                { props.firstSettingStatus <= 2 ? "2" : "✅" }
                Done
            </h2>
            {
                props.firstSettingStatus === 1 ? <Step11 maxCharge={maxCharge} setMaxCharge={setMaxCharge} chargeThreshold={chargeThreshold} setChargeThreshold={setChargeThreshold} /> : (
                    props.firstSettingStatus === 2 ? <Deposit deposit={deposit} setDeposit={setDeposit} /> : <Step3 />
                )
            }
            <button onClick={handleConnecting} style={{display:props.firstSettingStatus === 3 ? "none":""}} >{props.firstSettingStatus === 1 ? "Next" : "Deposit"} </button>
        </div>
    )
  }
  