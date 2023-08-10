'use client'

import { useState } from "react"
import Deposit from "./deposit.client"

export default function Menu() {
    const [isDeposit,setIsDeposit] = useState(false)
    const [isSettings,setIsSettings] = useState(false)

    const handleDepositClick = () => {
        setIsDeposit(!isDeposit)
    }

    const handleSettingsClick = () => {
        setIsSettings(!isSettings)
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
                        <Deposit />
                    ) : (
                        <Settings />
                    )
                )
            }
        </div>
    )
}
  