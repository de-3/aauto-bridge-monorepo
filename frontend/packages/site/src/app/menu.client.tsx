'use client'

import { useState } from "react"
import Deposit from "./deposit.client"
import Settings from "./settings.client"

export default function Menu() {
    const [isDeposit,setIsDeposit] = useState(false)
    const [isSettings,setIsSettings] = useState(false)
    const [deposit,setDeposit] = useState(1)
    const [maxCharge,setMaxCharge] = useState(1)
    const [chargeThreshold,setChargeThreshold] = useState(0.5)

    const handleDepositClick = () => {
        setIsDeposit(!isDeposit)
    }

    const handleSettingsClick = () => {
        setIsSettings(!isSettings)
    }

    const handlAddClick = () => {
    }
    return (
        <div>
            <h2>Masterhack</h2>
            {
                !isDeposit && !isSettings ? (
                    <>
                        <button onClick={handleDepositClick}>Deposit</button>
                        <button onClick={handleSettingsClick}>Settings</button>
                    </>
                ):(
                    isDeposit ? (
                        <Deposit deposit={deposit} setDeposit={setDeposit} />
                    ) : (
                        <Settings maxCharge={maxCharge} setMaxCharge={setMaxCharge} chargeThreshold={chargeThreshold} setChargeThreshold={setChargeThreshold} handlAddClick={handlAddClick} />
                    )
                )
            }
        </div>
    )
}
  