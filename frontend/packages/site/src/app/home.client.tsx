'use client'

import { use, useState } from "react";
import Connect from "./connect";

export default function ClientSideComponent() {
    const [isConnecring,setIsConnecting] = useState(false)
    const [firstSettingStatus,setFirstSettingStatus] = useState(0)
    return (
        <div>
            {
                firstSettingStatus === 0 ? (

                    <Connect isConnecring={isConnecring} setIsConnecting={setIsConnecting} setFirstSettingStatus={setFirstSettingStatus} />
                ) : (
                    firstSettingStatus === 5 ? (
                        <h2>メニュー</h2>
                    ):(
                        <h2>Setting</h2>
                    )
                )
            }
        </div>
    )
}